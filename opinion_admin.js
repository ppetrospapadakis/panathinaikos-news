// ── Roster & Analysis Editing Logic ──────────────────────────────────────────
const footballStartingDefault = [
    [50, 88, 'ΦΝ', 'Φιλίποβιτς', 1],
    [15, 68, 'ΒΑ', 'Βαγιαννίδης', 2],
    [38, 70, 'ΜΣ', 'Μαξίμοβιτς', 5],
    [62, 70, 'ΤΟ', 'Τόμας', 4],
    [85, 68, 'ΡΩΑ', 'Ρουά', 3],
    [25, 48, 'ΝΤΡ', 'Ντρ. Σκι', 8],
    [50, 44, 'ΓΡΑ', 'Γκρέι', 6],
    [75, 48, 'ΘΟΥ', 'Θορ', 10],
    [18, 22, 'ΤΕΤ', 'Τετέ', 7],
    [50, 18, 'ΙΩΑ', 'Ιωαννίδης', 9],
    [82, 22, 'ΠΕΛ', 'Πελίστρι', 11]
];

const footballBenchDefault = [
    [50, 85, 'ΒΡΑ', 'Βρατσάνος', 23],
    [15, 65, 'ΓΙΕ', 'Γιεντβάι', 14],
    [38, 67, 'ΑΝΔ', 'Ανδρέ', 16],
    [62, 67, 'ΛΩΡ', 'Λόρδος', 22],
    [85, 65, 'ΚΟΡ', 'Κόρμπο', 3],
    [20, 45, 'ΜΠΑ', 'Μπαλόγκ', 17],
    [40, 42, 'ΤΖΑ', 'Τζαβέλας', 18],
    [60, 42, 'ΧΑΡ', 'Χαρίσης', 19],
    [80, 45, 'ΠΑΛ', 'Παλμέρι', 15],
    [35, 22, 'ΟΑΔ', 'Οάδες', 20],
    [65, 22, 'ΙΝΓ', 'Ίνγκασον', 21]
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

    ['opinion', 'football', 'basketball'].forEach(t => {
        const btn = document.getElementById(`admin-tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = 'px-5 py-2.5 rounded-xl font-label text-label uppercase bg-primary text-on-primary transition-all flex items-center gap-2';
            } else {
                btn.className = 'px-5 py-2.5 rounded-xl font-label text-label uppercase bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-2';
            }
        }
    });
}
window.switchAdminTab = switchAdminTab;

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
    players.forEach(([left, top, initials, name, badgeVal], idx) => {
        const token = document.createElement('div');
        token.className = `draggable-player ${sport}`;
        token.style.left = left + '%';
        token.style.top = top + '%';
        
        token.innerHTML = `
            <div class="avatar" style="position:relative;">
                ${initials}
                <div class="badge">${badgeVal || ''}</div>
            </div>
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
    
    const [left, top, initials, name, badge] = player;
    
    document.getElementById('popover-initials').value = initials;
    document.getElementById('popover-name').value = name;
    document.getElementById('popover-badge').value = badge;
    
    const labelEl = document.getElementById('popover-badge-label');
    if (sport === 'football') {
        labelEl.textContent = 'Νούμερο (Jersey)';
    } else {
        labelEl.textContent = 'Θέση (Position)';
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
        card.innerHTML = `
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

        const { data: existing } = await db.from('articles')
            .select('id')
            .eq('source_url', sourceUrl)
            .maybeSingle();

        let saveErr = null;
        if (existing && existing.id) {
            const { error } = await db.from('articles')
                .update({
                    content: analysis,
                    bullets: [JSON.stringify(starting), JSON.stringify(benchOrBackup), JSON.stringify(rest)],
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            saveErr = error;
        } else {
            const { error } = await db.from('articles')
                .insert({
                    title: title,
                    summary: `${sport.toUpperCase()} starting squad and tactical analysis.`,
                    content: analysis,
                    bullets: [JSON.stringify(starting), JSON.stringify(benchOrBackup), JSON.stringify(rest)],
                    source_url: sourceUrl,
                    category: 'SystemRoster',
                    group_id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            saveErr = error;
        }

        if (saveErr) throw saveErr;

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
