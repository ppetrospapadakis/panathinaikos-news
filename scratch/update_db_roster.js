const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";
const db = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await db.from('articles')
        .select('*')
        .eq('source_url', 'opinion://system-roster-football')
        .maybeSingle();

    if (error) {
        console.error('Fetch error:', error);
        return;
    }
    if (!data) {
        console.log('No football roster found in DB.');
        return;
    }

    const bullets = data.bullets || [];
    if (bullets.length >= 2) {
        console.log('Original bench:', bullets[1]);
        // Update bench to 4-3-3 coordinates
        const newBench = [
            [50, 88, 'ΒΡΑ', 'Βρατσάνος', 23, 'GK'],
            [15, 68, 'ΓΙΕ', 'Γιεντβάι', 14, 'RB'],
            [38, 70, 'ΑΝΔ', 'Ανδρέ', 16, 'CB'],
            [62, 70, 'ΛΩΡ', 'Λόρδος', 22, 'CB'],
            [85, 68, 'ΚΟΡ', 'Κόρμπο', 3, 'LB'],
            [25, 48, 'ΤΖΑ', 'Τζαβέλας', 18, 'CM'],
            [50, 44, 'ΧΑΡ', 'Χαρίσης', 19, 'CM'],
            [75, 48, 'ΜΠΑ', 'Μπαλόγκ', 17, 'CM'],
            [18, 22, 'ΠΑΛ', 'Παλμέρι', 15, 'RW'],
            [50, 18, 'ΟΑΔ', 'Οάδες', 20, 'ST'],
            [82, 22, 'ΙΝΓ', 'Ίνγκασον', 21, 'LW']
        ];
        bullets[1] = JSON.stringify(newBench);
        
        const { error: updateError } = await db.from('articles')
            .update({ bullets })
            .eq('id', data.id);

        if (updateError) {
            console.error('Update error:', updateError);
        } else {
            console.log('Successfully updated DB roster to 4-3-3!');
        }
    }
}

run();
