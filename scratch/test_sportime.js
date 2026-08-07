const axios = require('axios');
const cheerio = require('cheerio');

async function testSportimeArticle() {
    const url = 'https://sportime.gr/podosfairo/panathinaikos-dipla-ston-nte-frai-o-fan-ntronghkelen-o-nistroyp-edeikse-tis-protheseis-toy/';
    try {
        console.log("Fetching Sportime article:", url);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });
        const $ = cheerio.load(res.data);

        console.log("Status:", res.status);
        console.log("h1 Title:", $('h1').text().trim());
        console.log("og:title:", $('meta[property="og:title"]').attr('content'));

        console.log("Paragraphs count:", $('p').length);
        $('p').slice(0, 10).each((i, el) => {
            console.log(`p[${i}] (class: "${$(el).attr('class')||''}", parent: "${$(el).parent().get(0).tagName}.${$(el).parent().attr('class')||''}"):`, $(el).text().trim().substring(0, 100));
        });

        // Find main wrapper
        const mainClasses = [];
        $('[class*="content"], [class*="article"], [class*="post"], [class*="single"], [class*="body"]').each((i, el) => {
            const cls = $(el).attr('class');
            if (cls && !mainClasses.includes(cls)) mainClasses.push(cls);
        });
        console.log("\nPotential content container classes:", mainClasses.slice(0, 30));

    } catch(e) {
        console.error("Error fetching Sportime:", e.message);
    }
}

testSportimeArticle();
