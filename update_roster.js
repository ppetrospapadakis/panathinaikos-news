const fs = require('fs');
let r = fs.readFileSync('roster.html', 'utf8');

// 1. Remove search button
r = r.replace(/<button class="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity" onclick="window\.location\.href='[^']*'" aria-label="Search">[\s\S]*?<\/button>/, '<div class="w-6 h-6"></div>');

// 2. Remove smooth scrolling from roster.html tabs
r = r.replace(/container\.scrollTo\(\{ left: scrollLeft, behavior: 'smooth' \}\);/, 'container.scrollTo({ left: scrollLeft });');

// 3. Infinite scrolling (using unicode escapes for Greek to prevent any encoding issues)
const oldMoreRegex = /\/\/ Fetch latest news[\s\S]*?\}\s*\}/;

const newMoreNews = `                // Fetch latest news
                let streamPage = 1;
                let streamHasMore = true;
                let isFetchingMore = false;

                async function fetchMoreRosterNews() {
                    if (isFetchingMore || !streamHasMore) return;
                    isFetchingMore = true;
                    try {
                        const res = await fetch(\`/api/articles?page=\${streamPage}\`);
                        const data = await res.json();
                        if (data.articles && data.articles.length > 0) {
                            const grid = document.getElementById('more-news-grid');
                            const html = data.articles.map(a => {
                                const date = new Date(a.created_at).toLocaleDateString('el-GR', {day:'2-digit', month:'2-digit', year:'numeric'});
                                const slug = (a.title || '').toLowerCase().replace(/[^a-z0-9\\u0370-\\u03ff]+/g, '-').replace(/(^-|-$)/g, '');
                                let cat = 'podosfairo';
                                if (a.category === '\\u039C\\u03C0\\u03AC\\u03C3\\u03BA\\u03B5\\u03C4') cat = 'basket'; // Μπάσκετ
                                if (a.category === '\\u0395\\u03C1\\u03B1\\u03C3\\u03B9\\u03C4\\u03AD\\u03C7\\u03BD\\u03B7\\u03C2') cat = 'erasitexnis'; // Ερασιτέχνης
                                const url = \`/\${cat}/\${slug}-id=\${a.id}\`;
                                const img = a.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
                                return \`
                                <a class="group cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container/30 flex flex-col overflow-hidden card-hover h-full" href="\${url}">
                                    <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">
                                        <img referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="\${img}" alt="\${a.title}" loading="lazy" onerror="this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY'"/>
                                    </div>
                                    <div class="p-5 flex flex-col flex-1">
                                        <span class="font-label text-label text-primary uppercase mb-1">\${date}</span>
                                        <h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors">\${a.title}</h3>
                                    </div>
                                </a>\`;
                            }).join('');
                            grid.insertAdjacentHTML('beforeend', html);
                            document.getElementById('more-news-section').classList.remove('hidden');
                            streamPage++;
                        }
                        if (!data.has_more) {
                            streamHasMore = false;
                            const sentinel = document.getElementById('roster-sentinel');
                            if (sentinel) sentinel.style.display = 'none';
                        }
                    } catch (err) {
                        console.error('Error fetching more news:', err);
                    } finally {
                        isFetchingMore = false;
                    }
                }

                await fetchMoreRosterNews();
                const sentinelHTML = \`<div id="roster-sentinel" class="py-12 flex justify-center hidden"><div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>\`;
                document.getElementById('more-news-section').insertAdjacentHTML('afterend', sentinelHTML);

                const sentinel = document.getElementById('roster-sentinel');
                if (sentinel && streamHasMore) {
                    sentinel.classList.remove('hidden');
                    const observer = new IntersectionObserver(async entries => {
                        if (entries[0].isIntersecting && !isFetchingMore && streamHasMore) {
                            await fetchMoreRosterNews();
                        }
                    }, { rootMargin: '200px' });
                    observer.observe(sentinel);
                }`;

r = r.replace(oldMoreRegex, newMoreNews);
fs.writeFileSync('roster.html', r);

let idx = fs.readFileSync('index.html', 'utf8');
idx = idx.replace(/container\.scrollTo\(\{ left: scrollLeft, behavior: 'smooth' \}\);/, 'container.scrollTo({ left: scrollLeft });');
fs.writeFileSync('index.html', idx);
