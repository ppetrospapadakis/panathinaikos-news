const axios = require('axios');
const cheerio = require('cheerio');

const http = axios.create({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });

async function checkDom(url) {
    const res = await http.get(url);
    const $ = cheerio.load(res.data);
    console.log(`\nURL: ${url}`);
    
    // Check sport-fm
    if (url.includes('sport-fm')) {
        const anchors = $('a').slice(0, 20).map((i, el) => $(el).attr('href')).get();
        console.log('Sample a hrefs:', anchors);
        console.log('Articles class?', $('article').length);
    }
    
    // Check pao1908
    if (url.includes('pao1908')) {
        const anchors = $('a').slice(0, 20).map((i, el) => $(el).attr('href')).get();
        console.log('Sample a hrefs:', anchors);
        console.log('.post class?', $('.post').length);
    }
}

async function run() {
    await checkDom('https://www.sport-fm.gr/tag/pao');
    await checkDom('https://www.pao1908.com/category/nea/');
}
run();
