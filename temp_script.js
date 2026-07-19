
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
            // Scroll active tab into view horizontally
            const el = document.getElementById('tab-roster');
            if (el && el.parentElement) {
                const container = el.parentElement;
                const scrollLeft = el.offsetLeft - (container.clientWidth / 2) + (el.clientWidth / 2);
                container.scrollTo({ left: scrollLeft });
            }

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
                    const elFootballContainer = document.getElementById('analysis-container-football');
                    if (analysis.trim() !== '') {
                        document.getElementById('analysis-text-football').innerHTML = analysis.split(/\n+/).map(p => `<p class="mb-4">${p}</p>`).join('');
                        if (elFootballContainer) elFootballContainer.style.display = 'block';
                    } else {
                        if (elFootballContainer) elFootballContainer.style.display = 'none';
                    }
                } else {
                    renderPitchPlayers('pitch-starting', footballStarting);
                    renderPitchPlayers('pitch-bench', footballBench);
                    renderSquadList('squad-rest-football', footballRest);
                    document.getElementById('analysis-text-football').innerHTML = '<p>Ο Παναθηναϊκός δείχνει να διαθέτει εξαιρετικό βάθος στο φετινό ρόστερ του, με ποιοτικές επιλογές σε κάθε γραμμή. Η προσθήκη των Τετέ και Πελίστρι δίνει ταχύτητα στα άκρα, ενώ ο Ιωαννίδης παραμένει η αιχμή του δόρατος στην επίθεση.</p>';
                }

                // Fetch Basketball Roster
                const { data: bData } = await db.from('articles')
                    .select('*')
                    .eq('source_url', 'opinion://system-roster-basketball')
                    .maybeSingle();

                if (bData && bData.bullets && bData.bullets.length >= 3) {
                    const starting = JSON.parse(bData.bullets[0]);
                    const backup = JSON.parse(bData.bullets[1]);
                    const rest = JSON.parse(bData.bullets[2]);
                    const analysis = bData.content || '';

                    renderCourtPlayers('court-starting', starting);
                    renderCourtPlayers('court-backup', backup);
                    renderSquadList('squad-rest-basketball', rest);
                    const elBasketballContainer = document.getElementById('analysis-container-basketball');
                    if (analysis.trim() !== '') {
                        document.getElementById('analysis-text-basketball').innerHTML = analysis.split(/\n+/).map(p => `<p class="mb-4">${p}</p>`).join('');
                        if (elBasketballContainer) elBasketballContainer.style.display = 'block';
                    } else {
                        if (elBasketballContainer) elBasketballContainer.style.display = 'none';
                    }
                } else {
                    renderCourtPlayers('court-starting', basketballStarting);
                    renderCourtPlayers('court-backup', basketballBackup);
                    renderSquadList('squad-rest-basketball', basketballRest);
                    document.getElementById('analysis-text-basketball').innerHTML = '<p>Με τον Εργκίν Αταμάν στο τιμόνι, ο Παναθηναϊκός AKTOR διαθέτει μια από τις ισχυρότερες περιφέρειες στην Ευρώπη. Η παρουσία του Σλούκα ως ηγέτη και το βάθος στους ψηλούς προσφέρουν τεράστια τακτική ευελιξία.</p>';
                }

                
            } catch (err) {
                console.error('Error loading dynamic roster:', err);
                // Football fallback
                renderPitchPlayers('pitch-starting', footballStarting);
                renderPitchPlayers('pitch-bench', footballBench);
                renderSquadList('squad-rest-football', footballRest);
                document.getElementById('analysis-text-football').innerHTML = '<p>Ο Παναθηναϊκός δείχνει να διαθέτει εξαιρετικό βάθος στο φετινό ρόστερ του, με ποιοτικές επιλογές σε κάθε γραμμή.</p>';
                
                // Basketball fallback
                renderCourtPlayers('court-starting', basketballStarting);
                renderCourtPlayers('court-backup', basketballBackup);
                renderSquadList('squad-rest-basketball', basketballRest);
                document.getElementById('analysis-text-basketball').innerHTML = '<p>Με τον Εργκίν Αταμάν στο τιμόνι, ο Παναθηναϊκός AKTOR διαθέτει μια από τις ισχυρότερες περιφέρειες στην Ευρώπη.</p>';
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // SPORT SWITCHER
        // ─────────────────────────────────────────────────────────────────
        function switchSport(sport) {
            const isFootball = sport === 'football';
            document.getElementById('view-football').classList.toggle('hidden', !isFootball);
            document.getElementById('view-basketball').classList.toggle('hidden', isFootball);

            document.getElementById('tab-football').className = isFootball
                ? 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider border border-primary bg-primary/10 text-primary transition-all'
                : 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all';
            document.getElementById('tab-basketball').className = !isFootball
                ? 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider border border-primary bg-primary/10 text-primary transition-all'
                : 'px-6 py-2.5 rounded-full font-label text-label uppercase tracking-wider border border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all';
        }
        window.switchSport = switchSport;

        // ─────────────────────────────────────────────────────────────────
        // INIT
        // ─────────────────────────────────────────────────────────────────
        // Initialization handled by Supabase loader above

// Fetch latest news
let streamPage = 1;
let streamHasMore = true;
let isFetchingMore = false;

async function fetchMoreRosterNews() {
    if (isFetchingMore || !streamHasMore) return;
    isFetchingMore = true;
    try {
        const res = await fetch(`/api/articles?page=${streamPage}`);
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
            const grid = document.getElementById('more-news-grid');
            const html = data.articles.map(a => {
                const date = new Date(a.created_at).toLocaleDateString('el-GR', {day:'2-digit', month:'2-digit', year:'numeric'});
                const slug = (a.title || '').toLowerCase().replace(/[^a-z0-9\u0370-\u03ff]+/g, '-').replace(/(^-|-$)/g, '');
                let cat = 'podosfairo';
                if (a.category === '\u039C\u03C0\u03AC\u03C3\u03BA\u03B5\u03C4') cat = 'basket'; // Μπάσκετ
                if (a.category === '\u0395\u03C1\u03B1\u03C3\u03B9\u03C4\u03AD\u03C7\u03BD\u03B7\u03C2') cat = 'erasitexnis'; // Ερασιτέχνης
                const url = `/${cat}/${slug}-id=${a.id}`;
                const img = a.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
                return `
                <a class="group cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container/30 flex flex-col overflow-hidden card-hover h-full" href="${url}">
                    <div class="relative w-full shrink-0 overflow-hidden" style="padding-top: 56.25%;">
                        <img referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${img}" alt="${a.title}" loading="lazy" onerror="this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY'"/>
                    </div>
                    <div class="p-5 flex flex-col flex-1">
                        <span class="font-label text-label text-primary uppercase mb-1">${date}</span>
                        <h3 class="font-h4 text-h4 leading-tight group-hover:text-primary transition-colors">${a.title}</h3>
                    </div>
                </a>`;
            }).join('');
            grid.insertAdjacentHTML('beforeend', html);
            document.getElementById('more-news-section').classList.remove('hidden');
            streamPage++;
        }
        if (!data.has_more) {
            streamHasMore = false;
            const sentinel = document.getElementById('roster-sentinel');
            if (sentinel) sentinel.style.display = 'none';
        }
    } catch (err) {
        console.error('Error fetching more news:', err);
    } finally {
        isFetchingMore = false;
    }
}

fetchMoreRosterNews();
const sentinelHTML = `<div id="roster-sentinel" class="py-12 flex justify-center hidden"><div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>`;
document.getElementById('more-news-section').insertAdjacentHTML('afterend', sentinelHTML);

const sentinel = document.getElementById('roster-sentinel');
if (sentinel && streamHasMore) {
    sentinel.classList.remove('hidden');
    const observer = new IntersectionObserver(async entries => {
        if (entries[0].isIntersecting && !isFetchingMore && streamHasMore) {
            await fetchMoreRosterNews();
        }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
}

    })();
    