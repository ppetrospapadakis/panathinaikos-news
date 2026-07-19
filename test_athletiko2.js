const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const html = (await axios.get('https://www.athletiko.gr/build-up-ti-podosfairo-tha-doyme-apo-nikolits-mentilimpas-kai-nistroyp-90556', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })).data;
    const $ = cheerio.load(html);
    console.log('Content block:', $('#content').length ? 'Found' : 'Not found');
    console.log('Article length:', $('article').length);
    console.log('Main P length:', $('main p').length);
    console.log('.post-content length:', $('.post-content').length);
    console.log('.entry-content length:', $('.entry-content').length);
}
test();
