const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Wrap the title and stream container
const target1 = `                <!-- Stream: right 4 cols — Phase 2 skeletons initially -->
                <div class="flex items-center gap-2 mb-2 mt-4 lg:mt-0 px-4 md:px-0">
                    <span class="material-symbols-outlined text-primary text-xl">rss_feed</span>
                    <h2 class="font-label text-label text-primary uppercase tracking-widest font-bold">Ροη Ειδησεων</h2>
                </div>
                    <div id="stream-container" class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-[500px] max-h-[500px] lg:max-h-[700px]" style="overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">`;

const replace1 = `                <!-- Stream: right 4 cols — Phase 2 skeletons initially -->
                <div class="md:col-span-4 flex flex-col w-full">
                    <div class="flex items-center gap-2 mb-4 mt-4 lg:mt-0 px-4 md:px-0">
                        <span class="material-symbols-outlined text-primary text-xl">rss_feed</span>
                        <h2 class="font-label text-label text-primary uppercase tracking-widest font-bold">Ροη Ειδησεων</h2>
                    </div>
                    <div id="stream-container" class="flex flex-col gap-3 px-4 md:px-0 min-h-[500px] max-h-[500px] lg:max-h-[700px]" style="overflow-y:auto;scrollbar-width:thin;scrollbar-color:#2e7d32 transparent;">`;

if (indexHtml.includes(target1)) {
    indexHtml = indexHtml.replace(target1, replace1);
    console.log("Successfully wrapped the stream start.");
} else {
    console.log("Failed to find target1");
}

// 2. Add the closing div after stream-container
const target2 = `                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl min-h-[110px]">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div></div>
                    </div>
                </div>
            </div>`;

const replace2 = `                    <div class="animate-pulse flex gap-4 items-start bg-surface-container/20 p-4 rounded-xl min-h-[110px]">
                        <div class="w-[72px] h-[72px] bg-surface-container-high rounded-lg shrink-0"></div>
                        <div class="space-y-2 w-full"><div class="h-3 bg-surface-container-high w-1/3 rounded"></div><div class="h-4 bg-surface-container-high w-3/4 rounded"></div></div>
                    </div>
                </div>
                </div>
            </div>`;

if (indexHtml.includes(target2)) {
    indexHtml = indexHtml.replace(target2, replace2);
    console.log("Successfully added closing div.");
} else {
    console.log("Failed to find target2");
}

fs.writeFileSync('index.html', indexHtml);
