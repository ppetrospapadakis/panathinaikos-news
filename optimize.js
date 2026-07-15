const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add fetchpriority and eager loading to hero image
const oldImg = `<img referrerpolicy="no-referrer" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="\${a.image_url||DEFAULT_IMG}" alt="\${a.title}" onerror="this.src='\${DEFAULT_IMG}'"/>`;
const newImg = `<img referrerpolicy="no-referrer" fetchpriority="high" loading="eager" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="\${a.image_url||DEFAULT_IMG}" alt="\${a.title}" onerror="this.src='\${DEFAULT_IMG}'"/>`;
content = content.replace(oldImg, newImg);

// 2. Change Phase 1 to await the hero fetch
const oldPhase1 = `            // PHASE 1 — hero (limit=1) fires immediately, renders as soon as it arrives
            const heroPromise = fetch(\`/api/articles?limit=1&category=\${apiCat}\`)
                .then(r => r.json())
                .then(data => {
                    if (data && data[0]) renderHero(processImage(data[0]));
                })
                .catch(err => console.error('[Phase1]', err));`;

const newPhase1 = `            // PHASE 1 — hero (limit=1) fires immediately, renders as soon as it arrives, BLOCKING other requests to ensure absolute priority
            try {
                const r = await fetch(\`/api/articles?limit=1&category=\${apiCat}\`);
                const data = await r.json();
                if (data && data[0]) renderHero(processImage(data[0]));
            } catch (err) {
                console.error('[Phase1]', err);
            }`;
content = content.replace(oldPhase1, newPhase1);

// 3. Fix the comment for Phase 2
const oldPhase2Comment = `            // Don't block hero on stream; run hero independently`;
const newPhase2Comment = `            // Fire stream and own articles in parallel AFTER Hero is painted`;
content = content.replace(oldPhase2Comment, newPhase2Comment);

fs.writeFileSync('index.html', content, 'utf8');
console.log('Optimized index.html latency');
