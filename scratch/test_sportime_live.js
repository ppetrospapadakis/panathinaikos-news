const cheerio = require('cheerio');

async function testSportime() {
    const url = 'https://sportime.gr/panathinaikos';
    console.log('Fetching:', url);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML length:', html.length);

    const $ = cheerio.load(html);
    const links = [];

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

    console.log('Total matched links by selectors:', links.length);
    console.log('Sample links:', links.slice(0, 15));

    // Also check all links on the page
    const allLinks = [];
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('panathinaikos')) {
            allLinks.push(href);
        }
    });
    console.log('All links with "panathinaikos":', allLinks.length, allLinks.slice(0, 15));
}

testSportime();
