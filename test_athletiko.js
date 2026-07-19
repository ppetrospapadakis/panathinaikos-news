const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const html = (await axios.get('https://www.athletiko.gr/build-up-ti-podosfairo-tha-doyme-apo-nikolits-mentilimpas-kai-nistroyp-90556', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })).data;
    const $ = cheerio.load(html);
    const bodySelectors = [
        'article .article-body', 'article .content', '.article-content',
        '.article-body', '.story-body', '.entry-content', '.post-content',
        '[class*="article-text"]', '[class*="article-content"]',
        'article p', '.content-area p', 'main p',
    ];
    let bodyText = '';
    let usedSel = '';
    for (const sel of bodySelectors) {
        const els = $(sel);
        if (els.length > 0) {
            usedSel = sel;
            els.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"]').remove();
            const paragraphs = [];
            els.find('p, div, br').each((i, el) => {
                const t = $(el).text().replace(/[ \t]+/g, ' ').trim();
                if (t) paragraphs.push(t);
            });
            if (paragraphs.length > 0) {
                bodyText = paragraphs.join('\n\n');
            } else {
                bodyText = els.text().replace(/[ \t]+/g, ' ').trim();
            }
            if (bodyText.length > 100) break;
        }
    }
    console.log('Used Selector:', usedSel);
    console.log('Length:', bodyText.length);
    console.log('Content Start:', bodyText.substring(0, 200));
    console.log('Content End:', bodyText.substring(bodyText.length - 200));
}
test();
