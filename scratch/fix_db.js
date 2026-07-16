require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
    // 1. Fix the date of the Grasshopper article
    const titleMatch = 'Το απόλυτο του Παναθηναϊκού: Νίκη με 3-0 επί της Γκρασχόπερ και το 3 στα 3 στα φιλικά';
    
    console.log('Searching for future dated article...');
    const { data: futureArt, error: fetchErr } = await supabase
        .from('articles')
        .select('id, title, created_at')
        .eq('title', titleMatch);

    if (fetchErr) {
        console.error('Error fetching article:', fetchErr);
    } else if (futureArt && futureArt.length > 0) {
        console.log('Found article:', futureArt[0]);
        // Update to 11th July 2026, e.g., 2026-07-11T12:00:00Z
        const { error: updateErr } = await supabase
            .from('articles')
            .update({ created_at: '2026-07-11T20:58:00Z' }) // November was 7/11, changing to July 11/7
            .eq('id', futureArt[0].id);
        
        if (updateErr) {
            console.error('Error updating article:', updateErr);
        } else {
            console.log('Successfully updated article date to 2026-07-11T20:58:00Z');
        }
    } else {
        console.log('Could not find the Grasshopper article by exact title.');
        // Let's do a loose match
        const { data: looseArt } = await supabase.from('articles').select('id, title, created_at').ilike('title', '%Γκρασχόπερ%').order('created_at', {ascending: false});
        if (looseArt && looseArt.length > 0) {
             console.log('Found similar article:', looseArt[0]);
             await supabase.from('articles').update({ created_at: '2026-07-11T20:58:00Z' }).eq('id', looseArt[0].id);
             console.log('Updated similar article date');
        }
    }

    // 2. Check the image URL for the specific opinion article
    console.log('\nFetching Opinion Article ID: 4a14291e-7161-4a9c-a693-d55837b0f446');
    const { data: opArt, error: opErr } = await supabase
        .from('articles')
        .select('*')
        .eq('id', '4a14291e-7161-4a9c-a693-d55837b0f446')
        .single();

    if (opErr) {
        console.error('Error fetching opinion article:', opErr);
    } else {
        console.log('Opinion Article Data:');
        console.log('Title:', opArt.title);
        console.log('Image URL:', opArt.image_url);
    }
}

main();
