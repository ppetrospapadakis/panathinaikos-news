const axios = require('axios');
const fs = require('fs');

const http = axios.create({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });

async function run() {
    const res1 = await http.get('https://www.sport-fm.gr/tag/pao');
    fs.writeFileSync('scratch/sport-fm.html', res1.data);
    
    const res2 = await http.get('https://www.pao1908.com/category/nea/');
    fs.writeFileSync('scratch/pao1908.html', res2.data);
    
    const res3 = await http.get('https://www.pao.gr/');
    fs.writeFileSync('scratch/pao.html', res3.data);
}
run();
