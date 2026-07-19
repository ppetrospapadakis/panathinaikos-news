const axios = require('axios');

async function test() {
    const urls = [
        'https://www.gazzetta.gr/sites/default/files/styles/og_image/public/2026-07/van_drongelen_intime.jpg',
        'https://www.gazzetta.gr/sites/default/files/styles/main/public/2026-07/van_drongelen_intime.jpg',
        'https://www.gazzetta.gr/sites/default/files/styles/og_image/public/2026-07/yabusele_1.jpg',
        'https://www.gazzetta.gr/sites/default/files/styles/main/public/2026-07/yabusele_1.jpg'
    ];

    for (const url of urls) {
        try {
            const res = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            console.log(`URL: ${url} -> Status: ${res.status}`);
        } catch (e) {
            console.log(`URL: ${url} -> Failed: ${e.message}`);
        }
    }
}
test();
