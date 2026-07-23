const cheerio = require('cheerio');

async function testArticle(url) {
    console.log('Testing article extraction for:', url);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    console.log('HTTP status:', res.status);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Title
    const title = $('h1').first().text().trim() || $('title').text().trim();
    console.log('Title:', title);

    // Content selectors
    const selectors = [
        'article .entry-content',
        '.entry-content',
        'article .post-content',
        '.post-content',
        'article'
    ];

    let content = '';
    for (const sel of selectors) {
        const el = $(sel);
        if (el.length > 0) {
            // Remove noise
            el.find('script, style, iframe, .ad, .social-share, .related-posts, nav, header, footer').remove();
            const text = el.text().replace(/\s+/g, ' ').trim();
            if (text.length > 200) {
                content = text;
                console.log('Matched content selector:', sel, '| Length:', content.length);
                break;
            }
        }
    }

    if (!content) {
        console.log('No content matched! Paragraph count:', $('p').length);
        const pTexts = [];
        $('p').each((_, p) => pTexts.push($(p).text().trim()));
        console.log('Sample <p> texts:', pTexts.slice(0, 5));
    } else {
        console.log('Content snippet (first 300 chars):', content.substring(0, 300));
        
        // Word count check
        const words = content.split(/\s+/).filter(w => w.length > 0);
        console.log('Word count:', words.length);
    }
}

testArticle('https://sportime.gr/panathinaikos/panathinaikos-h-prwti-paghida-toy-nistroyp-kryvei-kai-mia-meghali-efkairia');
