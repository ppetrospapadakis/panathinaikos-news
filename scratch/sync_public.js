const fs = require('fs');
const path = require('path');

const files = [
    'index.html',
    'roster.html',
    'article.html',
    'contact.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'login.html',
    'fixtures.html'
];

files.forEach(f => {
    const src = path.join(__dirname, '..', f);
    const dest = path.join(__dirname, '..', 'public', f);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Synced ${f} to public/${f}`);
    }
});
