require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function updateArticle() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    
    if (!url || !key) {
        console.error('Missing Supabase credentials in env.');
        return;
    }

    const supabase = createClient(url, key);
    
    const { data, error } = await supabase
        .from('articles')
        .select('id, title')
        .ilike('title', '%Στη λίστα ο Κοτσόλης%');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No articles found matching the criteria.');
        return;
    }

    console.log(`Found ${data.length} article(s). Updating...`);

    for (const article of data) {
        const newTitle = article.title.replace('Στη λίστα ο Κοτσόλης', 'εξετάζει τη λίστα ο Κοτσόλης');
        const { error: updateError } = await supabase
            .from('articles')
            .update({ title: newTitle })
            .eq('id', article.id);
            
        if (updateError) {
            console.error(`Failed to update article ${article.id}:`, updateError);
        } else {
            console.log(`Successfully updated article ${article.id}`);
            console.log(`Old title: ${article.title}`);
            console.log(`New title: ${newTitle}`);
        }
    }
}

updateArticle();
