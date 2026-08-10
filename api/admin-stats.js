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
    if (password !== '1357') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 1. Fetch DB Totals (only valid published articles, excluding DELETED/SKIPPED placeholders)
        const { count: totalArticles } = await supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .neq('category', 'DELETED')
            .not('title', 'ilike', '%[SKIPPED]%')
            .not('summary', 'ilike', '%Skipped%');

        const { count: manualOpinions } = await supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .like('source_url', 'opinion://manual%')
            .neq('category', 'DELETED')
            .not('title', 'ilike', '%[SKIPPED]%')
            .not('summary', 'ilike', '%Skipped%');

        const { count: totalRuns } = await supabase
            .from('scraping_runs')
            .select('id', { count: 'exact', head: true });

        // Estimated database size: articles are ~5.2 KB each, runs are ~14.5 KB each (in raw JSONB payload)
        const dbSizeEstimatedMb = Number((((totalArticles || 0) * 5.2 + (totalRuns || 0) * 14.5) / 1024).toFixed(2));

        // 2. Fetch Post Frequency for 24h and 30d (strictly valid published articles)
        const now = Date.now();
        const last24hIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        const last30dIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

        let recentArticles = [];
        let page = 0;
        const pageSize = 1000;
        while (true) {
            const { data, error } = await supabase
                .from('articles')
                .select('created_at, source_url, title, category, summary')
                .gt('created_at', last30dIso)
                .neq('category', 'DELETED')
                .not('title', 'ilike', '%[SKIPPED]%')
                .not('summary', 'ilike', '%Skipped%')
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error || !data || data.length === 0) break;
            recentArticles.push(...data);
            if (data.length < pageSize) break;
            page++;
        }

        const totalBySource = {};
        const windowStart = now - 24 * 60 * 60 * 1000; // 24h ago in ms
        const hourlyDistribution = Array(24).fill(0);
        const hourlyBySource = Array(24).fill(null).map(() => ({}));

        // 30-day daily buckets (Index 0 = 29 days ago, Index 29 = Today)
        const dailyDistribution = Array(30).fill(0);
        const dailyBySource = Array(30).fill(null).map(() => ({}));
        const dailyLabels = [];
        const dayMap = {};

        const athensDateFormatter = new Intl.DateTimeFormat('el-GR', {
            day: '2-digit',
            month: '2-digit',
            timeZone: 'Europe/Athens'
        });

        for (let i = 29; i >= 0; i--) {
            const d = new Date(now - i * 24 * 60 * 60 * 1000);
            const dateStr = athensDateFormatter.format(d);
            const index = 29 - i;
            dailyLabels.push(dateStr);
            dayMap[dateStr] = index;
        }

        const rangeStats = {
            today: {},
            yesterday: {},
            last_7d: {},
            ever: {}
        };

        const nowYmdDate = new Date();
        const athensYmdFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' });
        const todayYmd = athensYmdFormatter.format(nowYmdDate);
        const yesterdayYmd = athensYmdFormatter.format(new Date(now - 24 * 60 * 60 * 1000));
        const last7dMs = now - 7 * 24 * 60 * 60 * 1000;

        function getSourcesFromArticleUrl(sourceUrl) {
            if (!sourceUrl) return ['Άλλο'];
            const urls = sourceUrl.split(',').map(u => u.trim()).filter(Boolean);
            const labels = new Set();

            urls.forEach(url => {
                const uLower = url.toLowerCase();
                if (uLower.includes('pao1908.com') || uLower.includes('pao1908')) labels.add('PAO1908 Official');
                else if (uLower.includes('pao.gr') || uLower.includes('paobc.gr')) labels.add('PAO Official');
                else if (uLower.includes('sport-fm') || uLower.includes('sportfm')) labels.add('Sport-FM');
                else if (uLower.includes('sport24')) labels.add('Sport24');
                else if (uLower.includes('sportime')) labels.add('Sportime');
                else if (uLower.includes('sportal')) labels.add('Sportal');
                else if (uLower.includes('sdna')) labels.add('SDNA');
                else if (uLower.includes('gazzetta')) labels.add('Gazzetta');
                else if (uLower.includes('athletiko')) labels.add('Athletiko');
                else if (uLower.includes('monobala')) labels.add('Monobala');
                else if (uLower.includes('onsports')) labels.add('OnSports');
                else if (uLower.includes('opinion://manual') || uLower.includes('manual')) labels.add('Manual');
                else {
                    try {
                        const domain = new URL(url).hostname.replace('www.', '');
                        const raw = domain.split('.')[0].toLowerCase();
                        if (raw) labels.add(raw.charAt(0).toUpperCase() + raw.slice(1));
                    } catch {}
                }
            });

            return labels.size > 0 ? Array.from(labels) : ['Άλλο'];
        }

        if (recentArticles) {
            recentArticles.forEach(art => {
                if (!art.created_at) return;
                if (art.category === 'DELETED') return;
                if (art.title && art.title.toLowerCase().includes('[skipped]')) return;
                if (art.summary && art.summary.toLowerCase().includes('skipped')) return;
                const artDate = new Date(art.created_at);
                const artMs = artDate.getTime();
                const artYmd = athensYmdFormatter.format(artDate);

                const srcLabels = getSourcesFromArticleUrl(art.source_url);

                srcLabels.forEach(srcLabel => {
                    totalBySource[srcLabel] = (totalBySource[srcLabel] || 0) + 1;
                    rangeStats.ever[srcLabel] = (rangeStats.ever[srcLabel] || 0) + 1;

                    if (artYmd === todayYmd) {
                        rangeStats.today[srcLabel] = (rangeStats.today[srcLabel] || 0) + 1;
                    }
                    if (artYmd === yesterdayYmd) {
                        rangeStats.yesterday[srcLabel] = (rangeStats.yesterday[srcLabel] || 0) + 1;
                    }
                    if (artMs >= last7dMs) {
                        rangeStats.last_7d[srcLabel] = (rangeStats.last_7d[srcLabel] || 0) + 1;
                    }

                    // 1. 24h Hourly bucket
                    if (artMs >= windowStart) {
                        const bucket = Math.min(23, Math.floor((artMs - windowStart) / 3600000));
                        if (bucket >= 0 && bucket < 24) {
                            hourlyBySource[bucket][srcLabel] = (hourlyBySource[bucket][srcLabel] || 0) + 1;
                        }
                    }

                    // 2. 30d Daily bucket
                    const dateStr = athensDateFormatter.format(artDate);
                    if (dateStr in dayMap) {
                        const dayIdx = dayMap[dateStr];
                        dailyBySource[dayIdx][srcLabel] = (dailyBySource[dayIdx][srcLabel] || 0) + 1;
                    }
                });

                // Overall total post activity counts (1 per unique article)
                if (artMs >= windowStart) {
                    const bucket = Math.min(23, Math.floor((artMs - windowStart) / 3600000));
                    if (bucket >= 0 && bucket < 24) {
                        hourlyDistribution[bucket]++;
                    }
                }
                const dateStr = athensDateFormatter.format(artDate);
                if (dateStr in dayMap) {
                    const dayIdx = dayMap[dateStr];
                    dailyDistribution[dayIdx]++;
                }
            });
        }

        // Build X-axis labels for hourly chart — wall-clock hour in Greece Time
        const hourlyLabels = Array(24).fill(null).map((_, i) => {
            const slotStart = new Date(windowStart + i * 3600000);
            const formatter = new Intl.DateTimeFormat('el-GR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Europe/Athens'
            });
            return formatter.format(slotStart);
        });

        // 3. Fetch scraping runs in the last 24 hours to aggregate Gemini API usage
        const { data: runs } = await supabase
            .from('scraping_runs')
            .select('stats, started_at')
            .gt('started_at', last24hIso)
            .order('started_at', { ascending: false });

        // Parse Gemini Keys from env (Vercel) — used only as fallback for masking
        const rawKey1 = process.env.GEMINI_API_KEY || '';
        const rawKey2 = process.env.GEMINI_API_KEY_2 || '';
        let envApiKeys = rawKey1.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (rawKey2) envApiKeys.push(rawKey2.trim());

        // Discover true key count from the scraping runs (GitHub Actions env may differ from Vercel env)
        // The scraper stores key_count and keys_status in each run's stats
        const latestRunGemini = (runs && runs.length > 0 && runs[0].stats && runs[0].stats.gemini) ? runs[0].stats.gemini : null;
        
        // Use the key_count stored in the last run, or fall back to env-based count
        let keyCount = (latestRunGemini && latestRunGemini.key_count) ? latestRunGemini.key_count : (envApiKeys.length || 1);

        // Also check calls_by_key to ensure we capture all indexes
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

            // Sum up calls by key from all runs in the last 24h & detect max key index seen
            let maxKeyIdxSeen = 0;
            runs.forEach(run => {
                if (run.stats && run.stats.gemini && run.stats.gemini.calls_by_key) {
                    Object.keys(run.stats.gemini.calls_by_key).forEach(idxStr => {
                        const idx = parseInt(idxStr, 10);
                        const count = run.stats.gemini.calls_by_key[idxStr] || 0;
                        
                        if (idx >= 0) {
                            if (idx > maxKeyIdxSeen) maxKeyIdxSeen = idx;
                            keyUsageToday[idx] = (keyUsageToday[idx] || 0) + count;
                        }
                    });
                }
            });
            if (maxKeyIdxSeen + 1 > keyCount) {
                keyCount = maxKeyIdxSeen + 1;
            }
        }

        // Build masked key labels: prefer stored keys_status from latest run (GitHub Actions),
        // fall back to Vercel env vars
        const storedKeysStatus = (latestRunGemini && Array.isArray(latestRunGemini.keys_status)) ? latestRunGemini.keys_status : [];
        const getMasked = (idx) => {
            if (storedKeysStatus[idx] && storedKeysStatus[idx].masked) return storedKeysStatus[idx].masked;
            if (envApiKeys[idx]) return envApiKeys[idx].slice(0, 8) + '...' + envApiKeys[idx].slice(-4);
            return `Key #${idx + 1}`;
        };

        // Build Gemini keys status array
        // SOURCE OF TRUTH: use calls_today vs 1500 limit.
        // NEVER rely on stored status from previous run (it may be stale/buggy).
        // A key is EXHAUSTED only if it has actually used >= 1500 calls today.
        const keysStatus = [];

        for (let i = 0; i < keyCount; i++) {
            const callsToday = keyUsageToday[i] || 0;
            const DAILY_LIMIT = 1500;

            // A key is exhausted ONLY if it has actually hit the daily limit
            const status = callsToday >= DAILY_LIMIT ? 'exhausted' : 'active';

            keysStatus.push({
                index: i,
                masked: getMasked(i),
                status: status,
                calls_today: callsToday,
                limit: DAILY_LIMIT
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
            hourly_posts: hourlyDistribution,
            hourly_by_source: hourlyBySource,
            hourly_labels: hourlyLabels,
            daily_posts: dailyDistribution,
            daily_by_source: dailyBySource,
            daily_labels: dailyLabels,
            total_by_source: totalBySource,
            sources_by_range: rangeStats
        });

    } catch (err) {
        console.error('Failed to aggregate admin stats:', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};
