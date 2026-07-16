// ── Roster & Analysis Editing Logic ──────────────────────────────────────────
const footballStartingDefault = [
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
    [82, 22, 'ΠΕΛ', 'Πελίστρι', 11, 'LW']
];

const footballBenchDefault = [
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
    [65, 22, 'ΙΝΓ', 'Ίνγκασον', 21, 'ST']
];

const footballRestDefault = [
    { initials:'ΑΛΕ', name:'Αλεξανδρόπουλος', num:24, pos:'GK', detail:'3ος Τερματοφύλακας' },
    { initials:'ΜΠΙ', name:'Μπίλε', num:25, pos:'CB', detail:'Ελεύθερος Ροφ' },
    { initials:'ΣΑΝ', name:'Σάντσεζ', num:26, pos:'RB', detail:'Νεαρό Ταλέντο' },
    { initials:'ΚΑΡ', name:'Καρβαλιό', num:27, pos:'CAM', detail:'Ερασιτεχνική Τμήμα' },
    { initials:'ΔΗΜ', name:'Δημητρίου', num:28, pos:'LW', detail:'U21' },
    { initials:'ΠΑΠ', name:'Παπαδόπουλος', num:29, pos:'CM', detail:'Academy' }
];

const basketballStartingDefault = [
    [50, 82, 'ΣΛ', 'Σλούκας', 'PG'],
    [20, 65, 'ΛΟΥ', 'Λούντζης', 'SG'],
    [80, 65, 'ΗΛ', 'Ηλιόπουλος', 'SF'],
    [30, 38, 'ΠΑΠ', 'Παπαπέτρου', 'PF'],
    [70, 38, 'ΜΙΤ', 'Μιτόγλου', 'C']
];

const basketballBackupDefault = [
    [50, 80, 'ΛΑΡ', 'Λαρεντζάκης', 'PG'],
    [20, 60, 'ΒΟΥ', 'Βουγιούκας', 'SG'],
    [80, 60, 'ΠΑΛ', 'Παλμέρ', 'SF'],
    [35, 35, 'ΓΙΑ', 'Γιαννόπουλος', 'PF'],
    [65, 35, 'ΟΑΥ', 'Ουάιτ', 'C']
];

const basketballRestDefault = [
    { initials:'ΔΑΡ', name:'Δάρα', pos:'C', detail:'Βαθιά Ρότα' },
    { initials:'ΠΑΠ', name:'Παπαγεωργίου', pos:'PG', detail:'Academy' },
    { initials:'ΤΣΑ', name:'Τσαϊρέλης', pos:'SF', detail:'Two-Way' },
    { initials:'ΑΓΓ', name:'Αγγελόπουλος', pos:'SG', detail:'U22' }
];

let currentRoster = {
    football: {
        starting: [],
        bench: [],
        rest: []
    },
    basketball: {
        starting: [],
        backup: [],
        rest: []
    }
};

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-panel-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`panel-section-${tab}`).classList.remove('hidden');

    // Style active sidebar menu items
    ['opinion', 'football', 'basketball', 'analytics-ingestion', 'analytics-engagement'].forEach(t => {
        const btn = document.getElementById(`admin-tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = 'w-full flex items-center gap-4 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold transition-all duration-200 active:scale-95 text-left';
            } else {
                btn.className = 'w-full flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl font-body transition-all duration-200 active:scale-95 text-left';
            }
        }
    });

    if (tab === 'analytics-ingestion') {
        loadScraperRuns();
    }
    if (tab === 'analytics-engagement') {
        loadEngagementStats();
    }
}
window.switchAdminTab = switchAdminTab;

// ── Ingestion Runs Fetching & Inspectors ───────────────────────────────────
let runsCached = [];
let selectedRunId = null;

async function loadScraperRuns() {
    const listContainer = document.getElementById('runs-list-container');
    const refreshIcon = document.getElementById('refresh-runs-icon');
    
    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    
    try {
        const { data, error } = await db.from('scraping_runs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(40);
            
        if (error) throw error;
        
        runsCached = data || [];
        renderRunsList();
        
        // Auto-select first run if none selected
        if (runsCached.length > 0 && !selectedRunId) {
            selectRun(runsCached[0].id);
        } else if (selectedRunId) {
            selectRun(selectedRunId);
        } else {
            document.getElementById('run-inspector-card').innerHTML = `
                <div class="text-center text-on-surface-variant/40 py-16">Δεν βρέθηκαν εκτελέσεις στη βάση.</div>
            `;
        }
    } catch (err) {
        console.error('Failed to load runs:', err);
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="text-center text-error py-8 text-xs font-semibold">❌ Σφάλμα σύνδεσης: ${err.message}</div>
            `;
        }
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    }
}
window.loadScraperRuns = loadScraperRuns;

