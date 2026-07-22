const { createClient } = require('@supabase/supabase-js');

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

module.exports = async (req, res) => {
    // Set caching and Content-Type headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1200');

    try {
        // Fetch all articles (excluding system configurations)
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, category, created_at')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .order('created_at', { ascending: false })
            .limit(10000); // Fetch up to 10k articles for sitemap

        if (error) throw error;

        // Base domain
        const domain = 'https://www.panathinaikosnews.gr';

        // Static routes
        const staticRoutes = [
            '',
            '/podosfairo',
            '/basket',
            '/erasitexnis',
            '/apopsi',
            '/metagrafes',
            '/agones',
            '/fixtures',
            '/schedule',
            '/roster.html'
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // 1. Add static routes
        const nowStr = new Date().toISOString().split('T')[0];
        for (const route of staticRoutes) {
            xml += `  <url>\n`;
            xml += `    <loc>${domain}${route}</loc>\n`;
            xml += `    <lastmod>${nowStr}</lastmod>\n`;
            xml += `    <changefreq>always</changefreq>\n`;
            xml += `    <priority>1.0</priority>\n`;
            xml += `  </url>\n`;
        }

        // 2. Add dynamic article URLs
        for (const art of (articles || [])) {
            const cleanCat = getCategoryCleanName(art.category);
            const cleanSlug = slugify(art.title);
            const url = `${domain}/${cleanCat}/${cleanSlug}-id=${art.id}`;
            const artDate = new Date(art.created_at).toISOString().split('T')[0];

            xml += `  <url>\n`;
            xml += `    <loc>${url}</loc>\n`;
            xml += `    <lastmod>${artDate}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        }

        xml += `</urlset>`;

        return res.status(200).send(xml);
    } catch (err) {
        // Return fallback XML on error
        let fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        fallbackXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        fallbackXml += `  <url>\n`;
        fallbackXml += `    <loc>https://www.panathinaikosnews.gr</loc>\n`;
        fallbackXml += `  </url>\n`;
        fallbackXml += `</urlset>`;
        console.error('Sitemap generation error:', err);
        return res.status(200).send(fallbackXml);
    }
};
