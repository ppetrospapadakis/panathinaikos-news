const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSportimeDb() {
    console.log('Querying Supabase for Sportime articles...');
    
    // Find all Sportime URLs
    const { data: sportimeArticles, error } = await supabase
        .from('articles')
        .select('id, title, category, source_url, created_at')
        .ilike('source_url', '%sportime.gr%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Database query error:', error);
        return;
    }

    console.log(`Found ${sportimeArticles.length} Sportime entries in DB:`);
    sportimeArticles.forEach((a, i) => {
        console.log(`[${i + 1}] ID: ${a.id} | Title: "${a.title}" | Cat: ${a.category} | Created: ${a.created_at} | URL: ${a.source_url}`);
    });
}

checkSportimeDb();