function renderRunsList() {
    const container = document.getElementById('runs-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (runsCached.length === 0) {
        container.innerHTML = `<div class="text-center text-on-surface-variant/40 py-8">Δεν βρέθηκαν εκτελέσεις.</div>`;
        return;
    }
    
    runsCached.forEach(run => {
        const date = new Date(run.started_at);
        const dateStr = date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
        const timeStr = date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
        
        const isSuccess = run.status === 'success';
        const activeClass = run.id === selectedRunId 
            ? 'border-primary bg-primary/5' 
            : 'border-outline-variant/30 hover:border-primary/40 bg-surface-container-low';
            
        const statusDot = isSuccess 
            ? '<span class="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>'
            : '<span class="w-2.5 h-2.5 rounded-full bg-error inline-block animate-pulse"></span>';
            
        const card = document.createElement('div');
        card.className = `p-4 border rounded-xl cursor-pointer transition-all duration-200 active:scale-98 ${activeClass}`;
        card.onclick = () => selectRun(run.id);
        
        const skipped = run.stats?.totals 
            ? (run.stats.totals.skipped_duplicate || 0) + (run.stats.totals.skipped_relevance || 0) + (run.stats.totals.skipped_size || 0) + (run.stats.totals.skipped_crawling_failed || 0) + (run.stats.totals.skipped_technical_error || 0) + (run.stats.totals.skipped_other || 0)
            : 0;
            
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono font-bold text-on-surface-variant/75">${dateStr} · ${timeStr}</span>
                ${statusDot}
            </div>
            <div class="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Νέα: <strong class="text-primary">${run.stats?.totals?.added || 0}</strong></span>
                <span>Merge: <strong class="text-tertiary">${run.stats?.totals?.merged || 0}</strong></span>
                <span>Skipped: <strong>${skipped}</strong></span>
            </div>
        `;
        container.appendChild(card);
    });
}

function selectRun(runId) {
    selectedRunId = runId;
    renderRunsList(); // Refresh active highlight
    
    const run = runsCached.find(r => r.id === runId);
    const inspector = document.getElementById('run-inspector-card');
    if (!run || !inspector) return;
    
    const dateStart = new Date(run.started_at);
    const dateEnd = new Date(run.completed_at);
    const durationSec = Math.round((dateEnd - dateStart) / 1000);
    const isSuccess = run.status === 'success';
    
    const statusBadge = isSuccess 
        ? '<div class="status-badge status-success">Success</div>'
        : '<div class="status-badge status-error">Failed</div>';
        
    const totals = run.stats?.totals || {};
    const sources = run.stats?.sources || {};
    const recentErrors = run.stats?.recent_errors || [];
    
    const skipped = (totals.skipped_duplicate || 0) + (totals.skipped_relevance || 0) + (totals.skipped_size || 0) + (totals.skipped_crawling_failed || 0) + (totals.skipped_technical_error || 0) + (totals.skipped_other || 0);
    const errorsCount = recentErrors.length + (run.status === 'failed' ? 1 : 0);

    // Build a map of source → error code for highlighting 0-scraped sources
    const sourceErrorMap = {};
    recentErrors.forEach(err => {
        if (err.source && !sourceErrorMap[err.source]) {
            // Extract HTTP status code from message, e.g. "Request failed with status code 403"
            const codeMatch = err.message && err.message.match(/(\d{3})/);
            sourceErrorMap[err.source] = codeMatch ? codeMatch[1] : 'ERR';
        }
    });
    
    // Fatal run error alert
    let fatalAlertHtml = '';
    if (run.error_message) {
        fatalAlertHtml = `
            <div class="bg-error/10 text-error p-4 rounded-xl border border-error/20 mb-6 font-mono text-xs whitespace-pre-wrap text-left">
                <h5 class="font-bold mb-2 flex items-center gap-2 text-sm uppercase">
                    <span class="material-symbols-outlined text-[18px]">warning</span> Fatal Scraper Crash
                </h5>
                ${run.error_message}
            </div>
        `;
    }
    
    // Generate recent errors markup
    let errorsListHtml = '<div class="text-on-surface-variant/40 py-2 italic text-left">Δεν καταγράφηκαν σφάλματα κατά τη διάρκεια αυτής της εκτέλεσης.</div>';
    if (recentErrors.length > 0) {
        errorsListHtml = recentErrors.map(err => {
            const errDate = new Date(err.time);
            const timeStr = errDate.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `
                <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 flex flex-col gap-1 text-left">
                    <div class="flex justify-between items-center text-[10px] text-on-surface-variant/50">
                        <span class="font-bold text-primary">${err.source}</span>
                        <span>${timeStr} · Type: <strong class="text-tertiary">${err.type}</strong></span>
                    </div>
                    ${err.url ? `<a href="${err.url}" target="_blank" class="text-[10px] text-primary/75 hover:underline break-all mb-1">${err.url}</a>` : ''}
                    <div class="text-on-surface text-[11px] font-mono leading-normal bg-background/50 p-2 rounded border border-outline-variant/10 break-words">${err.message}</div>
                </div>
            `;
        }).join('');
    }

    // Build target rows
    let tableRowsHtml = '';
    Object.keys(sources).forEach(srcKey => {
        const src = sources[srcKey];
        const srcSkipped = (src.skipped_duplicate || 0) + (src.skipped_relevance || 0) + (src.skipped_size || 0) + (src.skipped_crawling_failed || 0) + (src.skipped_technical_error || 0) + (src.skipped_other || 0);
        const scraped = src.scraped || 0;
        const relevance = src.skipped_relevance || 0;
        
        // If scraped=0 and source appears in recent_errors, show the error badge
        const errCode = scraped === 0 ? sourceErrorMap[srcKey] : null;
        const scrapedCell = errCode
            ? `<span class="font-mono text-red-400">0</span><span title="${errCode} error" class="ml-1.5 inline-flex items-center gap-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider cursor-help">⚠ ${errCode}</span>`
            : `<span class="font-mono">${scraped}</span>`;
        
        // Colour relevance only if non-zero
        const relevanceCell = relevance > 0
            ? `<span class="font-mono text-yellow-400 font-semibold">${relevance}</span>`
            : `<span class="font-mono text-on-surface-variant/40">0</span>`;
        
        tableRowsHtml += `
            <tr class="border-b border-outline-variant/10 text-xs text-on-surface-variant hover:bg-surface-container-high/20">
                <td class="py-3 px-4 font-bold text-on-surface text-left">${srcKey}</td>
                <td class="py-3 px-4 text-center">${scrapedCell}</td>
                <td class="py-3 px-4 text-center font-mono text-primary font-semibold">${src.added || 0}</td>
                <td class="py-3 px-4 text-center font-mono text-tertiary font-semibold">${src.merged || 0}</td>
                <td class="py-3 px-4 text-center font-mono text-red-400">${src.skipped_crawling_failed || 0}</td>
                <td class="py-3 px-4 text-center font-mono text-red-500">${src.skipped_technical_error || 0}</td>
                <td class="py-3 px-4 text-center">${relevanceCell}</td>
                <td class="py-3 px-4 text-center font-mono">${srcSkipped}</td>
            </tr>
        `;
    });

    inspector.innerHTML = `
        <!-- Header details -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 text-left">
            <div>
                <div class="flex items-center gap-3">
                    <h4 class="font-bold text-lg text-on-surface">Run Details</h4>
                    ${statusBadge}
                </div>
                <p class="text-xs text-on-surface-variant font-mono mt-1">ID: ${run.id}</p>
            </div>
            <div class="text-left md:text-right">
                <p class="text-xs text-on-surface-variant">Έναρξη: <span class="font-bold text-on-surface">${dateStart.toLocaleString('el-GR')}</span></p>
                <p class="text-xs text-on-surface-variant mt-1">Διάρκεια: <span class="font-bold text-on-surface">${durationSec}s</span></p>
            </div>
        </div>

        ${fatalAlertHtml}

        <!-- Metrics cards row -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-center">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">Scraped</p>
                <h4 class="text-xl font-bold text-on-surface">${totals.scraped || 0}</h4>
            </div>
            <div class="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-center">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">Added (New)</p>
                <h4 class="text-xl font-bold text-primary">${totals.added || 0}</h4>
            </div>
            <div class="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-center">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">Merged</p>
                <h4 class="text-xl font-bold text-tertiary">${totals.merged || 0}</h4>
            </div>
            <div class="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-center">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">Exclusions</p>
                <h4 class="text-xl font-bold text-on-surface">${skipped}</h4>
            </div>
            <div onclick="document.getElementById('recent-errors-container').scrollIntoView({ behavior: 'smooth' })" class="bg-surface-container-low border border-outline-variant/30 hover:border-error/40 p-4 rounded-xl text-center cursor-pointer transition-colors group">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1 group-hover:text-error/70 transition-colors">Errors / Failed</p>
                <h4 class="text-xl font-bold text-error">${errorsCount}</h4>
            </div>
        </div>

        <!-- Skips breakdown panel -->
        <div class="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 text-left">
            <h5 class="text-xs uppercase tracking-wider text-primary font-bold mb-4">Ανάλυση Απορρίψεων & Φίλτρων</h5>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs text-on-surface-variant">
                <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                    <span class="flex items-center gap-1.5 cursor-help">
                        <span>Διπλότυπα URL (Duplicates)</span>
                        <span class="relative group inline-flex items-center">
                            <span class="material-symbols-outlined text-on-surface-variant/50 text-[14px]">help</span>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1e2024] border border-outline-variant text-[11px] text-on-surface/90 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 text-left line-clamp-4 leading-relaxed normal-case font-normal">
                                Αυτά τα άρθρα έχουν ήδη εισαχθεί στη βάση δεδομένων από το ίδιο URL και αγνοήθηκαν για την αποφυγή διπλότυπων.
                            </span>
                        </span>
                    </span>
                    <strong class="font-mono text-on-surface">${totals.skipped_duplicate || 0}</strong>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                    <span class="flex items-center gap-1.5 cursor-help">
                        <span>Άσχετο Περιεχόμενο (Relevance)</span>
                        <span class="relative group inline-flex items-center">
                            <span class="material-symbols-outlined text-on-surface-variant/50 text-[14px]">help</span>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1e2024] border border-outline-variant text-[11px] text-on-surface/90 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 text-left line-clamp-4 leading-relaxed normal-case font-normal">
                                Το AI αξιολόγησε το άρθρο ως μη σχετικό με τον Παναθηναϊκό.
                            </span>
                        </span>
                    </span>
                    <strong class="font-mono text-on-surface">${totals.skipped_relevance || 0}</strong>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                    <span class="flex items-center gap-1.5 cursor-help">
                        <span>Μικρό Κείμενο / Video (Size)</span>
                        <span class="relative group inline-flex items-center">
                            <span class="material-symbols-outlined text-on-surface-variant/50 text-[14px]">help</span>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1e2024] border border-outline-variant text-[11px] text-on-surface/90 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 text-left line-clamp-4 leading-relaxed normal-case font-normal">
                                Άρθρα με πολύ μικρό κείμενο (π.χ. video-only άρθρα, tweets ή φωτογραφίες).
                            </span>
                        </span>
                    </span>
                    <strong class="font-mono text-on-surface">${totals.skipped_size || 0}</strong>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                    <span class="flex items-center gap-1.5 cursor-help">
                        <span>Αποτυχία Φόρτωσης (Crawl Failed)</span>
                        <span class="relative group inline-flex items-center">
                            <span class="material-symbols-outlined text-on-surface-variant/50 text-[14px]">help</span>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1e2024] border border-outline-variant text-[11px] text-on-surface/90 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 text-left line-clamp-4 leading-relaxed normal-case font-normal">
                                Αδυναμία λήψης της σελίδας λόγω σφαλμάτων δικτύου, 404 ή Cloudflare block.
                            </span>
                        </span>
                    </span>
                    <strong class="font-mono text-on-surface text-red-400">${totals.skipped_crawling_failed || 0}</strong>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                    <span class="flex items-center gap-1.5 cursor-help">
                        <span>Σφάλματα API/DB (Errors)</span>
                        <span class="relative group inline-flex items-center">
                            <span class="material-symbols-outlined text-on-surface-variant/50 text-[14px]">help</span>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1e2024] border border-outline-variant text-[11px] text-on-surface/90 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 text-left line-clamp-4 leading-relaxed normal-case font-normal">
                                Σφάλματα API Gemini (quota/rate limit) ή σφάλματα Supabase DB. Κάντε κλικ στο Error card για να δείτε τα logs.
                            </span>
                        </span>
                    </span>
                    <strong class="font-mono text-on-surface text-red-500">${totals.skipped_technical_error || 0}</strong>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                    <span class="flex items-center gap-1.5 cursor-help">
                        <span>Προωθητικά / Άλλα (Other)</span>
                        <span class="relative group inline-flex items-center">
                            <span class="material-symbols-outlined text-on-surface-variant/50 text-[14px]">help</span>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1e2024] border border-outline-variant text-[11px] text-on-surface/90 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 text-left line-clamp-4 leading-relaxed normal-case font-normal">
                                Διαφημιστικά άρθρα, Live WebTV εκπομπές ή άρθρα που εξαιρέθηκαν βάσει φίλτρων τίτλου.
                            </span>
                        </span>
                    </span>
                    <strong class="font-mono text-on-surface">${totals.skipped_other || 0}</strong>
                </div>
            </div>
        </div>

        <!-- Target by Target stats table -->
        <div class="bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden text-left">
            <div class="p-5 border-b border-outline-variant/20">
                <h5 class="text-xs uppercase tracking-wider text-primary font-bold">Ανάλυση ανά Πηγή</h5>
            </div>
            <div class="overflow-x-auto w-full">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-surface-container-high/50 text-[10px] uppercase font-bold text-on-surface-variant/70 border-b border-outline-variant/30">
                            <th class="py-3 px-4">Πηγή</th>
                            <th class="py-3 px-4 text-center">Scraped</th>
                            <th class="py-3 px-4 text-center">Added</th>
                            <th class="py-3 px-4 text-center">Merged</th>
                            <th class="py-3 px-4 text-center text-red-400/80">Crawl Fail</th>
                            <th class="py-3 px-4 text-center text-red-500/80">Errors</th>
                            <th class="py-3 px-4 text-center text-yellow-400/80">Relevance</th>
                            <th class="py-3 px-4 text-center">Skipped</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant/10">
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Recent errors card list -->
        <div id="recent-errors-container" class="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 text-left">
            <h5 class="text-xs uppercase tracking-wider text-error font-bold mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">error</span> Logs / Σφάλματα Συστήματος
            </h5>
            <div class="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                ${errorsListHtml}
            </div>
        </div>
    `;
}


async function loadRostersForEditing() {
    try {
        // Fetch Football
        const { data: fData } = await db.from('articles')
            .select('*')
            .eq('source_url', 'opinion://system-roster-football')
            .maybeSingle();

        if (fData && fData.bullets && fData.bullets.length >= 3) {
            document.getElementById('roster-football-analysis').value = fData.content || '';
            currentRoster.football.starting = JSON.parse(fData.bullets[0]);
            currentRoster.football.bench = JSON.parse(fData.bullets[1]);
            currentRoster.football.rest = JSON.parse(fData.bullets[2]);
        } else {
            document.getElementById('roster-football-analysis').value = 'Ο Παναθηναϊκός δείχνει να διαθέτει εξαιρετικό βάθος στο φετινό ρόστερ του, με ποιοτικές επιλογές σε κάθε γραμμή. Η προσθήκη των Τετέ και Πελίστρι δίνει ταχύτητα στα άκρα, ενώ ο Ιωαννίδης παραμένει η αιχμή του δόρατος στην επίθεση.';
            currentRoster.football.starting = JSON.parse(JSON.stringify(footballStartingDefault));
            currentRoster.football.bench = JSON.parse(JSON.stringify(footballBenchDefault));
            currentRoster.football.rest = JSON.parse(JSON.stringify(footballRestDefault));
        }

        // Fetch Basketball
        const { data: bData } = await db.from('articles')
            .select('*')
            .eq('source_url', 'opinion://system-roster-basketball')
            .maybeSingle();

        if (bData && bData.bullets && bData.bullets.length >= 3) {
            document.getElementById('roster-basketball-analysis').value = bData.content || '';
            currentRoster.basketball.starting = JSON.parse(bData.bullets[0]);
            currentRoster.basketball.backup = JSON.parse(bData.bullets[1]);
            currentRoster.basketball.rest = JSON.parse(bData.bullets[2]);
        } else {
            document.getElementById('roster-basketball-analysis').value = 'Με τον Εργκίν Αταμάν στο τιμόνι, ο Παναθηναϊκός AKTOR διαθέτει μια από τις ισχυρότερες περιφέρειες στην Ευρώπη. Η παρουσία του Σλούκα ως ηγέτη και το βάθος στους ψηλούς προσφέρουν τεράστια τακτική ευελιξία.';
            currentRoster.basketball.starting = JSON.parse(JSON.stringify(basketballStartingDefault));
            currentRoster.basketball.backup = JSON.parse(JSON.stringify(basketballBackupDefault));
            currentRoster.basketball.rest = JSON.parse(JSON.stringify(basketballRestDefault));
        }

        // Populate JSON Textareas
        document.getElementById('roster-football-starting').value = JSON.stringify(currentRoster.football.starting, null, 2);
        document.getElementById('roster-football-bench').value = JSON.stringify(currentRoster.football.bench, null, 2);
        document.getElementById('roster-football-rest').value = JSON.stringify(currentRoster.football.rest, null, 2);

        document.getElementById('roster-basketball-starting').value = JSON.stringify(currentRoster.basketball.starting, null, 2);
        document.getElementById('roster-basketball-backup').value = JSON.stringify(currentRoster.basketball.backup, null, 2);
        document.getElementById('roster-basketball-rest').value = JSON.stringify(currentRoster.basketball.rest, null, 2);

        // Render Visual Components
        adminRenderRosterSection('football', 'starting');
        adminRenderRosterSection('football', 'bench');
        adminRenderReserves('football');

        adminRenderRosterSection('basketball', 'starting');
        adminRenderRosterSection('basketball', 'backup');
        adminRenderReserves('basketball');

    } catch (err) {
        console.error('Error loading rosters for editing:', err);
    }
}

// Visual rendering
function adminRenderRosterSection(sport, rosterType) {
    const isFb = sport === 'football';
    const containerId = `admin-${isFb ? 'pitch' : 'court'}-${rosterType}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear old draggable player tokens
    container.querySelectorAll('.draggable-player').forEach(el => el.remove());
    
    const players = currentRoster[sport][rosterType];
    players.forEach((player, idx) => {
        const left = player[0];
        const top = player[1];
        const initials = player[2];
        const name = player[3];
        
        let avatarInner = '';
        if (isFb) {
            const num = player[4];
            const pos = player[5];
            avatarInner = `
                <div class="avatar" style="position:relative;">
                    ${num}
                    <div class="badge">${pos || initials}</div>
                </div>
            `;
        } else {
            const num = idx + 1;
            const pos = player[4];
            avatarInner = `
                <div class="avatar" style="position:relative;">
                    ${num}
                    <div class="badge">${pos || ''}</div>
                </div>
            `;
        }

        const token = document.createElement('div');
        token.className = `draggable-player ${sport}`;
        token.style.left = left + '%';
        token.style.top = top + '%';
        
        token.innerHTML = `
            ${avatarInner}
            <div class="name-tag">${name}</div>
        `;
        
        container.appendChild(token);
        
        setupDraggableToken(token, sport, rosterType, idx);
    });
}

