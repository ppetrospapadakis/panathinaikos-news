const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = ['roster.html', 'fixtures.html'];

const fnCode = `
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

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes('function formatExactDate(')) {
        content = content.replace('let streamPage = 1;', `${fnCode}\n        let streamPage = 1;`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added formatExactDate definition to ${file}`);
    }
});
