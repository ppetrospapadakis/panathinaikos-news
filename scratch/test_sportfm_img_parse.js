const cheerio = require('cheerio');

function sanitizeImageUrl(raw) {
    if (!raw) return '';
    let img = raw.trim();
    if (img.startsWith('//')) return 'https:' + img;
    return img;
}

async function testSportFmImage() {
    const url = "https://www.sport-fm.gr/article/epikairotita/oristiko-me-fan-ntrongkelen-o-panathinaikos-kodra-stin-paksi/5137349";
    console.log('Testing image extraction for:', url);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const scrapedImg = (
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('article img').first().attr('src') ||
        $('img').first().attr('src') ||
        ''
    );

    console.log('scrapedImg raw:', scrapedImg);
    const cleanedImg = sanitizeImageUrl(scrapedImg);
    console.log('cleanedImg:', cleanedImg);

    if (cleanedImg && cleanedImg.startsWith('http')) {
        const u = new URL(cleanedImg);
        const pathParts = u.pathname.toLowerCase().split('/');
        const filename = pathParts[pathParts.length - 1] || '';
        const parentPath = pathParts.slice(0, -1).join('/');

        const filenameBrandingIndicators = [
            'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
            'og-image', 'og_image', 'site-logo', 'site_logo', 'default-image', 'default_image',
            'noimage', 'no-image', 'blank', 'generic', 'share-image', 'share_image'
        ];

        const pathBrandingIndicators = [
            '/logos/', '/logo/', '/brand/', '/branding/',
            '/default_images/', '/default-images/',
            '/assets/images/', '/site-assets/'
        ];

        let isBranding = filenameBrandingIndicators.some(ind => filename.includes(ind));
        if (!isBranding) {
            isBranding = pathBrandingIndicators.some(p => ('/' + parentPath + '/').includes(p));
        }

        console.log('filename:', filename);
        console.log('parentPath:', parentPath);
        console.log('isBranding?', isBranding);
    }
}

testSportFmImage();
