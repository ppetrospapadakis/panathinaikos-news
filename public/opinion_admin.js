function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ── Roster & Analysis Editing Logic ──────────────────────────────────────────
const footballStartingDefault = [
    [50, 88, 'ΦΝ', 'Φιλίποβιτς', 1, 'GK', 'Ελλάδα', '01/01/1995', '1.88m'],
    [15, 68, 'ΒΑ', 'Βαγιαννίδης', 2, 'RB', 'Ελλάδα', '12/09/2001', '1.78m'],
    [38, 70, 'ΜΣ', 'Μαξίμοβιτς', 5, 'CB', 'Σερβία', '26/01/1995', '1.89m'],
    [62, 70, 'ΤΟ', 'Τόμας', 4, 'CB', 'Πορτογαλία', '15/05/1994', '1.87m'],
    [85, 68, 'ΡΩΑ', 'Ρουά', 3, 'LB', 'Γαλλία', '03/04/1998', '1.82m'],
    [25, 48, 'ΝΤΡ', 'Ντρ. Σκι', 8, 'CM', 'Σλοβενία', '16/07/1999', '1.80m'],
    [50, 44, 'ΓΡΑ', 'Γκρέι', 6, 'CM', 'Τζαμάικα', '18/03/1996', '1.83m'],
    [75, 48, 'ΘΟΥ', 'Θορ', 10, 'CAM', 'Ισλανδία', '24/11/1997', '1.81m'],
    [18, 22, 'ΤΕΤ', 'Τετέ', 7, 'RW', 'Βραζιλία', '15/02/2000', '1.75m'],
    [50, 18, 'ΙΩΑ', 'Ιωαννίδης', 9, 'ST', 'Ελλάδα', '10/01/2000', '1.86m'],
    [82, 22, 'ΠΕΛ', 'Πελίστρι', 11, 'LW', 'Ουρουγουάη', '20/12/2001', '1.75m']
];

const footballBenchDefault = [
    [50, 88, 'ΒΡΑ', 'Βρατσάνος', 23, 'GK', 'Ελλάδα', '15/04/2002', '1.85m'],
    [15, 68, 'ΓΙΕ', 'Γιεντβάι', 14, 'RB', 'Κροατία', '28/11/1995', '1.88m'],
    [38, 70, 'ΑΝΔ', 'Ανδρέ', 16, 'CB', 'Ελλάδα', '10/02/2000', '1.86m'],
    [62, 70, 'ΛΩΡ', 'Λόρδος', 22, 'CB', 'Αγγλία', '05/06/1997', '1.87m'],
    [85, 68, 'ΚΟΡ', 'Κόρμπο', 3, 'LB', 'Ισπανία', '19/09/1999', '1.81m'],
    [25, 48, 'ΤΖΑ', 'Τζαβέλας', 18, 'CM', 'Ελλάδα', '26/11/1987', '1.83m'],
    [50, 44, 'ΧΑΡ', 'Χαρίσης', 19, 'CM', 'Ελλάδα', '12/01/1995', '1.78m'],
    [75, 48, 'ΜΠΑ', 'Μπαλόγκ', 17, 'CM', 'Ουγγαρία', '14/01/2002', '1.89m'],
    [18, 22, 'ΠΑΛ', 'Παλμέρι', 15, 'RW', 'Ιταλία', '20/01/1994', '1.76m'],
    [50, 18, 'ΟΑΔ', 'Οάδες', 20, 'ST', 'Γαλλία', '01/01/1996', '1.84m'],
    [82, 22, 'ΙΝΓ', 'Ίνγκασον', 21, 'LW', 'Ισλανδία', '05/08/1993', '1.88m']
];

const footballRestDefault = [
    { initials:'ΑΛΕ', name:'Αλεξανδρόπουλος', num:24, pos:'GK', detail:'3ος Τερματοφύλακας', nationality:'Ελλάδα', birthDate:'03/08/2001', height:'1.86m' },
    { initials:'ΜΠΙ', name:'Μπίλε', num:25, pos:'CB', detail:'Ελεύθερος Ροφ', nationality:'Δανία', birthDate:'15/05/1988', height:'1.85m' },
    { initials:'ΣΑΝ', name:'Σάντσεζ', num:26, pos:'RB', detail:'Νεαρό Ταλέντο', nationality:'Αργεντινή', birthDate:'04/04/1990', height:'1.76m' },
    { initials:'ΚΑΡ', name:'Καρβαλιό', num:27, pos:'CAM', detail:'Ερασιτεχνική Τμήμα', nationality:'Πορτογαλία', birthDate:'09/03/1997', height:'1.75m' },
    { initials:'ΔΗΜ', name:'Δημητρίου', num:28, pos:'LW', detail:'U21', nationality:'Ελλάδα', birthDate:'12/06/2003', height:'1.78m' },
    { initials:'ΠΑΠ', name:'Παπαδόπουλος', num:29, pos:'CM', detail:'Academy', nationality:'Ελλάδα', birthDate:'20/02/2004', height:'1.80m' }
];

const basketballStartingDefault = [
    [50, 82, 'ΣΛ', 'Σλούκας', 10, 'PG', 'Ελλάδα', '15/01/1990', '1.90m'],
    [20, 65, 'ΛΟΥ', 'Λούντζης', 0, 'SG', 'Ελλάδα', '04/08/1998', '1.98m'],
    [80, 65, 'ΗΛ', 'Ηλιόπουλος', 77, 'SF', 'Ελλάδα', '10/10/2000', '2.01m'],
    [30, 38, 'ΠΑΠ', 'Παπαπέτρου', 21, 'PF', 'Ελλάδα', '30/03/1994', '2.06m'],
    [70, 38, 'ΜΙΤ', 'Μιτόγλου', 44, 'C', 'Ελλάδα', '11/06/1996', '2.10m']
];

const basketballBackupDefault = [
    [50, 80, 'ΛΑΡ', 'Λαρεντζάκης', 5, 'PG', 'Ελλάδα', '22/09/1993', '1.96m'],
    [20, 60, 'ΒΟΥ', 'Βουγιούκας', 14, 'SG', 'Ελλάδα', '31/05/1985', '2.11m'],
    [80, 60, 'ΠΑΛ', 'Παλμέρ', 22, 'SF', 'USA', '15/08/1997', '1.98m'],
    [35, 35, 'ΓΙΑ', 'Γιαννόπουλος', 8, 'PF', 'Ελλάδα', '14/10/1989', '2.01m'],
    [65, 35, 'ΟΑΥ', 'Ουάιτ', 30, 'C', 'USA', '10/09/1992', '2.06m']
];

