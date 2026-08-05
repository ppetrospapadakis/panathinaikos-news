// ─── Interactive Fan Lineup Studio & Comment Viewer ──────────────────────────
(function() {
    let activeSport = 'football';
    let activeArticleId = '';
    let activeRosterState = {
        starting: [],
        bench: [],
        rest: []
    };
    let selectedPlayerForSwap = null;
    window.userLineupsMap = {};

    // Helper: Clone roster array safely
    function clonePlayerList(arr) {
        return JSON.parse(JSON.stringify(arr || []));
    }

    // Initialize & open Lineup Studio Modal
    window.openLineupStudio = function(sport, articleId) {
        activeSport = sport;
        activeArticleId = articleId;

        // Fetch current live roster data from page DOM / state
        let starting = [], bench = [], rest = [];
        if (sport === 'football') {
            starting = window.liveFootballStarting ? clonePlayerList(window.liveFootballStarting) : [];
            bench = window.liveFootballBench ? clonePlayerList(window.liveFootballBench) : [];
            rest = window.liveFootballRest ? clonePlayerList(window.liveFootballRest) : [];
        } else {
            starting = window.liveBasketballStarting ? clonePlayerList(window.liveBasketballStarting) : [];
            bench = window.liveBasketballBackup ? clonePlayerList(window.liveBasketballBackup) : [];
            rest = window.liveBasketballRest ? clonePlayerList(window.liveBasketballRest) : [];
        }

        activeRosterState = { starting, bench, rest };
        selectedPlayerForSwap = null;
        renderStudioModal();
    };

    window.closeLineupStudio = function() {
        const modal = document.getElementById('lineup-studio-modal');
        if (modal) modal.remove();
    };

    // Render Studio Modal HTML
    function renderStudioModal() {
        let modal = document.getElementById('lineup-studio-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'lineup-studio-modal';
            modal.className = 'fixed inset-0 bg-black/85 z-[100] backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in';
            document.body.appendChild(modal);
        }

        const isFootball = activeSport === 'football';
        const sportTitle = isFootball ? '⚽ Φτιάξε τη δική σου 11άδα' : '🏀 Φτιάξε τη δική σου 5άδα';
        const isAuthedAdmin = sessionStorage.getItem('op_auth') === '1';

        modal.innerHTML = `
        <div class="bg-surface-container border border-outline-variant/40 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 space-y-6 shadow-2xl relative scrollbar-thin">
            <!-- Header -->
            <div class="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                        <span class="material-symbols-outlined text-[24px]">tune</span>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-lg sm:text-xl text-on-surface">${sportTitle}</h3>
                        <p class="text-xs text-on-surface-variant">Σύρε (Drag & Drop) ή πάτα παίκτες για αλλαγή θέσης μεταξύ Βασικών, Πάγκου & Εκτός Αποστολής!</p>
                    </div>
                </div>
                <button onclick="closeLineupStudio()" class="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant flex items-center justify-center transition-all cursor-pointer shrink-0">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <!-- Pitch / Court Interactive Preview -->
            <div class="space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-primary uppercase tracking-wider">
                    <span>Τακτικο Πλανο Βασικων</span>
                    <span class="text-[11px] text-on-surface-variant/70 font-normal">(${activeRosterState.starting.length} Παίκτες)</span>
                </div>
                <div class="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-surface-container-high rounded-2xl overflow-hidden border border-outline-variant/30 shadow-inner">
                    ${renderStudioPitchHtml()}
                </div>
            </div>

            <!-- 3 Categorized Droppable Pools -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Starting Pool -->
                <div class="bg-surface-container-low border border-primary/30 rounded-2xl p-4 space-y-3 dropzone" data-cat="starting" ondragover="studioDragOver(event)" ondragleave="studioDragLeave(event)" ondrop="studioDrop(event, 'starting')">
                    <div class="flex items-center justify-between">
                        <h4 class="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px]">star</span>
                            <span>Βασικοί (${activeRosterState.starting.length})</span>
                        </h4>
                    </div>
                    <div class="space-y-2 min-h-[120px]">
                        ${renderPoolCardsHtml('starting')}
                    </div>
                </div>

                <!-- Bench Pool -->
                <div class="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 space-y-3 dropzone" data-cat="bench" ondragover="studioDragOver(event)" ondragleave="studioDragLeave(event)" ondrop="studioDrop(event, 'bench')">
                    <div class="flex items-center justify-between">
                        <h4 class="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px]">chair</span>
                            <span>Πάγκος (${activeRosterState.bench.length})</span>
                        </h4>
                    </div>
                    <div class="space-y-2 min-h-[120px]">
                        ${renderPoolCardsHtml('bench')}
                    </div>
                </div>

                <!-- Rest Pool -->
                <div class="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 space-y-3 dropzone" data-cat="rest" ondragover="studioDragOver(event)" ondragleave="studioDragLeave(event)" ondrop="studioDrop(event, 'rest')">
                    <div class="flex items-center justify-between">
                        <h4 class="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant/70 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px]">groups</span>
                            <span>Υπόλοιποι (${activeRosterState.rest.length})</span>
                        </h4>
                    </div>
                    <div class="space-y-2 min-h-[120px]">
                        ${renderPoolCardsHtml('rest')}
                    </div>
                </div>
            </div>

            <!-- Comment Submission Form -->
            <form id="lineup-studio-form" onsubmit="submitLineupComment(event)" class="bg-surface-container-high border border-outline-variant/30 rounded-2xl p-5 space-y-4">
                <h4 class="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">share</span>
                    <span>Μοιράσου την ομάδα σου στα σχόλια</span>
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${isAuthedAdmin ? `
                        <div class="p-3 bg-primary/10 border border-primary/30 rounded-xl text-primary font-bold text-xs flex items-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">verified</span>
                            <span>Δημοσίευση ως: <strong>PanathinaikosNews (Διαχειριστής)</strong></span>
                            <input type="hidden" id="studio-user-name" value="PanathinaikosNews">
                        </div>
                    ` : `
                        <div>
                            <label class="text-xs font-bold text-on-surface-variant block mb-1">Όνομα / Ψευδώνυμο</label>
                            <input type="text" id="studio-user-name" placeholder="π.χ. Γιώργος 13" required maxlength="50" class="w-full bg-background border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface">
                        </div>
                    `}
                </div>

                <div>
                    <label class="text-xs font-bold text-on-surface-variant block mb-1">Σχόλιο για την ομάδα σου</label>
                    <textarea id="studio-comment-text" rows="3" placeholder="Γράψε λίγα λόγια για την τακτική σου επιλογή..." required maxlength="800" class="w-full bg-background border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface resize-none"></textarea>
                </div>

                <div id="studio-toast" class="hidden p-3 rounded-xl border bg-error-container text-on-error-container text-xs font-bold"></div>

                <div class="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onclick="closeLineupStudio()" class="px-5 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container-highest transition-all cursor-pointer">Ακύρωση</button>
                    <button type="submit" id="studio-submit-btn" class="px-6 py-2.5 bg-primary text-on-primary font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
                        <span class="material-symbols-outlined text-[16px]">send</span>
                        <span>Δημοσίευση 11άδας στα Σχόλια</span>
                    </button>
                </div>
            </form>
        </div>`;
    }

    // Render interactive pitch layout for studio
    function renderStudioPitchHtml() {
        const isFootball = activeSport === 'football';
        const bgStyle = isFootball
            ? 'background: radial-gradient(circle, #1a3a2a 0%, #0d2016 100%);'
            : 'background: radial-gradient(circle, #2d1f15 0%, #17100b 100%);';

        const tokensHtml = activeRosterState.starting.map(([left, top, initials, name, num, pos], idx) => {
            const isSelected = selectedPlayerForSwap && selectedPlayerForSwap.cat === 'starting' && selectedPlayerForSwap.idx === idx;
            const borderClass = isSelected ? 'border-2 border-yellow-400 scale-110 shadow-yellow-500/50' : 'border border-primary/40';

            return `
            <div class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${borderClass}" style="left:${left}%; top:${top}%; z-index:10;" onclick="handlePlayerTap('starting', ${idx})">
                <div class="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-md relative">
                    ${num || idx + 1}
                    <div class="absolute -top-1.5 -right-1.5 bg-background text-primary border border-primary/40 text-[9px] font-extrabold rounded-full px-1 py-0.2 min-w-[16px] text-center">${pos || initials}</div>
                </div>
                <div class="mt-1 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-center shadow">${name}</div>
            </div>`;
        }).join('');

        return `<div class="w-full h-full relative" style="${bgStyle}">${tokensHtml}</div>`;
    }

    // Render cards list inside a pool
    function renderPoolCardsHtml(cat) {
        const list = activeRosterState[cat] || [];
        if (list.length === 0) {
            return `<div class="p-3 rounded-xl border border-dashed border-outline-variant/30 text-center text-xs text-on-surface-variant/40">Κενό (Σύρε παίκτη εδώ)</div>`;
        }

        return list.map((item, idx) => {
            let name, num, pos, initials;
            if (Array.isArray(item)) {
                initials = item[2]; name = item[3]; num = item[4]; pos = item[5] || initials;
            } else {
                initials = item.initials; name = item.name; num = item.num || '#'; pos = item.pos || '';
            }

            const isSelected = selectedPlayerForSwap && selectedPlayerForSwap.cat === cat && selectedPlayerForSwap.idx === idx;
            const cardBg = isSelected ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-surface-container border-outline-variant/20 hover:border-primary/40 text-on-surface';

            return `
            <div draggable="true" ondragstart="studioDragStart(event, '${cat}', ${idx})" onclick="handlePlayerTap('${cat}', ${idx})" class="p-2.5 rounded-xl border ${cardBg} flex items-center justify-between text-xs font-medium cursor-grab active:cursor-grabbing transition-all shadow-sm group select-none">
                <div class="flex items-center gap-2 truncate">
                    <span class="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0">${num}</span>
                    <span class="font-bold truncate">${name}</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/60 text-on-surface-variant border border-outline-variant/30 uppercase shrink-0">${pos}</span>
            </div>`;
        }).join('');
    }

    // Tap to Swap / Move Player
    window.handlePlayerTap = function(cat, idx) {
        if (!selectedPlayerForSwap) {
            selectedPlayerForSwap = { cat, idx };
        } else {
            if (selectedPlayerForSwap.cat === cat && selectedPlayerForSwap.idx === idx) {
                selectedPlayerForSwap = null; // Unselect
            } else {
                // Swap/move
                moveOrSwapPlayers(selectedPlayerForSwap.cat, selectedPlayerForSwap.idx, cat, idx);
                selectedPlayerForSwap = null;
            }
        }
        renderStudioModal();
    };

    // Drag & Drop event handlers
    window.studioDragStart = function(e, cat, idx) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ cat, idx }));
    };

    window.studioDragOver = function(e) {
        e.preventDefault();
        e.currentTarget.classList.add('border-primary', 'bg-primary/10');
    };

    window.studioDragLeave = function(e) {
        e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
    };

    window.studioDrop = function(e, targetCat) {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
        try {
            const raw = e.dataTransfer.getData('text/plain');
            if (!raw) return;
            const { cat: srcCat, idx: srcIdx } = JSON.parse(raw);
            moveOrSwapPlayers(srcCat, srcIdx, targetCat, null);
            selectedPlayerForSwap = null;
            renderStudioModal();
        } catch (_) {}
    };

    // Perform swap or move
    function moveOrSwapPlayers(srcCat, srcIdx, targetCat, targetIdx) {
        const srcList = activeRosterState[srcCat];
        const targetList = activeRosterState[targetCat];
        if (!srcList || !targetList) return;

        const p1 = srcList[srcIdx];
        if (!p1) return;

        if (targetIdx !== null && targetIdx !== undefined && targetList[targetIdx]) {
            // Swap positions
            const p2 = targetList[targetIdx];
            srcList[srcIdx] = p2;
            targetList[targetIdx] = p1;
        } else {
            // Move to target list
            srcList.splice(srcIdx, 1);
            targetList.push(p1);
        }
    }

    // Submit custom lineup comment
    window.submitLineupComment = async function(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('studio-submit-btn');
        const toast = document.getElementById('studio-toast');
        const nameEl = document.getElementById('studio-user-name');
        const textEl = document.getElementById('studio-comment-text');

        if (!nameEl || !textEl || !activeArticleId) return;

        const isAuthedAdmin = sessionStorage.getItem('op_auth') === '1';
        const userName = isAuthedAdmin ? 'PanathinaikosNews' : nameEl.value.trim();
        const userComment = textEl.value.trim();

        if (toast) toast.classList.add('hidden');

        // Package lineup into comment payload
        const lineupPayload = {
            sport: activeSport,
            starting: activeRosterState.starting,
            bench: activeRosterState.bench,
            rest: activeRosterState.rest
        };

        const fullCommentText = `${userComment}\n\n[LINEUP_DATA]${JSON.stringify(lineupPayload)}[/LINEUP_DATA]`;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> <span>Δημοσίευση...</span>`;

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    article_id: activeArticleId,
                    user_name: userName,
                    comment_text: fullCommentText
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Σφάλμα υποβολής σχολίου.');

            closeLineupStudio();
            // Reload comments
            if (typeof loadRosterComments === 'function') {
                loadRosterComments(activeSport, activeArticleId);
            }
        } catch (err) {
            if (toast) {
                toast.textContent = err.message;
                toast.classList.remove('hidden');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">send</span> <span>Δημοσίευση 11άδας στα Σχόλια</span>`;
            }
        }
    };

    // Open Read-Only Fan Lineup Viewer Modal
    window.openViewUserLineupModal = function(commentId) {
        const item = window.userLineupsMap[commentId];
        if (!item) return;

        let modal = document.getElementById('view-lineup-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'view-lineup-modal';
            modal.className = 'fixed inset-0 bg-black/85 z-[100] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in';
            document.body.appendChild(modal);
        }

        const isFootball = item.sport === 'football';
        const sportTitle = isFootball ? '⚽ 11άδα Φιλάθλου' : '🏀 5άδα Φιλάθλου';
        const lineup = item.lineup || {};

        const starting = lineup.starting || [];
        const bench = lineup.bench || [];

        const bgStyle = isFootball
            ? 'background: radial-gradient(circle, #1a3a2a 0%, #0d2016 100%);'
            : 'background: radial-gradient(circle, #2d1f15 0%, #17100b 100%);';

        const pitchTokens = starting.map(([left, top, initials, name, num, pos], idx) => `
            <div class="absolute -translate-x-1/2 -translate-y-1/2" style="left:${left}%; top:${top}%; z-index:10;">
                <div class="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-md relative border border-primary/40">
                    ${num || idx + 1}
                    <div class="absolute -top-1.5 -right-1.5 bg-background text-primary border border-primary/40 text-[9px] font-extrabold rounded-full px-1 py-0.2 min-w-[16px] text-center">${pos || initials}</div>
                </div>
                <div class="mt-1 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-center shadow">${name}</div>
            </div>
        `).join('');

        const benchCards = bench.map((b) => {
            let name, num, pos;
            if (Array.isArray(b)) { name = b[3]; num = b[4]; pos = b[5] || b[2]; }
            else { name = b.name; num = b.num || '#'; pos = b.pos || ''; }
            return `<span class="px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/20 text-[11px] font-bold text-on-surface flex items-center gap-1.5">
                <span class="text-primary font-mono">${num}</span> ${name}
            </span>`;
        }).join('');

        modal.innerHTML = `
        <div class="bg-surface-container border border-outline-variant/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                        <span class="material-symbols-outlined text-[24px]">groups</span>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-lg text-on-surface">${sportTitle} — ${item.name}</h3>
                        <p class="text-xs text-on-surface-variant">${item.date}</p>
                    </div>
                </div>
                <button onclick="document.getElementById('view-lineup-modal').remove()" class="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant flex items-center justify-center transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <!-- Pitch -->
            <div class="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-surface-container-high rounded-2xl overflow-hidden border border-outline-variant/30 shadow-inner">
                <div class="w-full h-full relative" style="${bgStyle}">${pitchTokens}</div>
            </div>

            <!-- Bench -->
            ${bench.length > 0 ? `
                <div class="space-y-2">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Πάγκος</h4>
                    <div class="flex flex-wrap gap-2">${benchCards}</div>
                </div>
            ` : ''}
        </div>`;
    };
})();
