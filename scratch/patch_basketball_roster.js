const fs = require('fs');

function replaceFlex(content, oldText, newText) {
    const oldCRLF = oldText.replace(/\r?\n/g, '\r\n');
    const oldLF = oldText.replace(/\r?\n/g, '\n');
    const newCRLF = newText.replace(/\r?\n/g, '\r\n');
    
    if (content.includes(oldCRLF)) {
        return content.replace(oldCRLF, newCRLF);
    } else if (content.includes(oldLF)) {
        return content.replace(oldLF, newText);
    } else {
        console.warn('Could not find match for block:\n', oldText.slice(0, 60) + '...');
        return content;
    }
}

// 1. Update opinion_admin.js
let adminJs = fs.readFileSync('opinion_admin.js', 'utf8');

adminJs = replaceFlex(adminJs, 
`const basketballStartingDefault = [
    [50, 82, 'ΣΛ', 'Σλούκας', 'PG'],
    [20, 65, 'ΛΟΥ', 'Λούντζης', 'SG'],
    [80, 65, 'ΗΛ', 'Ηλιόπουλος', 'SF'],
    [30, 38, 'ΠΑΠ', 'Παπαπέτρου', 'PF'],
    [70, 38, 'ΜΙΤ', 'Μιτόγλου', 'C']
];`,
`const basketballStartingDefault = [
    [50, 82, 'ΣΛ', 'Σλούκας', 10, 'PG'],
    [20, 65, 'ΛΟΥ', 'Λούντζης', 0, 'SG'],
    [80, 65, 'ΗΛ', 'Ηλιόπουλος', 77, 'SF'],
    [30, 38, 'ΠΑΠ', 'Παπαπέτρου', 21, 'PF'],
    [70, 38, 'ΜΙΤ', 'Μιτόγλου', 44, 'C']
];`
);

adminJs = replaceFlex(adminJs, 
`const basketballBackupDefault = [
    [50, 80, 'ΛΑΡ', 'Λαρεντζάκης', 'PG'],
    [20, 60, 'ΒΟΥ', 'Βουγιούκας', 'SG'],
    [80, 60, 'ΠΑΛ', 'Παλμέρ', 'SF'],
    [35, 35, 'ΓΙΑ', 'Γιαννόπουλος', 'PF'],
    [65, 35, 'ΟΑΥ', 'Ουάιτ', 'C']
];`,
`const basketballBackupDefault = [
    [50, 80, 'ΛΑΡ', 'Λαρεντζάκης', 5, 'PG'],
    [20, 60, 'ΒΟΥ', 'Βουγιούκας', 14, 'SG'],
    [80, 60, 'ΠΑΛ', 'Παλμέρ', 22, 'SF'],
    [35, 35, 'ΓΙΑ', 'Γιαννόπουλος', 8, 'PF'],
    [65, 35, 'ΟΑΥ', 'Ουάιτ', 30, 'C']
];`
);

adminJs = replaceFlex(adminJs, 
`        } else {
            const num = idx + 1;
            const pos = player[4];
            avatarInner = \`
                <div class="avatar" style="position:relative;">
                    \${num}
                    <div class="badge">\${pos || ''}</div>
                </div>
            \`;
        }`,
`        } else {
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
            avatarInner = \`
                <div class="avatar" style="position:relative;">
                    \${num}
                    <div class="badge">\${pos || ''}</div>
                </div>
            \`;
        }`
);

adminJs = replaceFlex(adminJs, 
`    if (sport === 'football') {
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
    }`,
`    labelEl.textContent = 'Νούμερο';
    
    let playerNum = '';
    let playerPos = '';
    
    if (player.length >= 6) {
        playerNum = (player[4] !== undefined && player[4] !== null) ? player[4] : '';
        playerPos = player[5] || '';
    } else {
        const val = player[4];
        if (val !== undefined && val !== null && val !== '' && !isNaN(val)) {
            playerNum = val;
            playerPos = player[5] || '';
        } else {
            playerNum = '';
            playerPos = val || '';
        }
    }
    
    badgeInput.value = playerNum;
    
    if (extraWrapper && extraInput) {
        extraWrapper.classList.remove('hidden');
        document.getElementById('popover-extra-label').textContent = 'Θέση';
        extraInput.value = playerPos;
    }`
);

adminJs = replaceFlex(adminJs, 
`    rosterList[idx][2] = newInitials;
    rosterList[idx][3] = newName;
    rosterList[idx][4] = newBadge;
    
    if (sport === 'football') {
        const extraInput = document.getElementById('popover-extra-input');
        if (extraInput) {
            rosterList[idx][5] = extraInput.value.trim();
        }
    }`,
`    const extraInput = document.getElementById('popover-extra-input');
    const newPos = extraInput ? extraInput.value.trim() : '';

    rosterList[idx][2] = newInitials;
    rosterList[idx][3] = newName;
    rosterList[idx][4] = newBadge;
    rosterList[idx][5] = newPos;`
);

