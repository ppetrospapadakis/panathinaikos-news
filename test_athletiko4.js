const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const html = (await axios.get('https://www.athletiko.gr/build-up-ti-podosfairo-tha-doyme-apo-nikolits-mentilimpas-kai-nistroyp-90556', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })).data;
    const $ = cheerio.load(html);
    console.log('Main HTML structure:');
    $('main').children().each((i, el) => {
        console.log(`Child ${i}:`, el.tagName, $(el).attr('class'), $(el).attr('id'));
    });
}
test();
