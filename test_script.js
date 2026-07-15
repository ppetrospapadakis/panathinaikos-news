
    (function() {
        function toggleDrawer() {
            const drawer = document.getElementById('nav-drawer');
            const overlay = document.getElementById('drawer-overlay');
            drawer.classList.toggle('-translate-x-full');
            overlay.classList.toggle('opacity-0');
            overlay.classList.toggle('pointer-events-none');
        }
        window.toggleDrawer = toggleDrawer;

        function extractDomain(url) {
            try { return new URL(url).hostname.replace('www.','').split('.')[0]; }
            catch(e) { return 'News'; }
        }

        // ─── Clean & Sanitize HTML from scraper ───
        function sanitizeArticleHTML(rawHtml) {
            if (!rawHtml || !rawHtml.trim()) return null;

            const tmp = document.createElement('div');
            tmp.innerHTML = rawHtml;

            // Style all images: responsive, rounded, remove inline dimensions
            tmp.querySelectorAll('img').forEach(img => {
                img.removeAttribute('width');
                img.removeAttribute('height');
                img.removeAttribute('srcset');
                img.removeAttribute('sizes');
                img.removeAttribute('class');
                img.removeAttribute('fetchpriority');
                img.removeAttribute('decoding');
                img.style.cssText = '';
                img.classList.add('w-full','h-auto','rounded-xl','my-6','block');
                img.setAttribute('loading','lazy');
                // Remove google/tracking pixels (tiny images < meaningful size)
                const src = img.getAttribute('src') || '';
                if (src.includes('pixel') || src.includes('track') || src.includes('1x1')) {
                    img.remove();
                }
            });

            // Remove script, style, iframe, form elements
            tmp.querySelectorAll('script,style,iframe,form,button,input').forEach(el => el.remove());

            // Style all links
            tmp.querySelectorAll('a').forEach(a => {
                a.setAttribute('target','_blank');
                a.setAttribute('rel','noopener noreferrer');
                a.style.color = '#84d999';
                a.style.textDecoration = 'underline';
            });

            // Remove empty paragraphs and comment nodes
            tmp.querySelectorAll('p').forEach(p => {
                if (!p.textContent.trim() && !p.querySelector('img')) p.remove();
            });

            // Strip WordPress-specific junk class names, keep structure
            tmp.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
            tmp.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
            tmp.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

            const result = tmp.innerHTML.trim();
            // Sanity check: if result still looks like raw escaped markup, strip all tags
            if (result.includes('&lt;') || result.includes('&gt;')) {
                return tmp.textContent.trim();
            }
            return result || null;
        }

        // ─── Convert plain text to paragraphs ───
        function textToParagraphs(text) {
            if (!text || !text.trim()) return '';
            const lines = text.trim().split(/\n+/);
            return lines
                .map(l => l.trim())
                .filter(l => l.length > 0)
                .map(l => `<p>${l}</p>`)
                .join('');
        }

        // ─── Main loader ───
        async function loadArticle() {
            const params = new URLSearchParams(window.location.search);
            let articleId = params.get('id');
            if (!articleId) {
                const match = window.location.pathname.match(/-id=([a-zA-Z0-9-]+)/);
                if (match) articleId = match[1];
            }
            currentArticleId = articleId;

            if (window.__PRE_RENDERED__) {
                // Highlight active category tab
                const tabMap = {
                    'ΠΟΔΟΣΦΑΙΡΟ': 'tab-football',
                    'ΜΠΑΣΚΕΤ': 'tab-basketball',
                    'ΕΡΑΣΙΤΕΧΝΗΣ': 'tab-amateur',
                    'ΑΠΟΨΗ': 'tab-opinion',
                    'ΜΕΤΑΓΡΑΦΕΣ': 'tab-transfers'
                };
                const catEl = document.getElementById('article-category');
                const cat = catEl ? catEl.textContent : '';
                currentArticleCategory = cat;
                Object.keys(tabMap).forEach(key => {
                    if (cat.includes(key)) {
                        const el = document.getElementById(tabMap[key]);
                        if (el) {
                            el.className = 'px-5 py-2 rounded-full font-label text-label uppercase tracking-wider bg-primary text-on-primary transition-all whitespace-nowrap lg:flex-1 text-center';
                        }
                    }
                });
                fetchSidebarStream();
                return;
            }

            const params = new URLSearchParams(window.location.search);
            let articleId = params.get('id');

            if (!articleId) {
                // Fallback: extract from path, e.g. /podosfairo/slug-id=123
                const match = window.location.pathname.match(/-id=([^/&?]+)/);
                if (match) {
                    articleId = match[1];
                }
            }

            if (!articleId) {
                showError('Δεν βρέθηκε ID άρθρου στη διεύθυνση URL.');
                return;
            }

            try {
                const response = await fetch(`/api/articles?id=${articleId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Το άρθρο δεν βρέθηκε στη βάση δεδομένων.');
                    }
                    throw new Error('Αποτυχία φόρτωσης άρθρου.');
                }
                const article = await response.json();
                if (!article) throw new Error('Το άρθρο δεν βρέθηκε στη βάση δεδομένων.');

                renderArticle(article);

            } catch(err) {
                console.error('Article load error:', err);
                showError(err.message);
            }
        }

        function renderArticle(article) {
            // Page title
            document.title = `${article.title} | Panathinaikos News`;

            function formatExactDate(dateString) {
                if (!dateString) return '';
                const pubDate = new Date(dateString);
                const day = String(pubDate.getDate()).padStart(2, '0');
                const month = String(pubDate.getMonth() + 1).padStart(2, '0');
                const year = pubDate.getFullYear();
                const hours = String(pubDate.getHours()).padStart(2, '0');
                const minutes = String(pubDate.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} - ${hours}:${minutes}`;
            }

            document.getElementById('article-date').textContent = formatExactDate(article.created_at);
            document.getElementById('article-category').textContent = article.category || 'Ποδόσφαιρο';

            const isOfficialMain= (article.source_url||'').toLowerCase().includes('pao.gr') || (article.source_url||'').toLowerCase().includes('pao1908.com') || (article.source_url||'').toLowerCase().includes('paobc.gr');
            const offEl = document.getElementById('article-official-badge');
            if (offEl) {
                offEl.innerHTML = isOfficialMain ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider gap-0.5"><span class="material-symbols-outlined text-[12px]">verified</span>Official</span>` : '';
            }

            // Title
            document.getElementById('article-title').textContent = article.title;

            // ② Hero Image
            const DEFAULT_STADIUM_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
            let imageUrl = article.image_url || DEFAULT_STADIUM_IMG;

            if (article.image_url) {
                document.getElementById('article-image').src = imageUrl;
                document.getElementById('article-image').alt = article.title;
                document.getElementById('article-image-box').classList.remove('hidden');
            }

            // ③ Bullets — shown directly below image
            const bulletsBox = document.getElementById('article-bullets-box');
            const bulletsList = document.getElementById('article-bullets-list');
            
            let parsedBullets = [];
            if (article.bullets) {
                if (Array.isArray(article.bullets)) {
                    parsedBullets = article.bullets;
                } else if (typeof article.bullets === 'string') {
                    try { parsedBullets = JSON.parse(article.bullets); } catch(e) {}
                }
            }

            if (parsedBullets && parsedBullets.length > 0) {
                bulletsList.innerHTML = parsedBullets
                    .map(b => `<li class="flex items-start gap-3">
                        <span class="text-primary font-bold mt-1 shrink-0">→</span>
                        <span>${b}</span>
                    </li>`)
                    .join('');
                bulletsBox.classList.remove('hidden');
            } else if (article.summary) {
                bulletsList.innerHTML = `<li class="flex items-start gap-3">
                    <span class="text-primary font-bold mt-1 shrink-0">→</span>
                    <span>${article.summary}</span>
                </li>`;
                bulletsBox.classList.remove('hidden');
            }

            // ④ Article Body — strip ALL img tags (hero image already shown), strip attribution phrases
            const body = document.getElementById('article-body');
            const rawContent = article.content || '';
            const rawSummary = article.summary || '';

            function cleanBodyText(text) {
                if (!text || !text.trim()) return '';
                // Strip source attribution phrases (belt-and-suspenders, in case AI missed it)
                return text
                    .replace(/Πηγ[ήές]:.*$/im, '')
                    .replace(/Διαβάστε.*στο.*$/im, '')
                    .replace(/\bσύμφωνα με\s+\S+/gi, '')
                    .replace(/\b(gazzetta|sport24|sdna|sportal|sport-fm|athletiko)\b[\s.,·]*/gi, '')
                    .replace(/\bτο (site|portal|μέσο|ρεπορτάζ)\s+\S+/gi, '')
                    .replace(/[ \t]+/g, ' ')
                    .trim();
            }

            let bodyHtml = '';

            if (rawContent && rawContent.trim().length > 80) {
                const looksLikeHtml = /<[a-z][\s\S]*>/i.test(rawContent);
                if (looksLikeHtml) {
                    const sanitized = sanitizeArticleHTML(rawContent);
                    // Strip img tags from body — the hero slot handles the primary image
                    const tmp = document.createElement('div');
                    tmp.innerHTML = sanitized || '';
                    tmp.querySelectorAll('img').forEach(el => el.remove());
                    bodyHtml = cleanBodyText(tmp.innerHTML);
                } else {
                    bodyHtml = textToParagraphs(cleanBodyText(rawContent));
                }
            }

            if ((!bodyHtml || bodyHtml.length < 200) && rawSummary && rawSummary.trim().length > 80) {
                const looksLikeHtml = /<[a-z][\s\S]*>/i.test(rawSummary);
                let summaryHtml;
                if (looksLikeHtml) {
                    const sanitized = sanitizeArticleHTML(rawSummary);
                    const tmp = document.createElement('div');
                    tmp.innerHTML = sanitized || '';
                    tmp.querySelectorAll('img').forEach(el => el.remove());
                    summaryHtml = cleanBodyText(tmp.innerHTML);
                } else {
                    summaryHtml = textToParagraphs(cleanBodyText(rawSummary));
                }
                bodyHtml = summaryHtml;
            }

            body.innerHTML = (bodyHtml && bodyHtml.trim())
                ? bodyHtml
                : '<p class="italic text-on-surface-variant/60">Δεν υπάρχει διαθέσιμο εκτενές κείμενο. Διαβάστε το πλήρες ρεπορτάζ στην πηγή.</p>';

            // Show article, hide skeleton
            document.getElementById('article-skeleton').style.display = 'none';
            document.getElementById('article-display').classList.remove('hidden');
            
            // Fetch sidebar and bottom grid using the article's category
            currentArticleCategory = article.category;
            currentArticleId = article.id;
            fetchSidebarStream();

            // Highlight active category tab
            const tabMap = {
                'Ποδόσφαιρο': 'tab-football',
                'Μπάσκετ': 'tab-basketball',
                'Ερασιτέχνης': 'tab-amateur',
                'Άποψη': 'tab-opinion',
                'Μεταγραφές': 'tab-transfers'
            };
            const cat = article.category || '';
            Object.keys(tabMap).forEach(key => {
                if (cat.includes(key)) {
                    const el = document.getElementById(tabMap[key]);
                    if (el) {
                        el.className = 'px-5 py-2 rounded-full font-label text-label uppercase tracking-wider bg-primary text-on-primary transition-all whitespace-nowrap lg:flex-1 text-center';
                    }
                }
            });
        }

        let sidebarPage = 1;
        let sidebarHasMore = true;
        let isFetchingSidebar = false;
        let currentArticleCategory = null;
        let currentArticleId = null;
        let sentinelObserver = null;

        async function fetchSidebarStream() {
            if (isFetchingSidebar || !sidebarHasMore) return;
            isFetchingSidebar = true;

            const streamEl = document.getElementById('stream-container');
            if (!streamEl) return;
            const streamWrapper = document.getElementById('stream-wrapper');
            if (streamWrapper) streamWrapper.classList.remove('hidden');
            else streamEl.classList.remove('hidden');
            
            try {
                let url = '/api/articles?page=' + sidebarPage;
                if (currentArticleCategory) {
                    const catForApi = getCategoryCleanName(currentArticleCategory);
                    url += `&category=${catForApi}`;
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch stream');
                let articles = await response.json();
                
                if (currentArticleId) {
                    articles = articles.filter(a => String(a.id) !== String(currentArticleId));
                }
                
                if (!articles || articles.length === 0) {
                    sidebarHasMore = false;
                    return;
                }
                
                sidebarPage++;
                
                const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
                
                function formatExactDate(dateString) {
                    if (!dateString) return '';
                    const d = new Date(dateString);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    return `${day}/${month}/${year} - ${hours}:${minutes}`;
                }
                
                function slugify(text) {
                    return text.toString().toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w\u0370-\u03FF\u1F00-\u1FFF-]+/g, '')
                        .replace(/--+/g, '-')
                        .replace(/^-+/, '')
                        .replace(/-+$/, '');
                }
                
                function getCategoryCleanName(cat) {
                    if (!cat) return 'podosfairo';
                    if (cat.includes('Ποδόσφαιρο')) return 'podosfairo';
                    if (cat.includes('Μπάσκετ')) return 'basket';
                    if (cat.includes('Ερασιτέχνης')) return 'erasitechnis';
                    if (cat.includes('Άποψη')) return 'apopsi';
                    if (cat.includes('Μεταγραφές')) return 'metagrafes';
                    return 'podosfairo';
                }

                const htmlString = articles.map(a => {
                    const slug = slugify(a.title);
                    const catPath = getCategoryCleanName(a.category);
                    const url = `/${catPath}/${slug}-id=${a.id}`;
                    const isOwn = (a.source_url||'').toLowerCase().includes('manual') || (a.source_url||'').toLowerCase().includes('opinion');
                    const isOfficial= (a.source_url||'').toLowerCase().includes('pao.gr') || (a.source_url||'').toLowerCase().includes('pao1908.com') || (a.source_url||'').toLowerCase().includes('paobc.gr');
                    const officialBadge = isOfficial ? `<span class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider gap-0.5"><span class="material-symbols-outlined text-[11px]">verified</span>Official</span>` : '';
                    const imgBoxClass = isOwn ? 'w-[128px] h-[72px]' : 'w-[72px] h-[72px]';
                    const imageFit = isOwn ? 'object-contain bg-surface-container/50' : 'object-cover';
                    return `<a class="group cursor-pointer flex gap-3 items-start bg-surface-container/30 p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border border-outline-variant/10 text-left" href="${url}">
                        <div class="${imgBoxClass} flex-shrink-0 rounded-lg overflow-hidden">
                            <img referrerpolicy="no-referrer" class="w-full h-full ${imageFit} group-hover:scale-110 transition-transform duration-500" src="${a.image_url||DEFAULT_IMG}" alt="${a.title}" loading="lazy" onerror="this.src='${DEFAULT_IMG}'"/>
                        </div>
                        <div class="flex-1 min-w-0">
                            <span class="font-label text-label text-primary uppercase text-xs tracking-wider flex flex-wrap items-center gap-y-1">${formatExactDate(a.created_at)} ${officialBadge}</span>
                            <h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors mt-1 line-clamp-2" style="font-size:14px;line-height:1.4">${a.title}</h3>
                        </div>
                    </a>`;
                }).join('');

                const gridCardsHtml = articles.map(a => {
                    const slug = slugify(a.title);
                    const catPath = getCategoryCleanName(a.category);
                    const url = `/${catPath}/${slug}-id=${a.id}`;
                    const isOwn = (a.source_url||'').toLowerCase().includes('manual') || (a.source_url||'').toLowerCase().includes('opinion');
                    const isOfficial= (a.source_url||'').toLowerCase().includes('pao.gr') || (a.source_url||'').toLowerCase().includes('pao1908.com') || (a.source_url||'').toLowerCase().includes('paobc.gr');
                    const officialBadge = isOfficial ? `<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider gap-0.5"><span class="material-symbols-outlined text-[11px]">verified</span>Official</span>` : '';
                    const border = isOwn ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/20';
                    const imageFit = isOwn ? 'object-contain bg-surface-container/50' : 'object-cover';
                    return `<a class="group cursor-pointer rounded-xl border flex flex-col overflow-hidden card-hover ${border} h-full" href="${url}">
                        <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">
                            <img referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full ${imageFit} group-hover:scale-105 transition-transform duration-500" src="${a.image_url||DEFAULT_IMG}" alt="${a.title}" loading="lazy" onerror="this.src='${DEFAULT_IMG}'"/>
                        </div>
                        <div class="p-6 flex flex-col flex-1 bg-surface-container">
                            <span class="font-label text-label text-primary uppercase mb-2 flex flex-wrap items-center gap-y-1">${formatExactDate(a.created_at)} ${officialBadge}</span>
                            <h3 class="font-h3 text-h3 group-hover:text-primary transition-colors leading-tight line-clamp-3">${a.title}</h3>
                        </div>
                    </a>`;
                }).join('');

                const moreNewsSection = document.getElementById('more-news-section');
                let gridContainer = document.getElementById('bottom-grid-cards');

                if (sidebarPage === 2) { // because we incremented it already
                    streamEl.innerHTML = htmlString;
                    streamEl.addEventListener('scroll', () => {
                        if (streamEl.scrollTop + streamEl.clientHeight >= streamEl.scrollHeight - 100) {
                            fetchSidebarStream();
                        }
                    });

                    // Setup More News grid
                    if (moreNewsSection) {
                        moreNewsSection.innerHTML = `<div class="mt-12 pt-8 border-t border-outline-variant/30">
                            <h2 class="font-h2 text-h2 mb-6">Περισσότερες Ειδήσεις</h2>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="bottom-grid-cards"></div>`;
                        gridContainer = document.getElementById('bottom-grid-cards');
                    }
                } else {
                    streamEl.insertAdjacentHTML('beforeend', htmlString);
                }

                if (gridContainer) {
                    gridContainer.insertAdjacentHTML('beforeend', gridCardsHtml);
                }

                // Set up sentinel observer
                const sentinel = document.getElementById('feed-sentinel');
                if (sentinel && sidebarHasMore) {
                    sentinel.classList.remove('hidden');
                    if (!sentinelObserver) {
                        sentinelObserver = new IntersectionObserver(async entries => {
                            if (entries[0].isIntersecting && !isFetchingSidebar && sidebarHasMore) {
                                await fetchSidebarStream();
                            }
                        }, { rootMargin: '300px' });
                        sentinelObserver.observe(sentinel);
                    }
                } else if (sentinel) {
                    sentinel.classList.add('hidden');
                }

            } catch (err) {
                if (sidebarPage === 2) streamEl.innerHTML = `<p class="text-sm text-on-surface-variant p-4">Αποτυχία φόρτωσης ροής ειδήσεων.</p>`;
            } finally {
                isFetchingSidebar = false;
            }
        }

        function showError(msg) {
            document.getElementById('article-skeleton').style.display = 'none';
            document.getElementById('article-error-msg').textContent = msg;
            document.getElementById('article-error').classList.remove('hidden');
        }

        window.addEventListener('DOMContentLoaded', loadArticle);
    })();
    