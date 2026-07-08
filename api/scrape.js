const { main } = require('../backend/scraper.js');

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
    // Envs validation check
    const missingEnvs = [];
    if (!process.env.SUPABASE_URL) missingEnvs.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) missingEnvs.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!process.env.GEMINI_API_KEY) missingEnvs.push('GEMINI_API_KEY');

    if (missingEnvs.length > 0) {
        return res.status(500).json({
            success: false,
            error: `Missing environment variables on Vercel: ${missingEnvs.join(', ')}. Please add them in Vercel Dashboard > Settings > Environment Variables.`
        });
    }

    // Sanitize process.env variables to prevent any formatting/quotes issues
    if (process.env.SUPABASE_URL) {
        process.env.SUPABASE_URL = process.env.SUPABASE_URL.trim().replace(/^['"]|['"]$/g, '');
    }
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY.trim().replace(/^['"]|['"]$/g, '');
    }
    if (process.env.SUPABASE_KEY) {
        process.env.SUPABASE_KEY = process.env.SUPABASE_KEY.trim().replace(/^['"]|['"]$/g, '');
    }
    if (process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY.trim().replace(/^['"]|['"]$/g, '');
    }
    try {
        console.log('[API SCRAPE] Ingestion triggered via Serverless API Route');
        // Execute the main scraper loop (not a dry run)
        const stats = await main();
        
        return res.status(200).json({
            success: true,
            message: 'Ingestion completed successfully',
            stats
        });
    } catch (err) {
        console.error('[API SCRAPE] Scraper error:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
