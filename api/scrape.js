const axios = require('axios');

module.exports = async (req, res) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Token authentication check
    const { token } = req.query;
    if (token !== 'pao1908_secure') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Read GITHUB_PAT or GITHUB_TOKEN
    const pat = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
    if (!pat) {
        return res.status(500).json({ error: 'Missing GITHUB_PAT or GITHUB_TOKEN environment variable in Vercel.' });
    }

    // Night-time throttling (01:00 - 08:00 EEST)
    // External cron services (e.g. cron-job.org) pinging every 15 mins will be skipped during night hours,
    // except around 01:30, 04:30, and 07:30 EEST (or if ?force=true is passed).
    const { force } = req.query;
    if (force !== 'true') {
        const athensHour = parseInt(new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: 'Europe/Athens'
        }).format(new Date()), 10);
        
        const athensMinute = parseInt(new Intl.DateTimeFormat('en-US', {
            minute: 'numeric',
            timeZone: 'Europe/Athens'
        }).format(new Date()), 10);

        const isNightTime = (athensHour >= 1 && athensHour < 8);
        if (isNightTime) {
            const isNightRunWindow = [1, 4, 7].includes(athensHour) && athensMinute >= 25 && athensMinute <= 35;
            if (!isNightRunWindow) {
                console.log(`[API SCRAPE SKIPPED] Night time throttling active (${athensHour}:${athensMinute} EEST). Trigger skipped.`);
                return res.status(200).json({
                    success: true,
                    skipped: true,
                    message: `Night time throttling active (01:00 - 08:00 EEST). Current time: ${athensHour}:${athensMinute} EEST. Scrape trigger skipped.`
                });
            }
        }
    }

    try {
        console.log('[API SCRAPE] Triggering GitHub Repository Dispatch...');
        
        const response = await axios.post(
            'https://api.github.com/repos/ppetrospapadakis/panathinaikos-news/dispatches',
            {
                event_type: 'trigger-scrape'
            },
            {
                headers: {
                    'Authorization': `Bearer ${pat.trim()}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'User-Agent': 'Vercel-Serverless-Scrape'
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Repository dispatch triggered successfully.',
            status: response.status
        });
    } catch (err) {
        console.error('[API SCRAPE] GitHub API dispatch error:', err.response ? err.response.data : err.message);
        return res.status(500).json({
            success: false,
            error: err.response ? err.response.data : err.message
        });
    }
};