const basketballRestDefault = [
    { initials:'ΔΑΡ', name:'Δάρα', pos:'C', detail:'Βαθιά Ρότα', nationality:'Ελλάδα', birthDate:'01/01/2002', height:'2.08m' },
    { initials:'ΠΑΠ', name:'Παπαγεωργίου', pos:'PG', detail:'Academy', nationality:'Ελλάδα', birthDate:'12/04/2004', height:'1.92m' },
    { initials:'ΤΣΑ', name:'Τσαϊρέλης', pos:'SF', detail:'Two-Way', nationality:'Ελλάδα', birthDate:'10/05/1988', height:'2.02m' },
    { initials:'ΑΓΓ', name:'Αγγελόπουλος', pos:'SG', detail:'U22', nationality:'Ελλάδα', birthDate:'18/07/2003', height:'1.95m' }
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
    if (typeof closeSidebar === 'function') closeSidebar();
    else if (window.closeSidebar) window.closeSidebar();

    document.querySelectorAll('.admin-panel-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`panel-section-${tab}`).classList.remove('hidden');

    // Style active sidebar menu items
    ['opinion', 'football', 'basketball', 'fixtures', 'comments', 'analytics-ingestion', 'analytics-engagement', 'deleted'].forEach(t => {
        const btn = document.getElementById(`admin-tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = 'w-full flex items-center gap-4 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold transition-all duration-200 active:scale-95 text-left';
            } else {
                btn.className = 'w-full flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl font-body transition-all duration-200 active:scale-95 text-left';
            }
        }
    });

    // Update Page Header Content dynamically
    const headerIcon = document.getElementById('page-header-icon');
    const headerTag = document.getElementById('page-header-tag');
    const headerTitle = document.getElementById('page-header-title');
    const headerDesc = document.getElementById('page-header-desc');

    if (headerIcon && headerTag && headerTitle && headerDesc) {
        if (tab === 'opinion') {
            headerIcon.textContent = 'edit_note';
            headerTag.textContent = 'Private Editor';
            headerTitle.textContent = 'Η Άποψή Μου';
            headerDesc.innerHTML = 'Γράψε τη δική σου αθλητική ανάλυση, άποψη ή σχόλιο για τον Παναθηναϊκό. Τα άρθρα σου εμφανίζονται στη ροή ειδήσεων με την κατηγορία <span class="text-primary font-semibold">✍️ Άποψη</span>.';
        } else if (tab === 'football') {
            headerIcon.textContent = 'sports_soccer';
            headerTag.textContent = 'Squad Manager';
            headerTitle.textContent = 'Ρόστερ Ποδοσφαίρου';
            headerDesc.textContent = 'Διαμόρφωσε τη βασική ενδεκάδα, τον πάγκο και την ανάλυση τακτικής για την ποδοσφαιρική ομάδα του Παναθηναϊκού.';
        } else if (tab === 'basketball') {
            headerIcon.textContent = 'sports_basketball';
            headerTag.textContent = 'Squad Manager';
            headerTitle.textContent = 'Ρόστερ Μπάσκετ';
            headerDesc.textContent = 'Διαμόρφωσε την αρχική πεντάδα, τις εναλλακτικές επιλογές και την ανάλυση τακτικής για την ομάδα μπάσκετ του Παναθηναϊκού.';
        } else if (tab === 'fixtures') {
            headerIcon.textContent = 'calendar_month';
            headerTag.textContent = 'Schedule Manager';
            headerTitle.textContent = 'Πρόγραμμα & Αποτελέσματα';
            headerDesc.textContent = 'Πρόσθεσε νέους αγώνες, ενημέρωσε τα σκορ σε πραγματικό χρόνο ή όρισε τον επόμενο ενεργό αγώνα (Current Match).';
        } else if (tab === 'analytics-ingestion') {
            headerIcon.textContent = 'database';
            headerTag.textContent = 'Crawler Monitor';
            headerTitle.textContent = 'Ingestion Stats';
            headerDesc.textContent = 'Παρακολούθησε το ιστορικό εκτελέσεων του scraper, τις επιτυχημένες ροές και τις λεπτομέρειες των φιλτραρισμένων άρθρων.';
        } else if (tab === 'analytics-engagement') {
            headerIcon.textContent = 'analytics';
            headerTag.textContent = 'Dashboard';
            headerTitle.textContent = 'Reader Traffic';
            headerDesc.textContent = 'Συνολικά στατιστικά βάσης δεδομένων, όρια πόρων, χρήση κλειδιών Gemini API και δραστηριότητα δημοσιεύσεων ανά ώρα.';
        } else if (tab === 'deleted') {
            headerIcon.textContent = 'delete_history';
            headerTag.textContent = 'Recycle Bin';
            headerTitle.textContent = 'Διαγραμμένα Άρθρα';
            headerDesc.textContent = 'Δες όλα τα άρθρα που έχουν διαγραφεί. Μπορείς να κάνεις προεπισκόπηση ή να τα επαναφέρεις στην ενεργή ροή ειδήσεων.';
        } else if (tab === 'comments') {
            headerIcon.textContent = 'forum';
            headerTag.textContent = 'Moderation';
            headerTitle.textContent = 'Διαχείριση Σχολίων';
            headerDesc.textContent = 'Δες όλα τα σχόλια του site. Μπορείς να τα διαγράψεις οριστικά ή να τα κρύψεις μόνο από αυτή την admin προβολή.';
        }
    }

    if (tab === 'fixtures') {
        loadAdminFixtures(window.currentAdminFixtureCategoryFilter || 'all');
    }
    if (tab === 'analytics-ingestion') {
        loadScraperRuns();
    }
    if (tab === 'analytics-engagement') {
        loadEngagementStats();
    }
    if (tab === 'deleted') {
        loadDeletedArticles();
    }
    if (tab === 'comments') {
        loadAdminComments();
    }
}
window.switchAdminTab = switchAdminTab;

// ── Comments Management ───────────────────────────────────────────────────────
let _adminCommentsCache = [];
let _adminCommentsShowHidden = false;

function getHiddenCommentIds() {
    try { return JSON.parse(localStorage.getItem('admin_hidden_comments') || '[]'); } catch { return []; }
}
function setHiddenCommentIds(ids) {
    localStorage.setItem('admin_hidden_comments', JSON.stringify(ids));
}

function adminCommentIsHidden(id) {
    return getHiddenCommentIds().includes(id);
}

window.toggleAdminCommentsShowHidden = function() {
    _adminCommentsShowHidden = !_adminCommentsShowHidden;
    const btn = document.getElementById('comments-toggle-hidden-btn');
    if (btn) {
        btn.innerHTML = _adminCommentsShowHidden
            ? '<span class="material-symbols-outlined">visibility_off</span> Απόκρυψη Κρυμμένων'
            : '<span class="material-symbols-outlined">visibility</span> Εμφάνιση Κρυμμένων';
    }
    renderAdminComments();
};

function slugifyAdmin(text) {
    if (!text) return 'arthro';
    let str = text.toLowerCase();
    str = str.replace(/[αά]/g,'a').replace(/[εέ]/g,'e').replace(/[ηή]/g,'i').replace(/[ιίϊΐ]/g,'i')
             .replace(/[οό]/g,'o').replace(/[υύϋΰ]/g,'y').replace(/[ωώ]/g,'o')
             .replace(/θ/g,'th').replace(/χ/g,'ch').replace(/ψ/g,'ps').replace(/ξ/g,'x')
             .replace(/μπ/g,'b').replace(/ντ/g,'nt').replace(/γκ/g,'gk')
             .replace(/[^a-z0-9]+/g,'-').replace(/--+/g,'-').replace(/^-+|-+$/g,'');
    return str.substring(0,35) || 'arthro';
}

function buildArticleUrl(articleId, title, category) {
    const catMap = { 'ποδόσφαιρο': 'podosfairo', 'μπάσκετ': 'basket', 'ερασιτέχνης': 'erasitexnis', 'άποψη': 'apopsi' };
    const catLower = (category || '').toLowerCase();
    let catPath = catMap[catLower] || 'podosfairo';
    const slug = slugifyAdmin(title);
    const shortId = (articleId || '').substring(0,8);
    return `/${catPath}/${slug}-${shortId}`;
}

function isRosterComment(comment) {
    return (comment.comment_text || '').includes('[LINEUP_DATA]');
}

async function loadAdminComments() {
    const container = document.getElementById('admin-comments-list');
    if (!container) return;
    if (!db) {
        container.innerHTML = '<div class="text-center py-10 text-on-surface-variant/60">Δεν έχει συνδεθεί η βάση δεδομένων.</div>';
        return;
    }

    container.innerHTML = `<div class="flex items-center justify-center py-12"><div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>`;

    try {
        // Fetch all comments
        const { data: comments, error: cErr } = await db
            .from('article_comments')
            .select('id, article_id, user_name, comment_text, created_at')
            .order('created_at', { ascending: false })
            .limit(200);
        if (cErr) throw cErr;

        // Fetch article titles for those IDs
        const articleIds = [...new Set((comments || []).map(c => c.article_id).filter(Boolean))];
        let articlesMap = {};
        if (articleIds.length > 0) {
            const { data: arts } = await db
                .from('articles')
                .select('id, title, category')
                .in('id', articleIds);
            (arts || []).forEach(a => { articlesMap[a.id] = a; });
        }

        _adminCommentsCache = (comments || []).map(c => ({ ...c, _article: articlesMap[c.article_id] || null }));
        renderAdminComments();
    } catch (err) {
        container.innerHTML = `<div class="text-center py-10 text-error">Σφάλμα φόρτωσης: ${escapeHtml(err.message)}</div>`;
    }
}
window.loadAdminComments = loadAdminComments;

function renderAdminComments() {
    const container = document.getElementById('admin-comments-list');
    if (!container) return;
    const hiddenIds = getHiddenCommentIds();

    const toShow = _adminCommentsShowHidden
        ? _adminCommentsCache
        : _adminCommentsCache.filter(c => !hiddenIds.includes(c.id));

    if (toShow.length === 0) {
        container.innerHTML = `<div class="text-center py-12 bg-surface-container rounded-2xl border border-outline-variant/30 p-8 space-y-3">
            <span class="material-symbols-outlined text-4xl text-on-surface-variant/40">forum</span>
            <p class="text-on-surface-variant/60 text-sm">${_adminCommentsCache.length === 0 ? 'Δεν υπάρχουν σχόλια.' : 'Όλα τα σχόλια είναι κρυμμένα.'}</p>
        </div>`;
        return;
    }

    container.innerHTML = toShow.map(c => {
        const isHidden = hiddenIds.includes(c.id);
        const isRoster = isRosterComment(c);
        const article = c._article;
        let displayText = (c.comment_text || '').replace(/\[LINEUP_DATA\][\s\S]*?\[\/LINEUP_DATA\]/, '[📋 Lineup Data]').trim();
        const dateStr = c.created_at ? new Date(c.created_at).toLocaleString('el-GR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';

        let linkHtml = '';
        if (isRoster) {
            linkHtml = `<a href="/roster" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"><span class="material-symbols-outlined text-[13px]">open_in_new</span>Σελίδα Ρόστερ</a>`;
        } else if (article) {
            const url = buildArticleUrl(article.id, article.title, article.category);
            linkHtml = `<a href="${url}" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"><span class="material-symbols-outlined text-[13px]">open_in_new</span>${escapeHtml(article.title)}</a>`;
        } else {
            linkHtml = `<span class="text-[11px] text-on-surface-variant/40">(Άγνωστο άρθρο)</span>`;
        }

        const hiddenBadge = isHidden ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/15 border border-yellow-400/30 text-yellow-400 text-[10px] font-bold"><span class="material-symbols-outlined text-[11px]">visibility_off</span>Κρυμμένο</span>` : '';

        return `<div class="bg-surface-container border ${isHidden ? 'border-yellow-400/20 opacity-60' : 'border-outline-variant/20'} rounded-2xl p-4 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="font-bold text-sm text-on-surface">${escapeHtml(c.user_name || 'Ανώνυμος')}</span>
                        ${hiddenBadge}
                        ${isRoster ? '<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">📋 ΡΟΣΤΕΡ</span>' : ''}
                    </div>
                    <p class="text-xs text-on-surface-variant/60 mb-2">${dateStr}</p>
                    <p class="text-sm text-on-surface leading-relaxed whitespace-pre-line line-clamp-4">${escapeHtml(displayText)}</p>
                </div>
                <div class="flex flex-col gap-2 shrink-0">
                    <button onclick="adminToggleHideComment('${c.id}')" title="${isHidden ? 'Εμφάνιση' : 'Απόκρυψη από admin'}" class="w-8 h-8 flex items-center justify-center rounded-lg ${isHidden ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-500/30' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-highest'} transition-all">
                        <span class="material-symbols-outlined text-[16px]">${isHidden ? 'visibility' : 'visibility_off'}</span>
                    </button>
                    <button onclick="adminDeleteComment('${c.id}')" title="Διαγραφή" class="w-8 h-8 flex items-center justify-center rounded-lg bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
            </div>
            <div class="pt-2 border-t border-outline-variant/20">${linkHtml}</div>
        </div>`;
    }).join('');
}

window.adminToggleHideComment = function(id) {
    const hiddenIds = getHiddenCommentIds();
    if (hiddenIds.includes(id)) {
        setHiddenCommentIds(hiddenIds.filter(x => x !== id));
    } else {
        setHiddenCommentIds([...hiddenIds, id]);
    }
    renderAdminComments();
};

window.adminDeleteComment = async function(id) {
    if (!confirm('Να διαγραφεί οριστικά αυτό το σχόλιο;')) return;
    try {
        const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}&token=admin_secure_session`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Σφάλμα διαγραφής');
        _adminCommentsCache = _adminCommentsCache.filter(c => c.id !== id);
        // Also remove from hidden list if present
        setHiddenCommentIds(getHiddenCommentIds().filter(x => x !== id));
        renderAdminComments();
    } catch (err) {
        alert('Σφάλμα: ' + err.message);
    }
};

// ── Deleted Articles Manager (Trash / Recycle Bin) ───────────────────────────
let deletedArticlesCache = [];

async function loadDeletedArticles() {
    const listContainer = document.getElementById('deleted-articles-list');
    if (!listContainer) return;
    if (!db) {
        listContainer.innerHTML = '<div class="col-span-full text-center py-10 text-on-surface-variant/60">Δεν έχει συνδεθεί η βάση δεδομένων.</div>';
        return;
    }

    listContainer.innerHTML = `
        <div class="col-span-full flex items-center justify-center py-12">
            <div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
    `;

    try {
        const { data, error } = await db.from('articles')
            .select('id, title, summary, content, image_url, category, created_at, source_url, bullets')
            .eq('category', 'DELETED')
            .not('title', 'ilike', '%[SKIPPED]%')
            .not('summary', 'ilike', '%Skipped%')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        const filteredData = (data || []).filter(a => {
            const titleLower = (a.title || '').toLowerCase();
            const summaryLower = (a.summary || '').toLowerCase();
            return !titleLower.includes('[skipped]') && !summaryLower.includes('skipped');
        });

        deletedArticlesCache = filteredData;

        if (!filteredData || filteredData.length === 0) {
            listContainer.innerHTML = `
                <div class="col-span-full text-center py-12 bg-surface-container rounded-2xl border border-outline-variant/30 p-8 space-y-3">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant/40">delete_outline</span>
                    <h4 class="text-base font-bold text-on-surface">Το καλάθι είναι άδειο</h4>
                    <p class="text-xs text-on-surface-variant max-w-sm mx-auto">Δεν υπάρχουν διαγραμμένα άρθρα αυτή τη στιγμή.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filteredData.map(a => {
            const date = new Date(a.created_at);
            const dateStr = date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
            const img = a.image_url || DEFAULT_IMG;
            
            // Try to guess original sport / source category from title or URL
            let inferredCategory = 'Ποδόσφαιρο';
            const titleLower = (a.title || '').toLowerCase();
            const urlLower = (a.source_url || '').toLowerCase();
            if (titleLower.includes('μπάσκετ') || titleLower.includes('basket') || urlLower.includes('basket') || titleLower.includes('αταμάν') || titleLower.includes('ναν') || titleLower.includes('σλούκας')) {
                inferredCategory = 'Μπάσκετ';
            } else if (titleLower.includes('ερασιτέχνης') || titleLower.includes('βόλεϊ') || titleLower.includes('πόλο') || urlLower.includes('erasitechnis')) {
                inferredCategory = 'Ερασιτέχνης';
            } else if (titleLower.includes('άποψη') || urlLower.includes('opinion')) {
                inferredCategory = 'Άποψη';
            }

            return `
                <div class="bg-surface-container rounded-2xl border border-outline-variant/30 p-5 flex flex-col justify-between hover:border-outline-variant/60 transition-all shadow-sm group">
                    <div class="flex gap-4 items-start mb-4">
                        <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20">
                            <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='${DEFAULT_IMG}'"/>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1.5">
                                <span class="px-2 py-0.5 rounded-md bg-error/10 border border-error/20 text-error font-bold text-[10px] uppercase tracking-wider">DELETED</span>
                                <span class="text-[11px] text-on-surface-variant/60">🕒 ${dateStr}</span>
                            </div>
                            <h4 class="text-sm font-bold leading-snug line-clamp-2 text-on-surface mb-2">${a.title}</h4>
                            <p class="text-xs text-on-surface-variant/80 line-clamp-2 leading-relaxed">${a.summary || a.content || 'Χωρίς σύνοψη'}</p>
                        </div>
                    </div>
                    
                    <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                        <span class="text-[11px] text-on-surface-variant/50">Κατηγορία: <strong class="text-primary font-medium">${inferredCategory}</strong></span>
                        <div class="flex items-center gap-2">
                            <button onclick="previewDeletedArticle('${a.id}')" class="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer">
                                <span class="material-symbols-outlined" style="font-size:16px">visibility</span> Προεπισκόπηση
                            </button>
                            <button onclick="restoreDeletedArticle('${a.id}', '${inferredCategory}')" class="px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:opacity-90 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm">
                                <span class="material-symbols-outlined" style="font-size:16px">restore_from_trash</span> Επαναφορά
                            </button>
                            <button onclick="permanentlyDeleteArticle('${a.id}')" class="px-2.5 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 border border-error/30 text-xs font-semibold text-error flex items-center gap-1 transition-all cursor-pointer active:scale-95" title="Μόνιμη Διαγραφή">
                                <span class="material-symbols-outlined" style="font-size:16px">delete_forever</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('[Deleted Articles Error]', err);
        listContainer.innerHTML = `<div class="col-span-full text-center py-10 text-error">Σφάλμα φόρτωσης: ${err.message}</div>`;
    }
}

async function previewDeletedArticle(id) {
    const article = deletedArticlesCache.find(a => a.id === id);
    if (!article) return;

    const modal = document.getElementById('deleted-preview-modal');
    const content = document.getElementById('deleted-preview-content');
    if (!modal || !content) return;

    const date = new Date(article.created_at);
    const dateStr = date.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const DEFAULT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';
    const img = article.image_url || DEFAULT_IMG;

    let inferredCategory = 'Ποδόσφαιρο';
    const titleLower = (article.title || '').toLowerCase();
    const urlLower = (article.source_url || '').toLowerCase();
    if (titleLower.includes('μπάσκετ') || titleLower.includes('basket') || urlLower.includes('basket') || titleLower.includes('αταμάν') || titleLower.includes('ναν')) {
        inferredCategory = 'Μπάσκετ';
    } else if (titleLower.includes('ερασιτέχνης') || titleLower.includes('βόλεϊ') || urlLower.includes('erasitechnis')) {
        inferredCategory = 'Ερασιτέχνης';
    } else if (titleLower.includes('άποψη') || urlLower.includes('opinion')) {
        inferredCategory = 'Άποψη';
    }

    const bulletsList = Array.isArray(article.bullets) && article.bullets.length > 0
        ? `<div class="mb-6 bg-surface-container/60 rounded-xl p-4 border border-outline-variant/30">
            <h5 class="text-xs uppercase font-bold text-primary tracking-wider mb-2">Κύρια Σημεία</h5>
            <ul class="space-y-1.5 text-xs text-on-surface-variant">
                ${article.bullets.map(b => `<li class="flex gap-2"><span>•</span><span>${b}</span></li>`).join('')}
            </ul>
           </div>`
        : '';

    const contentParagraphs = (article.content || article.summary || 'Χωρίς περιεχόμενο')
        .split('\n\n')
        .map(p => `<p class="mb-4 text-on-surface-variant leading-relaxed text-sm">${p.trim()}</p>`)
        .join('');

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full bg-error/10 border border-error/20 text-error font-bold text-xs uppercase">ΔΙΑΓΡΑΜΜΕΝΟ</span>
                <span class="text-xs text-on-surface-variant">Δημιουργία: ${dateStr}</span>
                <a href="/podosfairo/arthro-id=${article.id}?admin_preview=true" target="_blank" class="ml-auto text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                    <span class="material-symbols-outlined text-sm">open_in_new</span> Άνοιγμα σε νέα καρτέλα
                </a>
            </div>

            <h2 class="text-2xl font-bold text-on-surface leading-tight">${article.title}</h2>

            <div class="rounded-xl overflow-hidden border border-outline-variant/30 max-h-[345px] bg-black/40">
                <img src="${img}" class="w-full h-full object-cover" onerror="this.src='${DEFAULT_IMG}'"/>
            </div>

            ${bulletsList}

            <div class="py-2 border-t border-outline-variant/20">
                ${contentParagraphs}
            </div>

            <div class="pt-6 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                    <label class="text-xs text-on-surface-variant font-semibold">Επαναφορά στην κατηγορία:</label>
                    <select id="restore-category-select" class="bg-surface-container border border-outline-variant/40 text-on-surface text-xs rounded-lg px-3 py-1.5 focus:border-primary">
                        <option value="Ποδόσφαιρο" ${inferredCategory === 'Ποδόσφαιρο' ? 'selected' : ''}>⚽ Ποδόσφαιρο</option>
                        <option value="Μπάσκετ" ${inferredCategory === 'Μπάσκετ' ? 'selected' : ''}>🏀 Μπάσκετ</option>
                        <option value="Ερασιτέχνης" ${inferredCategory === 'Ερασιτέχνης' ? 'selected' : ''}>🤾 Ερασιτέχνης</option>
                        <option value="Άποψη" ${inferredCategory === 'Άποψη' ? 'selected' : ''}>✍️ Άποψη</option>
                    </select>
                </div>

                <div class="flex items-center gap-3">
                    <button onclick="closeDeletedPreviewModal()" class="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition-all cursor-pointer">
                        Ακύρωση
                    </button>
                    <button onclick="restoreDeletedArticleFromModal('${article.id}')" class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md">
                        <span class="material-symbols-outlined" style="font-size:18px">restore_from_trash</span> Επαναφορά Άρθρου
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('opacity-0', 'pointer-events-none');
    if (modal.firstElementChild) {
        modal.firstElementChild.classList.remove('scale-95');
        modal.firstElementChild.classList.add('scale-100');
    }
}

function closeDeletedPreviewModal() {
    const modal = document.getElementById('google-news-modal') || document.getElementById('deleted-preview-modal');
    const delModal = document.getElementById('deleted-preview-modal');
    if (delModal) {
        delModal.classList.add('opacity-0', 'pointer-events-none');
        if (delModal.firstElementChild) {
            delModal.firstElementChild.classList.remove('scale-100');
            delModal.firstElementChild.classList.add('scale-95');
        }
    }
}

async function restoreDeletedArticle(id, category = 'Ποδόσφαιρο') {
    if (!db) return;
    const { error } = await db.from('articles').update({ category: category }).eq('id', id);
    if (error) {
        alert('Σφάλμα κατά την επαναφορά: ' + error.message);
        return;
    }
    closeDeletedPreviewModal();
    loadDeletedArticles();
}

async function restoreDeletedArticleFromModal(id) {
    const select = document.getElementById('restore-category-select');
    const selectedCategory = select ? select.value : 'Ποδόσφαιρο';
    await restoreDeletedArticle(id, selectedCategory);
}

async function permanentlyDeleteArticle(id) {
    if (!db || !id) return;
    if (!confirm('ΠΡΟΣΟΧΗ: Να διαγραφεί ΜΟΝΙΜΑ αυτό το άρθρο από τη βάση δεδομένων; Αυτή η ενέργεια δεν αναιρείται.')) return;
    try {
        const { error } = await db.from('articles').delete().eq('id', id);
        if (error) throw error;
        deletedArticlesCache = deletedArticlesCache.filter(a => a.id !== id);
        loadDeletedArticles();
    } catch (err) {
        alert('Σφάλμα κατά τη μόνιμη διαγραφή: ' + err.message);
    }
}

async function purgeAllDeletedArticles() {
    if (!db) return;
    const count = deletedArticlesCache.length;
    if (count === 0) {
        alert('Το καλάθι είναι ήδη άδειο.');
        return;
    }
    if (!confirm(`ΠΡΟΣΟΧΗ! Είστε σίγουροι ότι θέλετε να διαγράψετε ΜΟΝΙΜΑ και τα ${count} διαγραμμένα άρθρα από τη βάση δεδομένων;\n\nΑυτή η ενέργεια δεν αναιρείται!`)) return;

    try {
        const { error } = await db.from('articles').delete().eq('category', 'DELETED');
        if (error) throw error;
        alert('Όλα τα διαγραμμένα άρθρα διαγράφηκαν μόνιμα!');
        deletedArticlesCache = [];
        loadDeletedArticles();
    } catch (err) {
        alert('Σφάλμα κατά την εκκαθάριση: ' + err.message);
    }
}

window.loadDeletedArticles = loadDeletedArticles;
window.previewDeletedArticle = previewDeletedArticle;
window.closeDeletedPreviewModal = closeDeletedPreviewModal;
window.restoreDeletedArticle = restoreDeletedArticle;
window.restoreDeletedArticleFromModal = restoreDeletedArticleFromModal;
window.permanentlyDeleteArticle = permanentlyDeleteArticle;
window.purgeAllDeletedArticles = purgeAllDeletedArticles;
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

// Ingestion filter state
let currentIngestionFilter = 'ALL';
window.currentIngestionFilter = currentIngestionFilter;

// Ingestion sorting state
let ingestionSortColumn = 'name'; // default sort by source name
let ingestionSortDirection = 'asc'; // 'asc' or 'desc'
window.ingestionSortColumn = ingestionSortColumn;
window.ingestionSortDirection = ingestionSortDirection;

function applyIngestionFilter() {
    const dropdown = document.getElementById('ingestion-site-filter');
    if (dropdown) {
        currentIngestionFilter = dropdown.value;
        // Re-render list & selected details to apply filter
        renderRunsList();
        if (selectedRunId) {
            selectRun(selectedRunId);
        }
    }
}
window.applyIngestionFilter = applyIngestionFilter;

function sortIngestionTable(column) {
    if (ingestionSortColumn === column) {
        // Toggle direction
        ingestionSortDirection = ingestionSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        ingestionSortColumn = column;
        ingestionSortDirection = 'desc'; // default to desc for numeric metrics
        if (column === 'name') ingestionSortDirection = 'asc';
    }
    if (selectedRunId) {
        selectRun(selectedRunId);
    }
}
window.sortIngestionTable = sortIngestionTable;

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
        const isSelected = String(run.id) === String(selectedRunId);
        const activeClass = isSelected 
            ? 'border-2 border-primary bg-primary/15 shadow-md shadow-primary/10 ring-1 ring-primary/40' 
            : 'border-outline-variant/30 hover:border-primary/40 bg-surface-container-low';
            
        const statusDot = isSuccess 
            ? '<span class="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>'
            : '<span class="w-2.5 h-2.5 rounded-full bg-error inline-block animate-pulse"></span>';
            
        const card = document.createElement('div');
        card.dataset.runId = String(run.id);
        card.className = `p-4 border rounded-xl cursor-pointer transition-all duration-200 active:scale-98 ${activeClass}`;
        card.onclick = () => selectRun(run.id);
        
        // Sum totals dynamically or filter them
        let added = 0;
        let merged = 0;
        let skipped = 0;

        const sources = run.stats?.sources || {};
        Object.keys(sources).forEach(srcKey => {
            // Apply site filter
            if (currentIngestionFilter !== 'ALL' && !srcKey.toLowerCase().includes(currentIngestionFilter.toLowerCase())) {
                return;
            }
            const src = sources[srcKey];
            added += (src.added || 0);
            merged += (src.merged || 0);
            skipped += (src.skipped_duplicate || 0) + (src.skipped_relevance || 0) + (src.skipped_size || 0) + (src.skipped_crawling_failed || 0) + (src.skipped_technical_error || 0) + (src.skipped_other || 0);
        });
            
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono font-bold text-on-surface-variant/75">${dateStr} · ${timeStr}</span>
                ${statusDot}
            </div>
            <div class="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Νέα: <strong class="text-primary">${added}</strong></span>
                <span>Merge: <strong class="text-tertiary">${merged}</strong></span>
                <span>Skipped: <strong>${skipped}</strong></span>
            </div>
        `;
        container.appendChild(card);
    });
}

function selectRun(runId) {
    selectedRunId = runId;
    
    // Highlight selected run card in DOM list
    const listContainer = document.getElementById('runs-list-container');
    if (listContainer) {
        Array.from(listContainer.children).forEach(child => {
            if (child.dataset && child.dataset.runId) {
                const isActive = String(child.dataset.runId) === String(runId);
                if (isActive) {
                    child.className = 'p-4 border-2 border-primary bg-primary/15 shadow-md shadow-primary/10 ring-1 ring-primary/40 rounded-xl cursor-pointer transition-all duration-200 active:scale-98';
                } else {
                    child.className = 'p-4 border border-outline-variant/30 hover:border-primary/40 bg-surface-container-low rounded-xl cursor-pointer transition-all duration-200 active:scale-98';
                }
            }
        });
    }
    
    // Find run, keeping selected highlight updated
    const run = runsCached.find(r => String(r.id) === String(runId));
    const inspector = document.getElementById('run-inspector-card');
    if (!run || !inspector) return;
    
    const dateStart = new Date(run.started_at);
    const dateEnd = new Date(run.completed_at);
    const durationSec = Math.round((dateEnd - dateStart) / 1000);
    const isSuccess = run.status === 'success';
    
    const statusBadge = isSuccess 
        ? '<div class="status-badge status-success">Success</div>'
        : '<div class="status-badge status-error">Failed</div>';
        
    const sources = run.stats?.sources || {};
    const recentErrors = run.stats?.recent_errors || [];
    
    // Compute totals filtered by current filter state
    let totalScraped = 0;
    let totalAdded = 0;
    let totalMerged = 0;
    let totalSkippedDuplicate = 0;
    let totalSkippedRelevance = 0;
    let totalSkippedSize = 0;
    let totalSkippedCrawling = 0;
    let totalSkippedTechnical = 0;
    let totalSkippedOther = 0;

    Object.keys(sources).forEach(srcKey => {
        if (currentIngestionFilter !== 'ALL' && !srcKey.toLowerCase().includes(currentIngestionFilter.toLowerCase())) {
            return;
        }
        const src = sources[srcKey];
        totalScraped += (src.scraped || 0);
        totalAdded += (src.added || 0);
        totalMerged += (src.merged || 0);
        totalSkippedDuplicate += (src.skipped_duplicate || 0);
        totalSkippedRelevance += (src.skipped_relevance || 0);
        totalSkippedSize += (src.skipped_size || 0);
        totalSkippedCrawling += (src.skipped_crawling_failed || 0);
        totalSkippedTechnical += (src.skipped_technical_error || 0);
        totalSkippedOther += (src.skipped_other || 0);
    });

    const skippedTotal = totalSkippedDuplicate + totalSkippedRelevance + totalSkippedSize + totalSkippedCrawling + totalSkippedTechnical + totalSkippedOther;

    // Filtered Errors Count
    const filteredErrors = recentErrors.filter(err => {
        if (currentIngestionFilter === 'ALL') return true;
        return err.source && err.source.toLowerCase().includes(currentIngestionFilter.toLowerCase());
    });
    const errorsCount = filteredErrors.length + (run.status === 'failed' && currentIngestionFilter === 'ALL' ? 1 : 0);

    // Build a map of source → error code for highlighting 0-scraped sources
    const sourceErrorMap = {};
    filteredErrors.forEach(err => {
        if (err.source && !sourceErrorMap[err.source]) {
            const codeMatch = err.message && err.message.match(/(\d{3})/);
            sourceErrorMap[err.source] = codeMatch ? codeMatch[1] : 'ERR';
        }
    });
    
    // Fatal run error alert
    let fatalAlertHtml = '';
    if (run.error_message && currentIngestionFilter === 'ALL') {
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
    if (filteredErrors.length > 0) {
        errorsListHtml = filteredErrors.map(err => {
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

    // Build target rows (with sorting applied)
    const tableData = [];
    Object.keys(sources).forEach(srcKey => {
        if (currentIngestionFilter !== 'ALL' && !srcKey.toLowerCase().includes(currentIngestionFilter.toLowerCase())) {
            return;
        }
        const src = sources[srcKey];
        const srcSkipped = (src.skipped_duplicate || 0) + (src.skipped_relevance || 0) + (src.skipped_size || 0) + (src.skipped_crawling_failed || 0) + (src.skipped_technical_error || 0) + (src.skipped_other || 0);
        
        tableData.push({
            name: srcKey,
            scraped: src.scraped || 0,
            added: src.added || 0,
            merged: src.merged || 0,
            crawl_fail: src.skipped_crawling_failed || 0,
            errors: src.skipped_technical_error || 0,
            relevance: src.skipped_relevance || 0,
            skipped: srcSkipped
        });
    });

    // Apply Sorting logic
    tableData.sort((a, b) => {
        let valA = a[ingestionSortColumn];
        let valB = b[ingestionSortColumn];

        if (typeof valA === 'string') {
            return ingestionSortDirection === 'asc' 
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        } else {
            return ingestionSortDirection === 'asc' 
                ? valA - valB
                : valB - valA;
        }
    });

    let tableRowsHtml = '';
    tableData.forEach(row => {
        const errCode = row.scraped === 0 ? sourceErrorMap[row.name] : null;
        const scrapedCell = errCode
            ? `<span class="font-mono text-red-400">0</span><span title="${errCode} error" class="ml-1.5 inline-flex items-center gap-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider cursor-help">⚠ ${errCode}</span>`
            : `<span class="font-mono">${row.scraped}</span>`;
        
        const relevanceCell = row.relevance > 0
            ? `<span class="font-mono text-yellow-400 font-semibold">${row.relevance}</span>`
            : `<span class="font-mono text-on-surface-variant/40">0</span>`;

        tableRowsHtml += `
            <tr class="border-b border-outline-variant/10 text-xs text-on-surface-variant hover:bg-surface-container-high/20">
                <td class="py-3 px-4 font-bold text-on-surface text-left">${row.name}</td>
                <td class="py-3 px-4 text-center">${scrapedCell}</td>
                <td class="py-3 px-4 text-center font-mono text-primary font-semibold">${row.added}</td>
                <td class="py-3 px-4 text-center font-mono text-tertiary font-semibold">${row.merged}</td>
                <td class="py-3 px-4 text-center font-mono text-red-400">${row.crawl_fail}</td>
                <td class="py-3 px-4 text-center font-mono text-red-500">${row.errors}</td>
                <td class="py-3 px-4 text-center">${relevanceCell}</td>
                <td class="py-3 px-4 text-center font-mono">${row.skipped}</td>
            </tr>
        `;
    });

    // Generate skipped details list
    const skippedDetails = run.stats?.skipped_details || [];
    const filteredSkippedDetails = skippedDetails.filter(item => {
        if (currentIngestionFilter === 'ALL') return true;
        return item.source && item.source.toLowerCase().includes(currentIngestionFilter.toLowerCase());
    });
    
    let skippedDetailsHtml = '';
    if (filteredSkippedDetails.length > 0) {
        const itemsHtml = filteredSkippedDetails.map(item => {
            let reasonBadge = '';
            if (item.reason === 'relevance') reasonBadge = '<span class="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">ΑΣΧΕΤΟ</span>';
            else if (item.reason === 'size') reasonBadge = '<span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">ΜΙΚΡΟ</span>';
            else if (item.reason === 'promo') reasonBadge = '<span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">ΠΡΟΩΘΗΤΙΚΟ</span>';
            else if (item.reason === 'crawling_failed') reasonBadge = '<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">CRAWL FAIL</span>';

            return `
                <div class="p-2.5 bg-surface-container rounded-lg border border-outline-variant/10 flex flex-col gap-1 text-[11px] text-left">
                    <div class="flex justify-between items-start gap-3">
                        <div class="font-bold text-on-surface leading-tight break-all flex-1">${item.title}</div>
                        <div class="shrink-0 flex items-center gap-1.5">${reasonBadge}</div>
                    </div>
                    <div class="flex justify-between items-center text-[9px] text-on-surface-variant/60 mt-1">
                        <span>Πηγή: <strong class="text-primary">${item.source}</strong></span>
                        ${item.details ? `<span class="italic text-on-surface-variant/40">${item.details}</span>` : ''}
                    </div>
                    <a href="${item.url}" target="_blank" class="text-[9px] text-primary/70 hover:underline break-all mt-0.5 font-mono">${item.url}</a>
                </div>
            `;
        }).join('');
        
        skippedDetailsHtml = `
            <div class="mt-5 pt-5 border-t border-outline-variant/20">
                <h6 class="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold mb-3">Λεπτομέρειες Απορρίψεων (έως 100)</h6>
                <div class="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    ${itemsHtml}
                </div>
            </div>
        `;
    } else {
        skippedDetailsHtml = `
            <div class="mt-5 pt-5 border-t border-outline-variant/20">
                <h6 class="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Λεπτομέρειες Απορρίψεων</h6>
                <div class="text-on-surface-variant/40 italic text-xs py-1 text-left">Δεν καταγράφηκαν λεπτομέρειες απορρίψεων σε αυτή την εκτέλεση.</div>
            </div>
        `;
    }

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
                <h4 class="text-xl font-bold text-on-surface">${totalScraped}</h4>
            </div>
            <div class="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-center">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">Added (New)</p>
                <h4 class="text-xl font-bold text-primary">${totalAdded}</h4>
            </div>
            <div class="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-center">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">Merged</p>
                <h4 class="text-xl font-bold text-tertiary">${totalMerged}</h4>
            </div>
            <div class="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-center">
                <p class="text-[9px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-1">Exclusions</p>
                <h4 class="text-xl font-bold text-on-surface">${skippedTotal}</h4>
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
                    <strong class="font-mono text-on-surface">${totalSkippedDuplicate}</strong>
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
                    <strong class="font-mono text-on-surface">${totalSkippedRelevance}</strong>
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
                    <strong class="font-mono text-on-surface">${totalSkippedSize}</strong>
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
                    <strong class="font-mono text-on-surface text-red-400">${totalSkippedCrawling}</strong>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                    <span class="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors" onclick="document.getElementById('recent-errors-container').scrollIntoView({behavior: 'smooth'})">
                        <span>Σφάλματα API/DB (Errors)</span>
                        <span class="relative group inline-flex items-center">
                            <span class="material-symbols-outlined text-on-surface-variant/50 text-[14px]">help</span>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1e2024] border border-outline-variant text-[11px] text-on-surface/90 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 text-left line-clamp-4 leading-relaxed normal-case font-normal">
                                Σφάλματα API Gemini (quota/rate limit) ή σφάλματα Supabase DB. Κάντε κλικ εδώ για να κάνετε scroll στα Logs κάτω.
                            </span>
                        </span>
                    </span>
                    <strong class="font-mono text-on-surface text-red-500">${totalSkippedTechnical}</strong>
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
                    <strong class="font-mono text-on-surface">${totalSkippedOther}</strong>
                </div>
            </div>

            ${skippedDetailsHtml}
        </div>

        <!-- Target by Target stats table -->
        <div class="bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden text-left">
            <div class="p-5 border-b border-outline-variant/20">
                <h5 class="text-xs uppercase tracking-wider text-primary font-bold">Ανάλυση ανά Πηγή (Κάντε κλικ στους τίτλους για ταξινόμηση)</h5>
            </div>
            <div class="overflow-x-auto w-full">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-surface-container-high/50 text-[10px] uppercase font-bold text-on-surface-variant/70 border-b border-outline-variant/30 select-none">
                            <th onclick="sortIngestionTable('name')" class="py-3 px-4 cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Πηγή ${ingestionSortColumn === 'name' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick="sortIngestionTable('scraped')" class="py-3 px-4 text-center cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Scraped ${ingestionSortColumn === 'scraped' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick="sortIngestionTable('added')" class="py-3 px-4 text-center cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Added ${ingestionSortColumn === 'added' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick="sortIngestionTable('merged')" class="py-3 px-4 text-center cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Merged ${ingestionSortColumn === 'merged' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick="sortIngestionTable('crawl_fail')" class="py-3 px-4 text-center text-red-400/80 cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Crawl Fail ${ingestionSortColumn === 'crawl_fail' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick="sortIngestionTable('errors')" class="py-3 px-4 text-center text-red-500/80 cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Errors ${ingestionSortColumn === 'errors' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick="sortIngestionTable('relevance')" class="py-3 px-4 text-center text-yellow-400/80 cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Relevance ${ingestionSortColumn === 'relevance' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onclick="sortIngestionTable('skipped')" class="py-3 px-4 text-center cursor-pointer hover:bg-surface-container-high hover:text-primary transition-colors">
                                Skipped ${ingestionSortColumn === 'skipped' ? (ingestionSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
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
            let num, pos;
            if (player.length >= 6) {
                num = (player[4] !== undefined && player[4] !== null && player[4] !== '') ? player[4] : (idx + 1);
                pos = player[5] || '';
            } else {
                const val = player[4];
                if (val !== undefined && val !== null && val !== '' && !isNaN(val)) {
                    num = val;
                    pos = player[5] || '';
                } else {
                    num = idx + 1;
                    pos = val || '';
                }
            }
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
        
        // Direct 1st-click select / 2nd-click instant SWAP on pitch/court player token!
        token.onclick = (e) => {
            e.stopPropagation();
            handleAdminPlayerClick(sport, rosterType, idx, e, token);
        };
        
        // Double-click opens detailed edit popover for name/number changes
        token.ondblclick = (e) => {
            e.stopPropagation();
            cancelAdminSwapMode();
            showPopoverForPlayer(sport, rosterType, idx, token);
        };
        
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
        
        // Allow click events if not dragging
        if (isDragging && totalMoveDist > 5 && e.cancelable) e.preventDefault();
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
            // Click event handling:
            if (adminSwapSource) {
                // If swap source active, 2nd click swaps player A and player B instantly!
                if (handleAdminPlayerClick(sport, rosterType, idx)) return;
            } else {
                // 1st click: Automatically set as swap source & open edit popover
                adminSwapSource = { sport, rosterType, idx, player: currentRoster[sport][rosterType][idx] };
                document.querySelectorAll('.draggable-player').forEach(el => el.classList.remove('swap-source-highlight'));
                token.classList.add('swap-source-highlight');
                showAdminSwapToast(adminSwapSource.player);
                showPopoverForPlayer(sport, rosterType, idx, token);
            }
        }
    };
    
    token.addEventListener('mousedown', onStart);
    token.addEventListener('touchstart', onStart, { passive: false });
}

let selectedPlayerInfo = null;

// ══════════════════════════════════════════════════════════════
// PLAYER PHOTO SYSTEM
// ══════════════════════════════════════════════════════════════
const _adminPhotoCache = {}; // key: "sport/normalizedName" → dataURL
let _adminPhotoMap = null;   // key: "candidate" → filename in /images/roster/
let _adminPhotosLoaded = false;

function greekToLatin(text) {
    if (!text) return "";
    let str = String(text).toLowerCase();
    str = str
        .replace(/αι|αί/g, 'ai')
        .replace(/ει|εί/g, 'ei')
        .replace(/οι|οί/g, 'oi')
        .replace(/ου|ού/g, 'ou')
        .replace(/αυ|αύ/g, 'av')
        .replace(/ευ|εύ/g, 'ev')
        .replace(/μπ/g, 'b')
        .replace(/ντ/g, 'nt')
        .replace(/γκ/g, 'gk')
        .replace(/γγ/g, 'ng')
        .replace(/τζ/g, 'tz')
        .replace(/τσ/g, 'ts')
        .replace(/θ/g, 'th')
        .replace(/χ/g, 'ch')
        .replace(/ψ/g, 'ps')
        .replace(/ξ/g, 'x');

    const singleMap = {
        'α': 'a', 'ά': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'έ': 'e',
        'ζ': 'z', 'η': 'i', 'ή': 'i', 'ι': 'i', 'ί': 'i', 'ϊ': 'i', 'ΐ': 'i',
        'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ο': 'o', 'ό': 'o', 'π': 'p',
        'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'ύ': 'y', 'ϋ': 'y',
        'ΰ': 'y', 'φ': 'f', 'ω': 'o', 'ώ': 'o'
    };

    let res = '';
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        res += singleMap[c] !== undefined ? singleMap[c] : c;
    }
    return res;
}

function getPlayerKeyCandidates(name) {
    if (!name) return [];
    
    const rawNames = [name];
    const latin = greekToLatin(name);
    if (latin && latin !== name) rawNames.push(latin);

    const candidates = [];

    rawNames.forEach(n => {
        let cleaned = String(n).replace(/\(.*?\)/g, '');
        cleaned = cleaned.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        cleaned = cleaned.replace(/[^a-z0-9\u0370-\u03ff\s-]/g, '').trim();
        if (!cleaned) return;

        const words = cleaned.split(/\s+/).filter(Boolean);
        const multiCharWords = words.filter(w => w.length > 1);
        const validWords = multiCharWords.length > 0 ? multiCharWords : words;

        const surname = validWords[validWords.length - 1];
        if (surname && !candidates.includes(surname)) candidates.push(surname);

        const fullHyphen = validWords.join('-');
        if (fullHyphen && !candidates.includes(fullHyphen)) candidates.push(fullHyphen);

        validWords.forEach(w => {
            if (!candidates.includes(w)) candidates.push(w);
        });

        if (validWords.length >= 2) {
            const last2 = validWords.slice(-2).join('-');
            if (!candidates.includes(last2)) candidates.push(last2);
        }
    });

    if (candidates.length === 0) {
        candidates.push('player');
    }

    return candidates;
}

async function loadAllPlayerPhotos() {
    if (!_adminPhotoMap) {
        try {
            const r = await fetch('/player_photos.json?v=' + Date.now());
            if (r.ok) {
                _adminPhotoMap = await r.json();
            }
        } catch(e) { _adminPhotoMap = {}; }
    }

    const client = (typeof db !== 'undefined' && db) || (typeof window !== 'undefined' && window.db) || (window.supabase && window.supabase.createClient && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
    if (!client || _adminPhotosLoaded) return;

    try {
        const { data, error } = await client
            .from('articles')
            .select('source_url, content')
            .eq('category', 'PlayerPhoto');
        if (error) throw error;
        (data || []).forEach(row => {
            // source_url format: "photo://football/pena"
            const key = row.source_url.replace('photo://', '');
            _adminPhotoCache[key] = row.content;
        });
        _adminPhotosLoaded = true;
        console.log(`[Photos] Loaded ${Object.keys(_adminPhotoCache).length} player photos from Supabase`);
    } catch (e) {
        console.warn('[Photos] Could not load photos:', e.message);
    }
}

async function savePlayerPhoto(sport, playerName, dataUrl) {
    const candidates = getPlayerKeyCandidates(playerName);
    let primaryKey = candidates[0];
    if (!primaryKey) {
        let cleanFallback = String(playerName || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        primaryKey = cleanFallback || 'player';
    }
    const sourceUrl = `photo://${sport}/${primaryKey}`;

    const client = (typeof db !== 'undefined' && db) || (typeof window !== 'undefined' && window.db) || (window.supabase && window.supabase.createClient && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
    if (!client) throw new Error('Supabase client not initialized');

    const { error } = await client.from('articles').upsert({
        source_url: sourceUrl,
        title: `Player Photo: ${playerName}`,
        summary: `${sport} player photo`,
        content: dataUrl,
        bullets: [],
        category: 'PlayerPhoto',
        created_at: '1970-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString()
    }, { onConflict: 'source_url' });

    if (error) throw error;

    candidates.forEach(c => {
        _adminPhotoCache[`${sport}/${c}`] = dataUrl;
    });
    _adminPhotoCache[`${sport}/${primaryKey}`] = dataUrl;
    return primaryKey;
}

function getPlayerPhotoUrl(sport, playerName) {
    if (!playerName) return null;
    const sp = sport || 'football';
    const candidates = getPlayerKeyCandidates(playerName);

    // 1. Check Supabase uploaded photos first
    for (const c of candidates) {
        if (_adminPhotoCache[`${sp}/${c}`]) {
            return _adminPhotoCache[`${sp}/${c}`];
        }
    }

    // 2. Fallback to local JSON map
    if (_adminPhotoMap) {
        const folder = sp === 'basketball' ? '/images/roster/basketball/' : '/images/roster/football/';
        for (const c of candidates) {
            if (_adminPhotoMap[c]) {
                return folder + _adminPhotoMap[c];
            }
        }
    }

    return null;
}

function compressImageToDataUrl(file, maxSize = 300) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = url;
    });
}

function compressBlobToDataUrl(blob, maxSize = 300) {
    return compressImageToDataUrl(blob, maxSize);
}

function setupPhotoUploadWidget() {
    const dropZone = document.getElementById('photo-drop-zone');
    const fileInput = document.getElementById('photo-file-input');
    const preview = document.getElementById('photo-preview');
    const statusEl = document.getElementById('photo-upload-status');
    if (!dropZone) return;

    let stagedDataUrl = null;

    function setPreview(dataUrl) {
        stagedDataUrl = dataUrl;
        preview.src = dataUrl;
        preview.classList.remove('hidden');
        dropZone.querySelector('.photo-placeholder').classList.add('hidden');
        if (statusEl) { statusEl.textContent = '✅ Έτοιμο — πάτα Ενημέρωση για αποθήκευση'; statusEl.className = 'text-[10px] text-green-400 mt-1 text-center'; }
        window._stagedPlayerPhoto = dataUrl;
    }

    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const dataUrl = await compressImageToDataUrl(file);
        setPreview(dataUrl);
        fileInput.value = '';
    });

    // Drag & drop
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('ring-2', 'ring-primary'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('ring-2', 'ring-primary'));
    dropZone.addEventListener('drop', async e => {
        e.preventDefault();
        dropZone.classList.remove('ring-2', 'ring-primary');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const dataUrl = await compressImageToDataUrl(file);
            setPreview(dataUrl);
        }
    });

    // Global paste listener (active when popover is open)
    document.addEventListener('paste', async e => {
        const popover = document.getElementById('player-edit-popover');
        if (!popover || popover.classList.contains('hidden')) return;
        const items = e.clipboardData?.items || [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                const dataUrl = await compressBlobToDataUrl(file);
                setPreview(dataUrl);
                break;
            }
        }
    });
}

window._stagedPlayerPhoto = null;

async function showPopoverForPlayer(sport, rosterType, idx, token) {
    if (adminSwapSource) {
        if (handleAdminPlayerClick(sport, rosterType, idx)) return;
    }
    selectedPlayerInfo = { sport, rosterType, idx, token };
    
    const rosterList = currentRoster[sport][rosterType];
    const player = rosterList[idx];
    if (!player) return;
    
    let name = '', num = '', pos = '', initials = '', nationality = '', birthDate = '', height = '';
    
    if (Array.isArray(player)) {
        initials = player[2] || '';
        name = player[3] || '';
        num = (player[4] !== undefined && player[4] !== null) ? player[4] : '';
        pos = player[5] || '';
        nationality = player[6] || '';
        birthDate = player[7] || '';
        height = player[8] || '';
    } else if (typeof player === 'object') {
        initials = player.initials || '';
        name = player.name || '';
        num = player.num !== undefined && player.num !== null ? player.num : (player.number || '');
        pos = player.pos || player.position || '';
        nationality = player.nationality || player.national || player[6] || '';
        birthDate = player.birthDate || player.dob || player[7] || '';
        height = player.height || player[8] || '';
    }
    
    const initEl = document.getElementById('popover-initials');
    if (initEl) initEl.value = initials;
    document.getElementById('popover-name').value = name;
    
    const labelEl = document.getElementById('popover-badge-label');
    const badgeInput = document.getElementById('popover-badge');
    const extraWrapper = document.getElementById('popover-extra-wrapper');
    const extraInput = document.getElementById('popover-extra-input');
    
    const natInput = document.getElementById('popover-nationality');
    const dobInput = document.getElementById('popover-birthdate');
    const hgtInput = document.getElementById('popover-height');
    
    if (natInput) natInput.value = nationality;
    if (dobInput) dobInput.value = birthDate;
    if (hgtInput) hgtInput.value = height;
    
    labelEl.textContent = 'Νούμερο';
    badgeInput.value = num;
    
    if (extraWrapper && extraInput) {
        extraWrapper.classList.remove('hidden');
        document.getElementById('popover-extra-label').textContent = 'Θέση';
        extraInput.value = pos;
    }
    
    // ── Load existing photo into widget ──
    window._stagedPlayerPhoto = null;
    if (!_adminPhotosLoaded && typeof loadAllPlayerPhotos === 'function') {
        await loadAllPlayerPhotos();
    }
    const existingPhoto = getPlayerPhotoUrl(sport, name);
    const previewEl = document.getElementById('photo-preview');
    const placeholderEl = document.querySelector('#photo-drop-zone .photo-placeholder');
    const photoStatus = document.getElementById('photo-upload-status');
    if (previewEl) {
        if (existingPhoto) {
            previewEl.src = existingPhoto;
            previewEl.classList.remove('hidden');
            if (placeholderEl) placeholderEl.classList.add('hidden');
            if (photoStatus) { photoStatus.textContent = '📷 Υπάρχει φωτογραφία'; photoStatus.className = 'text-[10px] text-primary mt-1 text-center'; }
        } else {
            previewEl.src = '';
            previewEl.classList.add('hidden');
            if (placeholderEl) placeholderEl.classList.remove('hidden');
            if (photoStatus) { photoStatus.textContent = 'Δεν υπάρχει φωτογραφία'; photoStatus.className = 'text-[10px] text-on-surface-variant mt-1 text-center'; }
        }
    }

    const popover = document.getElementById('player-edit-popover');
    popover.classList.remove('hidden');
    
    const tokenRect = token.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    
    let popoverLeft = tokenRect.left - bodyRect.left + 50;
    let popoverTop = tokenRect.top - bodyRect.top - 80;
    
    popover.style.left = popoverLeft + 'px';
    popover.style.top = popoverTop + 'px';
    
    document.querySelectorAll('.draggable-player, .reserve-card-item').forEach(el => el.classList.remove('selected'));
    token.classList.add('selected');
}

function closePopover() {
    document.getElementById('player-edit-popover').classList.add('hidden');
    document.querySelectorAll('.draggable-player, .reserve-card-item').forEach(el => el.classList.remove('selected'));
    selectedPlayerInfo = null;
    window._stagedPlayerPhoto = null;
}

async function savePopoverChanges() {
    if (!selectedPlayerInfo) return;
    const { sport, rosterType, idx } = selectedPlayerInfo;
    const rosterList = currentRoster[sport][rosterType];
    if (!rosterList[idx]) return;
    
    const initEl = document.getElementById('popover-initials');
    const newInitials = initEl ? initEl.value.trim() : 'PAO';
    const newName = document.getElementById('popover-name').value.trim() || 'Παίκτης';
    const newBadge = document.getElementById('popover-badge').value.trim() || '';
    
    const extraInput = document.getElementById('popover-extra-input');
    const newPos = extraInput ? extraInput.value.trim() : '';

    const natInput = document.getElementById('popover-nationality');
    const dobInput = document.getElementById('popover-birthdate');
    const hgtInput = document.getElementById('popover-height');

    const newNat = natInput ? natInput.value.trim() : '';
    const newDob = dobInput ? dobInput.value.trim() : '';
    const newHgt = hgtInput ? hgtInput.value.trim() : '';

    if (Array.isArray(rosterList[idx])) {
        rosterList[idx][2] = newInitials;
        rosterList[idx][3] = newName;
        rosterList[idx][4] = newBadge;
        rosterList[idx][5] = newPos;
        rosterList[idx][6] = newNat;
        rosterList[idx][7] = newDob;
        rosterList[idx][8] = newHgt;
    } else if (typeof rosterList[idx] === 'object') {
        rosterList[idx].initials = newInitials;
        rosterList[idx].name = newName;
        rosterList[idx].num = newBadge;
        rosterList[idx].number = newBadge;
        rosterList[idx].pos = newPos;
        rosterList[idx].position = newPos;
        rosterList[idx].nationality = newNat;
        rosterList[idx].birthDate = newDob;
        rosterList[idx].height = newHgt;
    }
    
    // ── Save staged photo if any ──
    if (window._stagedPlayerPhoto) {
        const photoStatus = document.getElementById('photo-upload-status');
        if (photoStatus) { photoStatus.textContent = '⬆ Ανέβασμα...'; photoStatus.className = 'text-[10px] text-amber-400 mt-1 text-center animate-pulse'; }
        try {
            await savePlayerPhoto(sport, newName, window._stagedPlayerPhoto);
            if (photoStatus) { photoStatus.textContent = '✅ Φωτογραφία αποθηκεύτηκε!'; photoStatus.className = 'text-[10px] text-green-400 mt-1 text-center'; }
        } catch (e) {
            console.error('[Photos] Save failed:', e);
            if (photoStatus) { photoStatus.textContent = '❌ Σφάλμα αποθήκευσης φωτό'; photoStatus.className = 'text-[10px] text-red-400 mt-1 text-center'; }
        }
    }

    const rawId = `roster-${sport}-${rosterType}`;
    const textarea = document.getElementById(rawId);
    if (textarea) {
        textarea.value = JSON.stringify(rosterList, null, 2);
    }
    
    if (rosterType === 'rest') {
        adminRenderReserves(sport);
    } else {
        adminRenderRosterSection(sport, rosterType);
    }
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
    
    if (rosterType === 'rest') {
        adminRenderReserves(sport);
    } else {
        adminRenderRosterSection(sport, rosterType);
    }
    closePopover();
}

function addPlayer(sport, rosterType) {
    const rosterList = currentRoster[sport][rosterType];
    const defaultPlayer = sport === 'football' 
        ? [50, 50, 'NEW', 'Νέος Παίκτης', rosterType === 'starting' ? 10 : 12, 'ST']
        : [50, 50, 'NEW', 'Νέος Παίκτης', 10, 'SG'];
        
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
        container.innerHTML = `<div class="col-span-full text-center text-xs text-on-surface-variant/40 py-4">Δεν υπάρχουν παίκτες στο υπόλοιπο ρόστερ.</div>`;
        return;
    }
    
    restList.forEach((player, idx) => {
        const card = document.createElement('div');
        card.className = 'reserve-card-item flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 hover:border-amber-500/50 cursor-pointer transition-all shadow-sm w-full max-w-full overflow-hidden';
        card.onclick = (e) => {
            if (['INPUT', 'BUTTON', 'SPAN'].includes(e.target.tagName)) return;
            handleAdminPlayerClick(sport, 'rest', idx, e, card);
        };
        card.ondblclick = (e) => {
            e.stopPropagation();
            cancelAdminSwapMode();
            showPopoverForPlayer(sport, 'rest', idx, card);
        };
        
        let moveButtons = `
            <div class="flex flex-col gap-0.5 shrink-0">
                <button onclick="moveReserve('${sport}', ${idx}, -1)" class="material-symbols-outlined text-on-surface-variant hover:text-primary p-0 text-[14px] sm:text-[18px] leading-none ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}">arrow_drop_up</button>
                <button onclick="moveReserve('${sport}', ${idx}, 1)" class="material-symbols-outlined text-on-surface-variant hover:text-primary p-0 text-[14px] sm:text-[18px] leading-none ${idx === restList.length - 1 ? 'opacity-30 pointer-events-none' : ''}">arrow_drop_down</button>
            </div>
        `;
        
        const pName = Array.isArray(player) ? (player[3] || '') : (player.name || '');
        const pPos = Array.isArray(player) ? (player[5] || '') : (player.pos || player.position || '');
        const pNum = Array.isArray(player) ? (player[4] || '') : (player.num || player.number || '');

        card.innerHTML = `
            ${moveButtons}
            <input type="text" value="${pName}" placeholder="Όνομα Παίκτη" class="editor-input py-1 px-1.5 sm:px-3 text-xs sm:text-sm font-semibold flex-1 min-w-0" style="background:#111317;" oninput="updateReserveField('${sport}', ${idx}, 'name', this.value)"/>
            <input type="text" value="${pPos || pNum}" placeholder="Θέση" class="editor-input py-1 px-1 sm:px-2 text-[10px] sm:text-xs text-center font-mono w-12 sm:w-16 shrink-0" style="background:#111317;" oninput="updateReserveField('${sport}', ${idx}, 'pos', this.value)"/>
            <button onclick="showPopoverForPlayer('${sport}', 'rest', ${idx}, this.parentElement); event.stopPropagation();" class="p-1 sm:p-2 bg-primary/15 hover:bg-primary/25 border border-primary/40 text-primary rounded-lg sm:rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1" title="Επεξεργασία (Εθνικότητα, Ημερομηνία, Ύψος)">
                <span class="material-symbols-outlined text-[14px] sm:text-[18px] block">manage_accounts</span>
            </button>
            <button onclick="handleAdminPlayerClick('${sport}', 'rest', ${idx}, event, this.parentElement)" class="p-1 sm:p-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 rounded-lg sm:rounded-xl transition-all cursor-pointer shrink-0" title="Αντικατάσταση (Swap)">
                <span class="material-symbols-outlined text-[14px] sm:text-[18px] block">sync</span>
            </button>
            <button onclick="deleteReserve('${sport}', ${idx})" class="material-symbols-outlined text-red-400 hover:text-red-300 p-0.5 sm:p-1 text-[16px] sm:text-[18px] shrink-0 cursor-pointer" title="Διαγραφή">delete</button>
        `;
        container.appendChild(card);
    });
}

function updateReserveField(sport, idx, field, val) {
    const restList = currentRoster[sport].rest;
    if (restList[idx]) {
        if (Array.isArray(restList[idx])) {
            if (field === 'name') restList[idx][3] = val;
            if (field === 'pos') restList[idx][5] = val;
        } else {
            restList[idx][field] = val;
            if (field === 'pos') restList[idx]['num'] = val;
        }
        
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
        detail: 'Περιγραφή',
        nationality: '',
        birthDate: '',
        height: ''
    });
    
    const textarea = document.getElementById(`roster-${sport}-rest`);
    if (textarea) {
        textarea.value = JSON.stringify(restList, null, 2);
    }
    
    adminRenderReserves(sport);

    setTimeout(() => {
        const container = document.getElementById(`admin-reserves-${sport}`);
        if (container) {
            const cards = container.querySelectorAll('.reserve-card-item');
            const lastCard = cards[cards.length - 1];
            if (lastCard) {
                showPopoverForPlayer(sport, 'rest', restList.length - 1, lastCard);
            }
        }
    }, 100);
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
        const res = await fetch('/api/admin-stats?password=1357');
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

        // Cache fetched data and render charts
        trafficStatsCache = data;
        renderTrafficCharts(data, currentTrafficSourceFilter);
        renderSourceDistributionChart(currentSourceRangeFilter);

    } catch (err) {
        console.error('Failed to load engagement/system stats:', err);
    }
}
window.loadEngagementStats = loadEngagementStats;

