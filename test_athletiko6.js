const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const html = (await axios.get('https://www.athletiko.gr/oles-oi-metagrafikes-exelixeis-ston-panathinaiko-ti-ischyei-me-fan-ntrongkelen-90555', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })).data;
    const $ = cheerio.load(html);
    const els = $('.single-article');
    els.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"]').remove();
    const paragraphs = [];
    els.find('p').each((i, el) => {
        const t = $(el).text().replace(/[ \t]+/g, ' ').trim();
        if (t && !t.includes('Μην χάνεις είδηση')) paragraphs.push(t);
    });
    const bodyText = paragraphs.join('\n\n');
    console.log('Length:', bodyText.length);
    console.log('Text:', bodyText);
}
test();
