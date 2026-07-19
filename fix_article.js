const fs = require('fs');
let html = fs.readFileSync('article.html', 'utf8');

html = html.replace(
    '<div class="max-w-[1440px] mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-8">',
    '<div class="max-w-[1440px] mx-auto px-0 md:px-8 py-6 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8">'
);
html = html.replace(
    '<div id="article-skeleton" class="space-y-6 animate-pulse">',
    '<div id="article-skeleton" class="space-y-6 animate-pulse px-4 md:px-0">'
);
html = html.replace(
    '<!-- ? TITLE + CATEGORY HEADER -->\n                <div>',
    '<!-- ? TITLE + CATEGORY HEADER -->\n                <div class="px-4 md:px-0">'
);
html = html.replace(
    '<div id="article-image-box" class="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 shadow-xl hidden">',
    '<div id="article-image-box" class="relative w-full aspect-video rounded-none md:rounded-2xl overflow-hidden bg-surface-container-low border-y border-x-0 md:border-x md:border-y border-outline-variant/20 shadow-xl hidden">'
);
html = html.replace(
    '<section id="article-bullets-box" class="ai-summary p-6 bg-surface-container-low rounded-2xl border border-primary/30 premium-gradient hidden">',
    '<section id="article-bullets-box" class="ai-summary p-6 mx-4 md:mx-0 bg-surface-container-low rounded-2xl border border-primary/30 premium-gradient hidden">'
);
html = html.replace(
    '<div id="article-body" class="leading-relaxed">',
    '<div id="article-body" class="leading-relaxed px-4 md:px-0">'
);
html = html.replace(
    '<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 text-center">',
    '<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 text-center px-4 md:px-0">'
);
html = html.replace(
    '<div id="stream-wrapper" class="md:col-span-4 hidden flex-col md:mt-[112px]">',
    '<div id="stream-wrapper" class="md:col-span-4 hidden flex-col md:mt-[112px] px-4 md:px-0">'
);

fs.writeFileSync('article.html', html, 'utf8');
console.log('Fixed article.html');
