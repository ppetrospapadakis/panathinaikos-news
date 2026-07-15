
    (function() {
        const SUPABASE_URL = 'https://rctltbuiitdnqlxizlym.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI';

        function toggleDrawer() {
            const d = document.getElementById('nav-drawer');
            const o = document.getElementById('drawer-overlay');
            d.classList.toggle('-translate-x-full');
            o.classList.toggle('opacity-0');
            o.classList.toggle('pointer-events-none');
        }
        window.toggleDrawer = toggleDrawer;

        // ─────────────────────────────────────────────────────────────────
        // FOOTBALL DATA
        // ─────────────────────────────────────────────────────────────────
        const footballStarting = [
            // Formation 4-3-3 (top = GK, bottom = FW)
            // [left%, top%, initials, name, number, pos]
            [50, 88, 'ΦΝ', 'Φιλίποβιτς', 1, 'GK'],

            [15, 68, 'ΒΑ', 'Βαγιαννίδης', 2, 'RB'],
            [38, 70, 'ΜΣ', 'Μαξίμοβιτς', 5, 'CB'],
            [62, 70, 'ΤΟ', 'Τόμας', 4, 'CB'],
            [85, 68, 'ΡΩΑ', 'Ρουά', 3, 'LB'],

            [25, 48, 'ΝΤΡ', 'Ντρ. Σκι', 8, 'CM'],
            [50, 44, 'ΓΡΑ', 'Γκρέι', 6, 'CM'],
            [75, 48, 'ΘΟΥ', 'Θορ', 10, 'CAM'],

            [18, 22, 'ΤΕΤ', 'Τετέ', 7, 'RW'],
            [50, 18, 'ΙΩΑ', 'Ιωαννίδης', 9, 'ST'],
            [82, 22, 'ΠΕΛ', 'Πελίστρι', 11, 'LW'],
        ];

        const footballBench = [
            // Formation 4-4-2 on a smaller pitch
            [50, 85, 'ΒΡΑ', 'Βρατσάνος', 23, 'GK'],

            [15, 65, 'ΓΙΕ', 'Γιεντβάι', 14, 'RB'],
            [38, 67, 'ΑΝΔ', 'Ανδρέ', 16, 'CB'],
            [62, 67, 'ΛΩΡ', 'Λόρδος', 22, 'CB'],
            [85, 65, 'ΚΟΡ', 'Κόρμπο', 3, 'LB'],

            [20, 45, 'ΜΠΑ', 'Μπαλόγκ', 17, 'RM'],
            [40, 42, 'ΤΖΑ', 'Τζαβέλας', 18, 'CM'],
            [60, 42, 'ΧΑΡ', 'Χαρίσης', 19, 'CM'],
            [80, 45, 'ΠΑΛ', 'Παλμέρι', 15, 'LM'],

            [35, 22, 'ΟΑΔ', 'Οάδες', 20, 'ST'],
            [65, 22, 'ΙΝΓ', 'Ίνγκασον', 21, 'ST'],
        ];

        const footballRest = [
            { initials:'ΑΛΕ', name:'Αλεξανδρόπουλος', num:24, pos:'GK', detail:'3ος Τερματοφύλακας' },
            { initials:'ΜΠΙ', name:'Μπίλε', num:25, pos:'CB', detail:'Ελεύθερος Ροφ' },
            { initials:'ΣΑΝ', name:'Σάντσεζ', num:26, pos:'RB', detail:'Νεαρό Ταλέντο' },
            { initials:'ΚΑΡ', name:'Καρβαλιό', num:27, pos:'CAM', detail:'Ερασιτεχνική Τμήμα' },
            { initials:'ΔΗΜ', name:'Δημητρίου', num:28, pos:'LW', detail:'U21' },
            { initials:'ΠΑΠ', name:'Παπαδόπουλος', num:29, pos:'CM', detail:'Academy' },
        ];

        // ─────────────────────────────────────────────────────────────────
        // BASKETBALL DATA
        // ─────────────────────────────────────────────────────────────────
        const basketballStarting = [
            // [left%, top%, initials, name, position]
            [50, 82, 'ΣΛ', 'Σλούκας', 'PG'],
            [20, 65, 'ΛΟΥ', 'Λούντζης', 'SG'],
            [80, 65, 'ΗΛ', 'Ηλιόπουλος', 'SF'],
            [30, 38, 'ΠΑΠ', 'Παπαπέτρου', 'PF'],
            [70, 38, 'ΜΙΤ', 'Μιτόγλου', 'C'],
        ];

        const basketballBackup = [
            [50, 80, 'ΛΑΡ', 'Λαρεντζάκης', 'PG'],
            [20, 60, 'ΒΟΥ', 'Βουγιούκας', 'SG'],
            [80, 60, 'ΠΑΛ', 'Παλμέρ', 'SF'],
            [35, 35, 'ΓΙΑ', 'Γιαννόπουλος', 'PF'],
            [65, 35, 'ΟΑΥ', 'Ουάιτ', 'C'],
        ];

        const basketballRest = [
            { initials:'ΔΑΡ', name:'Δάρα', pos:'C', detail:'Βαθιά Ρότα' },
            { initials:'ΠΑΠ', name:'Παπαγεωργίου', pos:'PG', detail:'Academy' },
            { initials:'ΤΣΑ', name:'Τσαϊρέλης', pos:'SF', detail:'Two-Way' },
            { initials:'ΑΓΓ', name:'Αγγελόπουλος', pos:'SG', detail:'U22' },
        ];

        // ─────────────────────────────────────────────────────────────────
        // RENDER HELPERS
        // ─────────────────────────────────────────────────────────────────
        function renderPitchPlayers(containerId, players) {
            const container = document.getElementById(containerId);
            if (!container) return;
            // Remove old tokens
            container.querySelectorAll('.player-token').forEach(el => el.remove());
            players.forEach(([left, top, initials, name, num, pos]) => {
                const token = document.createElement('div');
                token.className = 'player-token';
                token.style.left = left + '%';
                token.style.top = top + '%';
                token.innerHTML = `
                    <div class="avatar" style="position:relative;">
                        ${num}
                        <div class="num-badge" style="font-size:8px; width:20px; height:20px; right:-6px; top:-6px; display:flex; align-items:center; justify-content:center;">${pos || initials}</div>
                    </div>
                    <div class="name-tag">${name}</div>`;
                container.appendChild(token);
            });
        }

        function renderCourtPlayers(containerId, players) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.querySelectorAll('.bball-token').forEach(el => el.remove());
            players.forEach(([left, top, initials, name, pos], index) => {
                const num = index + 1;
                const token = document.createElement('div');
                token.className = 'bball-token';
                token.style.left = left + '%';
                token.style.top = top + '%';
                token.innerHTML = `
                    <div class="avatar" style="position:relative;">
                        ${num}
                        <div class="pos-badge" style="font-size:8px; width:20px; height:20px; right:-6px; top:-6px; display:flex; align-items:center; justify-content:center;">${pos}</div>
                    </div>
                    <div class="name-tag">${name}</div>`;
                container.appendChild(token);
            });
        }

        function renderSquadList(containerId, players) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = players.map(p => `
            <div class="card-hover flex items-center gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant/20">
                <div class="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary shrink-0 text-sm">${p.initials}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-h4 text-h4 leading-tight">${p.name}</p>
                    <p class="font-caption text-caption text-on-surface-variant mt-0.5">${p.detail || p.pos}</p>
                </div>
                <span class="px-3 py-1 bg-surface-container-high rounded-full font-label text-label text-on-surface-variant text-xs uppercase">${p.pos || p.num || ''}</span>
            </div>`).join('');
        }

        // ─────────────────────────────────────────────────────────────────
        // INIT & DYNAMIC SUPABASE LOADING
        // ─────────────────────────────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', () => {
            // Load Supabase script dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                loadDynamicRoster(db);
            };
            script.onerror = () => {
                // If script fails to load, render fallbacks immediately
                renderPitchPlayers('pitch-starting', footballStarting);
                renderPitchPlayers('pitch-bench', footballBench);
                renderSquadList('squad-rest-football', footballRest);
                document.getElementById('analysis-text-football').innerHTML = '<p>Ο Παναθηναϊκός δείχνει να διαθέτει εξαιρετικό βάθος στο φετινό ρόστερ του, με ποιοτικές επιλογές σε κάθε γραμμή. Η προσθήκη των Τετέ και Πελίστρι δίνει ταχύτητα στα άκρα, ενώ ο Ιωαννίδης παραμένει η αιχμή του δόρατος στην επίθεση.</p>';

                renderCourtPlayers('court-starting', basketballStarting);
                renderCourtPlayers('court-backup', basketballBackup);
                renderSquadList('squad-rest-basketball', basketballRest);
                document.getElementById('analysis-text-basketball').innerHTML = '<p>Με τον Εργκίν Αταμάν στο τιμόνι, ο Παναθηναϊκός AKTOR διαθέτει μια από τις ισχυρότερες περιφέρειες στην Ευρώπη. Η παρουσία του Σλούκα ως ηγέτη και το βάθος στους ψηλούς προσφέρουν τεράστια τακτική ευελιξία.</p>';
            };
            document.head.appendChild(script);
        });

        // Stores dynamic basketball data if fetched before tab is clicked
        let pendingBasketballData = null;

        async function loadDynamicRoster(db) {
            try {
                // Fetch Football Roster
                const { data: fData } = await db.from('articles')
                    .select('*')
                    .eq('source_url', 'opinion://system-roster-football')
                    .maybeSingle();

                if (fData && fData.bullets && fData.bullets.length >= 3) {
                    const starting = JSON.parse(fData.bullets[0]);
                    const bench = JSON.parse(fData.bullets[1]);
                    const rest = JSON.parse(fData.bullets[2]);
                    const analysis = fData.content || '';

                    renderPitchPlayers('pitch-starting', starting);
                    renderPitchPlayers('pitch-bench', bench);
                    renderSquadList('squad-rest-football', rest);
                    document.getElementById('analysis-text-football').innerHTML = analysis.split(/\n+/).map(p => `<p class="mb-4">${p}</p>`).join('');
                } else {
                    renderPitchPlayers('pitch-starting', footballStarting);
                    renderPitchPlayers('pitch-bench', footballBench);
                    renderSquadList('squad-rest-football', footballRest);
                    document.getElementById('analysis-text-football').innerHTML = '<p>Ο Παναθηναϊκός δείχνει να διαθέτει εξαιρετικό βάθος στο φετινό ρόστερ του, με ποιοτικές επιλογές σε κάθε γραμμή. Η προσθήκη των Τετέ και Πελίστρι δίνει ταχύτητα στα άκρα, ενώ ο Ιωαννίδης παραμένει η αιχμή του δόρατος στην επίθεση.</p>';
                }

                // Fetch Basketball Roster — store data, render on first tab click
                const { data: bData } = await db.from('articles')
                    .select('*')
                    .eq('source_url', 'opinion://system-roster-basketball')
                    .maybeSingle();

                if (bData && bData.bullets && bData.bullets.length >= 3) {
                    pendingBasketballData = {
                        starting: JSON.parse(bData.bullets[0]),
                        backup: JSON.parse(bData.bullets[1]),
                        rest: JSON.parse(bData.bullets[2]),
                        analysis: bData.content || ''
                    };
                }

                // If basketball tab is already visible, render immediately
                const bView = document.getElementById('view-basketball');
                if (bView && !bView.classList.contains('hidden')) {
                    applyBasketballData();
                }

            } catch (err) {
                console.error('Error loading dynamic roster:', err);
                // Football fallback
                renderPitchPlayers('pitch-starting', footballStarting);
                renderPitchPlayers('pitch-bench', footballBench);
                renderSquadList('squad-rest-football', footballRest);
                document.getElementById('analysis-text-football').innerHTML = '<p>Ο Παναθηναϊκός δείχνει να διαθέτει εξαιρετικό βάθος στο φετινό ρόστερ του, με ποιοτικές επιλογές σε κάθε γραμμή.</p>';
            }
        }

        function applyBasketballData() {
            if (pendingBasketballData) {
                renderCourtPlayers('court-starting', pendingBasketballData.starting);
                renderCourtPlayers('court-backup', pendingBasketballData.backup);
                renderSquadList('squad-rest-basketball', pendingBasketballData.rest);
                document.getElementById('analysis-text-basketball').innerHTML =
                    pendingBasketballData.analysis.split(/\n+/).map(p => `<p class="mb-4">${p}</p>`).join('');
            } else {
                renderCourtPlayers('court-starting', basketballStarting);
                renderCourtPlayers('court-backup', basketballBackup);
                renderSquadList('squad-rest-basketball', basketballRest);
                document.getElementById('analysis-text-basketball').innerHTML = '<p>Με τον Εργκίν Αταμάν στο τιμόνι, ο Παναθηναϊκός AKTOR διαθέτει μια από τις ισχυρότερες περιφέρειες στην Ευρώπη. Η παρουσία του Σλούκα ως ηγέτη και το βάθος στους ψηλούς προσφέρουν τεράστια τακτική ευελιξία.</p>';
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // SPORT SWITCHER
        // ─────────────────────────────────────────────────────────────────
        let basketballRendered = false;

        function switchSport(sport) {
            const isFootball = sport === 'football';
            document.getElementById('view-football').classList.toggle('hidden', !isFootball);
            document.getElementById('view-basketball').classList.toggle('hidden', isFootball);

            document.getElementById('tab-football').className = isFootball
                ? 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider bg-primary text-on-primary transition-all'
                : 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all';
            document.getElementById('tab-basketball').className = !isFootball
                ? 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider bg-primary text-on-primary transition-all'
                : 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all';

            // Render basketball tokens AFTER the view is visible in the DOM
            // requestAnimationFrame guarantees the browser has laid out the div
            // so position:absolute tokens get correct coordinates
            if (!isFootball && !basketballRendered) {
                basketballRendered = true;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        applyBasketballData();
                    });
                });
            }
        }
        window.switchSport = switchSport;

        // ─────────────────────────────────────────────────────────────────
        // INIT — render football immediately; basketball deferred to first tab click
        // ─────────────────────────────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', () => {
            renderPitchPlayers('pitch-starting', footballStarting);
            renderPitchPlayers('pitch-bench', footballBench);
            renderSquadList('squad-rest-football', footballRest);
        });
    })();
    
