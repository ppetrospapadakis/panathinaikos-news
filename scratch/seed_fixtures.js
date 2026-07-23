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

        // Clear existing fixtures to have a clean seed
        await client.query('TRUNCATE TABLE public.fixtures;');

        const now = new Date();
        const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000).toISOString();

        const samples = [
            // Football
            { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: days(-14), home_team_name: 'Παναθηναϊκός', home_score: 2, away_team_name: 'Αστέρας Τρίπολης', away_score: 0, competition: 'Super League', is_current: false },
            { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: days(-7), home_team_name: 'ΠΑΟΚ', home_score: 1, away_team_name: 'Παναθηναϊκός', away_score: 1, competition: 'Super League', is_current: false },
            { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: days(-2), home_team_name: 'Παναθηναϊκός', home_score: 3, away_team_name: 'Λανς', away_score: 1, competition: 'UEFA Conference League', is_current: false },
            { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: days(3), home_team_name: 'Ολυμπιακός', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: true },
            { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: days(10), home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'ΑΕΚ', away_score: null, competition: 'Super League', is_current: false },
            { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: days(17), home_team_name: 'Άρης', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Greek Cup', is_current: false },

            // Basketball
            { category: 'basketball', sport_name: 'Μπάσκετ', match_date: days(-5), home_team_name: 'Παναθηναϊκός', home_score: 89, away_team_name: 'Ρεάλ Μαδρίτης', away_score: 81, competition: 'Euroleague', is_current: false },
            { category: 'basketball', sport_name: 'Μπάσκετ', match_date: days(2), home_team_name: 'Ολυμπιακός', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Stoiximan Basket League', is_current: true },
            { category: 'basketball', sport_name: 'Μπάσκετ', match_date: days(8), home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Μπαρτσελόνα', away_score: null, competition: 'Euroleague', is_current: false },

            // Amateur
            { category: 'amateur', sport_name: 'Βόλεϊ Ανδρών', match_date: days(-4), home_team_name: 'Παναθηναϊκός', home_score: 3, away_team_name: 'Ολυμπιακός', away_score: 1, competition: 'Volley League', is_current: false },
            { category: 'amateur', sport_name: 'Βόλεϊ Γυναικών', match_date: days(4), home_team_name: 'ΑΕΚ', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Volley League', is_current: true },
        ];

        for (const item of samples) {
            await client.query(`
                INSERT INTO public.fixtures 
                (category, sport_name, match_date, home_team_name, home_score, away_team_name, away_score, competition, is_current)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `, [item.category, item.sport_name, item.match_date, item.home_team_name, item.home_score, item.away_team_name, item.away_score, item.competition, item.is_current]);
        }

        console.log(`✅ Inserted ${samples.length} sample fixtures successfully!`);
    } catch (e) {
        console.error('Error seeding fixtures:', e);
    } finally {
        await client.end();
    }
}

main();
