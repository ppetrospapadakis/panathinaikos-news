const fs = require('fs');

// Patch index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Fix icon: feed -> rss_feed
indexHtml = indexHtml.replace(
    /<span class="material-symbols-outlined text-primary" style="font-size:22px;">feed<\/span>/g,
    '<span class="material-symbols-outlined text-primary" style="font-size:22px;">rss_feed</span>'
);

// Fix max-height
indexHtml = indexHtml.replace(
    /class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-\[800px\] md:min-h-\[500px\] lg:max-h-\[700px\]"/g,
    'class="md:col-span-4 flex flex-col gap-3 px-4 md:px-0 min-h-[500px] max-h-[500px] lg:max-h-[700px]"'
);

fs.writeFileSync('index.html', indexHtml);

// Patch article.html
let articleHtml = fs.readFileSync('article.html', 'utf8');

articleHtml = articleHtml.replace(
    /class="flex flex-col gap-3" style="max-height:800px;/g,
    'class="flex flex-col gap-3 max-h-[500px] lg:max-h-[800px]" style="'
);

fs.writeFileSync('article.html', articleHtml);

console.log('Patches applied.');
