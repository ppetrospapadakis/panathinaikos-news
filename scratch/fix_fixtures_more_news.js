const fs = require('fs');
const path = require('path');

const fixturesPath = path.join(__dirname, '..', 'fixtures.html');
let content = fs.readFileSync(fixturesPath, 'utf8');

// 1. Add slugify & getCategoryCleanName helpers if not present
const helpersCode = `
        function slugify(text) {
            if (!text) return "arthro";
            try {
                return (text || "").toString().toLowerCase()
                    .trim()
                    .replace(/\\s+/g, '-')
                    .replace(/[^\\w\\u0370-\\u03FF\\u1F00-\\u1FFF-]+/g, '')
                    .replace(/--+/g, '-')
                    .replace(/^-+/, '')
                    .replace(/-+$/, '') || "arthro";
            } catch(e) {
                return "arthro";
            }
        }

        function getCategoryCleanName(category) {
            const cat = (category || '').toLowerCase();
            if (cat.includes('ποδόσφαιρο') || cat.includes('football')) return 'podosfairo';
            if (cat.includes('μπάσκετ') || cat.includes('basketball')) return 'basket';
            if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) return 'erasitexnis';
            if (cat.includes('άποψη') || cat.includes('opinion')) return 'apopsi';
            return 'pao';
        }
`;

if (!content.includes('function getCategoryCleanName')) {
    content = content.replace('// More News Grid Infinite Loader', `${helpersCode}\n        // More News Grid Infinite Loader`);
}

// 2. Fix fetchMoreNews in fixtures.html (check articles.length < 10 instead of < 20, and construct clean SEO url)
const oldFetchMoreNewsRegex = /async function fetchMoreNews\(\) \{[\s\S]*?^\s*\}/m;
const newFetchMoreNews = `async function fetchMoreNews() {
            if (isFetchingMore || !streamHasMore) return;
            isFetchingMore = true;

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
                    const sentinel = document.getElementById('fixtures-sentinel');
                    if (sentinel) sentinel.style.display = 'none';
                }
            } catch (err) {
                console.error('Error fetching more news:', err);
            } finally {
                isFetchingMore = false;
            }
        }`;

content = content.replace(oldFetchMoreNewsRegex, newFetchMoreNews);

fs.writeFileSync(fixturesPath, content, 'utf8');
console.log('✅ Updated fixtures.html fetchMoreNews infinite scroll & SEO article links.');