let trafficStatsCache = null;
let currentTrafficSourceFilter = 'ALL';
let currentSourceRangeFilter = 'last_7d';

function filterTrafficChartsBySource(sourceFilter) {
    currentTrafficSourceFilter = sourceFilter;
    if (trafficStatsCache) {
        renderTrafficCharts(trafficStatsCache, currentTrafficSourceFilter);
    }
}
window.filterTrafficChartsBySource = filterTrafficChartsBySource;

function renderSourceDistributionChart(rangeKey) {
    if (rangeKey) currentSourceRangeFilter = rangeKey;
    if (!trafficStatsCache) return;

    const data = trafficStatsCache;
    const sourcesByRange = data.sources_by_range || {};
    const rangeData = sourcesByRange[currentSourceRangeFilter] || {};

    const targetSources = [
        'Sport-FM', 'SDNA', 'Sportal', 'Sport24', 
        'Gazzetta', 'Sportime', 'Monobala', 'OnSports', 'Athletiko', 
        'PAO Official', 'PAO1908 Official', 'Manual'
    ];

    const sourceCounts = targetSources.map(src => rangeData[src] || 0);
    const maxVal = Math.max(...sourceCounts, 1);
    const totalSum = sourceCounts.reduce((a, b) => a + b, 0);

    // Update Y-Axis
    const y3 = document.getElementById('source-y-axis-val-3');
    const y2 = document.getElementById('source-y-axis-val-2');
    const y1 = document.getElementById('source-y-axis-val-1');
    if (y3) y3.textContent = Math.round(maxVal).toString();
    if (y2) y2.textContent = Math.round(maxVal * 2 / 3).toString();
    if (y1) y1.textContent = Math.round(maxVal * 1 / 3).toString();

    // Update Subtitle with current date range text
    const subtitleEl = document.getElementById('source-chart-subtitle');
    if (subtitleEl) {
        const rangeNames = {
            today: 'Σήμερα',
            yesterday: 'Χθες',
            last_7d: 'Τελευταίες 7 Ημέρες',
            ever: 'Όλα (All Time)'
        };
        const rangeText = rangeNames[currentSourceRangeFilter] || currentSourceRangeFilter;
        subtitleEl.textContent = `Συνολικός αριθμός άρθρων που δημοσιεύθηκαν ανά πηγή — ${rangeText} (Σύνολο: ${totalSum})`;
    }

    // Populate Bars & X-Axis Labels
    const chartContainer = document.getElementById('source-chart-bars-container');
    const xAxisContainer = document.getElementById('source-chart-x-axis-labels');

    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="absolute inset-x-0 top-0 border-t border-outline-variant/10 pointer-events-none"></div>
            <div class="absolute inset-x-0 top-1/3 border-t border-outline-variant/10 pointer-events-none"></div>
            <div class="absolute inset-x-0 top-2/3 border-t border-outline-variant/10 pointer-events-none"></div>
        `;

        if (xAxisContainer) xAxisContainer.innerHTML = '';

        targetSources.forEach((srcName, idx) => {
            const count = sourceCounts[idx];
            const pct = ((count / maxVal) * 98).toFixed(1);
            const sharePct = totalSum > 0 ? ((count / totalSum) * 100).toFixed(1) : '0.0';

            const barDiv = document.createElement('div');
            barDiv.className = 'w-full bg-emerald-500/30 hover:bg-emerald-400/80 transition-all duration-300 rounded-t cursor-pointer relative group';
            barDiv.style.height = `${Math.max(3, pct)}%`;

            const isTallBar = Number(pct) > 55;
            const tooltipPosClass = isTallBar
                ? 'top-2 left-1/2 transform -translate-x-1/2'
                : 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';

            barDiv.innerHTML = `
                <div class="absolute ${tooltipPosClass} bg-[#1e2024] border border-outline-variant px-3 py-2 rounded-lg text-[10px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl text-left min-w-[130px]" style="white-space:normal">
                    <div class="flex justify-between items-center gap-3 font-bold">
                        <span class="text-emerald-400">${srcName}</span>
                        <span class="text-on-surface">${count} άρθρα</span>
                    </div>
                    <div class="text-[9px] text-on-surface-variant/70 mt-1">
                        Μερίδιο: <strong class="text-on-surface font-mono">${sharePct}%</strong>
                    </div>
                </div>
            `;
            chartContainer.appendChild(barDiv);

            if (xAxisContainer) {
                const labelSpan = document.createElement('span');
                labelSpan.className = 'w-full text-center truncate text-[9px] text-on-surface-variant/80 font-mono font-semibold';
                labelSpan.title = srcName;
                let shortName = srcName;
                if (srcName === 'PAO Official') shortName = 'PAO Off';
                if (srcName === 'PAO1908 Official') shortName = 'PAO1908';
                labelSpan.textContent = shortName;
                xAxisContainer.appendChild(labelSpan);
            }
        });
    }
}
window.renderSourceDistributionChart = renderSourceDistributionChart;

function renderTrafficCharts(data, filterSource = 'ALL') {
    // 0. Dynamic Overview Card Filtering
    const totalArticlesEl = document.getElementById('total-articles-count');
    const totalArticlesSubEl = document.getElementById('total-articles-sub');
    if (totalArticlesEl) {
        if (filterSource === 'ALL') {
            const dbTotal = (data.database && data.database.total_articles) || 0;
            totalArticlesEl.textContent = dbTotal.toLocaleString('el-GR');
            if (totalArticlesSubEl) totalArticlesSubEl.textContent = 'Αθροιστικά — ever';
        } else {
            const totalBySrc = data.total_by_source || {};
            const srcCount = totalBySrc[filterSource] || 0;
            totalArticlesEl.textContent = srcCount.toLocaleString('el-GR');
            if (totalArticlesSubEl) totalArticlesSubEl.textContent = `Πηγή: ${filterSource}`;
        }
    }

    // 4. Render 24h Post Activity Chart
    const hourlyBySource = data.hourly_by_source || Array(24).fill(null).map(() => ({}));
    const hourlyLabels = data.hourly_labels || Array(24).fill(null).map((_, i) => `${String(i).padStart(2,'0')}:00`);

    const hourlyPosts = Array(24).fill(0);
    for (let i = 0; i < 24; i++) {
        const srcObj = hourlyBySource[i] || {};
        if (filterSource === 'ALL') {
            hourlyPosts[i] = Object.values(srcObj).reduce((a, b) => a + b, 0);
        } else {
            hourlyPosts[i] = srcObj[filterSource] || 0;
        }
    }

    const chartContainer = document.getElementById('chart-bars-container');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="absolute inset-x-0 top-0 border-t border-outline-variant/10 pointer-events-none"></div>
            <div class="absolute inset-x-0 top-1/3 border-t border-outline-variant/10 pointer-events-none"></div>
            <div class="absolute inset-x-0 top-2/3 border-t border-outline-variant/10 pointer-events-none"></div>
        `;
        
        const maxVal = Math.max(...hourlyPosts, 1);
        
        document.getElementById('y-axis-val-3').textContent = Math.round(maxVal).toString();
        document.getElementById('y-axis-val-2').textContent = Math.round(maxVal * 2 / 3).toString();
        document.getElementById('y-axis-val-1').textContent = Math.round(maxVal * 1 / 3).toString();

        [0, 4, 8, 12, 16, 20, 23].forEach(idx => {
            const el = document.getElementById(`x-axis-val-${idx}`);
            if (el) el.textContent = hourlyLabels[idx] || '';
        });

        hourlyPosts.forEach((count, idx) => {
            const label = hourlyLabels[idx] || `${String(idx).padStart(2,'0')}:00`;
            const pct = ((count / maxVal) * 98).toFixed(1);
            
            const srcBreakdown = hourlyBySource[idx] || {};
            const srcEntries = filterSource === 'ALL'
                ? Object.entries(srcBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([src, n]) => `<span class="flex justify-between gap-3"><span class="text-on-surface-variant/70">${src}</span><strong class="text-on-surface">${n}</strong></span>`)
                    .join('')
                : (srcBreakdown[filterSource] ? `<span class="flex justify-between gap-3"><span class="text-on-surface-variant/70">${filterSource}</span><strong class="text-on-surface">${srcBreakdown[filterSource]}</strong></span>` : '');

            const srcHtml = srcEntries
                ? `<div class="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-outline-variant/30">${srcEntries}</div>`
                : '';
            
            const barDiv = document.createElement('div');
            barDiv.className = 'w-full bg-primary/25 hover:bg-primary/60 transition-all duration-300 rounded-t cursor-pointer relative group';
            barDiv.style.height = `${Math.max(3, pct)}%`;
            
            const isTallBar = Number(pct) > 55;
            const tooltipPosClass = isTallBar
                ? 'top-2 left-1/2 transform -translate-x-1/2'
                : 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';

            barDiv.innerHTML = `
                <div class="absolute ${tooltipPosClass} bg-[#1e2024] border border-outline-variant px-3 py-2 rounded-lg text-[10px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl text-left min-w-[140px]" style="white-space:normal">
                    <div class="flex justify-between items-center gap-3 font-bold">
                        <span class="text-primary">${label}</span>
                        <span class="text-on-surface">${count} άρθρα</span>
                    </div>
                    ${srcHtml}
                </div>
            `;
            chartContainer.appendChild(barDiv);
        });

        const startLabel = hourlyLabels[0] || '00:00';
        const endLabel = hourlyLabels[23] || '23:00';
        const chartSubtitle = document.getElementById('chart-subtitle');
        if (chartSubtitle) {
            const filterSuffix = filterSource === 'ALL' ? '' : ` [Πηγή: ${filterSource}]`;
            chartSubtitle.textContent = `Άρθρα που δημοσιεύθηκαν ανά ώρα — τελευταίες 24h (${startLabel} → ${endLabel})${filterSuffix}`;
        }
    }

    // 5. Render 30-day Post Activity Chart
    const dailyBySource = data.daily_by_source || Array(30).fill(null).map(() => ({}));
    const dailyLabels = data.daily_labels || Array(30).fill(null).map((_, i) => `H-${30-i}`);

    const dailyPosts = Array(30).fill(0);
    for (let i = 0; i < 30; i++) {
        const srcObj = dailyBySource[i] || {};
        if (filterSource === 'ALL') {
            dailyPosts[i] = Object.values(srcObj).reduce((a, b) => a + b, 0);
        } else {
            dailyPosts[i] = srcObj[filterSource] || 0;
        }
    }

    const dailyChartContainer = document.getElementById('daily-chart-bars-container');
    if (dailyChartContainer) {
        dailyChartContainer.innerHTML = `
            <div class="absolute inset-x-0 top-0 border-t border-outline-variant/10 pointer-events-none"></div>
            <div class="absolute inset-x-0 top-1/3 border-t border-outline-variant/10 pointer-events-none"></div>
            <div class="absolute inset-x-0 top-2/3 border-t border-outline-variant/10 pointer-events-none"></div>
        `;
        
        const maxValDaily = Math.max(...dailyPosts, 1);
        
        const y3 = document.getElementById('daily-y-axis-val-3');
        const y2 = document.getElementById('daily-y-axis-val-2');
        const y1 = document.getElementById('daily-y-axis-val-1');
        if (y3) y3.textContent = Math.round(maxValDaily).toString();
        if (y2) y2.textContent = Math.round(maxValDaily * 2 / 3).toString();
        if (y1) y1.textContent = Math.round(maxValDaily * 1 / 3).toString();

        [0, 5, 10, 15, 20, 25, 29].forEach(idx => {
            const el = document.getElementById(`daily-x-axis-val-${idx}`);
            if (el) el.textContent = dailyLabels[idx] || '';
        });

        dailyPosts.forEach((count, idx) => {
            const label = dailyLabels[idx] || `Hμέρα ${idx+1}`;
            const pct = ((count / maxValDaily) * 98).toFixed(1);
            
            const srcBreakdown = dailyBySource[idx] || {};
            const srcEntries = filterSource === 'ALL'
                ? Object.entries(srcBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([src, n]) => `<span class="flex justify-between gap-3"><span class="text-on-surface-variant/70">${src}</span><strong class="text-on-surface">${n}</strong></span>`)
                    .join('')
                : (srcBreakdown[filterSource] ? `<span class="flex justify-between gap-3"><span class="text-on-surface-variant/70">${filterSource}</span><strong class="text-on-surface">${srcBreakdown[filterSource]}</strong></span>` : '');

            const srcHtml = srcEntries
                ? `<div class="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-outline-variant/30">${srcEntries}</div>`
                : '';
            
            const barDiv = document.createElement('div');
            barDiv.className = 'w-full bg-primary/30 hover:bg-primary/70 transition-all duration-300 rounded-t cursor-pointer relative group';
            barDiv.style.height = `${Math.max(3, pct)}%`;
            
            const isTallBarDaily = Number(pct) > 55;
            const tooltipPosClassDaily = isTallBarDaily
                ? 'top-2 left-1/2 transform -translate-x-1/2'
                : 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';

            barDiv.innerHTML = `
                <div class="absolute ${tooltipPosClassDaily} bg-[#1e2024] border border-outline-variant px-3 py-2 rounded-lg text-[10px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl text-left min-w-[150px]" style="white-space:normal">
                    <div class="flex justify-between items-center gap-3 font-bold">
                        <span class="text-primary">${label}</span>
                        <span class="text-on-surface">${count} άρθρα</span>
                    </div>
                    ${srcHtml}
                </div>
            `;
            dailyChartContainer.appendChild(barDiv);
        });

        const firstDate = dailyLabels[0] || '';
        const lastDate = dailyLabels[dailyLabels.length - 1] || '';
        const dailyChartSubtitle = document.getElementById('daily-chart-subtitle');
        if (dailyChartSubtitle) {
            const filterSuffix = filterSource === 'ALL' ? '' : ` [Πηγή: ${filterSource}]`;
            dailyChartSubtitle.textContent = `Συνολικά άρθρα που δημοσιεύθηκαν ανά ημέρα — τελευταίες 30 ημέρες (${firstDate} → ${lastDate})${filterSuffix}`;
        }
    }
}

