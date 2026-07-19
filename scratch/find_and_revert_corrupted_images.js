const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        
        // Find articles where image_url contains '/styles/main/' but the domain is not sdna.gr
        const res = await client.query(`
            SELECT id, title, image_url, source_url 
            FROM articles 
            WHERE image_url LIKE '%/styles/main/%' 
              AND image_url NOT LIKE '%sdna.gr%'
        `);

        console.log(`Found ${res.rows.length} articles to revert.`);
        
        for (const row of res.rows) {
            const restoredUrl = row.image_url.replace('/styles/main/', '/styles/og_image/');
            console.log(`Reverting article "${row.title}"\n  From: ${row.image_url}\n  To:   ${restoredUrl}`);
            
            await client.query('UPDATE articles SET image_url = $1 WHERE id = $2', [restoredUrl, row.id]);
        }
        
        console.log('Revert completed successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
