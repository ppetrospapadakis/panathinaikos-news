const fs = require('fs');
let html = fs.readFileSync('article.html', 'utf8');

// Use regex to carefully match and remove the block
const regex = /if\s*\(currentArticleCategory\)\s*\{\s*const\s*catForApi\s*=\s*getCategoryCleanName\(currentArticleCategory\);\s*url\s*\+=\s*`&category=\$\{catForApi\}`;\s*\}/g;

if (regex.test(html)) {
    html = html.replace(regex, '');
    fs.writeFileSync('article.html', html);
    console.log('Successfully patched article.html using regex.');
} else {
    console.log('Could not find the target block to remove.');
}
