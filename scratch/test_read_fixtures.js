const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRead() {
    console.log('Testing Supabase client fetch for fixtures...');
    const { data: matches, error } = await supabase
        .from('fixtures')
        .select('*')
        .order('match_date', { ascending: true });

    if (error) {
        console.error('Error fetching fixtures:', error);
    } else {
        console.log(`✅ Successfully fetched ${matches.length} fixtures via Supabase Client!`);
        console.log('Sample match:', matches.find(m => m.is_current));
    }
}

testRead();
