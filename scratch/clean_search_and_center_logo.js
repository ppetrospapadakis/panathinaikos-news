const fs = require('fs');
const path = require('path');

const projectDir = 'c:/Users/Petros/Documents/panathnaikos-news';

// 1. Center logo in public HTML files
const publicFiles = [
    'index.html',
    'article.html',
    'roster.html',
    'contact.html',
    'privacy-policy.html',
    'terms-of-service.html'
];

publicFiles.forEach(fileName => {
    const filePath = path.join(projectDir, fileName);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the TOP HEADER block
    const headerRegex = /<!-- ═══ TOP HEADER ═══ -->[\s\S]*?<\/header>/;
    const newHeader = `<!-- ═══ TOP HEADER ═══ -->
    <header class="fixed top-0 left-0 w-full z-50 h-[80px] bg-background border-b border-outline-variant">
        <div class="max-w-[1440px] mx-auto h-full flex items-center justify-between px-4 md:px-8 relative">
            <button class="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity z-10" onclick="toggleDrawer()" aria-label="Menu">
                <span class="material-symbols-outlined text-primary">menu</span>
            </button>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <a href="/" class="flex items-center pointer-events-auto">
                    <img src="/logo.png" alt="PanathinaikosNews" class="h-[68px] md:h-[74px] w-auto object-contain" width="200" height="74"/>
                </a>
            </div>
            <div class="w-6 h-6 z-10"></div>
        </div>
    </header>`;

    if (headerRegex.test(content)) {
        content = content.replace(headerRegex, newHeader);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Centered logo in header of: ${fileName}`);
    } else {
        console.log(`Could not find TOP HEADER pattern in: ${fileName}`);
    }
});

// 2. Center logo in login.html
const loginPath = path.join(projectDir, 'login.html');
if (fs.existsSync(loginPath)) {
    let content = fs.readFileSync(loginPath, 'utf8');
    const loginHeaderRegex = /<header id="admin-header"[\s\S]*?<\/header>/;
    const newLoginHeader = `<header id="admin-header" class="fixed top-0 left-0 w-full z-50 h-[80px] bg-background border-b border-outline-variant transition-all duration-300">
        <div class="max-w-[1440px] mx-auto h-full flex items-center justify-between px-4 md:px-8 relative">
            <button class="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity z-10" onclick="toggleSidebar()" aria-label="Menu">
                <span class="material-symbols-outlined text-primary">menu</span>
            </button>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <a href="/" class="flex items-center pointer-events-auto">
                    <img src="/logo.png" alt="PanathinaikosNews" class="h-[68px] md:h-[74px] w-auto object-contain" width="200" height="74"/>
                </a>
            </div>
            <a href="/" class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm z-10">
                <span class="material-symbols-outlined" style="font-size:20px">arrow_back</span>
                Πίσω
            </a>
        </div>
    </header>`;

    if (loginHeaderRegex.test(content)) {
        content = content.replace(loginHeaderRegex, newLoginHeader);
        fs.writeFileSync(loginPath, content, 'utf8');
        console.log(`Centered logo in login.html`);
    } else {
        console.log(`Could not find login admin-header pattern`);
    }
}
