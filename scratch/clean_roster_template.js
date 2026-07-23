const fs = require('fs');
const path = require('path');

const rosterPath = path.join(__dirname, '..', 'roster.html');
let content = fs.readFileSync(rosterPath, 'utf8');

const funcStart = content.indexOf('async function fetchMoreRosterNews() {');
const funcEnd = content.indexOf('function initMoreNewsScroll() {', funcStart);

const cleanFunc = `async function fetchMoreRosterNews() {
            if (isFetchingMore || !streamHasMore) return;
            isFetchingMore = true;
            const sentinel = document.getElementById('roster-sentinel');
            try {
                const res = await fetch(\`/api/articles?page=\${streamPage}\`);
                const data = await res.json();
                const articles = Array.isArray(data) ? data : (data.articles || []);
                if (articles && articles.length > 0) {
                    const section = document.getElementById('more-news-section');
                    const grid = document.getElementById('more-news-grid');
                    const html = articles.map(a => {
                        const date = formatExactDate(a.created_at);
                        const catClean = getCategoryCleanName(a.category);
                        const slug = slugify(a.title);
                        const url = \`/\${catClean}/\${slug}-id=\${a.id}\`;
                        const img = a.image_url || '/logo.png';
                        return \`
                        <a class="group cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container/30 flex flex-col overflow-hidden card-hover h-full" href="\${url}">
                            <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">
                                <img referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="\${img}" alt="\${a.title}" loading="lazy" onerror="this.src='/logo.png'"/>
                            </div>
                            <div class="p-5 flex flex-col flex-1">
                                <span class="font-label text-label text-primary uppercase mb-1 text-xs font-semibold">\${date}</span>
                                <h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors text-sm sm:text-base font-bold line-clamp-2">\${a.title}</h3>
                            </div>
                        </a>\`;
                    }).join('');
                    grid.insertAdjacentHTML('beforeend', html);
                    section.classList.remove('hidden');
                    streamPage++;
                }
                if (!articles || articles.length < 10) {
                    streamHasMore = false;
                    if (sentinel) sentinel.style.display = 'none';
                }
            } catch (err) {
                console.error('Error fetching more news:', err);
            } finally {
                isFetchingMore = false;
            }
        }\n\n        `;

content = content.substring(0, funcStart) + cleanFunc + content.substring(funcEnd);

fs.writeFileSync(rosterPath, content, 'utf8');
console.log('✅ Cleaned up fetchMoreRosterNews function in roster.html.');
