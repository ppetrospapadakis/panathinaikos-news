const fs = require('fs');
const path = require('path');

const fixturesPath = path.join(__dirname, '..', 'fixtures.html');
let content = fs.readFileSync(fixturesPath, 'utf8');

// 1. Add custom scrollbar CSS in head if not present
const styleTag = `
    <style>
        #fixtures-box::-webkit-scrollbar {
            width: 6px;
        }
        #fixtures-box::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 9999px;
        }
        #fixtures-box::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.18);
            border-radius: 9999px;
        }
        #fixtures-box::-webkit-scrollbar-thumb:hover {
            background: rgba(16, 185, 129, 0.5);
        }
    </style>
`;

if (!content.includes('#fixtures-box::-webkit-scrollbar')) {
    content = content.replace('</head>', `${styleTag}\n</head>`);
}

// 2. Update Sport Filter Bar with "ΦΙΛΤΡΑ" badge & styling
const oldFilterBarRegex = /<!-- In-Page Sport Filter Tabs[\s\S]*?<\/div>\s*<\/div>/i;
const newFilterBarHtml = `<!-- In-Page Sport Filter Bar (Sticky right under main horizontal nav) -->
        <div class="sticky top-[137px] z-20 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 shadow-md">
            <div class="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-2.5">
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-label text-[11px] font-bold uppercase tracking-wider border border-primary/20 shrink-0 mr-1">
                    <span class="material-symbols-outlined text-[15px]">tune</span>
                    <span>ΦΙΛΤΡΑ</span>
                </div>
                <button id="fixture-cat-all" onclick="switchCategory('all')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-primary bg-primary/10 text-primary transition-all cursor-pointer whitespace-nowrap">ΌΛΑ</button>
                <button id="fixture-cat-football" onclick="switchCategory('football')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer whitespace-nowrap">⚽ Ποδόσφαιρο</button>
                <button id="fixture-cat-basketball" onclick="switchCategory('basketball')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer whitespace-nowrap">🏀 Μπάσκετ</button>
                <button id="fixture-cat-amateur" onclick="switchCategory('amateur')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer whitespace-nowrap">🤾 Ερασιτέχνης</button>
            </div>
        </div>`;

content = content.replace(oldFilterBarRegex, newFilterBarHtml);

// 3. Wrap matches container inside scrollable box (500px mobile / 800px desktop)
const oldMainContentRegex = /<!-- Main Content Area -->[\s\S]*?<\/div>\s*<\/div>/i;
const newMainContentHtml = `<!-- Main Content Area -->
        <div class="max-w-[900px] mx-auto px-4 md:px-8 py-6 min-h-[60vh]">
            <!-- Scrollable Match Box Container (500px mobile / 800px desktop) -->
            <div id="fixtures-box" class="h-[500px] md:h-[800px] overflow-y-auto pr-1.5 sm:pr-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/40 backdrop-blur-sm p-3 sm:p-5 shadow-inner">
                <!-- Loading Spinner -->
                <div id="fixtures-loading" class="w-full flex justify-center py-16">
                    <div class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>

                <!-- Match List Container (Flashscore Style) -->
                <div id="fixtures-list" class="flex flex-col gap-2.5 hidden"></div>

                <!-- Empty State -->
                <div id="fixtures-empty" class="hidden text-center py-16 bg-surface-container-low/50 rounded-2xl border border-outline-variant/20">
                    <span class="material-symbols-outlined text-on-surface-variant/40 text-5xl mb-2">event_busy</span>
                    <p class="font-body text-body text-on-surface-variant">Δεν βρέθηκαν προγραμματισμένοι αγώνες γι' αυτή την κατηγορία.</p>
                </div>
            </div>
        </div>`;

content = content.replace(oldMainContentRegex, newMainContentHtml);

// 4. Update JS scroll logic to scroll inside #fixtures-box instead of window
const oldScrollJsRegex = /\/\/\s*Instant Viewport Positioning[\s\S]*?window\.scrollTo\(\{[\s\S]*?\}\);\s*\}\s*\}\);\s*\}/i;
const newScrollJs = `// Instant Box Internal Positioning (Scrolls to current match inside box)
                if (currentMatchElId) {
                    requestAnimationFrame(() => {
                        const box = document.getElementById('fixtures-box');
                        const el = document.getElementById(currentMatchElId);
                        if (box && el) {
                            box.scrollTop = Math.max(0, el.offsetTop - 16);
                        }
                    });
                }`;

content = content.replace(oldScrollJsRegex, newScrollJs);

fs.writeFileSync(fixturesPath, content, 'utf8');
console.log('✅ Updated fixtures.html with filter indicator badge and scrollable box container (500px mobile / 800px desktop)');
