const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const filesToPatch = [
    'index.html',
    'article.html',
    'roster.html',
    'api/render-index.js',
    'api/render-article.js',
    'api/feed.js',
    'api/sitemap.js',
    'api/sys/social-sync.js'
];

filesToPatch.forEach(relPath => {
    const filePath = path.join(rootDir, relPath);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Bulletproof slugify function
    const bulletproofSlugify = `function slugify(text) {
    if (!text) return "arthro";
    try {
        return text.toString().toLowerCase()
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

    // Replace slugify function definitions
    content = content.replace(/function slugify\(text\) \{[\s\S]*?^\}/m, bulletproofSlugify);

    // 2. Bulletproof renderHero function guard in index.html
    if (relPath === 'index.html') {
        content = content.replace(
            /function renderHero\(a\) \{\s*const heroEl = document\.getElementById\('hero-container'\);\s*if \(!heroEl \|\| !a\) return;/g,
            "function renderHero(a) {\n            const heroEl = document.getElementById('hero-container');\n            if (!heroEl || !a || !a.title) return;"
        );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched slugify & renderHero in ${relPath}`);
});
