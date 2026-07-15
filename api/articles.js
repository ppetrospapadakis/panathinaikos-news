const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();

const supabase = createClient(supabaseUrl, supabaseKey);

function getNGrams(str, n = 3) {
    const clean = (str || '').toLowerCase().replace(/[^\w\s\u0370-\u03FF\u1F00-\u1FFF]/g, '');
    const ngrams = [];
    for (let i = 0; i <= clean.length - n; i++) {
        ngrams.push(clean.substring(i, i + n));
    }
    return ngrams;
}

function areSimilar(titleA, titleB) {
    // 1. Character N-Gram Cosine Similarity (captures word variations and stems)
    const nGramsA = getNGrams(titleA, 3);
    const nGramsB = getNGrams(titleB, 3);
    
    if (nGramsA.length === 0 || nGramsB.length === 0) return false;
    
    const freqA = {};
    const freqB = {};
    const allGrams = new Set();
    
    for (const g of nGramsA) { freqA[g] = (freqA[g] || 0) + 1; allGrams.add(g); }
    for (const g of nGramsB) { freqB[g] = (freqB[g] || 0) + 1; allGrams.add(g); }
    
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    
    for (const g of allGrams) {
        const valA = freqA[g] || 0;
        const valB = freqB[g] || 0;
        dotProduct += valA * valB;
        magA += valA * valA;
        magB += valB * valB;
    }
    
    const cosineSimilarity = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
    
    // 2. Keyword Entity Overlap check
    // Simple helper to match key sports entities (e.g. names, verbs, places)
    const wordsA = new Set((titleA || '').toLowerCase().replace(/[^\w\s\u0370-\u03FF\u1F00-\u1FFF]/g, '').split(/\s+/).filter(w => w.length > 3));
    const wordsB = (titleB || '').toLowerCase().replace(/[^\w\s\u0370-\u03FF\u1F00-\u1FFF]/g, '').split(/\s+/).filter(w => w.length > 3);
    const overlappingWords = wordsB.filter(w => wordsA.has(w)).length;
    
    // If cosine similarity of trigrams is high (e.g. > 0.40) and there is at least some word overlap (e.g. >= 2 words),
    // or if the trigram cosine similarity is extremely high (e.g. > 0.60), they are duplicates.
    return cosineSimilarity > 0.60 || (cosineSimilarity > 0.38 && overlappingWords >= 2);
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

    // Set high-performance Edge caching headers. If limit=1, use shorter cache to ensure freshness.
    if (req.query.limit === '1') {
        res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
    } else {
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    }

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

        // 1b. Fetch all own opinion articles (for dedicated section)
        if (req.query.opinionOnly === 'true') {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .or('source_url.ilike.%manual%,source_url.ilike.%opinion://manual%')
                .order('created_at', { ascending: false })
                .order('id', { ascending: false });
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
            .order('id', { ascending: false });
          
        if (req.query.category && req.query.category !== 'all' && req.query.category !== '') {
          const categoryMap = {
            'football': 'Ποδόσφαιρο',
            'podosfairo': 'Ποδόσφαιρο',
            'basket': 'Μπάσκετ',
            'basketball': 'Μπάσκετ',
            'erasitexnis': 'Ερασιτέχνης',
            'erasitechnis': 'Ερασιτέχνης',
            'apopsi': 'Άποψη',
            'metagrafes': 'Μεταγραφές',
            'transfers': 'Μεταγραφές',
            'agones': 'Αγώνες'
          };
          const dbCategory = categoryMap[req.query.category.toLowerCase()] || req.query.category;
          query = query.ilike('category', `%${dbCategory}%`);
        }

        if (req.query.limit) {
            query = query.limit(parseInt(req.query.limit, 10));
        } else {
            query = query.range(from, to);
        }
        
        const { data, error } = await query;
        if (error) throw error;

        // Apply dynamic Jaccard similarity title deduplication (40-minute window)
        const uniqueArticles = [];
        for (const current of (data || [])) {
            let isDuplicate = false;
            const currentIsOwn = (current.source_url || '').toLowerCase().includes('manual') || 
                                 (current.source_url || '').toLowerCase().includes('opinion://manual');
            
            if (!currentIsOwn) {
                for (const existing of uniqueArticles) {
                    const timeDiffMins = Math.abs(new Date(current.created_at) - new Date(existing.created_at)) / (1000 * 60);
                    const isAmateur = (current.category && current.category.includes('Ερασιτέχνης')) ||
                                     (existing.category && existing.category.includes('Ερασιτέχνης'));
                    const maxWindow = isAmateur ? 120 : 60;
                    if (timeDiffMins <= maxWindow) {
                        if (areSimilar(current.title, existing.title)) {
                            isDuplicate = true;
                            break;
                        }
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
