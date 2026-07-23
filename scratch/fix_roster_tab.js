const fs = require('fs');
const path = require('path');

const files = [
    'index.html',
    'roster.html',
    'article.html',
    'contact.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'login.html'
];

const tabFixturesHtml = `<a id="tab-item-fixtures" href="/fixtures" class="hidden px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all whitespace-nowrap lg:flex-1 text-center">📅 ΠΡΟΓΡΑΜΜΑ</a>`;

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove duplicate/existing tab-item-fixtures in sticky header if any
    const stickySectionRegex = /(<div class="sticky top-\[80px\][\s\S]*?<\/div>\s*<\/div>)/i;

    const match = content.match(stickySectionRegex);
    if (match) {
        let stickyHtml = match[1];
        if (!stickyHtml.includes('id="tab-item-fixtures"')) {
            // Find roster link in stickyHtml (either href="/roster.html" or id="tab-roster")
            const rosterRegex = /(<a\s+[^>]*href="\/roster\.html"[^>]*>[\s\S]*?<\/a>)/i;
            if (rosterRegex.test(stickyHtml)) {
                stickyHtml = stickyHtml.replace(rosterRegex, `$1\n                ${tabFixturesHtml}`);
                content = content.replace(match[1], stickyHtml);
                console.log(`✅ Added tab-item-fixtures to sticky bar in ${file}`);
            }
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Finished updating horizontal sticky bar across all pages.');
