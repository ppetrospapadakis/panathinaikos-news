const fs = require('fs');
const path = require('path');

const files = [
    'index.html',
    'article.html',
    'contact.html',
    'privacy-policy.html',
    'roster.html',
    'terms-of-service.html',
    'login.html'
];

const fontLinks = `    <!-- Optimized Geist Font Loading -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;700&display=swap" as="style">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;700&display=swap">`;

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the optimized font links block
    if (content.includes(fontLinks)) {
        content = content.replace(fontLinks + '\n', '');
        content = content.replace(fontLinks, '');
        console.log(`Removed font preloads from ${file}`);
    } else {
        // Try without LF/CRLF difference
        const fontLinksCRLF = fontLinks.replace(/\n/g, '\r\n');
        if (content.includes(fontLinksCRLF)) {
            content = content.replace(fontLinksCRLF + '\r\n', '');
            content = content.replace(fontLinksCRLF, '');
            console.log(`Removed font preloads from ${file} (CRLF)`);
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
});

// Restore input.css
const inputCssPath = path.join(__dirname, '..', 'input.css');
if (fs.existsSync(inputCssPath)) {
    let inputCss = fs.readFileSync(inputCssPath, 'utf8');
    if (!inputCss.includes('Geist')) {
        inputCss = `@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;700&display=swap');\n\n` + inputCss;
        fs.writeFileSync(inputCssPath, inputCss, 'utf8');
        console.log('Restored Geist font import in input.css');
    }
}
