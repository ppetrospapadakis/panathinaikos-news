const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Fix fixtures.html layout (Stack filter button ABOVE fixtures-box + set container to 800px max-width)
const fixturesPath = path.join(rootDir, 'fixtures.html');
let fixturesContent = fs.readFileSync(fixturesPath, 'utf8');

// Replace main content container structure
const oldMainContentRegex = /<!-- Main Content Area -->[\s\S]*?<!-- Scrollable Match Box Container/i;

const newMainContentHeader = `<!-- Main Content Area -->
        <div class="max-w-[800px] mx-auto px-4 sm:px-6 py-6 min-h-[60vh] flex flex-col">
            <!-- Top Controls Bar (Filter Dropdown Stacked ABOVE Matches Box) -->
            <div class="flex items-center justify-start mb-4 relative z-20">
                <div class="relative inline-block text-left" id="filter-dropdown-wrapper">
                    <button id="filter-dropdown-btn" onclick="toggleFilterDropdown(event)" class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label text-sm font-medium border border-outline-variant/30 shadow-md transition-all active:scale-95 cursor-pointer">
                        <span class="material-symbols-outlined text-primary text-[18px]">tune</span>
                        <span id="filter-selected-label">Φίλτρα Αγώνων</span>
                        <span class="material-symbols-outlined text-on-surface-variant text-[18px] transition-transform duration-200" id="filter-chevron">expand_more</span>
                    </button>

                    <!-- Dropdown Menu Panel -->
                    <div id="filter-dropdown-menu" class="hidden absolute left-0 mt-2 w-52 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/40 shadow-2xl p-1.5 z-30 transition-all duration-200 opacity-0 scale-95 origin-top-left">
                        <div class="px-3 py-2 font-label text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-b border-outline-variant/20 mb-1">
                            Επιλογή Αθλήματος
                        </div>
                        <button onclick="selectFilter('all', 'Όλα τα Αθλήματα')" class="filter-option flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span>🏆</span><span>Όλα τα Αθλήματα</span>
                        </button>
                        <button onclick="selectFilter('football', '⚽ Ποδόσφαιρο')" class="filter-option flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span>⚽</span><span>Ποδόσφαιρο</span>
                        </button>
                        <button onclick="selectFilter('basketball', '🏀 Μπάσκετ')" class="filter-option flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span>🏀</span><span>Μπάσκετ</span>
                        </button>
                        <button onclick="selectFilter('amateur', '🤾 Ερασιτέχνης')" class="filter-option flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl font-label text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all text-left cursor-pointer">
                            <span>🤾</span><span>Ερασιτέχνης</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Scrollable Match Box Container`;

fixturesContent = fixturesContent.replace(oldMainContentRegex, newMainContentHeader);

// Ensure max-w-[800px] on fixtures-box wrapper container
fixturesContent = fixturesContent.replace(/max-w-\[900px\]/g, 'max-w-[800px]');

fs.writeFileSync(fixturesPath, fixturesContent, 'utf8');
console.log('✅ Updated fixtures.html layout: Filter stacked ABOVE 800px box');

// 2. Fix console error in index.html, article.html & replace googleusercontent DEFAULT_IMG
const filesToFix = ['index.html', 'article.html', 'roster.html'];

filesToFix.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Fix slugify safe check
    content = content.replace(/function slugify\(text\) \{/g, 'function slugify(text) {\n            if (!text) return "arthro";');

    // Replace expiring googleusercontent DEFAULT_IMG
    content = content.replace(/const DEFAULT_IMG = 'https:\/\/lh3\.googleusercontent\.com\/aida-public\/[^']*';/g, "const DEFAULT_IMG = '/logo.png';");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed slugify & DEFAULT_IMG in ${file}`);
});