// ── Instant Admin Scrape Trigger ──────────────────────────────────────────────
async function triggerInstantScrape() {
    const btn = document.getElementById('instant-scrape-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> <span>Ενεργοποίηση...</span>`;
    }

    try {
        const res = await fetch('/api/scrape?token=pao1908_secure&force=true');
        const data = await res.json().catch(() => ({}));
        if (data.success) {
            alert('⚡ Ο Scraper ενεργοποιήθηκε ακαριαία! Η σάρωση όλων των πηγών ξεκίνησε στο GitHub.');
        } else {
            alert('❌ Σφάλμα: ' + (data.error || data.message || 'Αποτυχία ενεργοποίησης'));
        }
    } catch(e) {
        console.error(e);
        alert('❌ Σφάλμα σύνδεσης.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">bolt</span> <span>⚡ Instant Scrape Now</span>`;
        }
    }
}
window.triggerInstantScrape = triggerInstantScrape;



// ── FIXTURES & SCHEDULE MANAGER ────────────────────────────────────────────────
let adminFixturesCache = [];
let editingFixtureId = null;

async function loadAdminFixtures(categoryFilter = 'all') {
    window.currentAdminFixtureCategoryFilter = categoryFilter;
    if (!db && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    const container = document.getElementById('admin-fixtures-list');
    if (!container) return;

    container.innerHTML = '<div class="p-8 text-center text-on-surface-variant"><span class="material-symbols-outlined animate-spin text-2xl mb-2">sync</span><p>Φόρτωση αγώνων...</p></div>';

    // Highlight category sub-filter buttons
    ['all', 'football', 'basketball', 'amateur'].forEach(cat => {
        const btn = document.getElementById(`admin-fix-cat-${cat}`);
        if (btn) {
            if (cat === categoryFilter) {
                btn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary transition-all';
            } else {
                btn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all';
            }
        }
    });

    try {
        let query = db.from('fixtures').select('*').order('match_date', { ascending: true });
        if (categoryFilter !== 'all') {
            query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        adminFixturesCache = data || [];
        renderAdminFixturesList(container, adminFixturesCache);
    } catch (err) {
        console.error('Error loading fixtures:', err);
        container.innerHTML = `<div class="p-8 text-center text-error border border-error/20 rounded-2xl bg-error/5"><p class="font-bold mb-1">Σφάλμα φόρτωσης προγράμματος</p><p class="text-xs">${err.message}</p></div>`;
    }
}
window.loadAdminFixtures = loadAdminFixtures;

function renderAdminFixturesList(container, fixtures) {
    if (!fixtures || fixtures.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-on-surface-variant/60 border border-outline-variant/20 rounded-2xl bg-surface-container/30"><span class="material-symbols-outlined text-3xl mb-2">event_busy</span><p class="font-semibold text-sm">Δεν βρέθηκαν καταχωρημένοι αγώνες.</p><button onclick="openAddFixtureModal()" class="mt-4 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-md">➕ Προσθήκη Πρώτου Αγώνα</button></div>`;
        return;
    }

    let firstCurrentElId = null;
    let html = '';
    fixtures.forEach(m => {
        const dateStr = m.match_date ? new Date(m.match_date).toLocaleString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Χωρίς ημερομηνία';
        const isCurrent = Boolean(m.is_current);
        const cardId = `admin-fixture-card-${m.id}`;

        if (isCurrent && !firstCurrentElId) {
            firstCurrentElId = cardId;
        }

        const isCurrentBadge = isCurrent ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">📌 Current Match</span>' : '';
        const homeScoreText = (m.home_score !== null && m.home_score !== undefined) ? m.home_score : '-';
        const awayScoreText = (m.away_score !== null && m.away_score !== undefined) ? m.away_score : '-';

        let catBadge = '⚽ Ποδόσφαιρο';
        if (m.category === 'basketball') catBadge = '🏀 Μπάσκετ';
        else if (m.category === 'amateur') catBadge = '🤾 Ερασιτέχνης';

        const currentBtnText = isCurrent ? 'Unset Current' : '📌 Set Current';
        const currentBtnStyle = isCurrent ? 'bg-primary/20 text-primary border-primary/40' : 'bg-surface-container-high hover:bg-surface-container-highest border-outline-variant/30 text-on-surface';
        const currentIcon = isCurrent ? 'keep_off' : 'push_pin';

        const hasArticleBadge = m.article_url ? `<a href="${escapeHtml(m.article_url)}" target="_blank" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/20 text-tertiary border border-tertiary/30 flex items-center gap-1 hover:underline"><span class="material-symbols-outlined text-[12px]">newspaper</span> Άρθρο</a>` : '';

        html += `
        <div id="${cardId}" class="bg-surface-container rounded-2xl border ${isCurrent ? 'border-primary ring-1 ring-primary/40 shadow-lg shadow-primary/5' : 'border-outline-variant/30'} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all scroll-mt-28">
            <div class="flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-2 text-xs">
                    <span class="font-bold text-primary">${catBadge}</span>
                    <span class="text-on-surface-variant/40">•</span>
                    <span class="text-on-surface-variant font-medium">${m.competition || 'Αγώνας'}</span>
                    <span class="text-on-surface-variant/40">•</span>
                    <span class="text-on-surface-variant font-mono">${dateStr}</span>
                    ${isCurrentBadge}
                    ${hasArticleBadge}
                </div>
                <div class="flex items-center gap-4 text-base font-bold text-on-surface">
                    <span class="truncate">${m.home_team_name}</span>
                    <span class="px-3 py-1 bg-surface-container-high rounded-lg text-primary font-mono text-sm font-extrabold border border-outline-variant/20">${homeScoreText} - ${awayScoreText}</span>
                    <span class="truncate">${m.away_team_name}</span>
                </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
                <button onclick="toggleFixtureCurrent('${m.id}', ${isCurrent})" class="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${currentBtnStyle}" title="Toggle Current Match"><span class="material-symbols-outlined text-[16px]">${currentIcon}</span> ${currentBtnText}</button>
                <button onclick="editFixtureModal('${m.id}')" class="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"><span class="material-symbols-outlined text-[16px]">edit</span> Επεξεργασία</button>
                <button onclick="deleteFixture('${m.id}')" class="px-3 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error border border-error/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer" title="Διαγραφή αγώνα"><span class="material-symbols-outlined text-[16px]">delete</span></button>
            </div>
        </div>`;
    });

    container.innerHTML = html;

    if (firstCurrentElId) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const el = document.getElementById(firstCurrentElId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }));
    }
}

