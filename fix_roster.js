const fs = require('fs');
let r = fs.readFileSync('roster.html', 'utf8');

const funcStart = r.indexOf('                // Fetch latest news');
const funcEndStr = '                    observer.observe(sentinel);\r\n                }\r\n';
let funcEnd = r.indexOf(funcEndStr);

if(funcEnd === -1) {
    // try fallback line ending
    funcEnd = r.indexOf('                    observer.observe(sentinel);\n                }\n');
}

if(funcStart > -1 && funcEnd > -1) {
    const endTotal = funcEnd + funcEndStr.length;
    const block = r.substring(funcStart, endTotal);
    
    // Remove the block from its current location
    r = r.substring(0, funcStart) + r.substring(endTotal);
    
    // Find the end of DOMContentLoaded listener
    const appendStr = '            document.body.appendChild(script);\r\n        });\r\n';
    let appendIdx = r.indexOf(appendStr);
    
    if (appendIdx === -1) {
        appendIdx = r.indexOf('            document.body.appendChild(script);\n        });\n');
    }
    
    if(appendIdx > -1) {
        const replacement = '            document.body.appendChild(script);\n\n' + block + '\n        });\n';
        r = r.substring(0, appendIdx) + replacement + r.substring(appendIdx + appendStr.length);
        
        fs.writeFileSync('roster.html', r);
        console.log('Successfully moved infinite scroll outside of try-catch!');
    } else {
        console.log('Could not find insertion point.');
    }
} else {
    console.log('Could not find block to extract.');
}
