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
    if (!titleA || !titleB) return false;
    const cleanA = titleA.toLowerCase().replace(/[^\w\s\u0370-\u03FF\u1F00-\u1FFF]/g, '');
    const cleanB = titleB.toLowerCase().replace(/[^\w\s\u0370-\u03FF\u1F00-\u1FFF]/g, '');

    // 1. Character N-Gram Cosine Similarity
    const nGramsA = getNGrams(cleanA, 3);
    const nGramsB = getNGrams(cleanB, 3);
    
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
    
    // 2. Keyword Entity Overlap check (ignoring common Greek & site stopwords)
    const stopwords = new Set([
        'ο', 'η', 'το', 'οι', 'αι', 'τα', 'του', 'της', 'των', 'τον', 'την', 'τους', 'τις', 'τισ',
        'ένα', 'ένας', 'μία', 'μια', 'έναν', 'στην', 'στον', 'στους', 'στις', 'στη', 'στο', 'προς',
        'μετά', 'από', 'για', 'και', 'που', 'πως', 'πώς', 'πού', 'ότι', 'με', 'σε', 'κατά', 'διά',
        'παναθηναϊκός', 'παναθηναϊκό', 'παναθηναϊκού', 'παναθηναϊκά', 'τριφύλλι', 'πράσινοι', 'πράσινα',
        'δείτε', 'βίντεο', 'video', 'φωτογραφίες', 'pics', 'live', 'line', 'vids'
    ]);
    const wordsA = new Set(cleanA.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w)));
    const wordsB = new Set(cleanB.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w)));
    
    let overlapping = 0;
    let mainEntityMatch = false;

    for (const w of wordsA) {
        if (wordsB.has(w)) {
            overlapping++;
            if (w.length >= 5) mainEntityMatch = true; // Key subject name like νίστρουπ, γιάγκουσιτς, αταμάν, όσμαν, κλπ
        }
    }
    
    const minWords = Math.min(wordsA.size, wordsB.size);
    const wordOverlapRatio = minWords > 0 ? (overlapping / minWords) : 0;
    
    return cosineSimilarity > 0.50 || 
           (cosineSimilarity > 0.35 && overlapping >= 2) || 
           (wordOverlapRatio >= 0.50 && overlapping >= 2) ||
           (mainEntityMatch && overlapping >= 1 && (cosineSimilarity > 0.20 || wordOverlapRatio >= 0.20));
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
                .select('id, title, summary, content, image_url, category, created_at, updated_at, source_url, bullets, group_id, pinned_at')
                .eq('id', id)
                .single();
            if (error) throw error;
            return res.status(200).json(data);
        }

        // 1b. Fetch all own opinion articles (for dedicated section)
        // Query DB directly so old articles are never missed regardless of how many scraped articles exist
        if (req.query.opinionOnly === 'true') {
            const [opinionRes, manualRes] = await Promise.all([
                supabase
                    .from('articles')
                    .select('id, title, summary, content, image_url, category, created_at, updated_at, source_url, bullets, group_id, pinned_at')
                    .ilike('category', '%Άποψη%')
                    .not('category', 'eq', 'DELETED')
                    .order('created_at', { ascending: false })
                    .order('id', { ascending: false })
                    .limit(100),
                supabase
                    .from('articles')
                    .select('id, title, summary, content, image_url, category, created_at, updated_at, source_url, bullets, group_id, pinned_at')
                    .like('source_url', 'opinion://%')
                    .not('category', 'eq', 'DELETED')
                    .order('created_at', { ascending: false })
                    .order('id', { ascending: false })
                    .limit(100)
            ]);

            if (opinionRes.error) throw opinionRes.error;
            if (manualRes.error) throw manualRes.error;

            // Merge + deduplicate by id, sort by date
            const seen = new Set();
            const merged = [...(opinionRes.data || []), ...(manualRes.data || [])]
                .filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return res.status(200).json(merged);
        }


        // 2. Feed pagination & filtering query
        const page = parseInt(req.query.page, 10) || 1;
        const from = (page - 1) * 20;
        const to = from + 19;
        
        let query = supabase
            .from('articles')
            .select('id, title, summary, image_url, category, created_at, source_url, group_id, bullets, pinned_at')
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .not('category', 'eq', 'DELETED');

        // Auto-cleanup expired pins (> 3 hours old) in Supabase DB so stale pins don't linger
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        supabase.from('articles').update({ pinned_at: null }).lt('pinned_at', threeHoursAgo).then(() => {}).catch(() => {});

        // Page 1: surface any pinned article first using B-Tree index on pinned_at.
        // Pinned window is 3 hours. Bypassed for hero queries (limit=1) to keep strictly chronological hero views.
        if (page === 1 && req.query.limit !== '1') {
            query = query
                .order('pinned_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .order('id', { ascending: false });
        } else {
            query = query
                .order('created_at', { ascending: false })
                .order('id', { ascending: false });
        }
          
        const hasCategoryFilter = req.query.category && req.query.category !== 'all' && req.query.category !== '';
        if (hasCategoryFilter) {
          const categoryMap = {
            'football': 'Ποδόσφαιρο',
            'podosfairo': 'Ποδόσφαιρο',
            'basket': 'Μπάσκετ',
            'basketball': 'Μπάσκετ',
            'erasitexnis': 'Ερασιτέχνης',
            'erasitechnis': 'Ερασιτέχνης',
            'apopsi': 'Άποψη',
            'agones': 'Αγώνες'
          };
          const dbCategory = categoryMap[req.query.category.toLowerCase()] || req.query.category;
          query = query.ilike('category', `%${dbCategory}%`);
        }

        // Exclude 'Ερασιτέχνης' articles from the general Hero slot (when limit=1 and no category filter)
        if (req.query.limit === '1' && !hasCategoryFilter) {
            query = query.not('category', 'eq', 'Ερασιτέχνης');
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
                    // Category Guard: Articles from different categories (e.g. Football vs Basketball) can NEVER be deduplicated!
                    const catCurrent = (current.category || '').toLowerCase();
                    const catExisting = (existing.category || '').toLowerCase();
                    if (catCurrent !== catExisting) {
                        continue;
                    }

                    const timeDiffMins = Math.abs(new Date(current.created_at) - new Date(existing.created_at)) / (1000 * 60);
                    const isAmateur = (current.category && current.category.includes('Ερασιτέχνης')) ||
                                     (existing.category && existing.category.includes('Ερασιτέχνης'));
                    const maxWindow = isAmateur ? 600 : 180; // 10 hours for Amateur (600 mins), 3 hours for General (180 mins)
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
