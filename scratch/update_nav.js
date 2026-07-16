const fs = require('fs');

const files = ['article.html', 'roster.html'];
const searchBtnRegex = /<button class="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity" onclick="toggleSearch\(\)" aria-label="Search">\s*<span class="material-symbols-outlined text-primary">search<\/span>\s*<\/button>/;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (searchBtnRegex.test(content)) {
        content = content.replace(searchBtnRegex, '<div class="w-6 h-6"></div>');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Replaced search with dummy div in ${file}`);
    }
}

let opinion = fs.readFileSync('login.html', 'utf8');
if (searchBtnRegex.test(opinion)) {
    const backBtnHtml = `<a href="/" class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm">
                <span class="material-symbols-outlined" style="font-size:20px">arrow_back</span>
                Πίσω
            </a>`;
    opinion = opinion.replace(searchBtnRegex, backBtnHtml);
    fs.writeFileSync('login.html', opinion, 'utf8');
    console.log(`Replaced search with Back button in login.html`);
}