function ensureArticleUrlFieldExists() {
    let artUrlEl = document.getElementById('fix-article-url');
    if (!artUrlEl) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mt-1 mb-1';
        wrapper.innerHTML = `
            <label class="text-[11px] uppercase font-bold text-on-surface-variant mb-1 block flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-primary">link</span>
                Σχετικό Άρθρο (URL)
            </label>
            <input id="fix-article-url" type="url" class="editor-input text-sm py-2 px-3 w-full rounded-xl" placeholder="https://www.panathinaikosnews.gr/..."/>
            <p class="text-[10px] text-on-surface-variant/60 mt-1">Προαιρετικό. Αν συμπληρωθεί, θα εμφανιστεί κουμπί "Σχετικό άρθρο" δίπλα στο σκορ στον αγώνα.</p>
        `;
        const modalBody = document.querySelector('#fixture-edit-modal .p-6');
        const currentCheckboxRow = document.getElementById('fix-is-current')?.closest('.flex');
        if (modalBody && currentCheckboxRow) {
            modalBody.insertBefore(wrapper, currentCheckboxRow);
        } else if (modalBody) {
            modalBody.appendChild(wrapper);
        }
        artUrlEl = document.getElementById('fix-article-url');
    }
    return artUrlEl;
}

function openAddFixtureModal() {
    editingFixtureId = null;
    document.getElementById('fixture-modal-title').textContent = 'Προσθήκη Νέου Αγώνα';
    document.getElementById('fix-category').value = 'football';
    document.getElementById('fix-competition').value = 'Super League';
    document.getElementById('fix-date').value = '';
    document.getElementById('fix-home-name').value = 'Παναθηναϊκός';
    document.getElementById('fix-home-score').value = '';
    document.getElementById('fix-away-name').value = '';
    document.getElementById('fix-away-score').value = '';
    const artUrlEl = ensureArticleUrlFieldExists();
    if (artUrlEl) artUrlEl.value = '';
    document.getElementById('fix-is-current').checked = false;
    
    document.getElementById('fixture-edit-modal').classList.remove('hidden');
}
window.openAddFixtureModal = openAddFixtureModal;

