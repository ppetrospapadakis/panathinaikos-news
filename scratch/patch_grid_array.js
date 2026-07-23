const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');
let lines = content.split('\n');

let titleIdx = lines.findIndex(l => l.includes('<div class="flex items-center gap-2 mb-2 mt-4 lg:mt-0 px-4 md:px-0">'));
if (titleIdx !== -1) {
    lines.splice(titleIdx, 0, '                <div class="md:col-span-4 flex flex-col w-full">');
    console.log("Injected wrapper start at line", titleIdx);
}

let containerIdx = lines.findIndex(l => l.includes('<div id="stream-container" class="md:col-span-4'));
if (containerIdx !== -1) {
    lines[containerIdx] = lines[containerIdx].replace('class="md:col-span-4 ', 'class="');
    console.log("Removed md:col-span-4 from stream-container at line", containerIdx);
}

let phase3Idx = lines.findIndex(l => l.includes('<!-- Phase 3: deferred sections'));
if (phase3Idx !== -1) {
    // phase3Idx is the <!-- Phase 3 line
    // phase3Idx - 1 is the </div> that closes the grid
    // So we insert our wrapper closing div AT phase3Idx - 1,
    // which pushes the grid closing div down.
    lines.splice(phase3Idx - 1, 0, '                </div>');
    console.log("Injected wrapper end at line", phase3Idx - 1);
}

fs.writeFileSync('index.html', lines.join('\n'));
console.log('Done.');
