const axios = require('axios');
axios.get('https://www.pao.gr/feed/').then(res => {
    const lines = res.data.split('\n');
    const pubDates = lines.filter(l => l.includes('<pubDate>'));
    console.log(pubDates.slice(0, 5));
});
