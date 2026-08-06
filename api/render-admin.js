const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const html = fs.readFileSync(path.join(__dirname, '..', 'login.html'), 'utf8');
    res.end(html);
};
