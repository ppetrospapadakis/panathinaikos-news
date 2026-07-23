const axios = require('axios');
const cheerio = require('cheerio');

async function testSportime() {
    try {
        const res = await axios.get('https://sportime.gr/panathinaikos', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 10000
        });

        const $ = cheerio.load(res.data);

        // Find article elements
        console.log('--- Article Selectors ---');
        console.log('h2 a:', $('h2 a').length);
        console.log('h3 a:', $('h3 a').length);
        console.log('article a:', $('article a').length);
        console.log('.post-title a:', $('.post-title a').length);
        console.log('a[href*="/panathinaikos/"]:', $('a[href*="/panathinaikos/"]').length);
        console.log('a[href*="/podosfairo/"]:', $('a[href*="/podosfairo/"]').length);
        console.log('a[href*="/basket/"]:', $('a[href*="/basket/"]').length);

        console.log('\n--- Sample Article Links Found ---');
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            if (href.includes('/panathinaikos/') || href.includes('/podosfairo/') || href.includes('/basket/') || href.includes('panathinaikos-')) {
                console.log(`[${i}] ${text} -> ${href}`);
            }
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testSportime();
