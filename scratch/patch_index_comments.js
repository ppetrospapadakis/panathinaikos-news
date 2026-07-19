const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const targetLF = `        async function fetchCommentCounts() {
            const badgeElements = document.querySelectorAll('[id^="comments-badge-"]');
            const articleIds = Array.from(badgeElements).map(el => el.id.replace('comments-badge-', ''));
            if (articleIds.length === 0) return;
            try {
                const res = await fetch(\`/api/comments?action=batch_counts&article_ids=\${articleIds.join(',')}\`);
                if (res.ok) {
                    const counts = await res.json();
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
        }
        window.fetchCommentCounts = fetchCommentCounts;

        window.addEventListener('DOMContentLoaded', () => {
            initPageFilter();
        });

        window.addEventListener('load', () => {
            // Defer completely to unblock PageSpeed critical request chains
            setTimeout(fetchCommentCounts, 2000);
        });`;

const targetCRLF = targetLF.replace(/\n/g, '\r\n');

const replacement = `        let initialLoadDone = false;
        async function fetchCommentCounts() {
            if (!initialLoadDone) return;
            const badgeElements = document.querySelectorAll('[id^="comments-badge-"]');
            const articleIds = Array.from(badgeElements).map(el => el.id.replace('comments-badge-', ''));
            if (articleIds.length === 0) return;
            try {
                const res = await fetch(\`/api/comments?action=batch_counts&article_ids=\${articleIds.join(',')}\`);
                if (res.ok) {
                    const counts = await res.json();
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
        }
        window.fetchCommentCounts = fetchCommentCounts;

        window.addEventListener('DOMContentLoaded', () => {
            initPageFilter();
        });

        window.addEventListener('load', () => {
            // Defer completely to unblock PageSpeed critical request chains
            setTimeout(() => {
                initialLoadDone = true;
                fetchCommentCounts();
            }, 2500);
        });`;

if (content.includes(targetCRLF)) {
    content = content.replace(targetCRLF, replacement.replace(/\n/g, '\r\n'));
    fs.writeFileSync('index.html', content, 'utf8');
    console.log('Successfully updated index.html (CRLF)!');
} else if (content.includes(targetLF)) {
    content = content.replace(targetLF, replacement);
    fs.writeFileSync('index.html', content, 'utf8');
    console.log('Successfully updated index.html (LF)!');
} else {
    console.log('Target not found in index.html!');
}
