const { Client } = require('pg');

async function migrate() {
    const connectionString = "postgresql://postgres:Supabase13-@db.rctltbuiitdnqlxizlym.supabase.co:5432/postgres";
    const client = new Client({ connectionString });
    
    try {
        console.log('Connecting to PostgreSQL database...');
        await client.connect();
        
        console.log('Executing migration query: Adding pinned_at column...');
        await client.query(`
            ALTER TABLE articles ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ DEFAULT NULL;
        `);
        
        console.log('Executing migration query: Creating B-Tree index on pinned_at...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_articles_pinned_at ON articles (pinned_at DESC NULLS LAST);
        `);
        
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
