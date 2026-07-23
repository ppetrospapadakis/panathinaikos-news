const fs = require('fs');
const path = require('path');

const fixturesPath = path.join(__dirname, '..', 'fixtures.html');
let content = fs.readFileSync(fixturesPath, 'utf8');

const mainNavRegex = /(<!-- Main Site Sticky Horizontal Navigation Bar -->[\s\S]*?<\/div>\s*<\/div>)/i;
const filterTabsRegex = /<!-- In-Page Sport Filter Tabs[\s\S]*?<\/div>\s*<\/div>/i;

// Extract filter tabs HTML
const filterMatch = content.match(filterTabsRegex);
if (filterMatch) {
    const filterHtml = filterMatch[0];
    // Remove filter tabs from inside max-w-[900px]
    content = content.replace(filterTabsRegex, '');
    // Insert filter tabs immediately after main nav bar
    content = content.replace(mainNavRegex, `$1\n\n        ${filterHtml}`);
    console.log('✅ Moved sticky sport filter bar directly under main horizontal menu bar');
}

fs.writeFileSync(fixturesPath, content, 'utf8');
console.log('✅ Saved updated fixtures.html');
