const fs = require('fs');
const path = require('path');

const fixturesPath = path.join(__dirname, '..', 'fixtures.html');
let content = fs.readFileSync(fixturesPath, 'utf8');

// 1. Remove checkmark spans from dropdown buttons HTML
const dropdownMenuRegex = /<div id="filter-dropdown-menu"[\s\S]*?<\/div>\s*<\/div>/m;

const newDropdownMenuHtml = `<div id="filter-dropdown-menu" class="hidden absolute left-0 mt-2 w-52 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/40 shadow-2xl p-1.5 z-30 transition-all duration-200 opacity-0 scale-95 origin-top-left">
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
                    </div>`;

content = content.replace(dropdownMenuRegex, newDropdownMenuHtml);

// 2. Clean up selectFilter JS function in head
const oldSelectFilterRegex = /window\.selectFilter = function\(category, label\) \{[\s\S]*?^\s*\};/m;
const newSelectFilter = `window.selectFilter = function(category, label) {
            const labelEl = document.getElementById('filter-selected-label');
            if (labelEl) {
                labelEl.textContent = category === 'all' ? 'Φίλτρα Αγώνων' : \`Φίλτρο: \${label}\`;
            }

            window.closeFilterDropdown();
            if (typeof window.fetchFixtures === 'function') {
                window.fetchFixtures(category);
            }
        };`;

content = content.replace(oldSelectFilterRegex, newSelectFilter);

fs.writeFileSync(fixturesPath, content, 'utf8');
console.log('✅ Removed checkmark icons from dropdown menu in fixtures.html');
