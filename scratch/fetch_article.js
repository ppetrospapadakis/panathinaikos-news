const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www.pao.gr/matches/taktiki-kai-fysiki-katastasi-2/').then(res => {
    const $ = cheerio.load(res.data);
    const timeAttr = $('time').first().attr('datetime');
    const timeText = $('time').first().text().trim();
    const dateClassText = $('[class*="date"], [class*="time"]').first().text().trim();
    console.log("timeAttr:", timeAttr);
    console.log("timeText:", timeText);
    console.log("dateClassText:", dateClassText);
});
