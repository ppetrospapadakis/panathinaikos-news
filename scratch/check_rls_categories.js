const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCategory(categoryName) {
    const validUuid = crypto.randomUUID();
    const { data, error } = await supabase.from('articles').insert({
        id: validUuid,
        title: '[IGNORED_TEST]',
        summary: '[IGNORED_TEST]',
        content: '[IGNORED_TEST]',
        source_url: `https://sportime.gr/test-${Date.now()}-${categoryName}`,
        category: categoryName,
        created_at: new Date().toISOString()
    });

    if (error) {
        console.log(`Category "${categoryName}": FAIL ->`, error.message);
    } else {
        console.log(`Category "${categoryName}": SUCCESS!`);
        await supabase.from('articles').delete().eq('id', validUuid);
    }
}

async function run() {
    await testCategory('SystemRoster');
    await testCategory('Γενικά');
    await testCategory('Ποδόσφαιρο');
}

run();
