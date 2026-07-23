const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing insert into articles...');
    const dummyId = `ignored_${Date.now()}`;
    const { data, error } = await supabase.from('articles').insert({
        id: dummyId,
        title: '[IGNORED_TEST]',
        summary: '[IGNORED_TEST]',
        content: '[IGNORED_TEST]',
        source_url: `https://sportime.gr/test-${Date.now()}`,
        category: 'SystemRoster',
        created_at: new Date().toISOString()
    });

    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Insert success!');
        // Clean up
        await supabase.from('articles').delete().eq('id', dummyId);
    }
}

testInsert();
