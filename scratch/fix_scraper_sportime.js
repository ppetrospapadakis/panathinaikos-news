const fs = require('fs');
const path = require('path');

const scraperPath = path.join(__dirname, '..', 'backend', 'scraper.js');
let content = fs.readFileSync(scraperPath, 'utf8');

// 1. Replace all occurrences of `ignored_${crypto.randomUUID()}` with `${crypto.randomUUID()}` or `crypto.randomUUID()`
content = content.replace(/id:\s*`ignored_\$\{crypto\.randomUUID\(\)\}`/g, 'id: crypto.randomUUID()');

// 2. Remove group_id: 'IGNORED_URLS' if it exists in DB calls to avoid schema mismatches
content = content.replace(/\s*group_id:\s*'IGNORED_URLS',?/g, '');

// 3. Update Sportime target configuration and filtering
// Find Sportime first run block around line 970
const sportimeBlockRegex = /\/\/ Hack for Sportime first run[\s\S]*?\}\s*\}\s*\}/;

const newSportimeBlock = `// Hack for Sportime first run to not flood with 30 old articles
        if (target.name === 'Sportime') {
            // Clean & filter links to ensure only actual article pages are processed
            const cleanLinks = links.filter(l => !l.endsWith('/feed') && !l.endsWith('/panathinaikos') && !l.endsWith('/panathinaikos/') && !l.includes('/category/') && l.length > 35);
            links = Array.from(new Set(cleanLinks));

            const newLinks = links.filter(l => !existingUrls.has(l));
            if (newLinks.length > 2) {
                console.log(\`[SPORTIME] First run detected! Processing latest article "\${newLinks[0]}" and ignoring \${newLinks.length - 1} older articles.\`);
                for (let i = 1; i < newLinks.length; i++) {
                    if (!isDryRun) {
                        try {
                            const { error: insErr } = await db.from('articles').insert({
                                id: crypto.randomUUID(),
                                title: '[IGNORED_OLDER]',
                                summary: '[IGNORED_OLDER]',
                                content: '[IGNORED_OLDER]',
                                source_url: newLinks[i],
                                category: 'SystemRoster',
                                created_at: new Date().toISOString()
                            });
                            if (!insErr) {
                                existingUrls.add(newLinks[i]);
                            } else {
                                console.error(\`[SPORTIME DB WARN] \${insErr.message}\`);
                            }
                        } catch(e) {
                            console.error(\`[SPORTIME DB CATCH] \${e.message}\`);
                        }
                    }
                }
            }
        }`;

if (sportimeBlockRegex.test(content)) {
    content = content.replace(sportimeBlockRegex, newSportimeBlock);
    console.log('✅ Updated Sportime first run logic and UUID fix in scraper.js');
} else {
    console.log('⚠️ Could not match sportimeBlockRegex, check pattern!');
}

fs.writeFileSync(scraperPath, content, 'utf8');
console.log('✅ Saved updated backend/scraper.js');
