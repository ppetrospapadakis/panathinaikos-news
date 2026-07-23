require('dotenv').config();

async function run() {
    const url = process.env.SUPABASE_URL + '/rest/v1/articles?id=eq.8eeba85c-b6b4-4c61-a56d-3f2930aad51f';
    const key = process.env.SUPABASE_KEY;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        if (response.ok) {
            console.log('Successfully deleted via REST API');
        } else {
            console.log('Failed to delete via REST API:', await response.text());
        }
    } catch(e) {
        console.error(e);
    }
}
run();
