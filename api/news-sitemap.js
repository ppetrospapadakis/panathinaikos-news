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

function xmlEscape(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';

function proxyImageUrl(rawUrl) {
    if (!rawUrl) return DEFAULT_IMG;
    try {
        let url = rawUrl;
        if (url.startsWith('//')) url = 'https:' + url;
        if (!url.startsWith('http')) return DEFAULT_IMG;

        const u = new URL(url);
        if (u.hostname.includes('wsrv.nl')) return url;
        if (u.hostname.includes('googleusercontent.com') || u.hostname.includes('googleapis.com')) return url;

        return `https://wsrv.nl/?url=${encodeURIComponent(u.href)}&w=1200&h=628&fit=cover&output=webp&q=82`;
    } catch (_) {
        return DEFAULT_IMG;
    }
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');

    try {
        // Fetch recent articles from the last 48 hours for Google News crawler
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, category, created_at, image_url')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .gte('created_at', fortyEightHoursAgo)
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) throw error;

        const domain = 'https://www.panathinaikosnews.gr';
        const PUBLICATION_NAME = 'PanathinaikosNews';
        const PUBLICATION_LANGUAGE = 'el';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
        xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

        for (const art of (articles || [])) {
            const cleanCat = getCategoryCleanName(art.category);
            const cleanSlug = slugify(art.title);
            const shortId = (art.id || '').substring(0, 8);
            const url = `${domain}/${cleanCat}/${cleanSlug}-${shortId}`;
            const pubDateISO = new Date(art.created_at).toISOString();

            xml += `  <url>\n`;
            xml += `    <loc>${url}</loc>\n`;
            xml += `    <news:news>\n`;
            xml += `      <news:publication>\n`;
            xml += `        <news:name>${xmlEscape(PUBLICATION_NAME)}</news:name>\n`;
            xml += `        <news:language>${PUBLICATION_LANGUAGE}</news:language>\n`;
            xml += `      </news:publication>\n`;
            xml += `      <news:publication_date>${pubDateISO}</news:publication_date>\n`;
            xml += `      <news:title>${xmlEscape(art.title)}</news:title>\n`;
            xml += `    </news:news>\n`;

            if (art.image_url) {
                const imgLoc = proxyImageUrl(art.image_url);
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${xmlEscape(imgLoc)}</image:loc>\n`;
                xml += `      <image:title>${xmlEscape(art.title)}</image:title>\n`;
                xml += `    </image:image>\n`;
            }

            xml += `  </url>\n`;
        }

        xml += `</urlset>`;
        return res.status(200).send(xml);
    } catch (err) {
        console.error('News sitemap generation error:', err);
        let fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
        return res.status(200).send(fallbackXml);
    }
};
