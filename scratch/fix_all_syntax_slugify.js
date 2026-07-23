const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = [
    'index.html',
    'article.html',
    'roster.html',
    'fixtures.html',
    'api/render-index.js',
    'api/render-article.js',
    'api/feed.js',
    'api/sitemap.js',
    'api/sys/social-sync.js'
];

const cleanSlugify = `function slugify(text) {
    if (!text) return "arthro";
    try {
        return (text || "").toString().toLowerCase()
            .trim()
            .replace(/\\s+/g, '-')
            .replace(/[^\\w\\u0370-\\u03FF\\u1F00-\\u1FFF-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '') || "arthro";
    } catch(e) {
        return "arthro";
    }
}`;

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Match any slugify function up to its closing brace
    const slugifyRegex = /function slugify\(text\) \{[\s\S]*?^\}/m;
    if (slugifyRegex.test(content)) {
        content = content.replace(slugifyRegex, cleanSlugify);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed clean slugify syntax in ${file}`);
    }
});
