const fs = require('fs');
let html = fs.readFileSync('article.html', 'utf8');

// 1. Inject comments button to the header
const headerTarget = `<div class="w-6 h-6"></div>`;
const headerReplacement = `
            <!-- Header Anchor for Comments -->
            <button onclick="scrollToComments()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/30 text-on-surface-variant/80 hover:text-primary transition-all text-xs font-bold" title="Σχόλια">
                <span class="material-symbols-outlined text-[16px]">forum</span>
                <span id="header-comments-count" class="hidden">0</span>
            </button>`;
html = html.replace(headerTarget, headerReplacement).replace(headerTarget.replace(/\n/g, '\r\n'), headerReplacement.replace(/\n/g, '\r\n'));

// 2. Inject lazy loaded comments placeholder div
const displayTarget = `            </article>`;
const displayReplacement = `
                <!-- ⑥ LAZY LOADED COMMENTS AREA -->
                <div id="comments-lazy-placeholder" class="mt-12 pt-8 border-t border-outline-variant/30 px-4 md:px-0">
                    <div class="animate-pulse flex flex-col gap-3 py-6">
                        <div class="h-6 bg-surface-container-high w-1/4 rounded"></div>
                        <div class="h-10 bg-surface-container-high w-full rounded"></div>
                    </div>
                </div>
            </article>`;
html = html.replace(displayTarget, displayReplacement).replace(displayTarget.replace(/\n/g, '\r\n'), displayReplacement.replace(/\n/g, '\r\n'));

// 3. Inject comments badge placeholders in article stream/grid functions
html = html.replace(
    '${formatExactDate(a.created_at)} ${officialBadge}',
    '${formatExactDate(a.created_at)} ${officialBadge} <span id="comments-badge-${a.id}" class="ml-2 inline-flex items-center text-on-surface-variant/70 gap-0.5 text-[11px] font-bold"></span>'
);
html = html.replace(
    '${formatExactDate(a.created_at)} ${officialBadge}',
    '${formatExactDate(a.created_at)} ${officialBadge} <span id="comments-badge-${a.id}" class="ml-2 inline-flex items-center text-on-surface-variant/70 gap-0.5 text-[11px] font-bold"></span>'
);