function setupDraggableToken(token, sport, rosterType, idx) {
    let lastX = 0;
    let lastY = 0;
    let totalMoveDist = 0;
    let isDragging = false;
    let dragStartOffset = { x: 0, y: 0 };
    
    const onStart = (e) => {
        isDragging = true;
        totalMoveDist = 0;
        token.classList.add('dragging');
        
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        
        lastX = clientX;
        lastY = clientY;
        
        const rect = token.parentElement.getBoundingClientRect();
        dragStartOffset = {
            offsetX: clientX - (rect.left + (parseFloat(token.style.left) / 100) * rect.width),
            offsetY: clientY - (rect.top + (parseFloat(token.style.top) / 100) * rect.height)
        };
        
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
        
        if (e.cancelable) e.preventDefault();
    };
    
    const onMove = (e) => {
        if (!isDragging) return;
        
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        
        totalMoveDist += Math.abs(clientX - lastX) + Math.abs(clientY - lastY);
        lastX = clientX;
        lastY = clientY;
        
        const container = token.parentElement;
        const rect = container.getBoundingClientRect();
        
        let leftPx = clientX - rect.left - dragStartOffset.offsetX;
        let topPx = clientY - rect.top - dragStartOffset.offsetY;
        
        let leftPct = Math.min(Math.max(0, (leftPx / rect.width) * 100), 100);
        let topPct = Math.min(Math.max(0, (topPx / rect.height) * 100), 100);
        
        leftPct = Math.round(leftPct);
        topPct = Math.round(topPct);
        
        token.style.left = leftPct + '%';
        token.style.top = topPct + '%';
        
        const list = currentRoster[sport][rosterType];
        if (list[idx]) {
            list[idx][0] = leftPct;
            list[idx][1] = topPct;
            
            const rawId = `roster-${sport}-${rosterType}`;
            const textarea = document.getElementById(rawId);
            if (textarea) {
                textarea.value = JSON.stringify(list, null, 2);
            }
        }
        
        if (e.cancelable) e.preventDefault();
    };
    
    const onEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        token.classList.remove('dragging');
        
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
        
        if (totalMoveDist < 8) {
            showPopoverForPlayer(sport, rosterType, idx, token);
        }
    };
    
    token.addEventListener('mousedown', onStart);
    token.addEventListener('touchstart', onStart, { passive: false });
}

