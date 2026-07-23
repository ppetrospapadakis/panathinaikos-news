const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');

const target = `                    const h = hero.clientHeight;
                    requestAnimationFrame(() => {
                        stream.style.maxHeight = h > 200 ? \`\${h}px\` : '700px';
                    });`;

const replacement = `                    const h = hero.clientHeight;
                    const title = document.getElementById('stream-title');
                    let titleOffset = 0;
                    if (title) {
                        const style = window.getComputedStyle(title);
                        titleOffset = title.offsetHeight + parseFloat(style.marginTop || 0) + parseFloat(style.marginBottom || 0);
                    }
                    const targetHeight = h - titleOffset;
                    requestAnimationFrame(() => {
                        stream.style.maxHeight = targetHeight > 200 ? \`\${targetHeight}px\` : '700px';
                    });`;

if (indexHtml.includes(target)) {
    indexHtml = indexHtml.replace(target, replacement);
    fs.writeFileSync('index.html', indexHtml);
    console.log("Patched successfully!");
} else {
    console.log("Target not found. Please check whitespace.");
}
