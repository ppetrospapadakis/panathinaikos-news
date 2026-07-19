const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add admin helper & togglePin logic
const scriptEnd = `            if (new URLSearchParams(window.location.search).get('search') === 'open') {
                setTimeout(() => toggleSearch(), 300);
            }
        }`;

const scriptEndPatch = `            if (new URLSearchParams(window.location.search).get('search') === 'open') {
                setTimeout(() => toggleSearch(), 300);
            }
        }

        // Admin Inline Pinning Function (destined for homepage sidebar)
        async function togglePin(articleId, isPinned, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            const SUPABASE_URL = "https://rctltbuiitdnqlxizlym.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";
            
            if (typeof supabase === 'undefined') {
                await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
            }
            
            const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            try {
                if (isPinned) {
                    const { error } = await db.from('articles').update({ pinned_at: null }).eq('id', articleId);
                    if (error) throw error;
                } else {
                    // Enforce single pin
                    await db.from('articles').update({ pinned_at: null }).not('pinned_at', 'is', null);
                    const { error } = await db.from('articles').update({ pinned_at: new Date().toISOString() }).eq('id', articleId);
                    if (error) throw error;
                }
                window.location.reload();
            } catch (err) {
                alert('Σφάλμα: ' + err.message);
            }
        }
        window.togglePin = togglePin;`;

html = html.replace(scriptEnd, scriptEndPatch).replace(scriptEnd.replace(/\n/g, '\r\n'), scriptEndPatch.replace(/\n/g, '\r\n'));

// 2. Add isAdmin and pinButtonHtml rendering helpers
const helperAnchor = `        // ── Render helpers ─────────────────────────────────────────────────────`;
const helperAnchorPatch = `        // Helper to check if user is admin
        function isAdmin() {
            return sessionStorage.getItem('op_auth') === '1';
        }

        // Render Pin Button for stream card
        function pinButtonHtml(articleId, pinnedAt) {
            if (!isAdmin()) return '';
            const pinAgeMs = pinnedAt ? Date.now() - new Date(pinnedAt).getTime() : Infinity;
            const isPinned = pinAgeMs < 3 * 60 * 60 * 1000;
            const color = isPinned ? 'text-primary bg-primary/20' : 'text-on-surface/40 hover:text-primary hover:bg-primary/20 bg-background/80';
            const icon = isPinned ? 'keep_off' : 'keep';
            return \`
            <button onclick="window.togglePin('\${articleId}', \${isPinned}, event)" class="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30 backdrop-blur transition-all active:scale-90 \${color}" title="\${isPinned ? 'Unpin' : 'Pin'}" style="pointer-events: auto;">
                <span class="material-symbols-outlined" style="font-size:16px">\${icon}</span>
            </button>\`;
        }

        // ── Render helpers ─────────────────────────────────────────────────────`;

html = html.replace(helperAnchor, helperAnchorPatch).replace(helperAnchor.replace(/\n/g, '\r\n'), helperAnchorPatch.replace(/\n/g, '\r\n'));

// 3. Update sideCardHtml to include pinButtonHtml
html = html.replace(
    `return \`<a class="group cursor-pointer flex gap-3 items-start bg-surface-container/30 p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border border-outline-variant/10 text-left" href="\${url}">`,
    `const pinAgeMs = a.pinned_at ? Date.now() - new Date(a.pinned_at).getTime() : Infinity;
            const isPinned = pinAgeMs < 3 * 60 * 60 * 1000;
            const borderClass = isPinned ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/10 bg-surface-container/30';
            const pinPrefix = isPinned ? '📌 ' : '';
            return \`<a class="relative group cursor-pointer flex gap-3 items-start p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border \${borderClass} text-left" href="\${url}">\${pinButtonHtml(a.id, a.pinned_at)}`
);

// 4. Update the inner rendering selectors of sideCardHtml to show pinPrefix
html = html.replace(
    `<h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors mt-1 line-clamp-2" style="font-size:14px;line-height:1.4">\${a.title}</h3>`,
    `<h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors mt-1 line-clamp-2" style="font-size:14px;line-height:1.4">\${pinPrefix}\${a.title}</h3>`
);

// 5. Update renderStream to place pinned items at the top of sideCandidates
const renderStreamSortingAnchor = `            // Stream = scraper articles + own articles merged by date
            let sideCandidates;
            if (activeCategory === null) {`;

const renderStreamSortingAnchorPatch = `            // Stream = scraper articles + own articles merged by date
            let sideCandidates;
            if (activeCategory === null) {`;

// Let's hook into after sideCandidates sorting is done:
const renderStreamSortingResult = `            } else {
                sideCandidates = scraperGroups;
            }

            // Render first 20 into sidebar`;

const renderStreamSortingResultPatch = `            } else {
                sideCandidates = scraperGroups;
            }

            // Prioritize pinned articles (within 3 hours) to the absolute top of the stream candidates
            sideCandidates.sort((a, b) => {
                const pinAgeA = a.main.pinned_at ? Date.now() - new Date(a.main.pinned_at).getTime() : Infinity;
                const pinAgeB = b.main.pinned_at ? Date.now() - new Date(b.main.pinned_at).getTime() : Infinity;
                const isPinnedA = pinAgeA < 3 * 60 * 60 * 1000;
                const isPinnedB = pinAgeB < 3 * 60 * 60 * 1000;
                if (isPinnedA && !isPinnedB) return -1;
                if (!isPinnedA && isPinnedB) return 1;
                return 0; // maintain original recency sort otherwise
            });

            // Render first 20 into sidebar`;

html = html.replace(renderStreamSortingResult, renderStreamSortingResultPatch).replace(renderStreamSortingResult.replace(/\n/g, '\r\n'), renderStreamSortingResultPatch.replace(/\n/g, '\r\n'));

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html for stream-only pinning!');
