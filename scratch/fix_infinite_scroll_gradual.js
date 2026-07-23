const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const formatExactDateCode = `
        function formatExactDate(dateString) {
            if (!dateString) return '';
            const d = new Date(dateString);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return \`\${day}/\${month}/\${year} - \${hours}:\${minutes}\`;
        }
`;

// 1. Update fixtures.html
const fixturesPath = path.join(rootDir, 'fixtures.html');
let fixturesContent = fs.readFileSync(fixturesPath, 'utf8');

if (!fixturesContent.includes('function formatExactDate(')) {
    fixturesContent = fixturesContent.replace('function slugify(text) {', `${formatExactDateCode}\n        function slugify(text) {`);
}

// Lower rootMargin from 300px to 100px for gradual scrolling
fixturesContent = fixturesContent.replace(/\{ rootMargin: '300px' \}/g, "{ rootMargin: '100px' }");

// Add small throttle delay to fetchMoreNews
if (!fixturesContent.includes('setTimeout(r, 400)')) {
    fixturesContent = fixturesContent.replace('streamPage++;', 'streamPage++;\n                    await new Promise(r => setTimeout(r, 400));');
}

fs.writeFileSync(fixturesPath, fixturesContent, 'utf8');
console.log('✅ Added formatExactDate and set gradual scroll (100px margin + 400ms throttle) to fixtures.html');

// 2. Update roster.html
const rosterPath = path.join(rootDir, 'roster.html');
let rosterContent = fs.readFileSync(rosterPath, 'utf8');

if (!rosterContent.includes('function formatExactDate(')) {
    rosterContent = rosterContent.replace('function slugify(text) {', `${formatExactDateCode}\n        function slugify(text) {`);
}

rosterContent = rosterContent.replace(/\{ rootMargin: '300px' \}/g, "{ rootMargin: '100px' }");

if (!rosterContent.includes('setTimeout(r, 400)')) {
    rosterContent = rosterContent.replace('streamPage++;', 'streamPage++;\n                    await new Promise(r => setTimeout(r, 400));');
}

fs.writeFileSync(rosterPath, rosterContent, 'utf8');
console.log('✅ Added formatExactDate and set gradual scroll (100px margin + 400ms throttle) to roster.html');

// 3. Update index.html
const indexPath = path.join(rootDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

indexContent = indexContent.replace(/\{ rootMargin: '200px' \}/g, "{ rootMargin: '100px' }");
indexContent = indexContent.replace(/\{ rootMargin: '300px' \}/g, "{ rootMargin: '100px' }");

if (!indexContent.includes('setTimeout(r, 400)')) {
    indexContent = indexContent.replace('streamPage++;', 'streamPage++;\n                await new Promise(r => setTimeout(r, 400));');
}

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ Set gradual scroll (100px margin + 400ms throttle) to index.html');
