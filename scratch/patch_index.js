const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `        // Render Pin Button for stream card
        function pinButtonHtml(articleId, pinnedAt) {
            if (!isAdmin()) return '';
            const pinAgeMs = pinnedAt ? Date.now() - new Date(pinnedAt).getTime() : Infinity;
            const isPinned = pinAgeMs < 3 * 60 * 60 * 1000;
            const color = isPinned ? 'text-primary bg-primary/20' : 'text-on-surface/40 hover:text-primary hover:bg-primary/20 bg-background/80';
            const icon = isPinned ? 'keep_off' : 'keep';
            return \`
            <button onclick="window.togglePin('\${articleId}', \${isPinned}, event)" class="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30 backdrop-blur transition-all active:scale-90 \${color}" title="\${isPinned ? 'Unpin' : 'Pin'}" style="pointer-events: auto;">
                <span class="material-symbols-outlined" style="font-size:16px">\${icon}</span>
            </button>\`;
        }`;

const replacement = `        // Render Admin Buttons (Pin & Delete) for stream card
        function pinButtonHtml(articleId, pinnedAt) {
            if (!isAdmin()) return '';
            const pinAgeMs = pinnedAt ? Date.now() - new Date(pinnedAt).getTime() : Infinity;
            const isPinned = pinAgeMs < 3 * 60 * 60 * 1000;
            const pinColor = isPinned ? 'text-primary bg-primary/20' : 'text-on-surface/40 hover:text-primary hover:bg-primary/20 bg-background/80';
            const pinIcon = isPinned ? 'keep_off' : 'keep';
            
            return \`
            <div class="absolute top-2 right-2 z-20 flex gap-2" style="pointer-events: auto;">
                <button onclick="window.togglePin('\${articleId}', \${isPinned}, event)" class="w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30 backdrop-blur transition-all active:scale-90 \${pinColor}" title="\${isPinned ? 'Unpin' : 'Pin'}">
                    <span class="material-symbols-outlined" style="font-size:16px">\${pinIcon}</span>
                </button>
                <button onclick="window.deleteArticle('\${articleId}', event)" class="w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30 backdrop-blur transition-all active:scale-90 text-on-surface/40 hover:text-error hover:bg-error/20 bg-background/80" title="Διαγραφή">
                    <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                </button>
            </div>\`;
        }`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync('index.html', html);
    console.log('Successfully patched index.html');
} else {
    console.log('Could not find target block to replace.');
}
