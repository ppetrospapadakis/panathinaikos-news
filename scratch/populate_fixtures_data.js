const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

const fixturesData = [
    // SECTION 1: ΠΟΔΟΣΦΑΙΡΟ - Φιλικά Συλλόγων
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-07-01T18:00:00+03:00', home_team_name: 'Χελμόντ', home_score: 0, away_team_name: 'Παναθηναϊκός', away_score: 4, competition: 'Φιλικά Συλλόγων', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-07-04T18:00:00+03:00', home_team_name: 'Άγιαξ', home_score: 1, away_team_name: 'Παναθηναϊκός', away_score: 3, competition: 'Φιλικά Συλλόγων', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-07-11T21:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 3, away_team_name: 'Γκρασχόπερς', away_score: 0, competition: 'Φιλικά Συλλόγων', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-07-15T19:00:00+03:00', home_team_name: 'Ραπίντ Βιέννης', home_score: 4, away_team_name: 'Παναθηναϊκός', away_score: 1, competition: 'Φιλικά Συλλόγων', is_current: false },

    // SECTION 2: ΠΟΔΟΣΦΑΙΡΟ - Conference League & Stoiximan Super League
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-07-23T21:00:00+03:00', home_team_name: 'Πάκσι', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Conference League', is_current: true },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-07-30T21:30:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Πάκσι', away_score: null, competition: 'Conference League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-08-22T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Κηφισιά', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-08-29T18:00:00+03:00', home_team_name: 'Λεβαδειακός', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-09-05T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'ΠΑΟΚ', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-09-12T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Παναιτωλικός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-09-19T18:00:00+03:00', home_team_name: 'Καλαμάτα', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-10-10T18:00:00+03:00', home_team_name: 'Ολυμπιακός', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-10-17T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Αστέρας Τρίπολης', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-10-24T18:00:00+03:00', home_team_name: 'Βόλος', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-10-31T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'ΑΕΚ', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-11-07T18:00:00+03:00', home_team_name: 'Ηρακλής', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-11-21T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'ΟΦΗ', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-11-28T18:00:00+03:00', home_team_name: 'Ατρόμητος', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-12-05T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Άρης', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-12-12T18:00:00+03:00', home_team_name: 'ΠΑΟΚ', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2026-12-19T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Ηρακλής', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-01-09T18:00:00+03:00', home_team_name: 'Αστέρας Τρίπολης', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-01-16T18:00:00+03:00', home_team_name: 'ΟΦΗ', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-01-23T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Ατρόμητος', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-01-30T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Ολυμπιακός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-02-06T18:00:00+03:00', home_team_name: 'Άρης', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-02-13T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Καλαμάτα', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-02-20T18:00:00+03:00', home_team_name: 'Παναιτωλικός', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-02-27T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Βόλος', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-03-06T18:00:00+03:00', home_team_name: 'Κηφισιά', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-03-13T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: null, away_team_name: 'Λεβαδειακός', away_score: null, competition: 'Super League', is_current: false },
    { category: 'football', sport_name: 'Ποδόσφαιρο', match_date: '2027-03-20T18:00:00+03:00', home_team_name: 'ΑΕΚ', home_score: null, away_team_name: 'Παναθηναϊκός', away_score: null, competition: 'Super League', is_current: false },

    // SECTION 3: ΜΠΑΣΚΕΤ ΑΝΔΡΩΝ - Stoiximan GBL Πλέι Οφ
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-05-15T19:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 99, away_team_name: 'Μύκονος', away_score: 75, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-05-17T15:15:00+03:00', home_team_name: 'Μύκονος', home_score: 76, away_team_name: 'Παναθηναϊκός', away_score: 90, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-05-28T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 114, away_team_name: 'ΠΑΟΚ', away_score: 102, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-05-30T14:50:00+03:00', home_team_name: 'ΠΑΟΚ', home_score: 94, away_team_name: 'Παναθηναϊκός', away_score: 102, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-06-03T21:00:00+03:00', home_team_name: 'Ολυμπιακός', home_score: 82, away_team_name: 'Παναθηναϊκός', away_score: 76, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-06-05T21:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 68, away_team_name: 'Ολυμπιακός', away_score: 58, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-06-08T21:00:00+03:00', home_team_name: 'Ολυμπιακός', home_score: 102, away_team_name: 'Παναθηναϊκός', away_score: 92, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-06-10T21:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 93, away_team_name: 'Ολυμπιακός', away_score: 86, competition: 'Stoiximan Basket League', is_current: false },
    { category: 'basketball', sport_name: 'Μπάσκετ', match_date: '2026-06-13T18:00:00+03:00', home_team_name: 'Ολυμπιακός', home_score: 89, away_team_name: 'Παναθηναϊκός', away_score: 85, competition: 'Stoiximan Basket League', is_current: false },

    // SECTION 4: ΕΡΑΣΙΤΕΧΝΗΣ - Μπάσκετ Γυναικών (A1)
    { category: 'amateur', sport_name: 'Μπάσκετ Γυναικών', match_date: '2026-04-15T20:30:00+03:00', home_team_name: 'Αθηναϊκός Γ', home_score: 44, away_team_name: 'Παναθηναϊκός Γ', away_score: 36, competition: 'Α1 Γυναικών', is_current: false },

    // SECTION 5: ΕΡΑΣΙΤΕΧΝΗΣ - Βόλεϊ Ανδρών (Volley League)
    { category: 'amateur', sport_name: 'Βόλεϊ Ανδρών', match_date: '2026-03-28T20:30:00+03:00', home_team_name: 'Ολυμπιακός', home_score: 2, away_team_name: 'Παναθηναϊκός', away_score: 3, competition: 'Volley League', is_current: false },
    { category: 'amateur', sport_name: 'Βόλεϊ Ανδρών', match_date: '2026-04-02T18:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 3, away_team_name: 'Ολυμπιακός', away_score: 0, competition: 'Volley League', is_current: false },
    { category: 'amateur', sport_name: 'Βόλεϊ Ανδρών', match_date: '2026-04-18T20:30:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 3, away_team_name: 'ΠΑΟΚ', away_score: 1, competition: 'Volley League', is_current: false },
    { category: 'amateur', sport_name: 'Βόλεϊ Ανδρών', match_date: '2026-04-26T18:30:00+03:00', home_team_name: 'ΠΑΟΚ', home_score: 3, away_team_name: 'Παναθηναϊκός', away_score: 0, competition: 'Volley League', is_current: false },
    { category: 'amateur', sport_name: 'Βόλεϊ Ανδρών', match_date: '2026-05-04T19:00:00+03:00', home_team_name: 'Παναθηναϊκός', home_score: 3, away_team_name: 'ΠΑΟΚ', away_score: 2, competition: 'Volley League', is_current: false },
    { category: 'amateur', sport_name: 'Βόλεϊ Ανδρών', match_date: '2026-05-09T17:30:00+03:00', home_team_name: 'ΠΑOK', home_score: 1, away_team_name: 'Παναθηναϊκός', away_score: 3, competition: 'Volley League', is_current: false }
];

async function populateFixtures() {
    console.log('1. Clearing old test fixtures...');
    const { error: deleteErr } = await supabase
        .from('fixtures')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteErr) {
        console.error('Error clearing fixtures table:', deleteErr);
        return;
    }
    console.log('✅ Cleared old fixtures data.');

    console.log(`2. Inserting ${fixturesData.length} new fixture records...`);
    const { data: inserted, error: insertErr } = await supabase
        .from('fixtures')
        .insert(fixturesData)
        .select('id');

    if (insertErr) {
        console.error('Error inserting fixtures:', insertErr);
    } else {
        console.log(`✅ Successfully inserted ${inserted.length} fixtures records!`);
    }
}

populateFixtures();
