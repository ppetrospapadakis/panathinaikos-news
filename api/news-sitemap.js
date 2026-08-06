const sitemapHandler = require('./sitemap.js');

module.exports = async (req, res) => {
    req.query = req.query || {};
    req.query.type = 'news';
    req.url = '/sitemap.xml?type=news';
    return sitemapHandler(req, res);
};
