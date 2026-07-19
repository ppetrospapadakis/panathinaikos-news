const axios = require('axios');

async function testLive() {
    const url = 'https://www.panathinaikosnews.gr/api/sys/social-sync?secret=pao_social_sync_secret_123';
    console.log(`Calling live production URL: ${url}`);
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(`Live API Response Code: ${res.status}`);
        console.log('Live API Response Body:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        if (e.response) {
            console.error(`Live API Error Code: ${e.response.status}`);
            console.error('Live API Error Body:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error('Error calling live API:', e.message);
        }
    }
}

testLive();
