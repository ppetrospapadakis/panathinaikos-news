const cheerio = require('cheerio');

async function testFilter() {
    const url = 'https://sportime.gr/panathinaikos';
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    let links = [];
    const selectors = [
        'a[href*="sportime.gr/panathinaikos/"]',
        'a[href*="sportime.gr/podosfairo/"]',
        'a[href*="sportime.gr/basket/"]'
    ];

    selectors.forEach(sel => {
        $(sel).each((_, el) => {
            const href = $(el).attr('href');
            if (href) links.push(href);
        });
    });

    // Dedupe
    links = Array.from(new Set(links));

    // Filter non-article links
    const articleLinks = links.filter(l => !l.endsWith('/feed') && !l.endsWith('/panathinaikos') && !l.endsWith('/panathinaikos/') && !l.includes('/category/') && l.length > 35);

    console.log('Original unique links count:', links.length);
    console.log('Filtered article links count:', articleLinks.length);
    console.log('First/Most recent article URL:', articleLinks[0]);
    console.log('Older article URLs to ignore on 1st run:', articleLinks.slice(1));
}

testFilter();
