const { scrapeSingleArticle } = require('../backend/scraper');
const axios = require('axios');
const cheerio = require('cheerio');

async function testSingleSportimeArticle() {
    const testUrl = 'https://sportime.gr/panathinaikos/panathinaikos-h-prwti-paghida-toy-nistroyp-kryvei-kai-mia-meghali-efkairia';
    console.log(`Testing scrapeSingleArticle for: ${testUrl}`);

    try {
        const article = await scrapeSingleArticle({
            url: testUrl,
            category: 'Γενικά',
            sourceName: 'Sportime',
            linkSelector: ''
        });

        console.log('Result Article:', article);
    } catch (err) {
        console.error('Error scraping Sportime article:', err);
    }
}

testSingleSportimeArticle();
