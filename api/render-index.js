const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache HTML template at module level — avoids synchronous disk I/O on every request
const _indexTemplatePath = path.join(__dirname, '../index.html');
let _indexTemplate = null;
function getIndexTemplate() {
    if (!_indexTemplate) {
        _indexTemplate = fs.readFileSync(_indexTemplatePath, 'utf8');
    }
    return _indexTemplate;
}

function greekToLatin(text) {
    if (!text) return "";
    let str = text.toLowerCase();
    str = str
        .replace(/αι|αί/g, 'ai')
        .replace(/ει|εί/g, 'ei')
        .replace(/οι|οί/g, 'oi')
        .replace(/ου|ού/g, 'ou')
        .replace(/αυ|αύ/g, 'av')
        .replace(/ευ|εύ/g, 'ev')
        .replace(/μπ/g, 'b')
        .replace(/ντ/g, 'nt')
        .replace(/γκ/g, 'gk')
        .replace(/γγ/g, 'ng')
        .replace(/τζ/g, 'tz')
        .replace(/τσ/g, 'ts')
        .replace(/θ/g, 'th')
        .replace(/χ/g, 'ch')
        .replace(/ψ/g, 'ps')
        .replace(/ξ/g, 'x');

    const singleMap = {
        'α': 'a', 'ά': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'έ': 'e',
        'ζ': 'z', 'η': 'i', 'ή': 'i', 'ι': 'i', 'ί': 'i', 'ϊ': 'i', 'ΐ': 'i',
        'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ο': 'o', 'ό': 'o', 'π': 'p',
        'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'ύ': 'y', 'ϋ': 'y',
        'ΰ': 'y', 'φ': 'f', 'ω': 'o', 'ώ': 'o'
    };

    let res = '';
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        res += singleMap[c] !== undefined ? singleMap[c] : c;
    }
    return res;
}

function slugify(text) {
    if (!text) return "arthro";
    try {
        let latin = greekToLatin(text);
        let slug = latin
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
            
        if (slug.length > 35) {
            const truncated = slug.substring(0, 35).replace(/-[^-]*$/, '');
            slug = truncated.length > 8 ? truncated : slug.substring(0, 35);
        }
        return slug || "arthro";
    } catch(e) {
        return "arthro";
    }
}

function getCategoryCleanName(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('ποδόσφαιρο') || cat.includes('football')) return 'podosfairo';
    if (cat.includes('μπάσκετ') || cat.includes('basketball')) return 'basket';
    if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) return 'erasitexnis';
    if (cat.includes('άποψη') || cat.includes('opinion')) return 'apopsi';
    return 'podosfairo';
}

function formatExactDate(dateString) {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const parts = new Intl.DateTimeFormat('el-GR', {
            timeZone: 'Europe/Athens',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        }).formatToParts(d);
        let day='', month='', year='', hours='', minutes='';
        for (const p of parts) {
            if (p.type==='day') day=p.value;
            if (p.type==='month') month=p.value;
            if (p.type==='year') year=p.value;
            if (p.type==='hour') hours=p.value;
            if (p.type==='minute') minutes=p.value;
        }
        return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch (_) {
        return '';
    }
}

function applyMonotonicJitter(articles) {
    if (!articles || !Array.isArray(articles) || articles.length === 0) return;
    let lastDisplayMs = null;
    articles.forEach((art, index) => {
        if (!art || !art.created_at) return;
        const realMs = new Date(art.created_at).getTime();
        
        let hash = 0;
        const str = String(art.id || index);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        const gapMins = (Math.abs(hash) % 3) + 2; // 2 to 4 minutes gap
        const gapMs = gapMins * 60 * 1000;

        let displayMs;
        if (index === 0) {
            const baseJitterMs = (Math.abs(hash) % 3) * 60 * 1000; // 0 to 2 min base jitter
            displayMs = realMs - baseJitterMs;
        } else {
            const maxAllowedMs = lastDisplayMs - gapMs;
            displayMs = Math.min(realMs, maxAllowedMs);
        }

        lastDisplayMs = displayMs;
        art.created_at = new Date(displayMs).toISOString();
    });
}

