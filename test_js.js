const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('article.html', 'utf8');
const regex = /<script>([\s\S]*?)<\/script>/g;
let match;
while ((match = regex.exec(html)) !== null) {
    try {
        new vm.Script(match[1]);
        console.log('Script parsed OK');
    } catch (err) {
        console.error('Syntax error:', err);
    }
}
