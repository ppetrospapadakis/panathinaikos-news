module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Set high-performance Edge caching headers
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    // Supabase URL & Anon Key with fallback values
    const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rctltbuiitdnqlxizlym.supabase.co';
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI';
    
    let url = rawUrl.trim().replace(/^['"]|['"]$/g, '');
    const key = rawKey.trim().replace(/^['"]|['"]$/g, '');

    // Failsafe: Correct protocol typos automatically
    if (url.startsWith('s://')) {
        url = 'https://' + url.slice(4);
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (!url || !key) {
        return res.status(500).json({ error: 'Database configuration missing.' });
    }

    // 1. Single article fetch support (if id parameter is provided)
    const { id } = req.query;
    if (id) {
        try {
            const targetUrl = `${url}/rest/v1/articles?select=*&id=eq.${encodeURIComponent(id)}`;
            const response = await fetch(targetUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                return res.status(response.status).json({ error: errText });
            }

            const data = await response.json();
            if (!data || data.length === 0) {
                return res.status(404).json({ error: 'Article not found.' });
            }

            return res.status(200).json(data[0]);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // 2. Feed pagination & filtering query
    let pageNum = parseInt(req.query.page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
        pageNum = 1;
    }
    const limit = 20;
    const from = (pageNum - 1) * limit;
    const to = from + limit - 1;

    let categoryParam = req.query.category || '';
    categoryParam = categoryParam.trim().toLowerCase();

    // Map URL path slugs to backend Greek category names
    let dbCategory = null;
    if (categoryParam === 'football' || categoryParam === 'podosfairo' || categoryParam === 'podosfayro' || categoryParam === 'ποδόσφαιρο') {
        dbCategory = 'Ποδόσφαιρο';
    } else if (categoryParam === 'basketball' || categoryParam === 'basket' || categoryParam === 'μπάσκετ') {
        dbCategory = 'Μπάσκετ';
    } else if (categoryParam === 'amateur' || categoryParam === 'erasitechnis' || categoryParam === 'erasitexnis' || categoryParam === 'ερασιτέχνης') {
        dbCategory = 'Ερασιτέχνης';
    } else if (categoryParam === 'opinion' || categoryParam === 'apopsi' || categoryParam === 'άποψη') {
        dbCategory = 'Άποψη';
    } else if (categoryParam === 'transfers' || categoryParam === 'metagrafes' || categoryParam === 'μεταγραφές') {
        dbCategory = 'Μεταγραφές';
    }

    const isCategoryEmpty = !categoryParam || categoryParam === 'all' || categoryParam === 'null' || categoryParam === 'undefined';

    try {
        console.log("[api/articles] Native Fetching category:", dbCategory || (isCategoryEmpty ? "ALL" : categoryParam), "PageNum:", pageNum, "From:", from, "To:", to);

        let targetUrl = `${url}/rest/v1/articles?select=*&category=not.eq.SystemRoster&category=not.eq.SYSTEMROSTER&order=created_at.desc`;

        if (!isCategoryEmpty) {
            if (dbCategory) {
                targetUrl += `&category=eq.${encodeURIComponent(dbCategory)}`;
            } else {
                targetUrl += `&category=ilike.*${encodeURIComponent(categoryParam)}*`;
            }
        }

        const response = await fetch(targetUrl, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Range': `${from}-${to}`
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Supabase REST API Error: ${errText}`);
        }

        let data = await response.json();
        console.log("[api/articles] Supabase REST response rows count:", data ? data.length : 0);

        // Emergency Fallback: if data is empty on page 1, fetch top 20 rows ignoring filters
        if ((!data || data.length === 0) && pageNum === 1) {
            console.warn("[api/articles] Emergency fallback triggered: no rows found. Fetching raw top 20 rows.");
            const fallbackUrl = `${url}/rest/v1/articles?select=*&category=not.eq.SystemRoster&category=not.eq.SYSTEMROSTER&order=created_at.desc`;
            const fallbackRes = await fetch(fallbackUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Range': '0-19'
                }
            });
            if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                if (fallbackData && fallbackData.length > 0) {
                    data = fallbackData;
                    console.log("[api/articles] Emergency fallback loaded rows:", data.length);
                }
            }
        }

        return res.status(200).json(data || []);
    } catch (err) {
        console.error("[api/articles] Serverless exception:", err);
        return res.status(500).json({ error: err.message });
    }
};
