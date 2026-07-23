const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStart = `            if (false) {
                if (false) {
                    if (false) {`;
const startIdx = html.indexOf(targetStart);

if (startIdx !== -1) {
    // Find the next `});` after startIdx
    const endStr = `            });`;
    const endIdx = html.indexOf(endStr, startIdx);
    
    if (endIdx !== -1) {
        // We delete from startIdx to endIdx + endStr.length
        html = html.substring(0, startIdx) + html.substring(endIdx + endStr.length);
        fs.writeFileSync('index.html', html);
        console.log('Successfully removed the dead code block.');
    } else {
        console.log('Could not find the closing });');
    }
} else {
    console.log('Could not find the targetStart.');
}
