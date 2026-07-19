const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        const url = 'https://www.sdna.gr/podosfairo/1449728_epesan-oi-ypografes-gia-fan-ntrogkelen-simera-stin-athina-o-ollandos';
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);

        // Try extracting via HTML selector
        let mainImg = '';
        $('img').each((i, img) => {
            const src = $(img).attr('src') || '';
            if (src.includes('/styles/main/')) {
                mainImg = src.startsWith('http') ? src : 'https://www.sdna.gr' + src;
            }
        });

        console.log('Extracted main style image from HTML:', mainImg);

        // Try to fetch it to see if it resolves
        if (mainImg) {
            try {
                const imgRes = await axios.get(mainImg, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                console.log(`Resolution of HTML main image: ${imgRes.status}`);
            } catch (e) {
                console.log(`Failed to resolve HTML main image: ${e.message}`);
            }
        }

        // Try to fetch og_image converted to main style WITHOUT itok
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            const converted = ogImage.replace('/styles/og_image/', '/styles/main/').split('?')[0];
            console.log('Converted main style URL (no itok):', converted);
            try {
                const imgRes = await axios.get(converted, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                console.log(`Resolution of converted main image: ${imgRes.status}`);
            } catch (e) {
                console.log(`Failed to resolve converted main image: ${e.message}`);
            }
        }

    } catch (e) {
        console.error(e.message);
    }
}

test();
