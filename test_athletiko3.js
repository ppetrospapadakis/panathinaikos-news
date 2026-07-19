const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const html = (await axios.get('https://www.athletiko.gr/build-up-ti-podosfairo-tha-doyme-apo-nikolits-mentilimpas-kai-nistroyp-90556', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })).data;
    const $ = cheerio.load(html);
    const title = $('h1').first();
    let curr = title.parent();
    for (let i = 0; i < 4; i++) {
        console.log(`Parent ${i} classes:`, curr.attr('class'));
        curr = curr.parent();
    }
}
test();
