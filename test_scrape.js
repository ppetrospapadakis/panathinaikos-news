const cheerio = require('cheerio');
const axios = require('axios');
async function run() {
    const { data } = await axios.get('https://www.sport-fm.gr/article/recommendations/panathinaikos-apo-tin-arxi-sta-bathia-se-ellada-kai-eurwpi/5136516');
    const $ = cheerio.load(data);
    
    const bodySelectors = [
        'div.article-content',
        'div.main-article-content', 
        'div.post-content',
        'article div.content',
        'div.article-body',
        'div.single-article__content'
    ];
    let bodyText = '';
    let usedSel = '';
    for (const sel of bodySelectors) {
        if ($(sel).length) {
            bodyText = $(sel).text().replace(/\s+/g, ' ').trim();
            usedSel = sel;
            break;
        }
    }
    
    // Fallback if no matching body container
    if (!bodyText) {
        $('script, style, iframe, nav, header, footer').remove();
        bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        usedSel = 'body fallback';
    }
    
    console.log('Used Selector:', usedSel);
    console.log('Scraped Body Length:', bodyText.length);
    console.log('Body snippet:', bodyText.substring(0, 200));
}
run();
