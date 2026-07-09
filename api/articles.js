const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();

const supabase = createClient(supabaseUrl, supabaseKey);

function getWords(title) {
    return new Set((title || '')
        .toLowerCase()
        .replace(/[^\w\s\u0370-\u03FF\u1F00-\u1FFF]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
}

function areSimilar(titleA, titleB) {
    const wordsA = getWords(titleA);
    const wordsB = getWords(titleB);
    if (wordsA.size === 0 || wordsB.size === 0) return false;
    
    let intersect = 0;
    for (const w of wordsA) {
        if (wordsB.has(w)) intersect++;
    }
    const union = wordsA.size + wordsB.size - intersect;
    const jaccard = intersect / union;
    return jaccard > 0.45; // 45% word overlap threshold
}

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

    try {
        // 1. Single article fetch support (if id parameter is provided)
        const { id } = req.query;
        if (id) {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return res.status(200).json(data);
        }

        // 2. Feed pagination & filtering query
        const page = parseInt(req.query.page, 10) || 1;
        const from = (page - 1) * 20;
        const to = from + 19;
        
        let query = supabase
            .from('articles')
            .select('*')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .order('created_at', { ascending: false })
            .range(from, to);
          
        if (req.query.category && req.query.category !== 'all' && req.query.category !== '') {
            const categoryMap = {
              'football': 'ΠΟΔΟΣΦΑΙΡΟ',
              'podosfairo': 'ΠΟΔΟΣΦΑΙΡΟ',
              'basket': 'ΜΠΑΣΚΕΤ',
              'erasitexnis': 'ΕΡΑΣΙΤΕΧΝΗΣ',
              'apopsi': 'ΑΠΟΨΗ',
              'metagrafes': 'ΜΕΤΑΓΡΑΦΕΣ',
              'agones': 'ΑΓΩΝΕΣ'
            };
            
            const dbCategory = categoryMap[req.query.category.toLowerCase()] || req.query.category;
            query = query.eq('category', dbCategory);
        }
        
        const { data, error } = await query;
        if (error) throw error;

        // Apply dynamic Jaccard similarity title deduplication (40-minute window)
        const uniqueArticles = [];
        for (const current of (data || [])) {
            let isDuplicate = false;
            for (const existing of uniqueArticles) {
                const timeDiffMins = Math.abs(new Date(current.created_at) - new Date(existing.created_at)) / (1000 * 60);
                if (timeDiffMins <= 40) {
                    if (areSimilar(current.title, existing.title)) {
                        isDuplicate = true;
                        break;
                    }
                }
            }
            if (!isDuplicate) {
                uniqueArticles.push(current);
            }
        }
        
        return res.status(200).json(uniqueArticles);
    } catch (err) {
        return res.status(500).json({ error: err.message, stack: err.stack, name: err.name });
    }
};
