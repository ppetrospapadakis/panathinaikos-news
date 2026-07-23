const cheerio = require('cheerio');

async function test() {
    const res = await fetch('https://sportime.gr/panathinaikos/');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find all links that look like articles and print their classes or parents
    const links = new Set();
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('sportime.gr/') && href.length > 40 && !href.includes('/category/')) {
            const parent = $(el).parent();
            const parentName = parent.get(0).tagName;
            const parentClass = parent.attr('class') || '';
            console.log(`Link: ${href}`);
            console.log(`Parent: <${parentName} class="${parentClass}">`);
            console.log('---');
        }
    });
}
test();