function editFixtureModal(id) {
    let found = null;
    for (let i = 0; i < adminFixturesCache.length; i++) {
        if (String(adminFixturesCache[i].id) === String(id)) {
            found = adminFixturesCache[i];
            break;
        }
    }
    if (!found) return;

    editingFixtureId = found.id;
    document.getElementById('fixture-modal-title').textContent = 'Επεξεργασία Αγώνα';
    document.getElementById('fix-category').value = found.category || 'football';
    document.getElementById('fix-competition').value = found.competition || '';
    
    if (found.match_date) {
        const d = new Date(found.match_date);
        const pad = function(num) { return String(num).padStart(2, '0'); };
        const localIso = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        document.getElementById('fix-date').value = localIso;
    } else {
        document.getElementById('fix-date').value = '';
    }

    document.getElementById('fix-home-name').value = found.home_team_name || '';
    document.getElementById('fix-home-score').value = (found.home_score !== null && found.home_score !== undefined) ? found.home_score : '';
    document.getElementById('fix-away-name').value = found.away_team_name || '';
    document.getElementById('fix-away-score').value = (found.away_score !== null && found.away_score !== undefined) ? found.away_score : '';
    const artUrlEl = ensureArticleUrlFieldExists();
    if (artUrlEl) artUrlEl.value = found.article_url || '';
    document.getElementById('fix-is-current').checked = Boolean(found.is_current);

    document.getElementById('fixture-edit-modal').classList.remove('hidden');
}
window.editFixtureModal = editFixtureModal;

