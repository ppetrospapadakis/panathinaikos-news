require('dotenv').config();

async function run() {
    const url = process.env.SUPABASE_URL + '/rest/v1/articles?id=eq.612f74fc-8891-4bac-8465-d749e497f080';
    const key = process.env.SUPABASE_KEY;
    
    const newContent = "Ο Παναθηναϊκός αντιμετωπίζει εκτός έδρας την Πάκσι την Πέμπτη 23 Ιουλίου στις 20:00 (τοπική ώρα) για τον 2ο προκριματικό του UEFA Conference League. Στο πλαίσιο αυτό την Τετάρτη 22 Ιουλίου θα ακολουθηθεί το εξής πρόγραμμα:\n\n• Προπόνηση του Παναθηναϊκού στο «Γ. Καλαφάτης» στις 10:30.\n• Συνέντευξη Τύπου του Παναθηναϊκού στο Paksi FC Stadion στις 18:00 (τοπική ώρα). Θα μιλήσουν ο προπονητής της ομάδας μας, Τζέικομπ Νίστρουπ και ένας ποδοσφαιριστής μας.\n• Συνέντευξη Τύπου της Πάκσι στο Paksi FC Stadion στις 09:00 (τοπική ώρα). Θα μιλήσουν ο προπονητής της, György Bognár και ένας ποδοσφαιριστής της Πάκσι.\n• Προπόνηση της Πάκσι στο Paksi FC Stadion στις 10:00 (τοπική ώρα).";

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ content: newContent })
        });
        
        if (response.ok) {
            console.log('Successfully updated article content via REST API');
        } else {
            console.log('Failed to update via REST API:', await response.text());
        }
    } catch(e) {
        console.error(e);
    }
}
run();
