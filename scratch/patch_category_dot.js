const fs = require('fs');

let content = fs.readFileSync('article.html', 'utf8');

// Replace the category dot separator span with one that has id="article-category-dot"
const targetLF = `<span class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>\n                        <span id="article-category" class="text-primary"></span>`;
const targetCRLF = `<span class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>\r\n                        <span id="article-category" class="text-primary"></span>`;
const replacement = `<span id="article-category-dot" class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>\n                        <span id="article-category" class="text-primary"></span>`; // We will use CRLF or LF depending on what matched

if (content.includes(targetCRLF)) {
    content = content.replace(targetCRLF, `<span id="article-category-dot" class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>\r\n                        <span id="article-category" class="text-primary"></span>`);
    fs.writeFileSync('article.html', content, 'utf8');
    console.log('Successfully updated article.html (CRLF)!');
} else if (content.includes(targetLF)) {
    content = content.replace(targetLF, `<span id="article-category-dot" class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>\n                        <span id="article-category" class="text-primary"></span>`);
    fs.writeFileSync('article.html', content, 'utf8');
    console.log('Successfully updated article.html (LF)!');
} else {
    console.log('Target not found in article.html!');
}
