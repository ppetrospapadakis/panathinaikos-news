const { Client } = require('pg');

async function migrate() {
    const connectionString = "postgresql://postgres:Supabase13-@db.rctltbuiitdnqlxizlym.supabase.co:5432/postgres";
    const client = new Client({ connectionString });
    
    try {
        console.log('Connecting to database...');
        await client.connect();
        
        console.log('Creating article_comments table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS article_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                article_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                comment_text TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        console.log('Creating index on article_id for fast queries...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_comments_article_id ON article_comments(article_id);
        `);
        
        console.log('Comments Database migration completed successfully!');
    } catch (err) {
        console.error('Comments migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
