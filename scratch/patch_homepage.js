const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Define the togglePin function in index.html scripts
const scriptEnd = `            if (new URLSearchParams(window.location.search).get('search') === 'open') {
                setTimeout(() => toggleSearch(), 300);
            }
        }`;

const scriptEndPatch = `            if (new URLSearchParams(window.location.search).get('search') === 'open') {
                setTimeout(() => toggleSearch(), 300);
            }
        }

        // Admin Inline Pinning Function
        async function togglePin(articleId, isPinned) {
            event.preventDefault();
            event.stopPropagation();
            
            // Re-instantiate DB client using keys
            const SUPABASE_URL = "https://rctltbuiitdnqlxizlym.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";
            
            // Check if Supabase SDK is loaded (load if not)
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
                // Reload feed to display changes immediately
                window.location.reload();
            } catch (err) {
                alert('Σφάλμα: ' + err.message);
            }
        }
        window.togglePin = togglePin;`;

html = html.replace(scriptEnd, scriptEndPatch).replace(scriptEnd.replace(/\n/g, '\r\n'), scriptEndPatch.replace(/\n/g, '\r\n'));

// Add pin button render logic helper
const helperInject = `        // ── Render helpers ─────────────────────────────────────────────────────`;
const helperInjectPatch = `        // Helper to check if user is admin
        function isAdmin() {
            return sessionStorage.getItem('op_auth') === '1';
        }

        // Render Pin Button
        function pinButtonHtml(articleId, pinnedAt) {
            if (!isAdmin()) return '';
            const pinAgeMs = pinnedAt ? Date.now() - new Date(pinnedAt).getTime() : Infinity;
            const isPinned = pinAgeMs < 2 * 60 * 60 * 1000;
            const color = isPinned ? 'text-primary bg-primary/20' : 'text-on-surface/40 hover:text-primary hover:bg-primary/20 bg-background/80';
            const icon = isPinned ? 'keep_off' : 'keep';
            return \`
            <button onclick="togglePin('\${articleId}', \${isPinned})" class="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30 backdrop-blur transition-all active:scale-90 \${color}" title="\${isPinned ? 'Unpin' : 'Pin'}" style="pointer-events: auto;">
                <span class="material-symbols-outlined" style="font-size:16px">\${icon}</span>
            </button>\`;
        }

        // ── Render helpers ─────────────────────────────────────────────────────`;

html = html.replace(helperInject, helperInjectPatch).replace(helperInject.replace(/\n/g, '\r\n'), helperInjectPatch.replace(/\n/g, '\r\n'));

// Inject pinButtonHtml inside templates:
// 1. sideCardHtml
html = html.replace(
    `<a class="group cursor-pointer flex gap-3 items-start bg-surface-container/30 p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border border-outline-variant/10 text-left" href="\${url}">`,
    `<a class="relative group cursor-pointer flex gap-3 items-start bg-surface-container/30 p-4 rounded-xl hover:bg-surface-container/70 transition-all card-hover border border-outline-variant/10 text-left" href="\${url}">\${pinButtonHtml(a.id, a.pinned_at)}`
);

// 2. gridCardHtml
html = html.replace(
    `<a class="group cursor-pointer rounded-xl border flex flex-col overflow-hidden card-hover \${border}" href="\${url}">`,
    `<a class="relative group cursor-pointer rounded-xl border flex flex-col overflow-hidden card-hover \${border}" href="\${url}">\${pinButtonHtml(a.id, a.pinned_at)}`
);

// 3. renderHero
html = html.replace(
    `heroEl.innerHTML = \`<a class="group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant/20 flex flex-col overflow-hidden card-hover h-full" href="\${url}">`,
    `heroEl.innerHTML = \`<a class="relative group cursor-pointer bg-surface-container rounded-none md:rounded-xl border-y border-x-0 md:border-x border-outline-variant/20 flex flex-col overflow-hidden card-hover h-full" href="\${url}">\\\${pinButtonHtml(a.id, a.pinned_at)}`
);

// 4. renderEditorial
html = html.replace(
    `<a class="group cursor-pointer rounded-xl border border-primary/30 bg-primary/5 flex flex-col overflow-hidden card-hover h-full" href="\${url}">`,
    `<a class="relative group cursor-pointer rounded-xl border border-primary/30 bg-primary/5 flex flex-col overflow-hidden card-hover h-full" href="\${url}">\${pinButtonHtml(a.id, a.pinned_at)}`
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html with inline homepage pinning!');
