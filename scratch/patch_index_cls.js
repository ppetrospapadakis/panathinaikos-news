const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix logos
content = content.replace(
    '<img src="/logo.png" alt="PanathinaikosNews" class="h-[68px] md:h-[74px] w-auto object-contain" width="200" height="74"/>',
    '<img src="/logo.png" alt="PanathinaikosNews" class="h-[68px] md:h-[74px] w-auto object-contain" width="200" height="74" style="aspect-ratio: 200 / 74;"/>'
);

content = content.replace(
    '<img src="/logo.png" alt="PanathinaikosNews" class="h-20 md:h-24 w-[200px] object-contain" width="200" height="96"/>',
    '<img src="/logo.png" alt="PanathinaikosNews" class="h-20 md:h-24 w-[200px] object-contain" width="200" height="96" style="aspect-ratio: 200 / 96;"/>'
);

content = content.replace(
    '<img src="/logo.png" alt="PanathinaikosNews" class="h-10 md:h-12 w-auto object-contain" width="200" height="48"/>',
    '<img src="/logo.png" alt="PanathinaikosNews" class="h-10 md:h-12 w-auto object-contain" width="200" height="48" style="aspect-ratio: 200 / 48;"/>'
);

// 2. Fix stream-container layout shift
content = content.replace(
    '<div id="stream-container" class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0" style="max-height:700px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">',
    '<div id="stream-container" class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-[800px] md:min-h-[500px]" style="max-height:700px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">'
);

// 3. Fix candidateHeroGroup logic to exclude amateur
const oldHeroLogicLF = `            // Hero logic with cache mismatch handling
            let candidateHeroGroup = activeCategory === 'Άποψη' ? null : (scraperGroups[0] || ownGroups[0]);`;

const oldHeroLogicCRLF = oldHeroLogicLF.replace(/\n/g, '\r\n');

const newHeroLogic = `            // Hero logic with cache mismatch handling
            let candidateHeroGroup = null;
            if (activeCategory !== 'Άποψη') {
                if (activeCategory === null) {
                    candidateHeroGroup = scraperGroups.find(g => !(g.main.category || '').includes('Ερασιτέχνης')) || ownGroups[0];
                } else {
                    candidateHeroGroup = scraperGroups[0] || ownGroups[0];
                }
            }`;

if (content.includes(oldHeroLogicCRLF)) {
    content = content.replace(oldHeroLogicCRLF, newHeroLogic.replace(/\n/g, '\r\n'));
} else if (content.includes(oldHeroLogicLF)) {
    content = content.replace(oldHeroLogicLF, newHeroLogic);
} else {
    console.log('WARNING: Hero logic not found in index.html');
}

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully patched index.html for CLS and Hero fallback!');
