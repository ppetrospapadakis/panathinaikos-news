const { Client } = require('pg');

async function populateSql() {
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
        console.log('Connected to PostgreSQL DB via pg!');

        console.log('1. Truncating public.fixtures...');
        await client.query('TRUNCATE TABLE public.fixtures;');
        console.log('✅ Truncated public.fixtures table.');

        console.log('2. Inserting official match data...');

        const insertSql = `
-- SECTION 1: ΠΟΔΟΣΦΑΙΡΟ - Φιλικά Συλλόγων
INSERT INTO public.fixtures (category, sport_name, match_date, home_team_name, home_score, away_team_name, away_score, competition, is_current) VALUES
('football', 'Ποδόσφαιρο', '2026-07-01T18:00:00+03:00', 'Χελμόντ', 0, 'Παναθηναϊκός', 4, 'Φιλικά Συλλόγων', false),
('football', 'Ποδόσφαιρο', '2026-07-04T18:00:00+03:00', 'Άγιαξ', 1, 'Παναθηναϊκός', 3, 'Φιλικά Συλλόγων', false),
('football', 'Ποδόσφαιρο', '2026-07-11T21:00:00+03:00', 'Παναθηναϊκός', 3, 'Γκρασχόπερς', 0, 'Φιλικά Συλλόγων', false),
('football', 'Ποδόσφαιρο', '2026-07-15T19:00:00+03:00', 'Ραπίντ Βιέννης', 4, 'Παναθηναϊκός', 1, 'Φιλικά Συλλόγων', false);

-- SECTION 2: ΠΟΔΟΣΦΑΙΡΟ - Conference League & Stoiximan Super League
INSERT INTO public.fixtures (category, sport_name, match_date, home_team_name, home_score, away_team_name, away_score, competition, is_current) VALUES
('football', 'Ποδόσφαιρο', '2026-07-23T21:00:00+03:00', 'Πάκσι', NULL, 'Παναθηναϊκός', NULL, 'Conference League', true),
('football', 'Ποδόσφαιρο', '2026-07-30T21:30:00+03:00', 'Παναθηναϊκός', NULL, 'Πάκσι', NULL, 'Conference League', false),
('football', 'Ποδόσφαιρο', '2026-08-22T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Κηφισιά', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-08-29T18:00:00+03:00', 'Λεβαδειακός', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-09-05T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'ΠΑΟΚ', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-09-12T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Παναιτωλικός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-09-19T18:00:00+03:00', 'Καλαμάτα', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-10-10T18:00:00+03:00', 'Ολυμπιακός', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-10-17T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Αστέρας Τρίπολης', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-10-24T18:00:00+03:00', 'Βόλος', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-10-31T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'ΑΕΚ', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-11-07T18:00:00+03:00', 'Ηρακλής', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-11-21T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'ΟΦΗ', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-11-28T18:00:00+03:00', 'Ατρόμητος', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-12-05T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Άρης', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-12-12T18:00:00+03:00', 'ΠΑΟΚ', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2026-12-19T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Ηρακλής', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-01-09T18:00:00+03:00', 'Αστέρας Τρίπολης', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-01-16T18:00:00+03:00', 'ΟΦΗ', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-01-23T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Ατρόμητος', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-01-30T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Ολυμπιακός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-02-06T18:00:00+03:00', 'Άρης', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-02-13T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Καλαμάτα', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-02-20T18:00:00+03:00', 'Παναιτωλικός', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-02-27T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Βόλος', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-03-06T18:00:00+03:00', 'Κηφισιά', NULL, 'Παναθηναϊκός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-03-13T18:00:00+03:00', 'Παναθηναϊκός', NULL, 'Λεβαδειακός', NULL, 'Super League', false),
('football', 'Ποδόσφαιρο', '2027-03-20T18:00:00+03:00', 'ΑΕΚ', NULL, 'Παναθηναϊκός', NULL, 'Super League', false);

-- SECTION 3: ΜΠΑΣΚΕΤ ΑΝΔΡΩΝ - Stoiximan GBL Πλέι Οφ
INSERT INTO public.fixtures (category, sport_name, match_date, home_team_name, home_score, away_team_name, away_score, competition, is_current) VALUES
('basketball', 'Μπάσκετ', '2026-05-15T19:00:00+03:00', 'Παναθηναϊκός', 99, 'Μύκονος', 75, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-05-17T15:15:00+03:00', 'Μύκονος', 76, 'Παναθηναϊκός', 90, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-05-28T18:00:00+03:00', 'Παναθηναϊκός', 114, 'ΠΑΟΚ', 102, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-05-30T14:50:00+03:00', 'ΠΑΟΚ', 94, 'Παναθηναϊκός', 102, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-06-03T21:00:00+03:00', 'Ολυμπιακός', 82, 'Παναθηναϊκός', 76, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-06-05T21:00:00+03:00', 'Παναθηναϊκός', 68, 'Ολυμπιακός', 58, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-06-08T21:00:00+03:00', 'Ολυμπιακός', 102, 'Παναθηναϊκός', 92, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-06-10T21:00:00+03:00', 'Παναθηναϊκός', 93, 'Ολυμπιακός', 86, 'Stoiximan Basket League', false),
('basketball', 'Μπάσκετ', '2026-06-13T18:00:00+03:00', 'Ολυμπιακός', 89, 'Παναθηναϊκός', 85, 'Stoiximan Basket League', false);

-- SECTION 4: ΕΡΑΣΙΤΕΧΝΗΣ - Μπάσκετ Γυναικών (A1)
INSERT INTO public.fixtures (category, sport_name, match_date, home_team_name, home_score, away_team_name, away_score, competition, is_current) VALUES
('amateur', 'Μπάσκετ Γυναικών', '2026-04-15T20:30:00+03:00', 'Αθηναϊκός Γ', 44, 'Παναθηναϊκός Γ', 36, 'Α1 Γυναικών', false);

-- SECTION 5: ΕΡΑΣΙΤΕΧΝΗΣ - Βόλεϊ Ανδρών (Volley League)
INSERT INTO public.fixtures (category, sport_name, match_date, home_team_name, home_score, away_team_name, away_score, competition, is_current) VALUES
('amateur', 'Βόλεϊ Ανδρών', '2026-03-28T20:30:00+03:00', 'Ολυμπιακός', 2, 'Παναθηναϊκός', 3, 'Volley League', false),
('amateur', 'Βόλεϊ Ανδρών', '2026-04-02T18:00:00+03:00', 'Παναθηναϊκός', 3, 'Ολυμπιακός', 0, 'Volley League', false),
('amateur', 'Βόλεϊ Ανδρών', '2026-04-18T20:30:00+03:00', 'Παναθηναϊκός', 3, 'ΠΑΟΚ', 1, 'Volley League', false),
('amateur', 'Βόλεϊ Ανδρών', '2026-04-26T18:30:00+03:00', 'ΠΑΟΚ', 3, 'Παναθηναϊκός', 0, 'Volley League', false),
('amateur', 'Βόλεϊ Ανδρών', '2026-05-04T19:00:00+03:00', 'Παναθηναϊκός', 3, 'ΠΑΟΚ', 2, 'Volley League', false),
('amateur', 'Βόλεϊ Ανδρών', '2026-05-09T17:30:00+03:00', 'ΠΑΟΚ', 1, 'Παναθηναϊκός', 3, 'Volley League', false);
        `;

        await client.query(insertSql);
        console.log('✅ Successfully executed SQL insert for all official fixture sections!');

        const res = await client.query('SELECT COUNT(*) FROM public.fixtures;');
        console.log(`Current total rows in public.fixtures: ${res.rows[0].count}`);

    } catch (e) {
        console.error('Error running SQL script:', e);
    } finally {
        await client.end();
    }
}

populateSql();
