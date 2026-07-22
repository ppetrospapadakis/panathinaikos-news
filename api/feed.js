const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
    if (!text) return "arthro";
    try {
        return (text || "").toString().toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0370-\u03FF\u1F00-\u1FFF-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '') || "arthro";
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
    if (cat.includes('μεταγραφές') || cat.includes('transfers')) return 'metagrafes';
    return 'pao';
}

function escapeXml(unsafe) {
    return (unsafe || '').replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

module.exports = async (req, res) => {
    // Set headers for XML and Vercel edge caching
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=1200, stale-while-revalidate=600');

    const domain = 'https://www.panathinaikosnews.gr';

    try {
        // Fetch the 50 most recent articles for the RSS feed
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, summary, content, category, image_url, created_at')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        rss += `<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n`;
        rss += `  <channel>\n`;
        rss += `    <title>PanathinaikosNews</title>\n`;
        rss += `    <link>${domain}</link>\n`;
        rss += `    <description>Όλα τα νέα του Παναθηναϊκού. Ζωντανή ενημέρωση, αναλύσεις και ρεπορτάζ.</description>\n`;
        rss += `    <language>el</language>\n`;
        rss += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
        rss += `    <atom:link href="${domain}/feed.xml" rel="self" type="application/rss+xml" />\n`;

        for (const art of (articles || [])) {
            const cleanCat = getCategoryCleanName(art.category);
            const cleanSlug = slugify(art.title);
            const url = `${domain}/${cleanCat}/${cleanSlug}-id=${art.id}`;
            const pubDate = new Date(art.created_at).toUTCString();
            const description = art.summary || (art.content ? art.content.substring(0, 300) + '...' : '');

            rss += `    <item>\n`;
            rss += `      <title>${escapeXml(art.title)}</title>\n`;
            rss += `      <link>${url}</link>\n`;
            rss += `      <guid isPermaLink="true">${url}</guid>\n`;
            rss += `      <description><![CDATA[${description}]]></description>\n`;
            rss += `      <pubDate>${pubDate}</pubDate>\n`;
            rss += `      <category>${escapeXml(art.category || 'Γενικά')}</category>\n`;
            
            if (art.image_url && art.image_url.startsWith('http')) {
                let type = 'image/jpeg';
                if (art.image_url.endsWith('.png')) type = 'image/png';
                else if (art.image_url.endsWith('.webp')) type = 'image/webp';
                else if (art.image_url.endsWith('.svg')) type = 'image/svg+xml';
                
                rss += `      <enclosure url="${escapeXml(art.image_url)}" length="0" type="${type}" />\n`;
                rss += `      <media:content url="${escapeXml(art.image_url)}" medium="image" />\n`;
            }
            
            rss += `    </item>\n`;
        }

        rss += `  </channel>\n`;
        rss += `</rss>`;

        return res.status(200).send(rss);
    } catch (err) {
        console.error('RSS generation error:', err);
        // Fallback valid XML on error
        let fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        fallbackXml += `<rss version="2.0">\n`;
        fallbackXml += `  <channel>\n`;
        fallbackXml += `    <title>PanathinaikosNews</title>\n`;
        fallbackXml += `    <link>${domain}</link>\n`;
        fallbackXml += `    <description>Όλα τα νέα του Παναθηναϊκού.</description>\n`;
        fallbackXml += `  </channel>\n`;
        fallbackXml += `</rss>`;
        return res.status(200).send(fallbackXml);
    }
};
