const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `        // Admin Inline Pinning Function (destined for homepage sidebar)
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

const replacement = `        // Admin Inline Pinning Function (destined for homepage sidebar)
        async function togglePin(articleId, isPinned, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // Optimistic UI: Find button and show loading state instantly
            let btn = null;
            if (event && event.currentTarget) {
                btn = event.currentTarget;
            } else if (event && event.target) {
                btn = event.target.closest('button');
            }
            if (btn) {
                const iconSpan = btn.querySelector('.material-symbols-outlined');
                if (iconSpan) {
                    iconSpan.innerText = 'sync';
                    iconSpan.classList.add('animate-spin');
                }
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
                // Async reload data instead of whole page reload
                await startLoad();
            } catch (err) {
                alert('Σφάλμα: ' + err.message);
                if (btn) {
                    const iconSpan = btn.querySelector('.material-symbols-outlined');
                    if (iconSpan) {
                        iconSpan.innerText = isPinned ? 'keep_off' : 'keep';
                        iconSpan.classList.remove('animate-spin');
                    }
                }
            }
        }
        window.togglePin = togglePin;`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
} else {
    html = html.replace(target.replace(/\n/g, '\r\n'), replacement.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html for instant toggle feedback!');