// 4. Inject script block BEFORE the window.addEventListener
const originalShowError = `        function showError(msg) {`;
const commentsLogic = `
        // ── Comments System Controller (Decoupled, Lazy Loaded) ────────────────────
        let commentsInitialized = false;

        function isAdmin() {
            return sessionStorage.getItem('op_auth') === '1';
        }

        async function fetchCommentCounts() {
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
        }

        function scrollToComments() {
            const el = document.getElementById('comments-lazy-placeholder');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                if (!commentsInitialized) {
                    initializeComments();
                }
            }
        }
        window.scrollToComments = scrollToComments;

        function setupCommentsLazyLoader() {
            const placeholder = document.getElementById('comments-lazy-placeholder');
            if (!placeholder) return;
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !commentsInitialized) {
                    observer.disconnect();
                    initializeComments();
                }
            }, { rootMargin: '200px' });
            observer.observe(placeholder);
        }

        async function initializeComments() {
            if (commentsInitialized) return;
            commentsInitialized = true;

            const container = document.getElementById('comments-lazy-placeholder');
            if (!container) return;

            container.innerHTML = \`
            <div class="mt-8">
                <h3 class="font-h3 text-h3 text-on-surface mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">forum</span>
                    <span>Σχόλια (<span id="comments-total-count">0</span>)</span>
                </h3>

                <div id="comments-toast" class="hidden p-4 mb-4 rounded-xl border bg-error-container text-on-error-container border-error/20 text-sm font-semibold transition-all"></div>

                <div id="comments-list-box" class="space-y-4 max-h-[600px] md:max-h-[1000px] overflow-y-auto mb-8 pr-2 hidden" style="scrollbar-width:thin;">
                </div>
                
                <form id="comment-form" class="bg-surface-container rounded-2xl border border-outline-variant/30 p-6 space-y-4">
                    <h4 class="text-sm font-bold uppercase tracking-wider text-primary">Προσθηκη Σχολιου</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-xs font-bold text-on-surface-variant block mb-1">Όνομα / Ψευδώνυμο</label>
                            <input type="text" id="comment-user-name" placeholder="π.χ. Gate13" required maxlength="50" class="w-full bg-background border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface">
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-on-surface-variant block mb-1">Το σχόλιό σας</label>
                        <textarea id="comment-text" rows="4" placeholder="Γράψτε ένα κόσμιο σχόλιο..." required maxlength="1000" class="w-full bg-background border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface resize-none"></textarea>
                    </div>
                    <button type="submit" id="submit-comment-btn" class="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <span class="material-symbols-outlined text-[16px]">send</span>
                        <span>Υποβολή Σχολίου</span>
                    </button>
                </form>
            </div>\`;

            const form = document.getElementById('comment-form');
            if (form) {
                form.addEventListener('submit', handleCommentSubmit);
            }

            await loadComments();
        }

        async function loadComments() {
            if (!currentArticleId) return;
            const listBox = document.getElementById('comments-list-box');
            const totalCountSpan = document.getElementById('comments-total-count');
            if (!listBox) return;

            try {
                const res = await fetch(\`/api/comments?article_id=\${currentArticleId}\`);
                if (res.ok) {
                    const comments = await res.json();
                    
                    if (totalCountSpan) {
                        totalCountSpan.textContent = comments.length;
                    }

                    if (comments.length === 0) {
                        listBox.classList.add('hidden');
                        return;
                    }

                    listBox.classList.remove('hidden');
                    listBox.innerHTML = comments.map(c => {
                        const date = new Date(c.created_at);
                        const dateStr = date.toLocaleDateString('el-GR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
                        const deleteBtn = isAdmin() 
                            ? \`<button onclick="deleteComment('\${c.id}', event)" class="text-on-surface-variant/40 hover:text-error hover:bg-error/10 p-1.5 rounded-lg transition-all" title="Διαγραφή">
                                   <span class="material-symbols-outlined text-[16px]">delete</span>
                               </button>\` 
                            : '';

                        return \`
                        <div class="bg-surface-container/30 border border-outline-variant/10 rounded-2xl p-5 flex gap-4 items-start">
                            <div class="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
                                \${c.user_name.substring(0,2)}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="font-bold text-sm text-on-surface">\${c.user_name}</span>
                                        <span class="text-[11px] text-on-surface-variant/60">\${dateStr}</span>
                                    </div>
                                    \${deleteBtn}
                                </div>
                                <p class="text-sm text-on-surface-variant leading-relaxed mt-2 whitespace-pre-wrap">\${c.comment_text}</p>
                            </div>
                        </div>\`;
                    }).join('');
                }
            } catch(e) {
                console.error('[Load comments failed]', e);
            }
        }

        async function handleCommentSubmit(event) {
            event.preventDefault();
            const submitBtn = document.getElementById('submit-comment-btn');
            const toast = document.getElementById('comments-toast');
            
            const nameEl = document.getElementById('comment-user-name');
            const textEl = document.getElementById('comment-text');
            if (!nameEl || !textEl || !currentArticleId) return;

            const name = nameEl.value.trim();
            const text = textEl.value.trim();

            if (toast) {
                toast.classList.add('hidden');
                toast.textContent = '';
            }

            const hasLink = /https?:\\/\\/|www\\.|[a-zA-Z0-9-]+\\.(com|gr|net|org|info|edu|gov|eu|club|xyz|site)/i.test(text) ||
                            /https?:\\/\\/|www\\.|[a-zA-Z0-9-]+\\.(com|gr|net|org|info|edu|gov|eu|club|xyz|site)/i.test(name);
            if (hasLink) {
                showToast('Δεν επιτρέπονται σύνδεσμοι (links) στα σχόλια.');
                return;
            }

            const curseWords = [
                'μαλακ', 'πουστ', 'γαμησ', 'γαμω', 'γαμι', 'μουνι', 'μουνια', 'πουτανα', 'κωλο',
                'σκατα', 'fucking', 'fuck', 'bitch', 'asshole', 'shit', 'pussy', 'cunt', 'γαμημενη',
                'γαμημενο', 'γαμιολη', 'ξεκωλο', 'παπαρα', 'παπαρια', 'αρχιδια', 'αρχιδι'
            ];
            const lowerText = text.toLowerCase();
            const lowerName = name.toLowerCase();
            if (curseWords.some(w => lowerText.includes(w)) || curseWords.some(w => lowerName.includes(w))) {
                showToast('Το σχόλιό σας περιέχει ανάρμοστο λεξιλόγιο.');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = \`<span class="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent"></span> <span>Αποστολή...</span>\`;
            }

            try {
                const res = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ article_id: currentArticleId, user_name: name, comment_text: text })
                });

                if (res.ok) {
                    textEl.value = '';
                    await loadComments();
                    await fetchCommentCounts();
                } else {
                    const errData = await res.json();
                    showToast(errData.error || 'Αποτυχία υποβολής σχολίου.');
                }
            } catch(e) {
                showToast('Σφάλμα σύνδεσης. Δοκιμάστε ξανά.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = \`<span class="material-symbols-outlined text-[16px]">send</span> <span>Υποβολή Σχολίου</span>\`;
                }
            }
        }

        async function deleteComment(commentId, event) {
            if (event) event.stopPropagation();
            if (!confirm('Θέλεις σίγουρα να διαγράψεις αυτό το σχόλιο;')) return;
            try {
                const res = await fetch('/api/comments', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: commentId, token: 'admin_secure_session' })
                });
                if (res.ok) {
                    await loadComments();
                    await fetchCommentCounts();
                } else {
                    alert('Σφάλμα κατά τη διαγραφή.');
                }
            } catch(e) {
                alert('Σφάλμα σύνδεσης.');
            }
        }
        window.deleteComment = deleteComment;

        function showToast(msg) {
            const toast = document.getElementById('comments-toast');
            if (toast) {
                toast.textContent = msg;
                toast.classList.remove('hidden');
                toast.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function showError(msg) {`;
html = html.replace(originalShowError, commentsLogic).replace(originalShowError.replace(/\n/g, '\r\n'), commentsLogic.replace(/\n/g, '\r\n'));

// 5. Connect loading logic hooks to bottom start of init/DOMContentLoaded
const initAnchor = `window.addEventListener('DOMContentLoaded', loadArticle);`;
const initAnchorPatch = `window.addEventListener('DOMContentLoaded', () => {
            loadArticle().then(() => {
                fetchCommentCounts();
                setupCommentsLazyLoader();
            });
        });`;
html = html.replace(initAnchor, initAnchorPatch).replace(initAnchor.replace(/\n/g, '\r\n'), initAnchorPatch.replace(/\n/g, '\r\n'));

fs.writeFileSync('article.html', html, 'utf8');
console.log('Clean comments patch applied successfully to article.html!');
