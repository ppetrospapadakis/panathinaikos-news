const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
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

const fontLoadScript = `<script>
        document.fonts.load('400 24px "Material Symbols Outlined"').then(() => {
            document.documentElement.classList.add('icons-loaded');
        }).catch(() => { document.documentElement.classList.add('icons-loaded'); });
    </script>`;

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Ensure <html class="dark icons-loaded" lang="el">
    content = content.replace(/<html class="dark"/i, '<html class="dark icons-loaded"');

    // 2. Fix Material Symbols font loading script in <head> if missing
    if (!content.includes('icons-loaded') && content.includes('</head>')) {
        content = content.replace('</head>', `${fontLoadScript}\n</head>`);
    }

    // 3. Fix Ερασιτέχνης in horizontal bar (Replace ☘️ with 🤾)
    content = content.replace(/☘️\s*Ερασιτέχνης/g, '🤾 Ερασιτέχνης');
    content = content.replace(/☘️\s*ΕΡΑΣΙΤΕΧΝΗΣ/g, '🤾 ΕΡΑΣΙΤΕΧΝΗΣ');

    // 4. Fix Sidebar Drawer icon for Ερασιτέχνης (Replace 'sports' with 'directions_run')
    // Look for nav-amateur link
    const navAmateurRegex = /(<a\s+[^>]*id="nav-amateur"[^>]*>[\s\S]*?<span class="material-symbols-outlined">)sports(<\/span>[\s\S]*?<span>Ερασιτέχνης<\/span>)/i;
    if (navAmateurRegex.test(content)) {
        content = content.replace(navAmateurRegex, '$1directions_run$2');
        console.log(`✅ Updated nav-amateur icon to 'directions_run' in ${file}`);
    } else {
        // Fallback search for amateur drawer link if id not present
        content = content.replace(
            /(href="\/erasitechnis"[^>]*>[\s\S]*?<span class="material-symbols-outlined">)sports(<\/span>)/gi,
            '$1directions_run$2'
        );
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('✅ Updated all HTML pages cleanly.');
