const fs = require('fs');
const path = require('path');

const fixturesPath = path.join(__dirname, '..', 'fixtures.html');
let content = fs.readFileSync(fixturesPath, 'utf8');

// 1. Remove heading block "Πρόγραμμα & Αποτελέσματα"
content = content.replace(/<div class="flex items-center justify-between mb-4">[\s\S]*?<\/div>\s*<\/div>/i, '');

// 2. Make sport filter tabs sticky top-[137px] and full width inside <main>
const oldFiltersRegex = /<!-- In-Page Sport Filter Tabs[\s\S]*?<\/div>/i;

const newFiltersHtml = `<!-- In-Page Sport Filter Tabs (Sticky right under main horizontal nav) -->
        <div class="sticky top-[137px] z-20 bg-background border-b border-outline-variant/30 shadow-sm">
            <div class="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-2.5">
                <button id="fixture-cat-all" onclick="switchCategory('all')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-primary bg-primary/10 text-primary transition-all cursor-pointer whitespace-nowrap">ΌΛΑ</button>
                <button id="fixture-cat-football" onclick="switchCategory('football')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer whitespace-nowrap">⚽ Ποδόσφαιρο</button>
                <button id="fixture-cat-basketball" onclick="switchCategory('basketball')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer whitespace-nowrap">🏀 Μπάσκετ</button>
                <button id="fixture-cat-amateur" onclick="switchCategory('amateur')" class="px-5 py-2 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer whitespace-nowrap">🤾 Ερασιτέχνης</button>
            </div>
        </div>`;

if (oldFiltersRegex.test(content)) {
    content = content.replace(oldFiltersRegex, newFiltersHtml);
    console.log('✅ Replaced filter tabs with sticky sub-bar');
} else {
    console.log('⚠️ Could not find oldFiltersRegex');
}

// 3. Update headerOffset in JS for current match scroll position (from 180 to 210)
content = content.replace(/const headerOffset = 180;/g, 'const headerOffset = 210;');

fs.writeFileSync(fixturesPath, content, 'utf8');
console.log('✅ Saved updated fixtures.html');
