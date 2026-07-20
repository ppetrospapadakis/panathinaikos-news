const fs = require('fs');

const files = [
    'index.html',
    'article.html',
    'roster.html',
    'contact.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'login.html'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Replace the drawer top header div
    // Old pattern: <div class="flex items-center justify-between mb-8">\s*<a href="/" class="flex items-center px-4"><img src="/logo.png" alt="PanathinaikosNews"[^>]*><\/a>\s*<button[^>]*onclick="toggleDrawer()"[^>]*>close<\/button>\s*<\/div>
    const regex = /<div class="flex items-center justify-between mb-8">[\s\S]*?<button class="material-symbols-outlined[^>]*onclick="toggleDrawer\(\)"[^>]*>close<\/button>\s*<\/div>/g;

    const replacement = `<div class="flex items-center justify-between gap-2 mb-8 pr-1">
            <a href="/" class="flex items-center shrink min-w-0">
                <img src="/logo.png" alt="PanathinaikosNews" class="h-12 md:h-14 w-auto object-contain max-w-[200px]" width="261" height="74"/>
            </a>
            <button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors shrink-0 p-1" onclick="toggleDrawer()">close</button>
        </div>`;

    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated drawer logo/close button in ${file}`);
    } else {
        console.log(`Pattern not matched in ${file}`);
    }
}
