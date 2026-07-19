const https = require('https');
https.get('https://www.panathinaikosnews.gr/apopsi', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const start = data.indexOf('id="hero-container"');
        const end = data.indexOf('</section>', start);
        console.log(data.substring(start, end));
    });
});
