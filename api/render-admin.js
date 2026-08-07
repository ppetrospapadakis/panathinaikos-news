const fs = require('fs');
const path = require('path');

let _adminTemplate = null;
function getAdminTemplate() {
    if (!_adminTemplate) {
        const possiblePaths = [
            path.join(__dirname, '../login.html'),
            path.join(process.cwd(), 'login.html'),
            path.join(__dirname, 'login.html')
        ];
        for (const p of possiblePaths) {
            try {
                if (fs.existsSync(p)) {
                    _adminTemplate = fs.readFileSync(p, 'utf8');
                    if (_adminTemplate) break;
                }
            } catch (e) {}
        }
    }
    return _adminTemplate || '<h1>Error loading admin panel template</h1>';
}

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const html = getAdminTemplate();
    res.end(html);
};
