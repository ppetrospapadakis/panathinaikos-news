const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const footerRegex = /<!-- Footer -->\s*<footer[\s\S]*?<\/footer>/;
const footerMatch = indexHtml.match(footerRegex);
const footerHtml = footerMatch[0];

let roster = fs.readFileSync('roster.html', 'utf8');
const oldFooterRegex = /<!-- Footer -->\s*<footer[\s\S]*?<\/footer>/;
if (oldFooterRegex.test(roster)) {
    roster = roster.replace(oldFooterRegex, footerHtml);
    fs.writeFileSync('roster.html', roster);
    console.log('Replaced footer in roster.html');
}