let selectedPlayerInfo = null;

function showPopoverForPlayer(sport, rosterType, idx, token) {
    selectedPlayerInfo = { sport, rosterType, idx, token };
    
    const rosterList = currentRoster[sport][rosterType];
    const player = rosterList[idx];
    if (!player) return;
    
    document.getElementById('popover-initials').value = player[2] || '';
    document.getElementById('popover-name').value = player[3] || '';
    
    const labelEl = document.getElementById('popover-badge-label');
    const badgeInput = document.getElementById('popover-badge');
    const extraWrapper = document.getElementById('popover-extra-wrapper');
    const extraInput = document.getElementById('popover-extra-input');
    
    if (sport === 'football') {
        labelEl.textContent = 'Νούμερο';
        badgeInput.value = player[4] || '';
        
        if (extraWrapper && extraInput) {
            extraWrapper.classList.remove('hidden');
            document.getElementById('popover-extra-label').textContent = 'Θέση';
            extraInput.value = player[5] || '';
        }
    } else {
        labelEl.textContent = 'Θέση';
        badgeInput.value = player[4] || '';
        if (extraWrapper) extraWrapper.classList.add('hidden');
    }
    
    const popover = document.getElementById('player-edit-popover');
    popover.classList.remove('hidden');
    
    const tokenRect = token.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    
    let popoverLeft = tokenRect.left - bodyRect.left + 50;
    let popoverTop = tokenRect.top - bodyRect.top - 80;
    
    popover.style.left = popoverLeft + 'px';
    popover.style.top = popoverTop + 'px';
    
    document.querySelectorAll('.draggable-player').forEach(el => el.classList.remove('selected'));
    token.classList.add('selected');
}

