const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAndRunSportimeFirstRun() {
    console.log('--- Testing Sportime First Run Logic Fix ---');
    const links = [
        'https://sportime.gr/panathinaikos/panathinaikos-h-prwti-paghida-toy-nistroyp-kryvei-kai-mia-meghali-efkairia',
        'https://sportime.gr/panathinaikos/panathinaikos-o-pelistri-paizei-twra-ghia-thesi-aksia-kai-ekatommyria',
        'https://sportime.gr/panathinaikos/panathinaikos-h-paksi-tha-dokimasei-oti-iparkhei-piso-apo-to-pressing'
    ];

    // For test, insert older link 1 & 2 as ignored using valid UUID
    for (let i = 1; i < links.length; i++) {
        const url = links[i];
        const validUuid = crypto.randomUUID();
        console.log(`Inserting ignored URL (${i}):`, url);
        const { data, error } = await supabase.from('articles').insert({
            id: validUuid,
            title: '[IGNORED_OLDER]',
            summary: '[IGNORED_OLDER]',
            content: '[IGNORED_OLDER]',
            source_url: url,
            category: 'SystemRoster',
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error('Error inserting:', error);
        } else {
            console.log('✅ Successfully inserted ignored URL!');
        }
    }
}

fixAndRunSportimeFirstRun();
