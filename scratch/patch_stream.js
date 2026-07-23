const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add "Ροή Ειδήσεων" header for mobile
const streamHtmlTarget = `<div id="stream-container" class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-[800px] md:min-h-[500px] lg:max-h-[700px]" style="overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">`;
const streamHtmlReplace = `<div class="lg:hidden px-4 mb-2 mt-4 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                        <span class="material-symbols-outlined text-primary" style="font-size:22px;">feed</span>
                        <h2 class="font-h2 text-[20px] m-0 text-on-surface/90 font-semibold">Ροή Ειδήσεων</h2>
                    </div>
                    <div id="stream-container" class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-[800px] md:min-h-[500px] lg:max-h-[700px]" style="overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">`;
if(html.includes(streamHtmlTarget)) {
    html = html.replace(streamHtmlTarget, streamHtmlReplace);
    console.log("Applied title patch.");
} else {
    console.log("Failed to find streamHtmlTarget.");
}

// 2. Remove ownArticles from stream candidates
const streamMergeTarget = `            let sideCandidates;
            if (activeCategory === null) {
                const ownFromCache = ownArticles.map(a => ({ main: a, related: [] }));
                const filteredOwnCache = window.currentHeroId
                    ? ownFromCache.filter(g => g.main.id !== window.currentHeroId)
                    : ownFromCache;
                const getTime = (str) => { const t = new Date(str).getTime(); return isNaN(t) ? 0 : t; };
                sideCandidates = [
                    ...scraperGroups,
                    ...filteredOwnCache
                ].sort((a,b) => getTime(b.main.created_at) - getTime(a.main.created_at));
            } else {
                sideCandidates = scraperGroups;
            }`;

const streamMergeReplace = `            let sideCandidates;
            sideCandidates = scraperGroups;`;
if(html.includes(streamMergeTarget)) {
    html = html.replace(streamMergeTarget, streamMergeReplace);
    console.log("Applied own articles removal patch.");
} else {
    console.log("Failed to find streamMergeTarget.");
}

// 3. Fix infinite scroll on mobile for stream
const scrollTarget = `            let sideCount = Math.min(20, sideCandidates.length);
            stream.addEventListener('scroll', async () => {
                if (stream.scrollTop + stream.clientHeight >= stream.scrollHeight - 150) {
                    if (sideCount >= sideCandidates.length && !isFetchingMore && streamHasMore) {`;
const scrollReplace = `            let sideCount = Math.min(20, sideCandidates.length);
            
            const loadMoreStream = async () => {
                if (sideCount >= sideCandidates.length && !isFetchingMore && streamHasMore) {
                    const oldLength = allArticles.length;
                    await fetchMorePages();
                    const newArticles = allArticles.slice(oldLength);
                    
                    const newGroupsObj = {};
                    newArticles.forEach(a => {
                        const gid = a.group_id || ('solo-' + a.id);
                        if (!newGroupsObj[gid]) newGroupsObj[gid] = [];
                        newGroupsObj[gid].push(a);
                    });
                    
                    const getTime = (str) => { const t = new Date(str).getTime(); return isNaN(t) ? 0 : t; };
                    Object.values(newGroupsObj).forEach(g => {
                        g.sort((a,b) => getTime(b.created_at) - getTime(a.created_at));
                        if (activeCategory !== 'Άποψη' && window.currentHeroId && g[0].id === window.currentHeroId) return;
                        sideCandidates.push({ main: g[0], related: g.slice(1) });
                    });
                }

                if (sideCount < sideCandidates.length) {
                    const batch = sideCandidates.slice(sideCount, sideCount + 10);
                    batch.forEach(g => stream.insertAdjacentHTML('beforeend', sideCardHtml(g.main)));
                    sideCount += batch.length;
                }
            };
            
            stream.addEventListener('scroll', async () => {
                if (stream.scrollTop + stream.clientHeight >= stream.scrollHeight - 150) {
                    await loadMoreStream();
                }
            });
            
            if (window.streamMobileScrollHandler) {
                window.removeEventListener('scroll', window.streamMobileScrollHandler);
            }
            window.streamMobileScrollHandler = async () => {
                if (window.innerWidth >= 1024) return;
                const rect = stream.getBoundingClientRect();
                if (rect.bottom <= window.innerHeight + 800) {
                    await loadMoreStream();
                }
            };
            window.addEventListener('scroll', window.streamMobileScrollHandler);
            
            // Dummy block to match rest of code that was captured in regex
            if (false) {
                if (true) {`;

if (html.includes(scrollTarget)) {
    html = html.replace(scrollTarget, scrollReplace);
    console.log("Applied infinite scroll patch.");
} else {
    console.log("Failed to find scrollTarget.");
}

fs.writeFileSync('index.html', html);
console.log('Script completed.');