function closePopover() {
    document.getElementById('player-edit-popover').classList.add('hidden');
    document.querySelectorAll('.draggable-player').forEach(el => el.classList.remove('selected'));
    selectedPlayerInfo = null;
}

function savePopoverChanges() {
    if (!selectedPlayerInfo) return;
    const { sport, rosterType, idx } = selectedPlayerInfo;
    const rosterList = currentRoster[sport][rosterType];
    if (!rosterList[idx]) return;
    
    const newInitials = document.getElementById('popover-initials').value.trim() || 'ΠΑΙ';
    const newName = document.getElementById('popover-name').value.trim() || 'Παίκτης';
    const newBadge = document.getElementById('popover-badge').value.trim() || '';
    
    rosterList[idx][2] = newInitials;
    rosterList[idx][3] = newName;
    rosterList[idx][4] = newBadge;
    
    if (sport === 'football') {
        const extraInput = document.getElementById('popover-extra-input');
        if (extraInput) {
            rosterList[idx][5] = extraInput.value.trim();
        }
    }
    
    const rawId = `roster-${sport}-${rosterType}`;
    const textarea = document.getElementById(rawId);
    if (textarea) {
        textarea.value = JSON.stringify(rosterList, null, 2);
    }
    
    adminRenderRosterSection(sport, rosterType);
    closePopover();
}

