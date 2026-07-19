const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix sideCardHtml min-h-[110px]
content = content.replace(
    '`<a class="relative group cursor-pointer flex gap-3 items-start p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border ${borderClass} text-left" href="${url}" data-article-id="${a.id}">${pinButtonHtml(a.id, a.pinned_at)}',
    '`<a class="relative group cursor-pointer flex gap-3 items-start p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border ${borderClass} text-left min-h-[110px]" href="${url}" data-article-id="${a.id}">${pinButtonHtml(a.id, a.pinned_at)}'
);

// 2. Fix stream-container skeletons and max-height inline style
const oldSkeletonsLF = `                <div id="stream-container" class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-[800px] md:min-h-[500px]" style="max-height:700px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">
                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div><div class="h-3 bg-surface-container-high w-1/2 rounded"></div></div>
                    </div>
                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div></div>
                    </div>
                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div></div>
                    </div>`;

const newSkeletons = `                <div id="stream-container" class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-[800px] md:min-h-[500px] lg:max-h-[700px]" style="overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">
                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl min-h-[110px]">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div><div class="h-3 bg-surface-container-high w-1/2 rounded"></div></div>
                    </div>
                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl min-h-[110px]">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div></div>
                    </div>
                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl min-h-[110px]">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div></div>
                    </div>`;

const oldSkeletonsCRLF = oldSkeletonsLF.replace(/\n/g, '\r\n');
if (content.includes(oldSkeletonsCRLF)) {
    content = content.replace(oldSkeletonsCRLF, newSkeletons.replace(/\n/g, '\r\n'));
} else if (content.includes(oldSkeletonsLF)) {
    content = content.replace(oldSkeletonsLF, newSkeletons);
} else {
    console.log("Could not find skeletons HTML block");
}

// 3. Fix syncStreamHeight to not cause JS layout shifts on mobile
const oldSyncLF = `        function syncStreamHeight() {
            const hero   = document.getElementById('hero-container');
            const stream = document.getElementById('stream-container');
            if (!hero || !stream) return;
                        let isSyncing = false;
            const doSync = () => {
                if (isSyncing) return;
                isSyncing = true;
                requestAnimationFrame(() => {
                    isSyncing = false;
                    const isDesktop = window.innerWidth >= 768;
                    const h = isDesktop ? hero.clientHeight : 0;
                    requestAnimationFrame(() => {
                        stream.style.maxHeight = isDesktop ? (h > 200 ? \`\${h}px\` : '700px') : 'none';
                    });
                });
            };
            [50, 300, 800].forEach(t => setTimeout(doSync, t));
            const img = hero.querySelector('img');
            if (img) img.addEventListener('load', doSync);
            window.removeEventListener('resize', syncStreamHeight); // Ensure old generic listener is removed if it existed
            window.addEventListener('resize', doSync);
        }`;

const newSync = `        function syncStreamHeight() {
            const hero   = document.getElementById('hero-container');
            const stream = document.getElementById('stream-container');
            if (!hero || !stream) return;
            let isSyncing = false;
            const doSync = () => {
                if (window.innerWidth < 768) {
                    stream.style.maxHeight = ''; // reset on mobile to avoid layout shifts
                    return;
                }
                if (isSyncing) return;
                isSyncing = true;
                requestAnimationFrame(() => {
                    isSyncing = false;
                    const h = hero.clientHeight;
                    requestAnimationFrame(() => {
                        stream.style.maxHeight = h > 200 ? \`\${h}px\` : '700px';
                    });
                });
            };
            [50, 300, 800].forEach(t => setTimeout(doSync, t));
            const img = hero.querySelector('img');
            if (img) img.addEventListener('load', doSync);
            window.removeEventListener('resize', doSync);
            window.addEventListener('resize', doSync);
        }`;

const oldSyncCRLF = oldSyncLF.replace(/\n/g, '\r\n');
if (content.includes(oldSyncCRLF)) {
    content = content.replace(oldSyncCRLF, newSync.replace(/\n/g, '\r\n'));
} else if (content.includes(oldSyncLF)) {
    content = content.replace(oldSyncLF, newSync);
} else {
    console.log("Could not find syncStreamHeight function");
}

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully patched index.html for final CLS issues');
