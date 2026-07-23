const fs = require('fs');
const path = require('path');

const rosterPath = path.join(__dirname, '..', 'roster.html');
let content = fs.readFileSync(rosterPath, 'utf8');

const helpers = `
        function slugify(text) {
            if (!text) return "arthro";
            try {
                return (text || "").toString().toLowerCase()
                    .trim()
                    .replace(/\\s+/g, '-')
                    .replace(/[^\\w\\u0370-\\u03FF\\u1F00-\\u1FFF-]+/g, '')
                    .replace(/--+/g, '-')
                    .replace(/^-+/, '')
                    .replace(/-+$/, '') || "arthro";
            } catch(e) {
                return "arthro";
            }
        }

        function getCategoryCleanName(category) {
            const cat = (category || '').toLowerCase();
            if (cat.includes('ποδόσφαιρο') || cat.includes('football')) return 'podosfairo';
            if (cat.includes('μπάσκετ') || cat.includes('basketball')) return 'basket';
            if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) return 'erasitexnis';
            if (cat.includes('άποψη') || cat.includes('opinion')) return 'apopsi';
            return 'pao';
        }
`;

if (!content.includes('function getCategoryCleanName(')) {
    content = content.replace('function formatExactDate(dateString) {', `${helpers}\n        function formatExactDate(dateString) {`);
    fs.writeFileSync(rosterPath, content, 'utf8');
    console.log('✅ Added getCategoryCleanName and slugify to roster.html');
}
