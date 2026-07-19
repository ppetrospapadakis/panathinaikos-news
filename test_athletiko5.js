const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const html = (await axios.get('https://www.athletiko.gr/build-up-ti-podosfairo-tha-doyme-apo-nikolits-mentilimpas-kai-nistroyp-90556', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })).data;
    const $ = cheerio.load(html);
    const els = $('.single-article');
    els.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"]').remove();
    let bodyText = '';
    const paragraphs = [];
    els.find('p').each((i, el) => {
        const t = $(el).text().replace(/[ \t]+/g, ' ').trim();
        if (t) paragraphs.push(t);
    });
    bodyText = paragraphs.join('\n\n');
    console.log('Length:', bodyText.length);
    console.log('Text:', bodyText);
}
test();
