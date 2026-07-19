const fs = require('fs');

// Fix 1: Fix processImage hostname-based proxy check in index.html
let content = fs.readFileSync('index.html', 'utf8');
const oldCheck = `!imageUrl.startsWith('/') && !imageUrl.includes('localhost') && !imageUrl.includes('panathinaikosnews.gr')`;
const newCheck = `!u.hostname.includes('localhost') && !u.hostname.includes('panathinaikosnews.gr') && !u.hostname.includes('wsrv.nl')`;

if (content.includes(oldCheck)) {
    content = content.replace(oldCheck, newCheck);
    fs.writeFileSync('index.html', content, 'utf8');
    console.log('index.html: proxy check updated successfully.');
} else if (content.includes(newCheck)) {
    console.log('index.html: proxy check already up-to-date.');
} else {
    console.log('index.html: WARNING - could not find target string!');
}

// Fix 2: Remove duplicate Material Symbols font in article.html
let articleContent = fs.readFileSync('article.html', 'utf8');
const dupFont = `family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" rel="stylesheet"/>`;
const occurrences = (articleContent.match(new RegExp(dupFont.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log(`article.html: found ${occurrences} Material Symbols font link(s).`);
if (occurrences > 1) {
    // Keep only the first (with the version tag), remove plain one
    const plainDup = `    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" rel="stylesheet"/>\r\n`;
    const versionedDup = `    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block&v=2.0.3" rel="stylesheet"/>\r\n`;
    // Remove plain one (keep versioned)
    articleContent = articleContent.replace(plainDup, '');
    fs.writeFileSync('article.html', articleContent, 'utf8');
    console.log('article.html: duplicate font removed.');
}
