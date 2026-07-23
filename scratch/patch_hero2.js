const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Patch 1: Add relative class and pinButtonHtml to renderHero
html = html.replace(
    /heroEl\.innerHTML = `<a class="group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant\/20 flex flex-col overflow-hidden card-hover h-full" href="\$\{url\}" data-article-id="\$\{a\.id\}">\s*<div class="relative w-full shrink-0 overflow-hidden"/s,
    `heroEl.innerHTML = \`<a class="relative group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant/20 flex flex-col overflow-hidden card-hover h-full" href="\${url}" data-article-id="\${a.id}">
                \${pinButtonHtml(a.id, a.pinned_at)}
                <div class="relative w-full shrink-0 overflow-hidden"`
);

// Patch 2: Re-render SSR hero if admin
html = html.replace(
    /window\.currentHeroDate = parsed\.created_at;\s*}\s*}/,
    `window.currentHeroDate = parsed.created_at;
                    if (isAdmin()) {
                        renderHero(processImage(parsed)); // Re-render client-side to inject admin buttons
                    }
                }
            }`
);

fs.writeFileSync('index.html', html);
console.log('Done replacing via Regex');
