const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
    return (text || '').toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0370-\u03FF\u1F00-\u1FFF-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function getCategoryCleanName(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('ποδόσφαιρο') || cat.includes('football')) return 'podosfairo';
    if (cat.includes('μπάσκετ') || cat.includes('basketball')) return 'basket';
    if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) return 'erasitexnis';
    if (cat.includes('άποψη') || cat.includes('opinion')) return 'apopsi';
    if (cat.includes('μεταγραφές') || cat.includes('transfers')) return 'metagrafes';
    return 'podosfairo';
}

function formatExactDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
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
    // SSR Caching: 60s max age, 30s stale while revalidate
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=30');

    let categoryFilter = null;
    if (req.query.category) {
        const cat = req.query.category.toLowerCase();
        if (cat === 'football') categoryFilter = 'Ποδόσφαιρο';
        else if (cat === 'basket' || cat === 'basketball') categoryFilter = 'Μπάσκετ';
        else if (cat === 'erasitexnis' || cat === 'erasitechnis' || cat === 'amateur') categoryFilter = 'Ερασιτέχνης';
        else if (cat === 'apopsi' || cat === 'opinion') categoryFilter = 'Άποψη';
        else if (cat === 'metagrafes') categoryFilter = 'Μεταγραφές';
    }

    try {
        let query = supabase.from('articles').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1);
        if (categoryFilter) {
            if (categoryFilter === 'Άποψη') {
                query = query.ilike('category', '%Άποψη%');
            } else {
                query = query.ilike('category', `%${categoryFilter}%`);
            }
        }

        const { data: articles, error } = await query;
        let article = (articles && articles.length > 0) ? articles[0] : null;

        const templatePath = path.join(__dirname, '../index.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        if (!article) {
            // No article found, just return unmodified HTML (it will fallback to skeletons)
            return res.status(200).send(html);
        }

        const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
        let imageUrl = article.image_url || DEFAULT_IMG;

        // Try to filter out generic branding logos and replace with google proxy if valid
        try {
            if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
            let u;
            if (imageUrl.startsWith('/')) {
                u = new URL(imageUrl, 'https://www.panathinaikosnews.gr');
            } else {
                u = new URL(imageUrl);
            }
            const pathLower = u.pathname.toLowerCase();
            const filenameBrandingIndicators = ['logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark'];
            const isBranding = filenameBrandingIndicators.some(ind => pathLower.includes(ind));
            if (isBranding) {
                imageUrl = DEFAULT_IMG;
            } else if (!u.hostname.includes('localhost') && !u.hostname.includes('panathinaikosnews.gr') && !u.hostname.includes('wsrv.nl')) {
                // Compress external image on-the-fly to tiny WebP/AVIF format
                imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=800&output=webp&q=82`;
            }
        } catch (e) {}

        const slug = slugify(article.title);
        const catPath = getCategoryCleanName(article.category);
        const url = `/${catPath}/${slug}-id=${article.id}`;
        const pubDate = formatExactDate(article.created_at);

        const isOwn = (article.source_url||'').toLowerCase().includes('manual') || (article.source_url||'').toLowerCase().includes('opinion://');
        const isOfficial = (article.source_url||'').toLowerCase().includes('pao.gr') || (article.source_url||'').toLowerCase().includes('pao1908.com') || (article.source_url||'').toLowerCase().includes('paobc.gr');
        const ageMs = Date.now() - new Date(article.created_at).getTime();
        const isFresh = ageMs < 60 * 60 * 1000;
        const showLatest = !isOwn && article.category !== 'Άποψη' && isFresh;
        const latestBadge = showLatest
            ? `<div class="absolute top-3 left-3 px-3 py-1 bg-tertiary text-on-tertiary font-label text-label rounded font-bold tracking-wider">LATEST</div>`
            : '';

        let bulletsHtml = '';
        let parsedBullets = [];
        if (article.bullets) {
            if (Array.isArray(article.bullets)) {
                parsedBullets = article.bullets;
            } else if (typeof article.bullets === 'string') {
                try { parsedBullets = JSON.parse(article.bullets); } catch(e) {}
            }
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
            <a class="group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant/20 flex flex-col overflow-hidden card-hover h-full" href="${url}" data-ssr="true" data-article="${escapeHtml(articleJson)}">
                <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">
                    <img referrerpolicy="no-referrer" fetchpriority="high" loading="eager" class="absolute inset-0 w-full h-full ${imageFit} transition-transform duration-700 group-hover:scale-105" src="${imageUrl}" alt="${article.title||''}" onerror="this.src='${DEFAULT_IMG}'"/>
                    ${latestBadge}
                </div>
                <div class="p-6 flex flex-col flex-1">
                    <span class="font-label text-label text-primary uppercase tracking-widest mb-2 flex items-center gap-y-1 flex-wrap">${pubDate} ${ownBadge} ${officialBadge}</span>
                    <h2 class="font-h2 text-h2 group-hover:text-primary transition-colors leading-tight">${article.title||''}</h2>
                    <p class="font-body text-body text-on-surface-variant mt-2 line-clamp-2">${article.summary||''}</p>
                    <div class="mt-auto overflow-hidden">
                        ${bulletsHtml}
                    </div>
                </div>
            </a>
        `;

        const preloadTag = `<link rel="preload" as="image" href="${imageUrl}">`;

        // Inject Preload Tag
        html = html.replace('<!-- HERO_PRELOAD_INJECT -->', preloadTag);
        
        // Inject Hero HTML
        const heroRegex = /(<!-- HERO_START -->)([\s\S]*?)(<!-- HERO_END -->)/i;
        if (heroRegex.test(html)) {
            html = html.replace(heroRegex, `$1\n${heroHtml}\n$3`);
        } else {
            // Fallback just in case
            const fallbackRegex = /(<div[^>]*id="hero-container"[^>]*>)([\s\S]*?)(<\/div>)/i;
            html = html.replace(fallbackRegex, `$1\n${heroHtml}\n$3`);
        }
        
        res.status(200).send(html);

    } catch (err) {
        console.error('SSR Index Error:', err);
        const templatePath = path.join(__dirname, '../index.html');
        let html = fs.readFileSync(templatePath, 'utf8');
        html += `<!-- SSR ERROR: ${err.message}\n${err.stack} -->`;
        res.status(200).send(html); // Fallback to raw HTML
    }
};
