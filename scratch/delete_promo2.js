require('dotenv').config();

async function run() {
    const url = process.env.SUPABASE_URL + '/rest/v1/articles?id=eq.fcd4daf2-fd27-4918-bf6f-4af2269d5dac';
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
