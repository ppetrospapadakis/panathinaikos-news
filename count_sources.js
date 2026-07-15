const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL.trim().replace(/^['"]|['"]$/g, '');
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY).trim().replace(/^['"]|['"]$/g, '');

const db = createClient(url, key);

async function checkCounts() {
    const { data, error } = await db.from('articles')
        .select('source_url')
        .gte('created_at', '2026-07-13T00:00:00Z');
        
    if (error) {
        console.error(error);
        return;
    }

    const counts = {};
    for (const row of data) {
        let sources = [];
        if (row.source_url) {
            sources = row.source_url.split(',').map(s => s.trim());
        } else {
            sources = ['Unknown'];
        }

        for (const url of sources) {
            let name = 'Unknown';
            if (url.includes('sdna.gr')) name = 'SDNA';
            else if (url.includes('sportal.gr')) name = 'Sportal';
            else if (url.includes('sport24.gr')) name = 'Sport24';
            else if (url.includes('gazzetta.gr')) name = 'Gazzetta';
            else if (url.includes('athletiko.gr')) name = 'Athletiko';
            else if (url.includes('pao.gr')) name = 'PAO Official';
            else if (url.includes('pao1908.com')) name = 'PAO1908 Official';
            else if (url.includes('sport-fm.gr')) name = 'Sport-FM';
            else if (url.includes('monobala.gr')) name = 'Monobala';
            else if (url.toLowerCase().includes('manual')) name = 'Editorial (Manual)';
            
            counts[name] = (counts[name] || 0) + 1;
        }
    }

    console.log('--- Article counts since 13/7 ---');
    for (const [source, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
        console.log(`${source}: ${count}`);
    }
}

checkCounts();
