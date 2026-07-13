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

    return rawParagraphs.map((para, idx) => {
        // First paragraph gets slightly larger leading font size
        const cls = idx === 0
            ? 'text-[1.05rem] leading-[1.85] text-on-surface mb-6'
            : 'text-[1rem] leading-[1.85] text-on-surface/90 mb-6';
        return `<p class="${cls}">${para}</p>`;
    }).join('\n');
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
            const urls = article.source_url.split(',').map(u => u.trim()).filter(Boolean);
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
                        'athletiko': { name: 'Athletiko', color: '#0066cc' }
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
            sourcesHtml = `<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 flex flex-wrap justify-center gap-4">${linksHtml}</div>`;
        }

        const pubDate = new Date(article.created_at);
        let dateStr = pubDate.toLocaleDateString('el-GR', {
            day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit',
            timeZone: 'Europe/Athens', hour12: false
        });
        // Sometime localedateString returns something like "13 Ιουλίου 2026, 17:21"
        // Let's ensure it has "ΣΤΙΣ"
        if (dateStr.includes(',')) {
            dateStr = dateStr.replace(',', ' ΣΤΙΣ');
        } else {
            // fallback if it format is "13 Ιουλίου 2026 17:21"
            dateStr = dateStr.replace(/ (\d{2}:\d{2})$/, ' ΣΤΙΣ $1');
        }
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
            /<span id="article-date"([^>]*)><\/span>/g,
            `<span id="article-date"$1>${dateStr}</span>`
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
                /id="article-image"([^>]*)src=""/g,
                `id="article-image"$1src="${imageUrl}"`
            );
        }

        // Bullets (AI Summary)
        if (article.bullets && article.bullets.length > 0) {
            html = html.replace(
                /id="article-bullets-box" class="p-6 bg-surface-container-low rounded-2xl border border-primary\/30 premium-gradient hidden"/g,
                'id="article-bullets-box" class="p-6 bg-surface-container-low rounded-2xl border border-primary/30 premium-gradient"'
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

        if (isManual) {
            const logoBlock = `
                <div class="flex flex-col items-center justify-center py-10 border-t border-outline-variant/30 mt-12 space-y-3">
                    <img src="/logo.png" alt="PanathinaikosNews" class="h-12 md:h-14 w-auto object-contain opacity-90 transition-transform hover:scale-105 duration-300"/>
                    <p class="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold">PanathinaikosNews Editorial</p>
                </div>`;
            bodyHtml += logoBlock;
        }

        html = html.replace(
            /<div id="article-body" class="leading-relaxed">[\s\S]*?<\/div>/g,
            `<div id="article-body" class="leading-relaxed">${bodyHtml}</div>`
        );
        // Replace the entire original source container block using regex matching the HTML structure
        const sourceContainerRegex = /<div id="article-source-container"[\s\S]*?<\/div>\s*<\/div>\s*<!-- ⑤ MINIMAL SOURCE REFERENCE BUTTON -->/m;
        // Since matching multiline can be tricky, we'll replace a more robust substring or just use string splitting.
        // Actually, let's just do a string replace of the known div.
        const sourceContainerStart = '<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 text-center">';
        const sourceContainerEnd = '</a>\n                </div>';
        
        const blockStart = html.indexOf(sourceContainerStart);
        if (blockStart !== -1) {
            const blockEnd = html.indexOf('</div>', blockStart + sourceContainerStart.length) + 6;
            html = html.substring(0, blockStart) + sourcesHtml + html.substring(blockEnd);
        }

        return res.status(200).send(html);
    } catch (err) {
        console.error('Server-side rendering exception:', err);
        return res.status(500).send(`<h1>Σφάλμα συστήματος κατά την απόδοση του άρθρου.</h1><p>${escapeHtml(err.message)}</p>`);
    }
};
