const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not set in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database.');

        // Find how many rows would be affected
        const selectRes = await client.query(`
            SELECT id, title, image_url 
            FROM articles 
            WHERE source_url LIKE '%sdna.gr%' 
              AND image_url LIKE '%/styles/og_image/%'
        `);

        console.log(`Found ${selectRes.rows.length} articles with SDNA watermarked images.`);

        if (selectRes.rows.length > 0) {
            const updateRes = await client.query(`
                UPDATE articles
                SET image_url = SPLIT_PART(REPLACE(image_url, '/styles/og_image/', '/styles/main/'), '?', 1)
                WHERE source_url LIKE '%sdna.gr%'
                  AND image_url LIKE '%/styles/og_image/%'
            `);
            console.log(`Successfully updated ${updateRes.rowCount} articles in the database!`);
        } else {
            console.log('No articles needed updates.');
        }

    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await client.end();
    }
}

run();
