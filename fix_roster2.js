const fs = require('fs');
let r = fs.readFileSync('roster.html', 'utf8');

// The block to extract
const startPhrase = '                // Fetch latest news';
const endPhrase = '                    observer.observe(sentinel);\r\n                }\r\n';

let funcStart = r.indexOf(startPhrase);
let funcEnd = r.indexOf(endPhrase);
if(funcEnd === -1) {
    funcEnd = r.indexOf('                    observer.observe(sentinel);\n                }\n');
}

if(funcStart > -1 && funcEnd > -1) {
    let endTotal = funcEnd + (funcEnd === r.indexOf(endPhrase) ? endPhrase.length : '                    observer.observe(sentinel);\n                }\n'.length);
    let block = r.substring(funcStart, endTotal);
    
    // De-indent the block by removing 16 spaces (4 indents)
    block = block.split('\n').map(line => line.replace(/^                /, '')).join('\n');
    
    // Remove from original spot
    r = r.substring(0, funcStart) + r.substring(endTotal);
    
    // Insert before })();
    const insertionPoint = '    })();\r\n    </script>';
    let insertionIdx = r.indexOf(insertionPoint);
    if(insertionIdx === -1) {
        insertionIdx = r.indexOf('    })();\n    </script>');
    }
    
    if(insertionIdx > -1) {
        r = r.substring(0, insertionIdx) + '\n' + block + '\n' + r.substring(insertionIdx);
        fs.writeFileSync('roster.html', r);
        console.log('Successfully moved infinite scroll!');
    } else {
        console.log('Could not find })();');
    }
} else {
    console.log('Could not find block');
}