function deleteSelectedPlayer() {
    if (!selectedPlayerInfo) return;
    const { sport, rosterType, idx } = selectedPlayerInfo;
    const rosterList = currentRoster[sport][rosterType];
    
    rosterList.splice(idx, 1);
    
    const rawId = `roster-${sport}-${rosterType}`;
    const textarea = document.getElementById(rawId);
    if (textarea) {
        textarea.value = JSON.stringify(rosterList, null, 2);
    }
    
    adminRenderRosterSection(sport, rosterType);
    closePopover();
}

function addPlayer(sport, rosterType) {
    const rosterList = currentRoster[sport][rosterType];
    const defaultPlayer = sport === 'football' 
        ? [50, 50, 'NEW', 'Νέος Παίκτης', rosterType === 'starting' ? 10 : 12]
        : [50, 50, 'NEW', 'Νέος Παίκτης', 'SG'];
        
    rosterList.push(defaultPlayer);
    
    const rawId = `roster-${sport}-${rosterType}`;
    const textarea = document.getElementById(rawId);
    if (textarea) {
        textarea.value = JSON.stringify(rosterList, null, 2);
    }
    
    adminRenderRosterSection(sport, rosterType);
    
    setTimeout(() => {
        const containerId = `admin-${sport === 'football' ? 'pitch' : 'court'}-${rosterType}`;
        const container = document.getElementById(containerId);
        if (container) {
            const tokens = container.querySelectorAll('.draggable-player');
            const lastToken = tokens[tokens.length - 1];
            if (lastToken) {
                showPopoverForPlayer(sport, rosterType, rosterList.length - 1, lastToken);
            }
        }
    }, 100);
}

// Reserves
function adminRenderReserves(sport) {
    const container = document.getElementById(`admin-reserves-${sport}`);
    if (!container) return;
    
    const restList = currentRoster[sport].rest;
    container.innerHTML = '';
    
    if (restList.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-sm text-on-surface-variant/40 py-4">Δεν υπάρχουν παίκτες στο υπόλοιπο ρόστερ.</div>`;
        return;
    }
    
    restList.forEach((player, idx) => {
        const card = document.createElement('div');
        card.className = 'flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30';
        
        let moveButtons = `
            <div class="flex flex-col gap-1 mr-1">
                <button onclick="moveReserve('${sport}', ${idx}, -1)" class="material-symbols-outlined text-on-surface-variant hover:text-primary p-0.5 text-[18px] leading-none ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}">arrow_drop_up</button>
                <button onclick="moveReserve('${sport}', ${idx}, 1)" class="material-symbols-outlined text-on-surface-variant hover:text-primary p-0.5 text-[18px] leading-none ${idx === restList.length - 1 ? 'opacity-30 pointer-events-none' : ''}">arrow_drop_down</button>
            </div>
        `;
        
        card.innerHTML = `
            ${moveButtons}
            <input type="text" value="${player.initials || ''}" placeholder="Αρχ" class="editor-input py-1 px-2 text-center text-xs font-bold w-12 text-primary" style="background:#111317;" maxlength="3" oninput="updateReserveField('${sport}', ${idx}, 'initials', this.value)"/>
            <input type="text" value="${player.name || ''}" placeholder="Όνομα" class="editor-input py-1 px-2 text-xs flex-1" style="background:#111317;" oninput="updateReserveField('${sport}', ${idx}, 'name', this.value)"/>
            <input type="text" value="${player.pos || player.num || ''}" placeholder="Θέση" class="editor-input py-1 px-2 text-xs w-16" style="background:#111317;" oninput="updateReserveField('${sport}', ${idx}, 'pos', this.value)"/>
            <input type="text" value="${player.detail || ''}" placeholder="Λεπτομέρεια" class="editor-input py-1 px-2 text-xs flex-1" style="background:#111317;" oninput="updateReserveField('${sport}', ${idx}, 'detail', this.value)"/>
            <button onclick="deleteReserve('${sport}', ${idx})" class="material-symbols-outlined text-red-400 hover:text-red-300 p-1">delete</button>
        `;
        container.appendChild(card);
    });
}

