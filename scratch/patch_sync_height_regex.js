const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');

// Use regex to match the inner logic
const regex = /(isSyncing = false;\s*const h = hero\.clientHeight;\s*)requestAnimationFrame\(\(\) => \{\s*stream\.style\.maxHeight = h > 200 \? `\$\{h\}px` : '700px';\s*\}\);/;

const replacement = `$1const title = document.getElementById('stream-title');
                    let titleOffset = 0;
                    if (title) {
                        const style = window.getComputedStyle(title);
                        titleOffset = title.offsetHeight + parseFloat(style.marginTop || 0) + parseFloat(style.marginBottom || 0);
                    }
                    const targetHeight = h - titleOffset;
                    requestAnimationFrame(() => {
                        stream.style.maxHeight = targetHeight > 200 ? \`\${targetHeight}px\` : '700px';
                    });`;

if (regex.test(indexHtml)) {
    indexHtml = indexHtml.replace(regex, replacement);
    fs.writeFileSync('index.html', indexHtml);
    console.log("Patched successfully via regex!");
} else {
    console.log("Regex did not match.");
}
