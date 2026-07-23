const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllGoogleImages() {
    console.log('Searching for articles with googleusercontent image URLs...');
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, source_url, image_url')
        .ilike('image_url', '%googleusercontent.com%');

    if (error) {
        console.error('Error fetching articles:', error);
        return;
    }

    console.log(`Found ${articles.length} articles with googleusercontent image URLs.`);

    for (const art of articles) {
        console.log(`- Fixing article ${art.id}: "${art.title.substring(0, 40)}..."`);
        let newImg = '/logo.png';
        if (art.source_url) {
            try {
                // Try fetching original og:image from source
                const res = await fetch(art.source_url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (res.ok) {
                    const html = await res.text();
                    const cheerio = require('cheerio');
                    const $ = cheerio.load(html);
                    const ogImg = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
                    if (ogImg && ogImg.startsWith('http') && !ogImg.includes('logo')) {
                        newImg = ogImg;
                        console.log(`  └ Found real og:image: ${newImg.substring(0, 60)}...`);
                    }
                }
            } catch(e) {}
        }

        await supabase.from('articles').update({ image_url: newImg }).eq('id', art.id);
    }

    console.log('✅ Finished fixing all googleusercontent images in Supabase!');
}

fixAllGoogleImages();