function updateReserveField(sport, idx, field, val) {
    const restList = currentRoster[sport].rest;
    if (restList[idx]) {
        restList[idx][field] = val;
        if (field === 'pos') restList[idx]['num'] = val;
        
        const textarea = document.getElementById(`roster-${sport}-rest`);
        if (textarea) {
            textarea.value = JSON.stringify(restList, null, 2);
        }
    }
}

function moveReserve(sport, idx, dir) {
    const restList = currentRoster[sport].rest;
    if (idx + dir < 0 || idx + dir >= restList.length) return;
    
    const temp = restList[idx];
    restList[idx] = restList[idx + dir];
    restList[idx + dir] = temp;
    
    const textarea = document.getElementById(`roster-${sport}-rest`);
    if (textarea) {
        textarea.value = JSON.stringify(restList, null, 2);
    }
    
    adminRenderReserves(sport);
}

function addReserve(sport) {
    const restList = currentRoster[sport].rest;
    restList.push({
        initials: 'NEW',
        name: 'Νέος Παίκτης',
        pos: sport === 'football' ? 'GK' : 'C',
        num: sport === 'football' ? 'GK' : 'C',
        detail: 'Περιγραφή'
    });
    
    const textarea = document.getElementById(`roster-${sport}-rest`);
    if (textarea) {
        textarea.value = JSON.stringify(restList, null, 2);
    }
    
    adminRenderReserves(sport);
}

function deleteReserve(sport, idx) {
    const restList = currentRoster[sport].rest;
    restList.splice(idx, 1);
    
    const textarea = document.getElementById(`roster-${sport}-rest`);
    if (textarea) {
        textarea.value = JSON.stringify(restList, null, 2);
    }
    
    adminRenderReserves(sport);
}

function syncTextareaToState(sport, type) {
    try {
        const val = document.getElementById(`roster-${sport}-${type}`).value;
        currentRoster[sport][type] = JSON.parse(val);
        if (type === 'rest') {
            adminRenderReserves(sport);
        } else {
            adminRenderRosterSection(sport, type);
        }
    } catch (e) {
        // Invalid JSON
    }
}

async function saveRoster(sport) {
    const isFb = sport === 'football';
    const statusEl = document.getElementById(`roster-${sport}-status`);
    const btn = document.getElementById(`save-${sport}-roster-btn`);

    statusEl.className = 'text-center text-sm font-semibold text-primary animate-pulse mt-4';
    statusEl.textContent = 'Αποθήκευση...';
    statusEl.classList.remove('hidden');
    btn.disabled = true;

    try {
        const analysis = document.getElementById(`roster-${sport}-analysis`).value;
        const starting = currentRoster[sport].starting;
        const benchOrBackup = currentRoster[sport][isFb ? 'bench' : 'backup'];
        const rest = currentRoster[sport].rest;

        const sourceUrl = `opinion://system-roster-${sport}`;
        const title = `${isFb ? 'Football' : 'Basketball'} Roster Data`;

        const { error } = await db.from('articles')
            .upsert({
                source_url: sourceUrl,
                title: title,
                summary: `${sport.toUpperCase()} starting squad and tactical analysis.`,
                content: analysis,
                bullets: [JSON.stringify(starting), JSON.stringify(benchOrBackup), JSON.stringify(rest)],
                category: 'SystemRoster',
                created_at: '1970-01-01T00:00:00.000Z',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'source_url'
            });

        if (error) throw error;

        statusEl.className = 'text-center text-sm font-semibold text-green-400 mt-4';
        statusEl.textContent = '✅ Αποθηκεύτηκε επιτυχώς!';
    } catch (err) {
        console.error(err);
        statusEl.className = 'text-center text-sm font-semibold text-red-400 mt-4';
        statusEl.textContent = `❌ Σφάλμα: ${err.message}`;
    } finally {
        btn.disabled = false;
        setTimeout(() => statusEl.classList.add('hidden'), 4000);
    }
}
window.saveRoster = saveRoster;

