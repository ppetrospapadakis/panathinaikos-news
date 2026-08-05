module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
        "name": "PanathinaikosNews",
        "short_name": "PAO News",
        "description": "Όλα τα νέα του Παναθηναϊκού σε ένα μέρος",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#111317",
        "theme_color": "#111317",
        "icons": [
            {
                "src": "/favicon-touch.png?v=8",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/favicon-touch.png?v=8",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "maskable"
            },
            {
                "src": "/favicon-512.png?v=8",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/favicon-512.png?v=8",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "maskable"
            }
        ]
    });
};
