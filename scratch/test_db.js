const { Client } = require('pg');

async function tryConnect(host, port, user) {
    console.log(`Trying ${user}@${host}:${port}...`);
    const client = new Client({
        user: user,
        password: 'Supabase13-',
        host: host,
        port: port,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log(`SUCCESS connected to ${host}:${port}`);
        return client;
    } catch (e) {
        console.log(`FAILED ${host}:${port}: ${e.message}`);
        return null;
    }
}

async function main() {
    const projectRef = 'rctltbuiitdnqlxizlym';
    const hosts = [
        'aws-0-eu-central-1.pooler.supabase.com',
        'aws-0-eu-west-1.pooler.supabase.com'
    ];
    
    for (const h of hosts) {
        for (const p of [6543, 5432]) {
            const client = await tryConnect(h, p, `postgres.${projectRef}`);
            if (client) {
                const sql = `
                    ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
                    
                    DROP POLICY IF EXISTS "Allow public read comments" ON public.article_comments;
                    CREATE POLICY "Allow public read comments" ON public.article_comments FOR SELECT USING (true);

                    DROP POLICY IF EXISTS "Allow public insert comments" ON public.article_comments;
                    CREATE POLICY "Allow public insert comments" ON public.article_comments FOR INSERT WITH CHECK (true);

                    DROP POLICY IF EXISTS "Allow public delete comments" ON public.article_comments;
                    CREATE POLICY "Allow public delete comments" ON public.article_comments FOR DELETE USING (true);

                    ALTER TABLE public.scraping_runs ENABLE ROW LEVEL SECURITY;

                    DROP POLICY IF EXISTS "Allow public select scraping_runs" ON public.scraping_runs;
                    CREATE POLICY "Allow public select scraping_runs" ON public.scraping_runs FOR SELECT USING (true);

                    DROP POLICY IF EXISTS "Allow public insert scraping_runs" ON public.scraping_runs;
                    CREATE POLICY "Allow public insert scraping_runs" ON public.scraping_runs FOR INSERT WITH CHECK (true);
                `;
                const res = await client.query(sql);
                console.log('✅ Query executed successfully! RLS and policies have been applied!');
                await client.end();
                return;
            }
        }
    }
}

main();
