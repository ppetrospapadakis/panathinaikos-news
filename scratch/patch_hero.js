const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Patch 1: Add relative class and pinButtonHtml to renderHero
const target1 = `heroEl.innerHTML = \`<a class="group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant/20 flex flex-col overflow-hidden card-hover h-full" href="\${url}" data-article-id="\${a.id}">
                <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">`;
const replace1 = `heroEl.innerHTML = \`<a class="relative group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant/20 flex flex-col overflow-hidden card-hover h-full" href="\${url}" data-article-id="\${a.id}">
                \${pinButtonHtml(a.id, a.pinned_at)}
                <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">`;

if (html.includes(target1)) {
    html = html.replace(target1, replace1);
    console.log('Patch 1 successful');
} else {
    console.log('Patch 1 failed to match');
}

// Patch 2: Re-render SSR hero if admin
const target2 = `            if (hasSsrHero) {
                const ssrHero = heroEl.querySelector('[data-ssr="true"]');
                const parsed = JSON.parse(ssrHero.getAttribute('data-article') || 'null');
                if (parsed) {
                    window.currentHeroId = parsed.id;
                    window.currentHeroDate = parsed.created_at;
                }
            }`;
const replace2 = `            if (hasSsrHero) {
                const ssrHero = heroEl.querySelector('[data-ssr="true"]');
                const parsed = JSON.parse(ssrHero.getAttribute('data-article') || 'null');
                if (parsed) {
                    window.currentHeroId = parsed.id;
                    window.currentHeroDate = parsed.created_at;
                    if (isAdmin()) {
                        renderHero(processImage(parsed)); // Re-render client-side to inject admin buttons
                    }
                }
            }`;

if (html.includes(target2)) {
    html = html.replace(target2, replace2);
    console.log('Patch 2 successful');
} else {
    console.log('Patch 2 failed to match');
}

fs.writeFileSync('index.html', html);
console.log('Done');
