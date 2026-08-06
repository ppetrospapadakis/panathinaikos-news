const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();

const supabase = createClient(supabaseUrl, supabaseKey);

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

const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';

function proxyImageUrl(rawUrl) {
    if (!rawUrl) return DEFAULT_IMG;
    try {
        let url = rawUrl;
        if (url.startsWith('//')) url = 'https:' + url;
        if (!url.startsWith('http')) return DEFAULT_IMG;

        const u = new URL(url);
        const filename = u.pathname.substring(u.pathname.lastIndexOf('/') + 1).toLowerCase();
        const brandingKeywords = ['logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
            'og-image', 'og_image', 'site-logo', 'site_logo', 'noimage', 'no-image', 'blank', 'generic'];
        const brandingPaths = ['/logos/', '/logo/', '/brand/', '/branding/', '/default_images/', '/site-assets/'];
        const isBranding = brandingKeywords.some(k => filename.includes(k))
            || brandingPaths.some(p => ('/' + u.pathname.toLowerCase() + '/').includes(p));
        if (isBranding) return DEFAULT_IMG;

        // Already proxied? Return as-is
        if (u.hostname.includes('wsrv.nl')) return url;
        // lh3.googleusercontent or googleapis — return as-is (already CDN, no proxy)
        if (u.hostname.includes('googleusercontent.com') || u.hostname.includes('googleapis.com')) return url;

        return `https://wsrv.nl/?url=${encodeURIComponent(u.href)}&w=1200&h=628&fit=cover&output=webp&q=82`;
    } catch (_) {
        return DEFAULT_IMG;
    }
}

module.exports = async (req, res) => {
    // Short cache so Google Discover sees fresh articles quickly
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

    const domain = 'https://www.panathinaikosnews.gr';

    try {
        // Fetch the 100 most recent articles for the RSS feed (exclude system/erasitexnis)
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, summary, content, category, image_url, created_at')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .not('category', 'ilike', '%Ερασιτέχνης%')
            .not('category', 'ilike', '%amateur%')
            .order('created_at', { ascending: false })
            .limit(100);

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
            const shortId = (art.id || '').substring(0, 8);
            const url = `${domain}/${cleanCat}/${cleanSlug}-${shortId}`;
            const pubDate = new Date(art.created_at).toUTCString();
            const description = art.summary || (art.content ? art.content.substring(0, 300) + '...' : '');

            // Proxy image so Google can always fetch it, with correct 1200x628 crop
            const proxiedImage = proxyImageUrl(art.image_url);

            rss += `    <item>\n`;
            rss += `      <title>${escapeXml(art.title)}</title>\n`;
            rss += `      <link>${url}</link>\n`;
            rss += `      <guid isPermaLink="true">${url}</guid>\n`;
            rss += `      <description><![CDATA[${description}]]></description>\n`;
            rss += `      <pubDate>${pubDate}</pubDate>\n`;
            rss += `      <category>${escapeXml(art.category || 'Γενικά')}</category>\n`;
            // enclosure: non-zero length estimate required by some aggregators
            rss += `      <enclosure url="${escapeXml(proxiedImage)}" length="102400" type="image/webp" />\n`;
            rss += `      <media:content url="${escapeXml(proxiedImage)}" medium="image" width="1200" height="628">\n`;
            rss += `        <media:title><![CDATA[${escapeXml(art.title)}]]></media:title>\n`;
            rss += `      </media:content>\n`;
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
