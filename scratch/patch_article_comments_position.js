const fs = require('fs');
let html = fs.readFileSync('article.html', 'utf8');

// 1. Remove the header comments button which broke the layout / alignment
html = html.replace(`
            <!-- Header Anchor for Comments -->
            <button onclick="scrollToComments()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/30 text-on-surface-variant/80 hover:text-primary transition-all text-xs font-bold" title="Σχόλια">
                <span class="material-symbols-outlined text-[16px]">forum</span>
                <span id="header-comments-count" class="hidden">0</span>
            </button>`, '');

// Ensure default header has a dummy/spacer if required to match homepage alignment
html = html.replace('<div class="w-6 h-6"></div>', '<div class="w-6 h-6"></div>');

// 2. Put comment badge placeholder next to date / official badge
html = html.replace(
    `<span id="article-official-badge"></span>`,
    `<span id="article-official-badge"></span>
                        <!-- Comments Badge in Article Header next to date -->
                        <button onclick="scrollToComments()" id="header-comments-badge" class="hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant/80 hover:text-primary transition-all text-xs font-bold normal-case select-none">
                            <span class="material-symbols-outlined text-[14px]">forum</span>
                            <span id="header-comments-count">0</span>
                        </button>`
);

// 3. Update the comments counts fetching block to update this new header button
const oldFetchCommentCounts = `        async function fetchCommentCounts() {
            const badgeElements = document.querySelectorAll('[id^="comments-badge-"]');
            const articleIds = Array.from(badgeElements).map(el => el.id.replace('comments-badge-', ''));
            if (currentArticleId && !articleIds.includes(currentArticleId)) {
                articleIds.push(currentArticleId);
            }
            if (articleIds.length === 0) return;
            try {
                const res = await fetch(\`/api/comments?action=batch_counts&article_ids=\${articleIds.join(',')}\`);
                if (res.ok) {
                    const counts = await res.json();
                    
                    if (currentArticleId && counts[currentArticleId] > 0) {
                        const hCount = document.getElementById('header-comments-count');
                        if (hCount) {
                            hCount.textContent = counts[currentArticleId];
                            hCount.classList.remove('hidden');
                        }
                    }

                    Object.keys(counts).forEach(artId => {
                        const badge = document.getElementById('comments-badge-' + artId);
                        if (badge && counts[artId] > 0) {
                            badge.innerHTML = \`<span class="material-symbols-outlined text-[12px] text-primary/70">forum</span>\${counts[artId]}\`;
                        }
                    });
                }
            } catch(e) {
                console.error('[Comments count error]', e);
            }
        }`;

const newFetchCommentCounts = `        async function fetchCommentCounts() {
            const badgeElements = document.querySelectorAll('[id^="comments-badge-"]');
            const articleIds = Array.from(badgeElements).map(el => el.id.replace('comments-badge-', ''));
            if (currentArticleId && !articleIds.includes(currentArticleId)) {
                articleIds.push(currentArticleId);
            }
            if (articleIds.length === 0) return;
            try {
                const res = await fetch(\`/api/comments?action=batch_counts&article_ids=\${articleIds.join(',')}\`);
                if (res.ok) {
                    const counts = await res.json();
                    
                    if (currentArticleId && counts[currentArticleId] > 0) {
                        const hCount = document.getElementById('header-comments-count');
                        const hBadge = document.getElementById('header-comments-badge');
                        if (hCount && hBadge) {
                            hCount.textContent = counts[currentArticleId];
                            hBadge.classList.remove('hidden');
                            hBadge.classList.add('inline-flex');
                        }
                    } else {
                        const hBadge = document.getElementById('header-comments-badge');
                        if (hBadge) {
                            hBadge.classList.add('hidden');
                            hBadge.classList.remove('inline-flex');
                        }
                    }

                    Object.keys(counts).forEach(artId => {
                        const badge = document.getElementById('comments-badge-' + artId);
                        if (badge && counts[artId] > 0) {
                            badge.innerHTML = \`<span class="material-symbols-outlined text-[12px] text-primary/70">forum</span>\${counts[artId]}\`;
                        }
                    });
                }
            } catch(e) {
                console.error('[Comments count error]', e);
            }
        }`;

html = html.replace(oldFetchCommentCounts, newFetchCommentCounts).replace(oldFetchCommentCounts.replace(/\n/g, '\r\n'), newFetchCommentCounts.replace(/\n/g, '\r\n'));

fs.writeFileSync('article.html', html, 'utf8');
console.log('Comments badge successfully moved from top header to date-line area!');
