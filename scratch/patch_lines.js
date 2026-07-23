const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
let lines = content.split('\n');

// Arrays are 0-indexed. We want to remove lines 723 to 751 (inclusive).
// Line 723 is at index 722.
lines.splice(722, 751 - 723 + 1);

fs.writeFileSync('index.html', lines.join('\n'));
console.log('Removed lines 723-751.');
