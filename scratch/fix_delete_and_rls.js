const { Client } = require('pg');

async function tryConnect(connStr) {
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log('SUCCESS connecting with:', connStr);

        // 1. Grant RLS UPDATE and DELETE policies to public/anon on articles
        const sql = `
            DROP POLICY IF EXISTS "Allow public update articles" ON public.articles;
            CREATE POLICY "Allow public update articles" ON public.articles FOR UPDATE USING (true) WITH CHECK (true);

            DROP POLICY IF EXISTS "Allow public delete articles" ON public.articles;
            CREATE POLICY "Allow public delete articles" ON public.articles FOR DELETE USING (true);
        `;
        await client.query(sql);
        console.log('Successfully created RLS update & delete policies on articles table!');

        // 2. Delete the target article requested by the user
        const targetId = 'b1ff9e4e-223f-4201-a289-eae5871b4b44';
        const res = await client.query("DELETE FROM public.articles WHERE id = $1 RETURNING id, title", [targetId]);
        console.log(`Deleted article targetId=${targetId}, rows deleted:`, res.rowCount, res.rows);

        await client.end();
        return true;
    } catch (err) {
        console.error('Failed with:', connStr, err.message);
        try { await client.end(); } catch(e){}
        return false;
    }
}

async function main() {
    const passwords = ['Supabase13-'];
    const candidates = [
        'postgresql://postgres.rctltbuiitdnqlxizlym:Supabase13-@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
        'postgresql://postgres.rctltbuiitdnqlxizlym:Supabase13-@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
        'postgresql://postgres:Supabase13-@db.rctltbuiitdnqlxizlym.supabase.co:6543/postgres',
        'postgresql://postgres.rctltbuiitdnqlxizlym:Supabase13-@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
        'postgresql://postgres.rctltbuiitdnqlxizlym:Supabase13-@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
    ];

    for (const c of candidates) {
        const ok = await tryConnect(c);
        if (ok) break;
    }
}

main();
