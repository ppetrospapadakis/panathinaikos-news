const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('scratch/pao1908.html', 'utf-8');
const $ = cheerio.load(html);
const links = new Set();
$('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/nea/')) {
        links.add(href);
        console.log(`Href: ${href} | Parent classes: ${$(el).parent().attr('class')}`);
    }
});
console.log([...links]);
