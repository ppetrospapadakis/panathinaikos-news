const axios = require('axios');
const cheerio = require('cheerio');

async function testAxios() {
    const url = "https://www.sport-fm.gr/article/epikairotita/oristiko-me-fan-ntrongkelen-o-panathinaikos-kodra-stin-paksi/5137349";
    console.log('Fetching with axios:', url);
    try {
        const res = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'el-GR,el;q=0.9',
            }
        });

        console.log('Status:', res.status);
        const $ = cheerio.load(res.data);
        const ogImage = $('meta[property="og:image"]').attr('content');
        console.log('Axios extracted og:image:', ogImage);
    } catch(e) {
        console.error('Axios error:', e.message);
    }
}

testAxios();
