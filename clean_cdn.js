const fs = require('fs');
const path = require('path');

const filesToClean = [
    'contact.html',
    'login.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'index.html',
    'article.html',
    'roster.html'
];

for (const file of filesToClean) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove tailwind CDN
    content = content.replace(/<script[^>]*src="https:\/\/cdn\.tailwindcss\.com[^>]*><\/script>/g, '');
    
    // Check if style.css is already linked
    if (!content.includes('style.css')) {
        content = content.replace('</head>', `    <!-- Compiled Tailwind CSS -->\n    <link rel="preload" href="/style.css?v=4" as="style">\n    <link rel="stylesheet" href="/style.css?v=4">\n</head>`);
    } else {
        // bump version to v=4
        content = content.replace(/style\.css\?v=[0-9]+/g, 'style.css?v=4');
        content = content.replace(/style\.css"/g, 'style.css?v=4"'); // handles unversioned ones just in case
    }
    
    fs.writeFileSync(file, content, 'utf8');
}
console.log('All templates cleaned.');
