const axios = require('axios');

async function check() {
    const cacheBuster = Date.now();
    const url = `https://www.panathinaikosnews.gr/api/sys/social-sync?secret=pao_social_sync_secret_123&t=${cacheBuster}`;
    console.log(`Calling custom domain URL with cache buster: ${url}`);
    try {
        const res = await axios.get(url);
        console.log(`Status: ${res.status}`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log(`Failed: ${e.message}`);
        if (e.response) {
            console.log(JSON.stringify(e.response.data, null, 2));
        }
    }
}
check();
