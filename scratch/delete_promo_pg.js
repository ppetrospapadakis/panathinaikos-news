require('dotenv').config();
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        await client.connect();
        const res = await client.query('DELETE FROM articles WHERE id = $1', ['8eeba85c-b6b4-4c61-a56d-3f2930aad51f']);
        console.log(`Deleted ${res.rowCount} row(s).`);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}
run();
