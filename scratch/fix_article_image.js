const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixArticle() {
    const id = "b1ff9e4e-223f-4201-a289-eae5871b4b44";
    const realImageUrl = "https://resources.sport-fm.gr/supersportFM/images/news/26/07/22/5263301_110040.jpg?w=880&f=bicubic";

    console.log(`Updating article ${id} image_url to: ${realImageUrl}`);
    const { data, error } = await supabase
        .from('articles')
        .update({ image_url: realImageUrl })
        .eq('id', id);

    if (error) {
        console.error('Error updating article image:', error);
    } else {
        console.log('✅ Successfully updated article image in Supabase!');
    }
}

fixArticle();
