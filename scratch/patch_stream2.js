const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 2. Remove ownArticles from stream candidates
html = html.replace(
    /let sideCandidates;[\s\S]*?sideCandidates = scraperGroups;\s*\}/,
    `let sideCandidates = scraperGroups;`
);

// 3. Fix infinite scroll on mobile for stream
const scrollRegex = /let sideCount = Math\.min\(20, sideCandidates\.length\);[\s\S]*?stream\.addEventListener\('scroll', async \(\) => \{[\s\S]*?if \(stream\.scrollTop \+ stream\.clientHeight >= stream\.scrollHeight - 150\) \{[\s\S]*?if \(sideCount >= sideCandidates\.length && !isFetchingMore && streamHasMore\) \{/;

const scrollReplace = `let sideCount = Math.min(20, sideCandidates.length);
            
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
            
            if (false) {
                if (false) {
                    if (false) {`; // Dummy to close the braces of the captured block

html = html.replace(scrollRegex, scrollReplace);

fs.writeFileSync('index.html', html);
console.log('Script 2 completed.');