// ── Engagement & Resource Limits Dynamic Binding ───────────────────────────
async function loadEngagementStats() {
    try {
        const res = await fetch('/api/admin-stats?password=pao1908');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        
        // 1. Update Database Totals
        const dbInfo = data.database || {};
        document.getElementById('total-articles-count').textContent = dbInfo.total_articles.toLocaleString('el-GR');
        document.getElementById('manual-opinions-count').textContent = dbInfo.manual_opinions.toLocaleString('el-GR');
        document.getElementById('total-runs-count').textContent = dbInfo.total_runs.toLocaleString('el-GR');

        // 2. Update Database Size Storage Progress Bar
        const sizeMb = dbInfo.estimated_size_mb || 0;
        const limitMb = dbInfo.limit_mb || 500;
        const dbPct = Math.min(100, Math.max(0.1, (sizeMb / limitMb) * 100)).toFixed(1);
        document.getElementById('db-percentage').textContent = `${dbPct}%`;
        document.getElementById('db-progress').style.width = `${dbPct}%`;
        document.getElementById('db-usage-text').textContent = `${sizeMb} MB`;

        // 3. Update Gemini Keys List
        const geminiInfo = data.gemini || {};
        const keysContainer = document.getElementById('gemini-keys-container');
        if (keysContainer) {
            keysContainer.innerHTML = '';
            const keys = geminiInfo.keys || [];
            if (keys.length === 0) {
                keysContainer.innerHTML = `<div class="text-[11px] text-on-surface-variant/40 italic">Δεν υπάρχουν κλειδιά.</div>`;
            } else {
                keys.forEach(key => {
                    const calls = key.calls_today || 0;
                    const limit = key.limit || 1500;
                    const keyPct = Math.min(100, (calls / limit) * 100).toFixed(0);
                    
                    const isExhausted = key.status === 'exhausted';
                    const statusText = isExhausted ? 'Exhausted' : 'Active';
                    const badgeClass = isExhausted 
                        ? 'bg-error/10 text-error border border-error/20' 
                        : 'bg-primary/10 text-primary border border-primary/20';
                        
                    const keyRow = document.createElement('div');
                    keyRow.className = 'flex flex-col gap-1.5';
                    keyRow.innerHTML = `
                        <div class="flex items-center justify-between text-[11px]">
                            <span class="font-mono text-on-surface-variant">${key.masked}</span>
                            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeClass}">${statusText}</span>
                        </div>
                        <div class="w-full bg-surface-container-low border border-outline-variant/20 rounded-full h-2 overflow-hidden overflow-hidden">
                            <div class="${isExhausted ? 'bg-error' : 'bg-primary'} h-full transition-all duration-300" style="width: ${keyPct}%"></div>
                        </div>
                        <div class="text-[10px] text-on-surface-variant/70 text-right">
                            Κλήσεις: <strong class="text-on-surface font-mono">${calls}</strong> / ${limit} (RPD)
                        </div>
                    `;
                    keysContainer.appendChild(keyRow);
                });
            }
        }

        // 4. Render 24h Post Activity Chart
        const hourlyPosts = data.hourly_posts || Array(24).fill(0);
        const hourlyBySource = data.hourly_by_source || Array(24).fill(null).map(() => ({}));
        const hourlyLabels = data.hourly_labels || Array(24).fill(null).map((_, i) => `${String(i).padStart(2,'0')}:00`);
        const chartContainer = document.getElementById('chart-bars-container');
        if (chartContainer) {
            // Retain absolute grid lines
            chartContainer.innerHTML = `
                <div class="absolute inset-x-0 top-0 border-t border-outline-variant/10 pointer-events-none"></div>
                <div class="absolute inset-x-0 top-1/3 border-t border-outline-variant/10 pointer-events-none"></div>
                <div class="absolute inset-x-0 top-2/3 border-t border-outline-variant/10 pointer-events-none"></div>
            `;
            
            const maxVal = Math.max(...hourlyPosts, 1);
            
            // Set Y-axis labels dynamically based on max
            document.getElementById('y-axis-val-3').textContent = Math.round(maxVal).toString();
            document.getElementById('y-axis-val-2').textContent = Math.round(maxVal * 2 / 3).toString();
            document.getElementById('y-axis-val-1').textContent = Math.round(maxVal * 1 / 3).toString();

            // Populate all 24 bars
            hourlyPosts.forEach((count, idx) => {
                const label = hourlyLabels[idx] || `${String(idx).padStart(2,'0')}:00`;
                const pct = ((count / maxVal) * 98).toFixed(1);
                
                // Build per-source breakdown for tooltip
                const srcBreakdown = hourlyBySource[idx] || {};
                const srcEntries = Object.entries(srcBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([src, n]) => `<span class="flex justify-between gap-3"><span class="text-on-surface-variant/70">${src}</span><strong class="text-on-surface">${n}</strong></span>`)
                    .join('');
                const srcHtml = srcEntries
                    ? `<div class="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-outline-variant/30">${srcEntries}</div>`
                    : '';
                
                const barDiv = document.createElement('div');
                barDiv.className = 'w-full bg-primary/25 hover:bg-primary/60 transition-all duration-300 rounded-t cursor-pointer relative group';
                barDiv.style.height = `${Math.max(3, pct)}%`;
                
                barDiv.innerHTML = `
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#1e2024] border border-outline-variant px-3 py-2 rounded-lg text-[10px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl text-left min-w-[140px]" style="white-space:normal">
                        <div class="flex justify-between items-center gap-3 font-bold">
                            <span class="text-primary">${label}</span>
                            <span class="text-on-surface">${count} άρθρα</span>
                        </div>
                        ${srcHtml}
                    </div>
                `;
                chartContainer.appendChild(barDiv);
            });

            // Update chart subtitle and x-axis to reflect real 24h window
            const startLabel = hourlyLabels[0] || '00:00';
            const endLabel = hourlyLabels[23] || '23:00';
            const chartSubtitle = document.getElementById('chart-subtitle');
            if (chartSubtitle) {
                chartSubtitle.textContent = `Άρθρα που δημοσιεύθηκαν ανά ώρα — τελευταίες 24h (${startLabel} → ${endLabel} UTC)`;
            }
        }

    } catch (err) {
        console.error('Failed to load engagement/system stats:', err);
    }
}
window.loadEngagementStats = loadEngagementStats;

