const { createClient } = require('@supabase/supabase-js');

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

    const rawUrl = process.env.SUPABASE_URL;
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    const url = rawUrl ? rawUrl.trim().replace(/^['"]|['"]$/g, '') : '';
    const key = rawKey ? rawKey.trim().replace(/^['"]|['"]$/g, '') : '';

    if (!url || !key) {
        return res.status(500).json({ error: 'Database configuration missing.' });
    }

    const supabase = createClient(url, key);

    // 1. Single article fetch support (if id parameter is provided)
    const { id } = req.query;
    if (id) {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
            }
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // 2. Feed pagination & filtering query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const from = (page - 1) * limit;
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

    try {
        let query = supabase
            .from('articles')
            .select('*')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (dbCategory) {
            query = query.eq('category', dbCategory);
        } else if (categoryParam && !dbCategory) {
            // Support direct matching fallback for custom parameters
            query = query.ilike('category', `%${categoryParam}%`);
        }

        const { data, error } = await query;
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
