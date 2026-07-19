const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www.pao.gr/matches/taktiki-kai-fysiki-katastasi-2/').then(res => {
    const html = res.data;
    // Regex to find things like date or time
    const matches = html.match(/12:43/g);
    console.log("Found 12:43:", matches);
    const timeMatch = html.match(/<time[^>]*>.*?<\/time>/g);
    console.log("Time tags:", timeMatch);
    
    // Look for anything looking like a date
    const $ = cheerio.load(html);
    console.log("Article date text:", $('.article-date').text());
    console.log("Meta published_time:", $('meta[property="article:published_time"]').attr('content'));
});
