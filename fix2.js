const fs = require('fs');
let art = fs.readFileSync('article.html', 'utf8');
art = art.replace(/<!-- ① TITLE \+ CATEGORY HEADER -->\r?\n\s*<div>/, '<!-- ① TITLE + CATEGORY HEADER -->\n                <div class="px-4 md:px-0">');
fs.writeFileSync('article.html', art);
