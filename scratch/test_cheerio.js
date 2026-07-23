const cheerio = require('cheerio');
const html = `<div class="article-body">
  <p>Paragraph 1</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
  <div>Paragraph 2 inside div</div>
</div>`;
const $ = cheerio.load(html);
const els = $('.article-body');
const paragraphs = [];
els.find('p, div, br, li').each((i, el) => {
    let t = $(el).text().replace(/[ \t]+/g, ' ').trim();
    if (el.tagName === 'li') t = '• ' + t;
    if (t) paragraphs.push(t);
});
console.log(paragraphs);
