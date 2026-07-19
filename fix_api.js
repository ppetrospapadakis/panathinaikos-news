const fs = require('fs');
let code = fs.readFileSync('api/render-article.js', 'utf8');

code = code.replace(
    '/<div id="article-body" class="leading-relaxed">[\\s\\S]*?<\\/div>/g',
    '/<div id="article-body" class="leading-relaxed px-4 md:px-0">[\\s\\S]*?<\\/div>/g'
);
code = code.replace(
    '<div id="article-body" class="leading-relaxed">\</div>',
    '<div id="article-body" class="leading-relaxed px-4 md:px-0">\</div>'
);
code = code.replace(
    '<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 text-center">',
    '<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 text-center px-4 md:px-0">'
);
code = code.replace(
    'sourcesHtml = \<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 flex flex-wrap justify-center gap-4">\</div>\;',
    'sourcesHtml = \<div id="article-source-container" class="border-t border-outline-variant/30 pt-10 flex flex-wrap justify-center gap-4 px-4 md:px-0">\</div>\;'
);

fs.writeFileSync('api/render-article.js', code, 'utf8');
console.log('Fixed render-article.js');
