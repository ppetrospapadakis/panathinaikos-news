const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('Connected to PostgreSQL.');

        await client.query(`
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS twitter_posted BOOLEAN DEFAULT false;
        `);
        console.log('Added twitter_posted column successfully (or it already existed).');

        // Let's create an index for faster queries on unposted articles
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_articles_twitter_posted_created_at 
            ON articles(twitter_posted, created_at DESC);
        `);
        console.log('Created index idx_articles_twitter_posted_created_at successfully.');
    } catch (e) {
        console.error('Error adding column:', e);
    } finally {
        await client.end();
    }
}
run();