function escapeHtml(unsafe) {
    return (unsafe || '')
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

    let categoryFilter = null;
    if (req.query.category) {
        const cat = req.query.category.toLowerCase();
        if (cat === 'football') categoryFilter = 'Ποδόσφαιρο';
        else if (cat === 'basket' || cat === 'basketball') categoryFilter = 'Μπάσκετ';
        else if (cat === 'erasitexnis' || cat === 'erasitechnis' || cat === 'amateur') categoryFilter = 'Ερασιτέχνης';
        else if (cat === 'apopsi' || cat === 'opinion') categoryFilter = 'Άποψη';
    }

    try {
        let query = supabase.from('articles').select('id, title, summary, image_url, category, created_at, source_url, bullets, group_id, pinned_at')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER');
        if (categoryFilter) {
            if (categoryFilter === 'Ποδόσφαιρο') {
                query = query.or('category.ilike.%Ποδόσφαιρο%,category.ilike.%football%');
            } else if (categoryFilter === 'Μπάσκετ') {
                query = query.or('category.ilike.%Μπάσκετ%,category.ilike.%basket%');
            } else if (categoryFilter === 'Ερασιτέχνης') {
                query = query.or('category.ilike.%Ερασιτέχνης%,category.ilike.%amateur%');
            } else if (categoryFilter === 'Άποψη') {
                query = query.ilike('category', '%Άποψη%');
            } else {
                query = query.ilike('category', `%${categoryFilter}%`);
            }
        } else {
            query = query.not('category', 'ilike', '%Ερασιτέχνης%');
        }

        query = query.order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(1);

        const { data: articles, error } = await query;
        if (articles && articles.length > 0) {
            applyMonotonicJitter(articles);
        }
        let article = (articles && articles.length > 0) ? articles[0] : null;

        // 2. Get cached template (no disk I/O after first request)
        let html = getIndexTemplate();

        if (!article) {
            return res.status(200).send(html);
        }

        const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
        let imageUrl = article.image_url || DEFAULT_IMG;

        try {
            if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
            let u;
            if (imageUrl.startsWith('/')) {
                u = new URL(imageUrl, 'https://www.panathinaikosnews.gr');
            } else {
                u = new URL(imageUrl);
            }
            const filename = u.pathname.substring(u.pathname.lastIndexOf('/') + 1).toLowerCase();
            const pathLower = u.pathname.toLowerCase();
            const filenameBrandingIndicators = [
                'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
                'og-image', 'og_image', 'site-logo', 'site_logo', 'default-image', 'default_image',
                'noimage', 'no-image', 'blank', 'generic', 'share-image', 'share_image'
            ];
            const pathBrandingPaths = ['/logos/', '/logo/', '/brand/', '/branding/', '/default_images/', '/default-images/', '/assets/images/', '/site-assets/'];
            const isInternalLogo = filenameBrandingIndicators.some(ind => filename.includes(ind)) || pathBrandingPaths.some(p => ('/' + pathLower + '/').includes(p));
            if (isInternalLogo) {
                imageUrl = DEFAULT_IMG;
            } else if (!u.hostname.includes('wsrv.nl') && !imageUrl.includes('logo.png') && !imageUrl.includes('favicon')) {
                imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(u.href)}&w=1200&output=webp&q=82`;
            }
        } catch (e) {}

        const slug = slugify(article.title);
        const catPath = getCategoryCleanName(article.category);
        const shortId = (article.id || '').substring(0, 8);
        const url = `/${catPath}/${slug}-${shortId}`;
        const pubDate = formatExactDate(article.created_at);

        const srcLower = (article.source_url || '').toLowerCase();
        const isOwn = srcLower.startsWith('manual') || srcLower.includes('manual://') || srcLower.includes('opinion://') || (article.category || '').toLowerCase().includes('άποψη');
        const isOfficial = (article.source_url||'').toLowerCase().includes('pao.gr') || (article.source_url||'').toLowerCase().includes('pao1908.com') || (article.source_url||'').toLowerCase().includes('paobc.gr');
        const ageMs = Date.now() - new Date(article.created_at).getTime();
        const isFresh = ageMs < 60 * 60 * 1000;

        const showLatest = !isOwn && article.category !== 'Άποψη' && isFresh;
        const latestBadge = showLatest
            ? `<div class="absolute top-3 left-3 px-3 py-1 bg-tertiary text-on-tertiary font-label text-label rounded font-bold tracking-wider">LATEST</div>`
            : '';

        let bulletsHtml = '';
        let parsedBullets = Array.isArray(article.bullets) ? article.bullets : [];
        if (typeof article.bullets === 'string') {
            try { parsedBullets = JSON.parse(article.bullets); } catch (_) {}
        }
        if (parsedBullets && parsedBullets.length > 0) {
            bulletsHtml = `<div class="mt-4 p-4 bg-background/60 rounded-xl border border-primary/25 overflow-hidden">
                <div class="text-xs uppercase tracking-widest text-primary font-bold mb-2">⚡ AI SUMMARY</div>
                <ul class="list-disc pl-5 space-y-1 text-sm text-on-surface-variant leading-relaxed">
                    ${parsedBullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
            </div>`;
        }

        const articleJson = JSON.stringify({
            id: article.id,
            created_at: article.created_at
        });

        const imageFit = isOwn ? 'object-contain bg-surface-container/50' : 'object-cover';
        const officialBadge = isOfficial ? `<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#60a5fa] border border-[#60a5fa]/30 text-[9px] font-bold uppercase tracking-wider gap-0.5"><span class="material-symbols-outlined text-[11px]">verified</span>Official</span>` : '';
        const ownBadge = isOwn ? `<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20"><img src="/logo.png" alt="" class="h-3.5 w-auto object-contain" width="36" height="14"/></span>` : '';

        const heroHtml = `
            <a class="relative group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant/20 flex flex-col overflow-hidden card-hover h-full" href="${url}" data-ssr="true" data-article="${escapeHtml(articleJson)}">
                <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">
                    <img referrerpolicy="no-referrer" fetchpriority="high" loading="eager" class="absolute inset-0 w-full h-full ${imageFit} transition-transform duration-700 group-hover:scale-105" src="${imageUrl}" alt="${article.title||''}" onerror="this.src='${DEFAULT_IMG}'"/>
                    ${latestBadge}
                </div>
                <div class="p-6 flex flex-col flex-1">
                    <span class="font-label text-label text-primary uppercase tracking-widest mb-2 flex items-center gap-y-1 flex-wrap">${pubDate} ${ownBadge} ${officialBadge} <span id="comments-badge-${article.id}" class="ml-2 inline-flex items-center text-on-surface-variant/70 gap-0.5 text-[11px] font-bold"></span></span>
                    <h2 class="font-h2 text-h2 group-hover:text-primary transition-colors leading-tight">${article.title||''}</h2>
                    <p class="font-body text-body text-on-surface-variant mt-2 line-clamp-2">${article.summary||''}</p>
                    <div class="mt-auto overflow-hidden">
                        ${bulletsHtml}
                    </div>
                </div>
            </a>
        `;

        const preloadTag = `<link rel="preload" as="image" fetchpriority="high" href="${imageUrl}">`;

        html = html.replace('<!-- HERO_PRELOAD_INJECT -->', preloadTag);

        // Inject dynamic OG meta for homepage hero (important for Google Discover)
        const ogMeta = `
    <!-- Dynamic Hero OG Meta (SSR) -->
    <meta property="og:title" content="${escapeHtml(article.title)}"/>
    <meta property="og:description" content="${escapeHtml(article.summary || article.title)}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="628"/>
    <meta property="og:url" content="https://www.panathinaikosnews.gr"/>
    <meta property="og:type" content="website"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:image" content="${imageUrl}"/>
    <meta name="robots" content="index, follow, max-image-preview:large"/>`;
        html = html.replace('<!-- {{SSR_OG_META}} -->', ogMeta);
        
        const heroRegex = /(<!-- HERO_START -->)([\s\S]*?)(<!-- HERO_END -->)/i;
        if (heroRegex.test(html)) {
            html = html.replace(heroRegex, `$1\n${heroHtml}\n$3`);
        } else {
            const fallbackRegex = /(<div[^>]*id="hero-container"[^>]*>)([\s\S]*?)(<\/div>)/i;
            html = html.replace(fallbackRegex, `$1\n${heroHtml}\n$3`);
        }
        
        return res.status(200).send(html);

    } catch (err) {
        console.error('SSR Index Error:', err);
        let html = getIndexTemplate();
        html += `<!-- SSR ERROR: ${err.message}\n${err.stack} -->`;
        return res.status(200).send(html);
    }
};