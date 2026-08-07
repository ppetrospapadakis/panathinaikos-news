const https = require('https');

function checkUrl(url, label) {
    https.get(url, res => {
        let data = '';
        res.on('data', d => data+=d);
        res.on('end', () => {
            const matches = data.match(/href=[\"'][^\"']*arthro-id=[^\"']*[\"']/g);
            console.log(label + ' checked. Found arthro-id links: ' + (matches ? matches.length : 0));
        });
    });
}

https.get('https://www.panathinaikosnews.gr/api/articles?limit=1', res => {
    let data = '';
    res.on('data', d => data+=d);
    res.on('end', () => {
        const articles = JSON.parse(data);
        if(articles.length) {
            const slug = articles[0].title ? 'test' : 'test';
            const url = 'https://www.panathinaikosnews.gr/podosfairo/' + slug + '-id=' + articles[0].id.substring(0,8);
            checkUrl(url, 'Article Page SSR');
        }
    });
});
