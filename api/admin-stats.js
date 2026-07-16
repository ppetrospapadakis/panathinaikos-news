const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify authentication
    const password = req.query.password || req.headers['authorization'];
    if (password !== 'pao1908') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 1. Fetch DB Totals
        const { count: totalArticles } = await supabase
            .from('articles')
            .select('id', { count: 'exact', head: true });

        const { count: manualOpinions } = await supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .like('source_url', 'opinion://manual%');

        const { count: totalRuns } = await supabase
            .from('scraping_runs')
            .select('id', { count: 'exact', head: true });

        // Estimated database size: articles are ~5.2 KB each, runs are ~14.5 KB each (in raw JSONB payload)
        const dbSizeEstimatedMb = Number(((totalArticles * 5.2 + totalRuns * 14.5) / 1024).toFixed(2));

        // 2. Fetch Post Frequency over the last 7 days (hourly distribution)
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentArticles, error: artErr } = await supabase
            .from('articles')
            .select('created_at')
            .gt('created_at', lastWeek);

        const hourlyDistribution = Array(24).fill(0);
        if (recentArticles) {
            recentArticles.forEach(art => {
                if (art.created_at) {
                    const date = new Date(art.created_at);
                    // Get local hour (Athens is typically EET/EEST, we get local timezone hour or fallback nicely)
                    const hour = date.getHours(); 
                    if (hour >= 0 && hour < 24) {
                        hourlyDistribution[hour]++;
                    }
                }
            });
        }

        // 3. Fetch scraping runs in the last 24 hours to aggregate Gemini API usage
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: runs, error: runsErr } = await supabase
            .from('scraping_runs')
            .select('stats, started_at')
            .gt('started_at', last24h)
            .order('started_at', { ascending: false });

        // Parse Gemini Keys from process.env
        const rawKey = process.env.GEMINI_API_KEY || '';
        const apiKeys = rawKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const keyCount = apiKeys.length || 1; // default to at least 1 key for presentation if env is empty

        // Initialize key totals dictionary
        const keyUsageToday = {};
        for (let i = 0; i < keyCount; i++) {
            keyUsageToday[i] = 0;
        }

        let isLastRunExhausted = false;
        let lastRunKeyIndex = 0;

        if (runs && runs.length > 0) {
            // Check the status from the latest run to determine key blocks
            const latestRun = runs[0];
            if (latestRun.stats && latestRun.stats.gemini) {
                isLastRunExhausted = latestRun.stats.gemini.quota_exhausted || false;
                lastRunKeyIndex = latestRun.stats.gemini.current_index || 0;
            }

            // Sum up calls by key from all runs in the last 24h
            runs.forEach(run => {
                if (run.stats && run.stats.gemini && run.stats.gemini.calls_by_key) {
                    Object.keys(run.stats.gemini.calls_by_key).forEach(idxStr => {
                        const idx = parseInt(idxStr, 10);
                        const count = run.stats.gemini.calls_by_key[idxStr] || 0;
                        if (idx >= 0 && idx < keyCount) {
                            keyUsageToday[idx] = (keyUsageToday[idx] || 0) + count;
                        }
                    });
                }
            });
        }

        // Build Gemini keys status array
        const keysStatus = [];
        for (let i = 0; i < keyCount; i++) {
            const keyStr = apiKeys[i] || '';
            const masked = keyStr ? (keyStr.slice(0, 8) + '...' + keyStr.slice(-4)) : `Key #${i + 1}`;
            
            // If the latest scraper run hit a full exhaustion block OR this index is lower than the active index used in the last run, it's exhausted.
            let status = 'active';
            if (isLastRunExhausted) {
                status = 'exhausted';
            } else if (i < lastRunKeyIndex) {
                status = 'exhausted';
            }

            keysStatus.push({
                index: i,
                masked: masked,
                status: status,
                calls_today: keyUsageToday[i] || 0,
                limit: 1500
            });
        }

        return res.status(200).json({
            database: {
                total_articles: totalArticles || 0,
                manual_opinions: manualOpinions || 0,
                total_runs: totalRuns || 0,
                estimated_size_mb: dbSizeEstimatedMb,
                limit_mb: 500
            },
            github: {
                repo_status: 'Public Repository',
                actions_estimated_mins: 1440,
                actions_limit_mins: 'Unlimited (Public) / 2,000 (Private)'
            },
            gemini: {
                key_count: keyCount,
                keys: keysStatus
            },
            hourly_posts: hourlyDistribution
        });

    } catch (err) {
        console.error('Failed to aggregate admin stats:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};
