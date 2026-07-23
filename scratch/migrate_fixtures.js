const { Client } = require('pg');

async function main() {
    const client = new Client({
        user: 'postgres.rctltbuiitdnqlxizlym',
        password: 'Supabase13-',
        host: 'aws-0-eu-west-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB!');

        const sql = `
            CREATE TABLE IF NOT EXISTS public.fixtures (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                category TEXT NOT NULL CHECK (category IN ('football', 'basketball', 'amateur')),
                sport_name TEXT,
                match_date TIMESTAMPTZ NOT NULL,
                
                home_team_name TEXT NOT NULL,
                home_score INT DEFAULT NULL,
                
                away_team_name TEXT NOT NULL,
                away_score INT DEFAULT NULL,
                
                competition TEXT, -- e.g. "Super League", "Euroleague", "Stoiximan Basket League", etc.
                is_current BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Allow public read access" ON public.fixtures;
            CREATE POLICY "Allow public read access" ON public.fixtures FOR SELECT USING (true);
        `;

        await client.query(sql);
        console.log('✅ Table public.fixtures created and RLS policy applied successfully!');
    } catch (e) {
        console.error('Error running migration:', e);
    } finally {
        await client.end();
    }
}

main();
