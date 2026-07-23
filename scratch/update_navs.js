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

const tabFixturesHtml = `<a id="tab-fixtures" href="/fixtures" class="hidden px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all whitespace-nowrap lg:flex-1 text-center">📅 ΠΡΟΓΡΑΜΜΑ</a>`;

const checkAdminNavScript = `
        function checkAdminNav() {
            if (sessionStorage.getItem('op_auth') === '1') {
                const el = document.getElementById('nav-item-fixtures');
                if (el) el.classList.remove('hidden');
                const tab = document.getElementById('tab-fixtures');
                if (tab) tab.classList.remove('hidden');
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAdminNav);
        } else {
            checkAdminNav();
        }
`;

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add horizontal tab if not already present
    if (!content.includes('id="tab-fixtures"')) {
        // Look for roster link pattern in horizontal tab bar (e.g., href="/roster.html")
        const rosterTabRegex = /(href="\/roster\.html"[^>]*>[\s\S]*?<\/a>)/i;
        if (rosterTabRegex.test(content)) {
            content = content.replace(rosterTabRegex, `$1\n                ${tabFixturesHtml}`);
            console.log(`✅ Added tab-fixtures to horizontal bar in ${file}`);
        }
    }

    // 2. Update checkAdminNav script
    if (content.includes('checkAdminNav()')) {
        // replace old checkAdminNavScript snippet if it exists
        content = content.replace(/function checkAdminNav\(\) \{[\s\S]*?checkAdminNav\(\);\s*\}/g, checkAdminNavScript.trim());
    } else {
        content = content.replace('</body>', `<script>${checkAdminNavScript}</script>\n</body>`);
    }

    // 3. Fix SyntaxError in fixtures.html (replace const supabase = with const supabaseClient =)
    if (file === 'fixtures.html') {
        content = content.replace(/const supabase = window\.supabase\.createClient/g, 'const supabaseClient = window.supabase.createClient');
        content = content.replace(/supabase\s*\n?\s*\.from\('fixtures'\)/g, "supabaseClient.from('fixtures')");
        console.log(`✅ Fixed Supabase variable declaration collision in fixtures.html`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Nav drawers and horizontal tab bar updated successfully.');
