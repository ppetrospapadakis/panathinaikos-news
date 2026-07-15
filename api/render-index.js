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
    // Reduce cache during fixes to ensure the user sees changes immediately
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=0, stale-while-revalidate=0');

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
            const u = new URL(imageUrl);
            const pathLower = u.pathname.toLowerCase();
            const filenameBrandingIndicators = ['logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark'];
            const isBranding = filenameBrandingIndicators.some(ind => pathLower.includes(ind));
            if (isBranding) {
                imageUrl = DEFAULT_IMG;
            }
        } catch (e) {}

        const slug = slugify(article.title);
        const catPath = getCategoryCleanName(article.category);
        const url = `/${catPath}/${slug}-id=${article.id}`;
        const pubDate = formatExactDate(article.created_at);

        const articleJson = JSON.stringify({
            id: article.id,
            created_at: article.created_at
        });

        const heroHtml = `
            <a href="${url}" class="group relative block aspect-[4/3] md:aspect-video w-full rounded-2xl overflow-hidden bg-surface-container-high transition-transform card-hover border border-outline-variant/20 shadow-sm" data-ssr="true" data-article="${escapeHtml(articleJson)}">
                <img rel="preload" fetchpriority="high" loading="eager" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" src="${imageUrl}" alt="${article.title||''}" onerror="this.src='${DEFAULT_IMG}'"/>
                <div class="absolute inset-0 bg-gradient-to-t from-[#1A1C1E]/95 via-[#1A1C1E]/50 to-transparent"></div>
                
                <div class="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col justify-end">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="px-3 py-1 rounded-full text-xs font-label uppercase tracking-widest bg-primary text-on-primary">
                            ${article.category ? article.category.split(',')[0].trim() : 'Γενικα'}
                        </span>
                        <span class="text-xs font-label text-surface-container-highest bg-[#1A1C1E]/50 px-2 py-1 rounded backdrop-blur-sm">
                            ${pubDate}
                        </span>
                    </div>
                    
                    <h1 class="text-2xl md:text-4xl lg:text-5xl font-h1 text-white mb-3 leading-tight drop-shadow-md group-hover:text-primary-light transition-colors">
                        ${article.title||''}
                    </h1>
                    
                    <p class="text-white/80 font-body text-body-lg line-clamp-2 md:line-clamp-3 mb-5 max-w-3xl drop-shadow">
                        ${article.summary||''}
                    </p>
                    
                    <div class="flex items-center gap-2 text-primary-light font-label uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform">
                        <span>Διαβαστε περισσοτερα</span>
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
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
