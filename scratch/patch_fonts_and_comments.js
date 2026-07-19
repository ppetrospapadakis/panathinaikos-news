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
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${file}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add font preload right after <head>
    const headTag = '<head>';
    if (content.includes(headTag) && !content.includes('Geist:wght@400;700')) {
        content = content.replace(headTag, headTag + '\n' + fontLinks);
        console.log(`Added optimized Geist Font loading to ${file}`);
    }
    
    // Defer comments count loading in index.html to break critical request chains
    if (file === 'index.html') {
        const oldLoader = `        window.addEventListener('DOMContentLoaded', () => {
            initPageFilter();
            // Allow initial render to settle, then load comment counts asynchronously
            setTimeout(fetchCommentCounts, 600);
        });`;
        const newLoader = `        window.addEventListener('DOMContentLoaded', () => {
            initPageFilter();
        });

        window.addEventListener('load', () => {
            // Defer completely to unblock PageSpeed critical request chains
            setTimeout(fetchCommentCounts, 2000);
        });`;
        
        // Handle CRLF / LF line endings
        const oldLoaderCRLF = oldLoader.replace(/\n/g, '\r\n');
        if (content.includes(oldLoaderCRLF)) {
            content = content.replace(oldLoaderCRLF, newLoader.replace(/\n/g, '\r\n'));
            console.log('Deferred comments count loading in index.html (CRLF)');
        } else if (content.includes(oldLoader)) {
            content = content.replace(oldLoader, newLoader);
            console.log('Deferred comments count loading in index.html (LF)');
        } else {
            console.log('Could not find comments initialization block in index.html!');
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
});
