const { Client } = require('pg');

async function main() {
    const connectionString = 'postgresql://postgres:Supabase13-@db.rctltbuiitdnqlxizlym.supabase.co:5432/postgres';
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL successfully!');
        
        const sql = `
            -- Enable RLS and add policies for article_comments
            ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow public read comments" ON public.article_comments;
            CREATE POLICY "Allow public read comments" ON public.article_comments FOR SELECT USING (true);

            DROP POLICY IF EXISTS "Allow public insert comments" ON public.article_comments;
            CREATE POLICY "Allow public insert comments" ON public.article_comments FOR INSERT WITH CHECK (true);

            DROP POLICY IF EXISTS "Allow public delete comments" ON public.article_comments;
            CREATE POLICY "Allow public delete comments" ON public.article_comments FOR DELETE USING (true);

            -- Enable RLS and add policies for scraping_runs
            ALTER TABLE public.scraping_runs ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Allow public select scraping_runs" ON public.scraping_runs;
            CREATE POLICY "Allow public select scraping_runs" ON public.scraping_runs FOR SELECT USING (true);

            DROP POLICY IF EXISTS "Allow public insert scraping_runs" ON public.scraping_runs;
            CREATE POLICY "Allow public insert scraping_runs" ON public.scraping_runs FOR INSERT WITH CHECK (true);
        `;

        await client.query(sql);
        console.log('Successfully enabled RLS and created policies for article_comments and scraping_runs!');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

main();
