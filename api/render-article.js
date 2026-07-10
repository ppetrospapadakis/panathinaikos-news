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
        .replace(/[^\w\u0370-\u03FF\u1F00-\u1FFF-]+/g, '') // preserve Greek characters
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

module.exports = async (req, res) => {
    // Enable Vercel Edge caching - July 10, 2026
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');

    const { id } = req.query;

    if (!id) {
        return res.status(400).send('<h1>Σφάλμα: Λείπει το ID άρθρου.</h1>');
    }

    try {
        // 1. Fetch article from Supabase
        const { data: article, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !article) {
            console.error('Database fetch error:', error);
            return res.status(404).send('<h1>Το άρθρο δεν βρέθηκε στη βάση δεδομένων.</h1>');
        }

        // 2. Read template file article.html
        const templatePath = path.join(process.cwd(), 'article.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        // 3. Prepare parameters
        const cleanCat = getCategoryCleanName(article.category);
        const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
        
        let imageUrl = article.image_url || DEFAULT_IMG;
        if (imageUrl) {
            try {
                const u = new URL(imageUrl);
                const filename = u.pathname.substring(u.pathname.lastIndexOf('/') + 1).toLowerCase();
                const pathLower = u.pathname.toLowerCase();
                const filenameBrandingIndicators = [
                    'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
                    'og-image', 'og_image', 'site-logo', 'site_logo', 'default-image', 'default_image',
                    'noimage', 'no-image', 'blank', 'generic', 'share-image', 'share_image'
                ];
                const pathBrandingPaths = ['/logos/', '/logo/', '/brand/', '/branding/', '/default_images/', '/default-images/', '/assets/images/', '/site-assets/'];
                let isBranding = filenameBrandingIndicators.some(ind => filename.includes(ind));
                if (!isBranding) isBranding = pathBrandingPaths.some(p => ('/' + pathLower + '/').includes(p));
                if (isBranding) {
                    imageUrl = DEFAULT_IMG;
                }
            } catch (_) {}
        } else {
            imageUrl = DEFAULT_IMG;
        }

        const sourceUrlStr = (article.source_url || '').toLowerCase();
        const categoryStr = (article.category || '').toLowerCase();
        const isManual = sourceUrlStr.startsWith('manual') || 
                         sourceUrlStr.includes('opinion://manual') || 
                         sourceUrlStr.includes('opinion://system-roster') ||
                         categoryStr.includes('άποψη') || 
                         categoryStr.includes('apopsi');

        // Determine source domain
        let sourceName = 'Portal';
        if (!isManual && article.source_url) {
            try {
                const host = new URL(article.source_url).hostname.replace('www.','').split('.')[0].toLowerCase();
                const portals = {
                    'sdna': 'SDNA',
                    'gazzetta': 'Gazzetta.gr',
                    'sport24': 'Sport24',
                    'sportal': 'Sportal.gr',
                    'sport-fm': 'Sport-FM',
                    'athletiko': 'Athletiko'
                };
                sourceName = portals[host] || 'Πηγή';
            } catch (_) {}
        }

        const pubDate = new Date(article.created_at);
        const dateStr = pubDate.toLocaleDateString('el-GR', {
            day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'
        });

        // 4. Perform replacements
        
        // Title Replacement
        html = html.replace(
            /<title id="page-title">Panathinaikos News - Άρθρο<\/title>/g,
            `<title id="page-title">${escapeHtml(article.title)} | Panathinaikos News</title>`
        );

        // SEO and metadata replacement
        const metaTags = `
    <!-- Dynamic SEO and OpenGraph Metadata -->
    <meta property="og:title" content="${escapeHtml(article.title)}"/>
    <meta property="og:description" content="${escapeHtml(article.summary || '')}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:url" content="https://panathinaikos-news.vercel.app/${cleanCat}/${slugify(article.title)}-id=${article.id}"/>
    <meta property="og:type" content="article"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${escapeHtml(article.title)}"/>
    <meta name="twitter:description" content="${escapeHtml(article.summary || '')}"/>
    <meta name="twitter:image" content="${imageUrl}"/>
    <link rel="canonical" href="https://panathinaikos-news.vercel.app/${cleanCat}/${slugify(article.title)}-id=${article.id}"/>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": ${JSON.stringify(article.title)},
      "image": [
        ${JSON.stringify(imageUrl)}
      ],
      "datePublished": ${JSON.stringify(article.created_at)},
      "dateModified": ${JSON.stringify(article.updated_at || article.created_at)},
      "author": {
        "@type": "Person",
        "name": "PanathinaikosNews Editorial"
      },
      "publisher": {
        "@type": "Organization",
        "name": "PanathinaikosNews",
        "logo": {
          "@type": "ImageObject",
          "url": "https://panathinaikos-news.vercel.app/logo.png"
        }
      }
    }
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
        html = html.replace(
            /<span id="article-category">Κατηγορία<\/span>/g,
            `<span id="article-category">${article.category || 'Ποδόσφαιρο'}</span>`
        );

        // Date
        html = html.replace(
            /<span id="article-date" class="text-on-surface-variant normal-case font-normal tracking-normal"><\/span>/g,
            `<span id="article-date" class="text-on-surface-variant normal-case font-normal tracking-normal">${dateStr}</span>`
        );

        // Title
        html = html.replace(
            /<h1 id="article-title" class="font-display-l-mobile text-display-l-mobile md:text-display-l text-on-surface leading-tight"><\/h1>/g,
            `<h1 id="article-title" class="font-display-l-mobile text-display-l-mobile md:text-display-l text-on-surface leading-tight">${article.title}</h1>`
        );

        // Image Box
        if (imageUrl) {
            html = html.replace(
                /id="article-image-box" class="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant\/20 shadow-xl hidden"/g,
                'id="article-image-box" class="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 shadow-xl"'
            );
            html = html.replace(
                /id="article-image" class="w-full h-full object-cover" src=""/g,
                `id="article-image" class="w-full h-full object-cover" src="${imageUrl}"`
            );
        }

        // Bullets (AI Summary)
        if (article.bullets && article.bullets.length > 0) {
            html = html.replace(
                /id="article-bullets-box" class="p-6 bg-surface-container-low rounded-2xl border border-primary\/30 premium-gradient hidden"/g,
                'id="article-bullets-box" class="p-6 bg-surface-container-low rounded-2xl border border-primary/30 premium-gradient"'
            );
            
            const bulletsListHtml = article.bullets.map(b => `<li>${b}</li>`).join('');
            html = html.replace(
                /<ul id="article-bullets-list" class="space-y-3 text-on-surface-variant text-body leading-relaxed">\s*<\/ul>/g,
                `<ul id="article-bullets-list" class="space-y-3 text-on-surface-variant text-body leading-relaxed">${bulletsListHtml}</ul>`
            );
        }

        // Long-form body rendering
        let bodyHtml = article.content || '';
        if (!bodyHtml && article.summary) {
            bodyHtml = article.summary.split('\n+').map(p => `<p>${escapeHtml(p)}</p>`).join('');
        }
        
        if (isManual) {
            const logoBlock = `
                <div class="flex flex-col items-center justify-center py-10 border-t border-outline-variant/30 mt-12 space-y-3">
                    <img src="/logo.png" alt="PanathinaikosNews" class="h-12 md:h-14 w-auto object-contain opacity-90 transition-transform hover:scale-105 duration-300"/>
                    <p class="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold">PanathinaikosNews Editorial</p>
                </div>`;
            bodyHtml += logoBlock;
        }

        html = html.replace(
            /<div id="article-body" class="leading-relaxed">\s*<\/div>/g,
            `<div id="article-body" class="leading-relaxed">${bodyHtml}</div>`
        );

        // Source link references
        if (isManual) {
            html = html.replace(
                /id="article-source-container" class="border-t border-outline-variant\/30 pt-10 text-center"/g,
                'id="article-source-container" class="border-t border-outline-variant/30 pt-10 text-center" style="display: none;"'
            );
        } else {
            html = html.replace(
                /id="article-source-link" class="inline-flex items-center gap-2 px-6 py-3 bg-surface-container hover:bg-surface-container-highest border border-outline-variant\/30 text-primary font-bold rounded-xl active:scale-95 transition-all text-sm" href=""/g,
                `id="article-source-link" class="inline-flex items-center gap-2 px-6 py-3 bg-surface-container hover:bg-surface-container-highest border border-outline-variant/30 text-primary font-bold rounded-xl active:scale-95 transition-all text-sm" href="${article.source_url || '#'}"`
            );
            html = html.replace(
                /<span id="article-source-name">Portal<\/span>/g,
                `<span id="article-source-name">${sourceName}</span>`
            );
        }

        return res.status(200).send(html);
    } catch (err) {
        console.error('Server-side rendering exception:', err);
        return res.status(500).send(`<h1>Σφάλμα συστήματος κατά την απόδοση του άρθρου.</h1><p>${escapeHtml(err.message)}</p>`);
    }
};
