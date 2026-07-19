const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const ids = ['5c2f9ac8-4efe-481f-ae9d-e4d60ebe8569', 'afaea135-ddb7-443f-8128-bd53a3b722a9'];
        const res = await client.query('SELECT id, title, image_url, source_url FROM articles WHERE id = ANY($1)', [ids]);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
