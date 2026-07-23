async function testImg() {
    const googleUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY";
    console.log('Testing Google URL:', googleUrl);
    try {
        const res = await fetch(googleUrl, { method: 'HEAD' });
        console.log('Google URL status:', res.status);
    } catch(e) {
        console.error('Google URL fetch error:', e.message);
    }

    // Now test original sport-fm article page
    const articleUrl = "https://www.sport-fm.gr/article/epikairotita/oristiko-me-fan-ntrongkelen-o-panathinaikos-kodra-stin-paksi/5137349";
    console.log('\nFetching original sport-fm article:', articleUrl);
    const res2 = await fetch(articleUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res2.text();
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);

    const ogImage = $('meta[property="og:image"]').attr('content');
    console.log('Original og:image on sport-fm:', ogImage);
}

testImg();
