const cheerio = require('cheerio');

async function test() {
    const res = await fetch('https://www.sportdog.gr/teams/panathinaikos/panathinaikos-fc');
    const html = await res.text();
    
    console.log("HTML length:", html.length);
    
    const $ = cheerio.load(html);
    let allLinks = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) allLinks.push(href);
    });
    
    console.log("Total a tags:", allLinks.length);
    if (allLinks.length > 0) {
        console.log("Sample links:", allLinks.slice(0, 10));
    }
    
    // Check if there's any JSON in script tags
    $('script').each((i, el) => {
        const content = $(el).html();
        if (content && content.length > 500 && (content.includes('__NEXT_DATA__') || content.includes('__NUXT__') || content.includes('panathinaikos'))) {
            console.log("Found large script tag matching criteria, length:", content.length);
            console.log(content.substring(0, 200) + "...");
        }
    });
}
test();
