const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();

const supabase = createClient(supabaseUrl, supabaseKey);

// Cache HTML template at module level — avoids synchronous disk I/O on every request
let _articleTemplate = null;
function getTemplate() {
    if (!_articleTemplate) {
        const possiblePaths = [
            path.join(__dirname, '../article.html'),
            path.join(process.cwd(), 'article.html'),
            path.join(__dirname, 'article.html')
        ];
        for (const p of possiblePaths) {
            try {
                if (fs.existsSync(p)) {
                    _articleTemplate = fs.readFileSync(p, 'utf8');
                    if (_articleTemplate) break;
                }
            } catch (e) {}
        }
    }
    return _articleTemplate || '';
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
    return 'pao';
}

function escapeHtml(unsafe) {
    return (unsafe || '')
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * Converts plain-text article content (paragraphs separated by blank lines or \n)
 * into well-structured HTML with styled <p> tags.
 * Bold the first sentence of each paragraph for editorial emphasis.
 */
function formatBodyContent(text) {
    if (!text || !text.trim()) return '';

    // Split on one or more blank lines (handles \r\n too)
    const rawParagraphs = text.split(/\n{2,}|\r\n{2,}/).map(p => p.replace(/[\r\n]+/g, ' ').trim()).filter(Boolean);

    if (rawParagraphs.length === 0) return '';

    return rawParagraphs.map((para) => {
        return `<p class="text-[1rem] leading-[1.85] text-on-surface/90 mb-6">${para}</p>`;
    }).join('\n');
}

function getGreekDateParts(dateString) {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;

    const year = d.getUTCFullYear();
    const mar31 = new Date(Date.UTC(year, 2, 31));
    const dstStart = new Date(Date.UTC(year, 2, 31 - mar31.getUTCDay(), 1, 0, 0));
    const oct31 = new Date(Date.UTC(year, 9, 31));
    const dstEnd = new Date(Date.UTC(year, 9, 31 - oct31.getUTCDay(), 1, 0, 0));

    const isDst = d >= dstStart && d < dstEnd;
    const offsetHours = isDst ? 3 : 2;

    const greekMs = d.getTime() + (offsetHours * 60 * 60 * 1000);
    const greekDate = new Date(greekMs);

    return {
        day: String(greekDate.getUTCDate()).padStart(2, '0'),
        monthNum: String(greekDate.getUTCMonth() + 1).padStart(2, '0'),
        monthIndex: greekDate.getUTCMonth(),
        year: greekDate.getUTCFullYear(),
        hours: String(greekDate.getUTCHours()).padStart(2, '0'),
        minutes: String(greekDate.getUTCMinutes()).padStart(2, '0')
    };
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

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

    // Support both ?id=XXXXXXXX (old) and ?slug=titlos-XXXXXXXX (new format)
    let rawId = (req.query.id || '').trim();
    if (!rawId && req.query.slug) {
        // Extract trailing 8 hex chars from new-format slug: titlos-arthrou-67e7db6d
        const slugMatch = (req.query.slug || '').match(/-([0-9a-f]{8})$/i);
        if (slugMatch) rawId = slugMatch[1];
    }

    if (!rawId) {
        return res.status(400).send('<h1>Σφάλμα: Λείπει το ID άρθρου.</h1>');
    }

    try {
        // 1. Fetch article from Supabase (supports both 8-char short ID and 36-char full UUID)
        let query = supabase.from('articles').select('id, title, summary, content, image_url, category, created_at, updated_at, source_url, bullets, group_id');
        if (rawId.length === 36) {
            query = query.eq('id', rawId);
        } else if (rawId.length >= 8) {
            const shortHex = rawId.substring(0, 8);
            query = query
                .gte('id', `${shortHex}-0000-0000-0000-000000000000`)
                .lte('id', `${shortHex}-ffff-ffff-ffff-ffffffffffff`);
        } else {
            query = query.eq('id', rawId);
        }

        let { data: articles, error } = await query.limit(1);
        let article = (articles && articles.length > 0) ? articles[0] : null;

        if (error || !article) {
            console.error('Database fetch error:', error);
            return res.status(404).send('<h1>Το άρθρο δεν βρέθηκε στη βάση δεδομένων.</h1>');
        }

        // 2. Get cached template (no disk I/O after first request)
        let html = getTemplate();

        // 3. Prepare parameters
        const cleanCat = getCategoryCleanName(article.category);
        const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
        
        let imageUrl = article.image_url || DEFAULT_IMG;
        if (imageUrl && !imageUrl.includes('logo.png') && !imageUrl.includes('favicon')) {
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
                } else if (!u.hostname.includes('wsrv.nl')) {
                    // Proxy & optimize all images (external and custom uploads) to WebP format for fast mobile loads
                    imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(u.href)}&w=1200&output=webp&q=82`;
                }
            } catch (_) {}
        }
        // NOTE: if image_url contains 'logo.png' or 'favicon', we keep it as-is (our own CDN assets — no proxy needed).
        // We do NOT fall back to DEFAULT_IMG in that case — the user explicitly set that image.


        const sourceUrlStr = (article.source_url || '');
        const categoryStr = (article.category || '').toLowerCase();
        const isManual = sourceUrlStr.toLowerCase().startsWith('manual') || 
                         sourceUrlStr.toLowerCase().includes('opinion://manual') || 
                         sourceUrlStr.toLowerCase().includes('opinion://system-roster') ||
                         categoryStr.includes('άποψη') || 
                         categoryStr.includes('apopsi');

        let sourcesHtml = '';
        if (isManual) {
            sourcesHtml = `
            <div class="flex flex-col items-center justify-center py-10 border-t border-outline-variant/30 mt-12 space-y-3">
                <img src="/logo.png" alt="PanathinaikosNews" class="h-12 md:h-14 w-auto object-contain opacity-90 transition-transform hover:scale-105 duration-300"/>
                <p class="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold">PanathinaikosNews Editorial</p>
            </div>`;
        } else if (article.source_url) {
            const rawUrls = article.source_url.split(',').map(u => u.trim()).filter(Boolean);
            const seenDomains = new Set();
            const urls = [];
            for (const u of rawUrls) {
                try {
                    const host = new URL(u).hostname.replace('www.', '').toLowerCase();
                    if (!seenDomains.has(host)) {
                        seenDomains.add(host);
                        urls.push(u);
                    }
                } catch (_) {
                    urls.push(u);
                }
            }
            const linksHtml = urls.map(url => {
                let name = 'Portal';
                let color = '#84d999';
                try {
                    const host = new URL(url).hostname.replace('www.','').split('.')[0].toLowerCase();
                    const portals = {
                        'sdna': { name: 'SDNA', color: '#ff6600' },
                        'gazzetta': { name: 'Gazzetta.gr', color: '#0099ff' },
                        'sport24': { name: 'Sport24', color: '#ff3333' },
                        'sportal': { name: 'Sportal.gr', color: '#ff9900' },
                        'sport-fm': { name: 'Sport-FM', color: '#ffcc00' },
                        'athletiko': { name: 'Athletiko', color: '#0066cc' },
                        'pao': { name: 'PAO.GR', color: '#007a33' },
                        'paobc': { name: 'PAOBC.GR', color: '#007a33' },
                        'pao1908': { name: 'PAO1908.COM', color: '#007a33' }
                    };
                    if(portals[host]) {
                        name = portals[host].name;
                        color = portals[host].color;
                    } else {
                        name = host.toUpperCase();
                    }
                } catch(e) {}
                
                return `
                    <a href="${url}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all text-sm font-medium">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        <span>Διαβάστε σχετικό άρθρο στο <span style="color: ${color}" class="font-bold">${name}</span></span>
                    </a>`;
            }).join('');
            sourcesHtml = `<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 flex flex-wrap justify-center gap-4 px-4 md:px-0">${linksHtml}</div>`;
        }

        applyMonotonicJitter([article]);
        const monthNames = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
        const p = getGreekDateParts(article.created_at);
        const dateStr = p ? `${parseInt(p.day, 10)} ${monthNames[p.monthIndex]} ${p.year} στις ${p.hours}:${p.minutes}` : '';
        // 4. Perform replacements
        
        // Title Replacement
        html = html.replace(
            /<title id="page-title">Panathinaikos News - Άρθρο<\/title>/g,
            `<title id="page-title">${escapeHtml(article.title)} | Panathinaikos News</title>`
        );

        const shortId = (article.id || '').substring(0, 8);
        // SEO and metadata replacement
        const metaTags = `
    <!-- Dynamic SEO and OpenGraph Metadata -->
    <link rel="preload" as="image" fetchpriority="high" href="${imageUrl}"/>
    <meta name="description" content="${escapeHtml(article.summary || article.title)}"/>
    <meta name="robots" content="index, follow, max-image-preview:large"/>
    <meta property="og:title" content="${escapeHtml(article.title)}"/>
    <meta property="og:description" content="${escapeHtml(article.summary || '')}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:url" content="https://www.panathinaikosnews.gr/${cleanCat}/${slugify(article.title)}-${shortId}"/>
    <meta property="og:type" content="article"/>
    <meta property="og:locale" content="el_GR"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:site" content="@PanaNewsGr"/>
    <meta name="twitter:creator" content="@PanaNewsGr"/>
    <meta name="twitter:title" content="${escapeHtml(article.title)}"/>
    <meta name="twitter:description" content="${escapeHtml(article.summary || '')}"/>
    <meta name="twitter:image" content="${imageUrl}"/>
    <link rel="canonical" href="https://www.panathinaikosnews.gr/${cleanCat}/${slugify(article.title)}-${shortId}"/>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": "https://www.panathinaikosnews.gr/${cleanCat}/${slugify(article.title)}-${shortId}",
        "headline": ${JSON.stringify(article.title)},
        "image": [
          ${JSON.stringify(imageUrl)}
        ],
        "datePublished": ${JSON.stringify(article.created_at)},
        "dateModified": ${JSON.stringify(article.updated_at || article.created_at)},
        "author": {
          "@type": "Organization",
          "name": "PanathinaikosNews",
          "url": "https://www.panathinaikosnews.gr"
        },
        "publisher": {
          "@type": "Organization",
          "name": "PanathinaikosNews",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.panathinaikosnews.gr/logo.png"
          }
        },
        "description": ${JSON.stringify(article.summary || article.title)},
        "articleSection": ${JSON.stringify(article.category || 'Ποδόσφαιρο')}
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Αρχική",
            "item": "https://www.panathinaikosnews.gr"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": ${JSON.stringify(article.category || 'Ποδόσφαιρο')},
            "item": "https://www.panathinaikosnews.gr/${cleanCat}"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": ${JSON.stringify(article.title)},
            "item": "https://www.panathinaikosnews.gr/${cleanCat}/${slugify(article.title)}-${shortId}"
          }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "SportsTeam",
        "name": "Παναθηναϊκός",
        "alternateName": "Panathinaikos FC / BC",
        "url": "https://www.panathinaikosnews.gr",
        "sport": "Football / Basketball",
        "memberOf": {
          "@type": "SportsOrganization",
          "name": "Super League Greece / EuroLeague"
        }
      }
    ]
    </script>
    <script>window.__PRE_RENDERED__ = true;</script>
        `;

        html = html.replace('<!-- {{SEO_META_PLACEHOLDER}} -->', metaTags);

        // Hide Skeleton
        html = html.replace(
            /id="article-skeleton"/g,
            'id="article-skeleton" style="display: none;"'
        );

        // Show Article Display
        html = html.replace(
            /id="article-display" class="hidden space-y-8"/g,
            'id="article-display" class="space-y-8"'
        );

        // Category
        const isGenika = article.category === 'Γενικά' || !article.category;
        if (isGenika) {
            html = html.replace(
                /<span id="article-category-dot" class="w-1.5 h-1.5 rounded-full bg-primary\/40"><\/span>/g,
                ''
            );
            html = html.replace(
                /<span id="article-category" class="text-primary"><\/span>/g,
                ''
            );
        } else {
            const displayCat = article.category === 'DELETED' ? 'Ποδόσφαιρο' : article.category;
            html = html.replace(
                /<span id="article-category" class="text-primary"><\/span>/g,
                `<span id="article-category" class="text-primary">${displayCat}</span>`
            );
        }

        // Date
        html = html.replace(
            /<span id="article-date"([^>]*)><\/span>/g,
            `<span id="article-date"$1>${dateStr}</span>`
        );

        // Title
        html = html.replace(
            /<h1 id="article-title" class="font-display text-h1 md:text-display font-bold text-on-surface leading-tight mb-4"><\/h1>/g,
            `<h1 id="article-title" class="font-display text-h1 md:text-display font-bold text-on-surface leading-tight mb-4">${article.title}</h1>`
        );

        // Image Box
        if (imageUrl) {
            html = html.replace(
                /id="article-image-box" class="relative w-full aspect-video rounded-none md:rounded-2xl overflow-hidden bg-surface-container-low border-y border-x-0 md:border-x md:border-y border-outline-variant\/20 shadow-xl hidden"/g,
                'id="article-image-box" class="relative w-full aspect-video rounded-none md:rounded-2xl overflow-hidden bg-surface-container-low border-y border-x-0 md:border-x md:border-y border-outline-variant/20 shadow-xl"'
            );
            html = html.replace(
                /id="article-image"([^>]*)src=""/g,
                `id="article-image"$1src="${imageUrl}"`
            );
        }

        // Bullets (AI Summary)
        if (article.bullets && article.bullets.length > 0) {
            html = html.replace(
                /id="article-bullets-box" class="ai-summary p-6 mx-4 md:mx-0 bg-surface-container-low rounded-2xl border border-primary\/30 premium-gradient hidden"/g,
                'id="article-bullets-box" class="ai-summary p-6 mx-4 md:mx-0 bg-surface-container-low rounded-2xl border border-primary/30 premium-gradient"'
            );
            
            const bulletsListHtml = article.bullets.map(b => `<li class="flex items-start gap-3"><span class="text-primary font-bold mt-1 shrink-0">→</span><span>${b}</span></li>`).join('');
            html = html.replace(
                /<ul id="article-bullets-list" class="space-y-3 text-on-surface-variant text-body leading-relaxed">\s*<\/ul>/g,
                `<ul id="article-bullets-list" class="space-y-3 text-on-surface-variant text-body leading-relaxed">${bulletsListHtml}</ul>`
            );
        }

        // Long-form body rendering
        let bodyHtml = '';
        const rawContent = article.content || '';

        if (rawContent) {
            // If it already contains HTML tags, use as-is; otherwise format plain text
            const looksLikeHtml = /<(p|h[1-6]|ul|ol|li|div|strong|em|br)[\s>]/i.test(rawContent);
            bodyHtml = looksLikeHtml ? rawContent : formatBodyContent(rawContent);
        } else if (article.summary) {
            bodyHtml = formatBodyContent(article.summary);
        }

        // Remove duplicate logo block injection in bodyHtml since it's already in sourcesHtml
        html = html.replace(
            /<div id="article-body" class="leading-relaxed px-4 md:px-0">[\s\S]*?<\/div>/g,
            `<div id="article-body" class="leading-relaxed px-4 md:px-0">${bodyHtml}</div>`
        );
        // Replace the entire original source container block using regex matching the HTML structure
        const sourceContainerRegex = /<div id="article-source-container"[\s\S]*?<\/div>\s*<\/div>\s*<!-- ⑤ MINIMAL SOURCE REFERENCE BUTTON -->/m;
        // Since matching multiline can be tricky, we'll replace a more robust substring or just use string splitting.
        // Actually, let's just do a string replace of the known div.
        const sourceContainerStart = '<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 text-center px-4 md:px-0">';
        const sourceContainerEnd = '</a>\n                </div>';
        
        const blockStart = html.indexOf(sourceContainerStart);
        if (blockStart !== -1) {
            const blockEnd = html.indexOf('</div>', blockStart + sourceContainerStart.length) + 6;
            html = html.substring(0, blockStart) + sourcesHtml + html.substring(blockEnd);
        }

        
        const articleDataJson = JSON.stringify(article).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
        const articleDataScript = `<script>window.currentArticleData = ${articleDataJson};</script>`;
        html = html.replace('</head>', `${articleDataScript}\n</head>`);

        return res.status(200).send(html);
    } catch (err) {
        console.error('Server-side rendering exception:', err);
        return res.status(500).send(`<h1>Σφάλμα συστήματος κατά την απόδοση του άρθρου.</h1><p>${escapeHtml(err.message)}</p>`);
    }
};
