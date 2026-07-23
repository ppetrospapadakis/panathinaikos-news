const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectArticle() {
    const id = "b1ff9e4e-223f-4201-a289-eae5871b4b44";
    console.log('Inspecting article ID:', id);
    const { data: art, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching article:', error);
        return;
    }

    console.log('Article Title:', art.title);
    console.log('Category:', art.category);
    console.log('Source URL:', art.source_url);
    console.log('Stored Image URL:', art.image_url);
}

inspectArticle();