adminJs = replaceFlex(adminJs, 
`    const defaultPlayer = sport === 'football' 
        ? [50, 50, 'NEW', 'Νέος Παίκτης', rosterType === 'starting' ? 10 : 12]
        : [50, 50, 'NEW', 'Νέος Παίκτης', 'SG'];`,
`    const defaultPlayer = sport === 'football' 
        ? [50, 50, 'NEW', 'Νέος Παίκτης', rosterType === 'starting' ? 10 : 12, 'ST']
        : [50, 50, 'NEW', 'Νέος Παίκτης', 10, 'SG'];`
);

fs.writeFileSync('opinion_admin.js', adminJs, 'utf8');
console.log('Finished processing opinion_admin.js');

// 2. Update roster.html
let rosterHtml = fs.readFileSync('roster.html', 'utf8');

rosterHtml = replaceFlex(rosterHtml, 
`        const basketballStarting = [
            // [left%, top%, initials, name, position]
            [50, 82, 'ΣΛ', 'Σλούκας', 'PG'],
            [20, 65, 'ΛΟΥ', 'Λούντζης', 'SG'],
            [80, 65, 'ΗΛ', 'Ηλιόπουλος', 'SF'],
            [30, 38, 'ΠΑΠ', 'Παπαπέτρου', 'PF'],
            [70, 38, 'ΜΙΤ', 'Μιτόγλου', 'C'],
        ];`,
`        const basketballStarting = [
            [50, 82, 'ΣΛ', 'Σλούκας', 10, 'PG'],
            [20, 65, 'ΛΟΥ', 'Λούντζης', 0, 'SG'],
            [80, 65, 'ΗΛ', 'Ηλιόπουλος', 77, 'SF'],
            [30, 38, 'ΠΑΠ', 'Παπαπέτρου', 21, 'PF'],
            [70, 38, 'ΜΙΤ', 'Μιτόγλου', 44, 'C'],
        ];`
);

rosterHtml = replaceFlex(rosterHtml, 
`        const basketballBackup = [
            [50, 80, 'ΛΑΡ', 'Λαρεντζάκης', 'PG'],
            [20, 60, 'ΒΟΥ', 'Βουγιούκας', 'SG'],
            [80, 60, 'ΠΑΛ', 'Παλμέρ', 'SF'],
            [35, 35, 'ΓΙΑ', 'Γιαννόπουλος', 'PF'],
            [65, 35, 'ΟΑΥ', 'Ουάιτ', 'C'],
        ];`,
`        const basketballBackup = [
            [50, 80, 'ΛΑΡ', 'Λαρεντζάκης', 5, 'PG'],
            [20, 60, 'ΒΟΥ', 'Βουγιούκας', 14, 'SG'],
            [80, 60, 'ΠΑΛ', 'Παλμέρ', 22, 'SF'],
            [35, 35, 'ΓΙΑ', 'Γιαννόπουλος', 8, 'PF'],
            [65, 35, 'ΟΑΥ', 'Ουάιτ', 30, 'C'],
        ];`
);

rosterHtml = replaceFlex(rosterHtml, 
`        function renderCourtPlayers(containerId, players) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.querySelectorAll('.bball-token').forEach(el => el.remove());
            players.forEach(([left, top, initials, name, pos], index) => {
                const num = index + 1;
                const token = document.createElement('div');
                token.className = 'bball-token';
                token.style.left = left + '%';
                token.style.top = top + '%';
                token.innerHTML = \`
                    <div class="avatar" style="position:relative;">
                        \${num}
                        <div class="pos-badge" style="font-size:8px; width:20px; height:20px; right:-6px; top:-6px; display:flex; align-items:center; justify-content:center;">\${pos}</div>
                    </div>
                    <div class="name-tag">\${name}</div>\`;
                container.appendChild(token);
            });
        }`,
`        function renderCourtPlayers(containerId, players) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.querySelectorAll('.bball-token').forEach(el => el.remove());
            players.forEach((player, index) => {
                const left = player[0];
                const top = player[1];
                const initials = player[2];
                const name = player[3];
                let num, pos;
                if (player.length >= 6) {
                    num = (player[4] !== undefined && player[4] !== '') ? player[4] : (index + 1);
                    pos = player[5] || '';
                } else {
                    const val = player[4];
                    if (val !== undefined && val !== '' && !isNaN(val)) {
                        num = val;
                        pos = player[5] || '';
                    } else {
                        num = index + 1;
                        pos = val || '';
                    }
                }
                const token = document.createElement('div');
                token.className = 'bball-token';
                token.style.left = left + '%';
                token.style.top = top + '%';
                token.innerHTML = \`
                    <div class="avatar" style="position:relative;">
                        \${num}
                        <div class="pos-badge" style="font-size:8px; width:20px; height:20px; right:-6px; top:-6px; display:flex; align-items:center; justify-content:center;">\${pos}</div>
                    </div>
                    <div class="name-tag">\${name}</div>\`;
                container.appendChild(token);
            });
        }`
);

fs.writeFileSync('roster.html', rosterHtml, 'utf8');
console.log('Finished processing roster.html');
