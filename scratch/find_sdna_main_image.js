const axios = require('axios');

async function test() {
    try {
        const url = 'https://www.sdna.gr/podosfairo/1449728_epesan-oi-ypografes-gia-fan-ntrogkelen-simera-stin-athina-o-ollandos';
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const html = res.data;
        
        console.log('Searching in HTML for "rick-van-drongelen":');
        const lines = html.split('\n');
        lines.forEach((line, index) => {
            if (line.includes('rick-van-drongelen')) {
                console.log(`Line ${index}: ${line.trim().substring(0, 300)}`);
            }
        });
    } catch (e) {
        console.error(e.message);
    }
}

test();