function closeFixtureModal() {
    document.getElementById('fixture-edit-modal').classList.add('hidden');
}
window.closeFixtureModal = closeFixtureModal;

async function saveFixture() {
    if (!db && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    if (!db) {
        alert('Σφάλμα: Δεν υπάρχει σύνδεση με τη βάση.');
        return;
    }

    const category = document.getElementById('fix-category').value;
    const competition = document.getElementById('fix-competition').value.trim();
    const dateInput = document.getElementById('fix-date').value;
    const homeName = document.getElementById('fix-home-name').value.trim();
    const homeScoreVal = document.getElementById('fix-home-score').value;
    const awayName = document.getElementById('fix-away-name').value.trim();
    const awayScoreVal = document.getElementById('fix-away-score').value;
    const artUrlInput = document.getElementById('fix-article-url');
    const articleUrlVal = artUrlInput ? artUrlInput.value.trim() : '';
    const isCurrent = document.getElementById('fix-is-current').checked;

    if (!homeName || !awayName) {
        alert('Παρακαλώ συμπληρώστε τα ονόματα και των δύο ομάδων.');
        return;
    }
    if (!dateInput) {
        alert('Παρακαλώ επιλέξτε ημερομηνία και ώρα αγώνα.');
        return;
    }

    const matchDateIso = new Date(dateInput).toISOString();
    const homeScore = homeScoreVal !== '' ? parseInt(homeScoreVal, 10) : null;
    const awayScore = awayScoreVal !== '' ? parseInt(awayScoreVal, 10) : null;
    
    let sportName = 'Ποδόσφαιρο';
    if (category === 'basketball') sportName = 'Μπάσκετ';
    else if (category === 'amateur') sportName = 'Ερασιτέχνης';

    const saveBtn = document.getElementById('fixture-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Αποθήκευση...';

    try {
        const payload = {
            category: category,
            sport_name: sportName,
            competition: competition,
            match_date: matchDateIso,
            home_team_name: homeName,
            home_score: homeScore,
            away_team_name: awayName,
            away_score: awayScore,
            article_url: articleUrlVal || null,
            is_current: isCurrent,
            updated_at: new Date().toISOString()
        };

        if (editingFixtureId) {
            const res = await db.from('fixtures').update(payload).eq('id', editingFixtureId);
            if (res.error) throw res.error;
        } else {
            payload.created_at = new Date().toISOString();
            const res = await db.from('fixtures').insert([payload]);
            if (res.error) throw res.error;
        }

        closeFixtureModal();
        loadAdminFixtures(window.currentAdminFixtureCategoryFilter || 'all');
    } catch (err) {
        console.error('Save Fixture Error:', err);
        alert('Σφάλμα αποθήκευσης: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Αποθήκευση Αγώνα';
    }
}
window.saveFixture = saveFixture;

async function deleteFixture(id) {
    if (!confirm('Θέλεις σίγουρα να διαγράψεις αυτόν τον αγώνα από το πρόγραμμα;')) return;
    if (!db && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    if (!db) return;

    try {
        const res = await db.from('fixtures').delete().eq('id', id);
        if (res.error) throw res.error;
        loadAdminFixtures(window.currentAdminFixtureCategoryFilter || 'all');
    } catch (err) {
        alert('Σφάλμα διαγραφής: ' + err.message);
    }
}
window.deleteFixture = deleteFixture;

async function toggleFixtureCurrent(id, isCurrentlyCurrent) {
    if (!db && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    if (!db) return;

    try {
        const newStatus = !isCurrentlyCurrent;
        const res = await db.from('fixtures').update({ is_current: newStatus }).eq('id', id);
        if (res.error) throw res.error;
        loadAdminFixtures(window.currentAdminFixtureCategoryFilter || 'all');
    } catch (err) {
        alert('Σφάλμα ενημέρωσης αγώνα: ' + err.message);
    }
}
window.toggleFixtureCurrent = toggleFixtureCurrent;
window.setFixtureCurrent = (id) => toggleFixtureCurrent(id, false);



// ── 2-CLICK ROSTER SWAP & CATEGORY TRANSFER SYSTEM ─────────────────────────
let adminSwapSource = null; // { sport, rosterType, idx, player }

function startAdminSwapMode() {
    if (!selectedPlayerInfo) return;
    const { sport, rosterType, idx } = selectedPlayerInfo;
    const rosterList = currentRoster[sport][rosterType];
    const player = rosterList[idx];
    if (!player) return;

    adminSwapSource = { sport, rosterType, idx, player };

    // Highlight source token
    document.querySelectorAll('.draggable-player').forEach(el => el.classList.remove('swap-source-highlight'));
    if (selectedPlayerInfo.token) {
        selectedPlayerInfo.token.classList.add('swap-source-highlight');
    }

    closePopover();
    showAdminSwapToast(player);
}
window.startAdminSwapMode = startAdminSwapMode;

function showAdminSwapToast(sourcePlayer) {
    let toast = document.getElementById('admin-swap-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-swap-toast';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] bg-amber-950/95 border-2 border-amber-500 text-amber-100 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce';
        document.body.appendChild(toast);
    }

    const playerName = sourcePlayer[3] || sourcePlayer.name || 'Παίκτης';
    toast.innerHTML = `
        <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-amber-400 text-xl animate-spin">sync</span>
            <span class="text-xs font-bold">Επίλεξε 2ο παίκτη για να αλλάξει θέση με τον: <strong class="text-white font-extrabold text-sm underline">${playerName}</strong></span>
        </div>
        <button onclick="cancelAdminSwapMode()" class="px-3 py-1 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-bold border border-amber-500/40 cursor-pointer">
            Ακύρωση
        </button>
    `;
    toast.classList.remove('hidden');
}

function cancelAdminSwapMode() {
    adminSwapSource = null;
    clearAdminSwapHighlights();
    const toast = document.getElementById('admin-swap-toast');
    if (toast) toast.classList.add('hidden');
}
window.cancelAdminSwapMode = cancelAdminSwapMode;

function movePlayerToCategory(targetCategory) {
    if (!selectedPlayerInfo) return;
    const { sport, rosterType, idx } = selectedPlayerInfo;

    if (rosterType === targetCategory) {
        closePopover();
        return;
    }

    const currentList = currentRoster[sport][rosterType];
    const player = currentList[idx];
    if (!player) return;

    // Remove from current list
    currentList.splice(idx, 1);

    // Convert player payload if moving between array (pitch/court) and object (reserves) format
    let newPlayerPayload;
    if (targetCategory === 'rest') {
        // Moving to reserves: convert to object
        newPlayerPayload = {
            initials: player[2] || 'ΠΑΙ',
            name: player[3] || 'Παίκτης',
            pos: player[5] || player[4] || '',
            num: player[4] || '',
            detail: 'Εφεδρεία'
        };
    } else {
        // Moving to pitch/court starting/backup: convert to array [left, top, initials, name, num, pos]
        if (Array.isArray(player)) {
            newPlayerPayload = [...player];
        } else {
            newPlayerPayload = [
                50, 50,
                player.initials || 'ΠΑΙ',
                player.name || 'Παίκτης',
                player.num || player.pos || 10,
                player.pos || ''
            ];
        }
    }

    // Add to target category list
    currentRoster[sport][targetCategory].push(newPlayerPayload);

    // Update textareas & UI
    syncRosterStateToTextareas(sport);
    adminReRenderRoster(sport);

    closePopover();
}
window.movePlayerToCategory = movePlayerToCategory;

function moveReserveToLineup(sport, reserveIdx, targetCategory) {
    const reserves = currentRoster[sport].rest;
    const playerObj = reserves[reserveIdx];
    if (!playerObj) return;

    // Remove from reserves
    reserves.splice(reserveIdx, 1);

    // Convert reserve object to pitch/court player array
    const playerArray = [
        50, 50,
        playerObj.initials || 'ΠΑΙ',
        playerObj.name || 'Παίκτης',
        playerObj.num || playerObj.pos || 10,
        playerObj.pos || ''
    ];

    // Add to target category (starting or backup)
    currentRoster[sport][targetCategory].push(playerArray);

    // Sync & Re-render
    syncRosterStateToTextareas(sport);
    adminReRenderRoster(sport);
}
window.moveReserveToLineup = moveReserveToLineup;

function syncRosterStateToTextareas(sport) {
    const secondType = sport === 'football' ? 'bench' : 'backup';
    ['starting', secondType, 'rest'].forEach(type => {
        const textarea = document.getElementById(`roster-${sport}-${type}`);
        if (textarea && currentRoster[sport] && currentRoster[sport][type]) {
            textarea.value = JSON.stringify(currentRoster[sport][type], null, 2);
        }
    });
}

function adminReRenderRoster(sport) {
    const secondType = sport === 'football' ? 'bench' : 'backup';
    adminRenderRosterSection(sport, 'starting');
    adminRenderRosterSection(sport, secondType);
    adminRenderReserves(sport);
}



// ── PURE 2-CLICK PLAYER SWAP & POSITION MANAGER ──────────────────────────────
/* old adminSwapSource removed */ // { sport, rosterType, idx, player }

function handleAdminPlayerClick(sport, rosterType, idx, event, targetEl) {
    if (event) event.stopPropagation();

    // 1. If NO player selected yet: Select Player 1
    if (!adminSwapSource) {
        const player = currentRoster[sport][rosterType][idx];
        if (!player) return;

        adminSwapSource = { sport, rosterType, idx, player };

        // Highlight selected Player 1
        clearAdminSwapHighlights();
        if (targetEl) targetEl.classList.add('swap-source-highlight');

        showAdminSwapToast(player);
        return;
    }

    // 2. If SAME player clicked: Deselect / Cancel
    if (adminSwapSource.sport === sport && adminSwapSource.rosterType === rosterType && adminSwapSource.idx === idx) {
        cancelAdminSwapMode();
        return;
    }

    // 3. If player from DIFFERENT sport clicked: Reset to new selection
    if (adminSwapSource.sport !== sport) {
        cancelAdminSwapMode();
        handleAdminPlayerClick(sport, rosterType, idx, event, targetEl);
        return;
    }

    // 4. PERFORM INSTANT 2-CLICK SWAP between Player 1 and Player 2!
    executeAdminPlayerSwap(adminSwapSource, { sport, rosterType, idx });
    cancelAdminSwapMode();
}
window.handleAdminPlayerClick = handleAdminPlayerClick;

function clearAdminSwapHighlights() {
    document.querySelectorAll('.draggable-player, .reserve-card-item').forEach(el => {
        el.classList.remove('swap-source-highlight');
    });
}

function showAdminSwapToast(sourcePlayer) {
    let toast = document.getElementById('admin-swap-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-swap-toast';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] bg-amber-950/95 border-2 border-amber-500 text-amber-100 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce';
        document.body.appendChild(toast);
    }

    const playerName = sourcePlayer[3] || sourcePlayer.name || 'Παίκτης 1';
    toast.innerHTML = `
        <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-amber-400 text-xl animate-spin">sync</span>
            <span class="text-xs font-bold">Επίλεξες τον: <strong class="text-white font-extrabold text-sm underline">${playerName}</strong>. Πάτα 2ο παίκτη για άμεση αντικατάσταση!</span>
        </div>
        <button onclick="cancelAdminSwapMode()" class="px-3 py-1 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-bold border border-amber-500/40 cursor-pointer">
            Ακύρωση
        </button>
    `;
    toast.classList.remove('hidden');
}

function cancelAdminSwapMode() {
    adminSwapSource = null;
    clearAdminSwapHighlights();
    const toast = document.getElementById('admin-swap-toast');
    if (toast) toast.classList.add('hidden');
}
window.cancelAdminSwapMode = cancelAdminSwapMode;

function executeAdminPlayerSwap(src, tgt) {
    const sport = src.sport;
    const srcList = currentRoster[sport][src.rosterType];
    const tgtList = currentRoster[sport][tgt.rosterType];

    let p1 = srcList[src.idx];
    let p2 = tgtList[tgt.idx];

    if (!p1 || !p2) return;

    // CASE A: Both are Pitch/Court players (Arrays: [left, top, initials, name, num, pos])
    if (Array.isArray(p1) && Array.isArray(p2)) {
        // Keep pitch coordinates of Slot 1 and Slot 2 fixed
        const slot1_left = p1[0];
        const slot1_top  = p1[1];
        const slot2_left = p2[0];
        const slot2_top  = p2[1];

        // Extract player info details (initials, name, num, pos)
        const p1_details = p1.slice(2);
        const p2_details = p2.slice(2);

        // Slot 1 gets Player 2's details at Slot 1's position
        srcList[src.idx] = [slot1_left, slot1_top, ...p2_details];
        // Slot 2 gets Player 1's details at Slot 2's position
        tgtList[tgt.idx] = [slot2_left, slot2_top, ...p1_details];
    }
    // CASE B: p1 is Pitch Array and p2 is Reserve Object
    else if (Array.isArray(p1) && !Array.isArray(p2)) {
        const slot1_left = p1[0];
        const slot1_top  = p1[1];

        const convertedP2 = [
            slot1_left, slot1_top,
            p2.initials || 'ΠΑΙ',
            p2.name || 'Παίκτης',
            p2.num || p2.pos || 10,
            p2.pos || ''
        ];

        const convertedP1 = {
            initials: p1[2] || 'ΠΑΙ',
            name: p1[3] || 'Παίκτης',
            num: p1[4] || '',
            pos: p1[5] || p1[4] || '',
            detail: 'Εφεδρεία'
        };

        srcList[src.idx] = convertedP2;
        tgtList[tgt.idx] = convertedP1;
    }
    // CASE C: p1 is Reserve Object and p2 is Pitch Array
    else if (!Array.isArray(p1) && Array.isArray(p2)) {
        const slot2_left = p2[0];
        const slot2_top  = p2[1];

        const convertedP1 = [
            slot2_left, slot2_top,
            p1.initials || 'ΠΑΙ',
            p1.name || 'Παίκτης',
            p1.num || p1.pos || 10,
            p1.pos || ''
        ];

        const convertedP2 = {
            initials: p2[2] || 'ΠΑΙ',
            name: p2[3] || 'Παίκτης',
            num: p2[4] || '',
            pos: p2[5] || p2[4] || '',
            detail: 'Εφεδρεία'
        };

        srcList[src.idx] = convertedP1;
        tgtList[tgt.idx] = convertedP2;
    }
    // CASE D: Both are Reserve Objects
    else {
        const p1_copy = JSON.parse(JSON.stringify(p1));
        const p2_copy = JSON.parse(JSON.stringify(p2));
        srcList[src.idx] = p2_copy;
        tgtList[tgt.idx] = p1_copy;
    }

    // Sync all textareas & Re-render UI
    syncRosterStateToTextareas(sport);
    adminReRenderRoster(sport);
}

