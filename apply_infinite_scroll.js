const fs = require('fs');

function replaceNormalize(str, search, replacement) {
    const searchNormalized = search.replace(/\r\n/g, '\n');
    const strNormalized = str.replace(/\r\n/g, '\n');
    return strNormalized.replace(searchNormalized, replacement).replace(/\n/g, '\r\n');
}

// 1. Update index.html
let index = fs.readFileSync('index.html', 'utf8');

const oldIndexScroll = `            // Sidebar infinite scroll from local cache
            let sideCount = 20;
            stream.addEventListener('scroll', () => {
                if (stream.scrollTop + stream.clientHeight >= stream.scrollHeight - 60) {
                    const batch = sideCandidates.slice(sideCount, sideCount + 10);
                    batch.forEach(g => stream.insertAdjacentHTML('beforeend', sideCardHtml(g.main)));
                    sideCount += batch.length;
                }
            });`;

const newIndexScroll = `            // Sidebar infinite scroll from local cache + API
            let sideCount = 20;
            stream.addEventListener('scroll', async () => {
                if (stream.scrollTop + stream.clientHeight >= stream.scrollHeight - 150) {
                    if (sideCount < allArticles.length - 1) {
                        const batch = allArticles.slice(sideCount + 1, sideCount + 11);
                        batch.forEach(a => stream.insertAdjacentHTML('beforeend', sideCardHtml(a)));
                        sideCount += batch.length;
                    } else if (!isFetchingMore && streamHasMore) {
                        await fetchMorePages();
                        const batch = allArticles.slice(sideCount + 1, sideCount + 11);
                        batch.forEach(a => stream.insertAdjacentHTML('beforeend', sideCardHtml(a)));
                        sideCount += batch.length;
                    }
                }
            });`;

index = replaceNormalize(index, oldIndexScroll, newIndexScroll);
fs.writeFileSync('index.html', index);

// 2. Update article.html
let article = fs.readFileSync('article.html', 'utf8');

const oldArticleFetch = `        async function fetchSidebarStream() {
            const streamEl = document.getElementById('stream-container');
            if (!streamEl) return;
            const streamWrapper = document.getElementById('stream-wrapper');
            if (streamWrapper) streamWrapper.classList.remove('hidden');
            else streamEl.classList.remove('hidden');
            
            try {
                const response = await fetch('/api/articles?page=1');
                if (!response.ok) throw new Error('Failed to fetch stream');
                const articles = await response.json();`;

const newArticleFetch = `        let sidebarPage = 1;
        let sidebarHasMore = true;
        let isFetchingSidebar = false;

        async function fetchSidebarStream() {
            if (isFetchingSidebar || !sidebarHasMore) return;
            isFetchingSidebar = true;

            const streamEl = document.getElementById('stream-container');
            if (!streamEl) return;
            const streamWrapper = document.getElementById('stream-wrapper');
            if (streamWrapper) streamWrapper.classList.remove('hidden');
            else streamEl.classList.remove('hidden');
            
            try {
                const response = await fetch('/api/articles?page=' + sidebarPage);
                if (!response.ok) throw new Error('Failed to fetch stream');
                const articles = await response.json();
                
                if (!articles || articles.length === 0) {
                    sidebarHasMore = false;
                    return;
                }
                
                sidebarPage++;`;

const oldArticleAppend = `                streamEl.innerHTML = articles.map(a => {
                    const slug = slugify(a.title);
                    const catPath = getCategoryCleanName(a.category);
                    const url = \`/\${catPath}/\${slug}-id=\${a.id}\`;
                    return \`<a class="group cursor-pointer flex gap-3 items-start bg-surface-container/30 p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border border-outline-variant/10 text-left" href="\${url}">
                        <div class="w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden">
                            <img referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="\${a.image_url||DEFAULT_IMG}" alt="\${a.title}" loading="lazy" onerror="this.src='\${DEFAULT_IMG}'"/>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="font-label text-label text-primary uppercase text-xs tracking-wider">\${formatExactDate(a.created_at)}</span>
                            <h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors mt-1 line-clamp-2" style="font-size:14px;line-height:1.4">\${a.title}</h3>
                        </div>
                    </a>\`;
                }).join('');
            } catch (error) {
                console.error('Error fetching stream:', error);
                streamEl.innerHTML = '<p class="text-sm text-on-surface-variant p-4">Η ροή ειδήσεων δεν είναι διαθέσιμη.</p>';
            }
        }`;

const newArticleAppend = `                const htmlString = articles.map(a => {
                    const slug = slugify(a.title);
                    const catPath = getCategoryCleanName(a.category);
                    const url = \`/\${catPath}/\${slug}-id=\${a.id}\`;
                    return \`<a class="group cursor-pointer flex gap-3 items-start bg-surface-container/30 p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border border-outline-variant/10 text-left" href="\${url}">
                        <div class="w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden">
                            <img referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="\${a.image_url||DEFAULT_IMG}" alt="\${a.title}" loading="lazy" onerror="this.src='\${DEFAULT_IMG}'"/>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="font-label text-label text-primary uppercase text-xs tracking-wider">\${formatExactDate(a.created_at)}</span>
                            <h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors mt-1 line-clamp-2" style="font-size:14px;line-height:1.4">\${a.title}</h3>
                        </div>
                    </a>\`;
                }).join('');
                
                if (sidebarPage === 2) {
                    streamEl.innerHTML = htmlString;
                    streamEl.addEventListener('scroll', () => {
                        if (streamEl.scrollTop + streamEl.clientHeight >= streamEl.scrollHeight - 100) {
                            fetchSidebarStream();
                        }
                    });
                } else {
                    streamEl.insertAdjacentHTML('beforeend', htmlString);
                }
            } catch (error) {
                console.error('Error fetching stream:', error);
                if (sidebarPage === 2) streamEl.innerHTML = '<p class="text-sm text-on-surface-variant p-4">Η ροή ειδήσεων δεν είναι διαθέσιμη.</p>';
            } finally {
                isFetchingSidebar = false;
            }
        }`;

article = replaceNormalize(article, oldArticleFetch, newArticleFetch);
article = replaceNormalize(article, oldArticleAppend, newArticleAppend);
fs.writeFileSync('article.html', article);
console.log('Injected properly with normalized lines');
