const sitemapHandler = require('./sitemap.js');

module.exports = async (req, res) => {
    req.url = '/news-sitemap.xml';
    return sitemapHandler(req, res);
};
