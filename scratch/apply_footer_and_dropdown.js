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

const unifiedFooter = `    <!-- Footer -->
    <footer class="w-full py-16 bg-surface-container-lowest border-t border-outline-variant">
        <div class="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col items-center gap-8">
            <a href="/" class="flex items-center">
                <img src="/logo.png" alt="PanathinaikosNews" class="h-[68px] md:h-[74px] w-auto object-contain" width="261" height="74"/>
            </a>
            <div class="flex flex-wrap justify-center gap-x-8 gap-y-4">
                <a class="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors" href="/privacy-policy">Πολιτική Απορρήτου</a>
                <a class="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors" href="/terms-of-service">Όροι Χρήσης</a>
                <a class="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors" href="/contact">Επικοινωνία</a>
            </div>
            <p class="font-caption text-caption text-on-surface-variant/70">© 2026 PanathinaikosNews. All rights reserved.</p>
        </div>
    </footer>`;

// 1. Update footers across all HTML pages
files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace any existing <footer ...> ... </footer> block with unifiedFooter
    const footerRegex = /<!-- Footer -->\s*<footer[\s\S]*?<\/footer>|<footer[\s\S]*?<\/footer>/gi;
    if (footerRegex.test(content)) {
        content = content.replace(footerRegex, unifiedFooter);
        console.log(`✅ Unified footer with logo applied to ${file}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

// 2. Refine fixtures.html with top-left Filter Dropdown Menu
const fixturesPath = path.join(rootDir, 'fixtures.html');
let fixturesContent = fs.readFileSync(fixturesPath, 'utf8');

// Remove 2nd sticky row if present
const sticky2ndRowRegex = /<!-- In-Page Sport Filter Bar[\s\S]*?<\/div>\s*<\/div>/i;
fixturesContent = fixturesContent.replace(sticky2ndRowRegex, '');

// Insert Top Controls Bar (with Top-Left Dropdown Menu) inside <main> right above #fixtures-box
const topControlsHtml = `<!-- Top Controls Bar (Filter Dropdown Aligned Top-Left) -->
            <div class="flex items-center justify-between mb-4 relative z-20">
                <div class="relative inline-block text-left" id="filter-dropdown-wrapper">
                    <button id="filter-dropdown-btn" onclick="toggleFilterDropdown(event)" class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label text-sm font-medium border border-outline-variant/30 shadow-md transition-all active:scale-95 cursor-pointer">
                        <span class="material-symbols-outlined text-primary text-[18px]">tune</span>
                        <span id="filter-selected-label">Φίλτρα Αγώνων</span>
                        <span class="material-symbols-outlined text-on-surface-variant text-[18px] transition-transform duration-200" id="filter-chevron">expand_more</span>
                    </button>

                    <!-- Dropdown Menu Panel -->
                    <div id="filter-dropdown-menu" class="hidden absolute left-0 mt-2 w-56 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/40 shadow-2xl p-1.5 z-30 transition-all duration-200 opacity-0 scale-95 origin-top-left">
                        <div class="px-3 py-2 font-label text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-b border-outline-variant/20 mb-1">
                            Επιλογή Αθλήματος
                        </div>
                        <button onclick="selectFilter('all', 'Όλα τα Αθλήματα')" class="filter-option flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span class="flex items-center gap-2"><span>🏆</span><span>Όλα τα Αθλήματα</span></span>
                            <span class="material-symbols-outlined text-primary text-[18px] check-icon" id="check-all">check</span>
                        </button>
                        <button onclick="selectFilter('football', '⚽ Ποδόσφαιρο')" class="filter-option flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span class="flex items-center gap-2"><span>⚽</span><span>Ποδόσφαιρο</span></span>
                            <span class="material-symbols-outlined text-primary text-[18px] check-icon hidden" id="check-football">check</span>
                        </button>
                        <button onclick="selectFilter('basketball', '🏀 Μπάσκετ')" class="filter-option flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span class="flex items-center gap-2"><span>🏀</span><span>Μπάσκετ</span></span>
                            <span class="material-symbols-outlined text-primary text-[18px] check-icon hidden" id="check-basketball">check</span>
                        </button>
                        <button onclick="selectFilter('amateur', '🤾 Ερασιτέχνης')" class="filter-option flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span class="flex items-center gap-2"><span>🤾</span><span>Ερασιτέχνης</span></span>
                            <span class="material-symbols-outlined text-primary text-[18px] check-icon hidden" id="check-amateur">check</span>
                        </button>
                    </div>
                </div>
            </div>`;

// Insert topControlsHtml right inside <div class="max-w-[900px] mx-auto px-4 md:px-8 py-6 min-h-[60vh]"> before #fixtures-box
const mainAreaRegex = /(<div class="max-w-\[900px\] mx-auto px-4 md:px-8 py-6 min-h-\[60vh\]">)/i;
if (mainAreaRegex.test(fixturesContent) && !fixturesContent.includes('filter-dropdown-wrapper')) {
    fixturesContent = fixturesContent.replace(mainAreaRegex, `$1\n            ${topControlsHtml}`);
    console.log('✅ Added Top-Left Filter Dropdown Menu to fixtures.html');
}

// Add Dropdown JS Functions before </script>
const dropdownJs = `
        // Dropdown Menu Functions
        function toggleFilterDropdown(e) {
            if (e) e.stopPropagation();
            const menu = document.getElementById('filter-dropdown-menu');
            const chevron = document.getElementById('filter-chevron');
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                requestAnimationFrame(() => {
                    menu.classList.remove('opacity-0', 'scale-95');
                    menu.classList.add('opacity-100', 'scale-100');
                });
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                closeFilterDropdown();
            }
        }

        function closeFilterDropdown() {
            const menu = document.getElementById('filter-dropdown-menu');
            const chevron = document.getElementById('filter-chevron');
            if (!menu || menu.classList.contains('hidden')) return;
            menu.classList.remove('opacity-100', 'scale-100');
            menu.classList.add('opacity-0', 'scale-95');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                menu.classList.add('hidden');
            }, 150);
        }

        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('filter-dropdown-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                closeFilterDropdown();
            }
        });

        function selectFilter(category, label) {
            const labelEl = document.getElementById('filter-selected-label');
            if (labelEl) {
                labelEl.textContent = category === 'all' ? 'Φίλτρα Αγώνων' : \`Φίλτρο: \${label}\`;
            }

            ['all', 'football', 'basketball', 'amateur'].forEach(cat => {
                const check = document.getElementById(\`check-\${cat}\`);
                if (check) {
                    if (cat === category) check.classList.remove('hidden');
                    else check.classList.add('hidden');
                }
            });

            closeFilterDropdown();
            fetchFixtures(category);
        }
        window.selectFilter = selectFilter;
        window.toggleFilterDropdown = toggleFilterDropdown;
`;

if (!fixturesContent.includes('toggleFilterDropdown')) {
    fixturesContent = fixturesContent.replace('</script>', `${dropdownJs}\n</script>`);
}

fs.writeFileSync(fixturesPath, fixturesContent, 'utf8');
console.log('✅ Saved updated fixtures.html');
