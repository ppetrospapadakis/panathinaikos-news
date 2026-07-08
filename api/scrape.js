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
