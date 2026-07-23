const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
    const rawUrl = process.env.SUPABASE_URL || 'https://jyswqzohfczswmhmqfjk.supabase.co';
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!rawKey) {
        console.error('No SUPABASE_SERVICE_ROLE_KEY provided in env.');
        return;
    }
    const db = createClient(rawUrl, rawKey);
    const { data, error } = await db.from('articles').delete().eq('id', '8eeba85c-b6b4-4c61-a56d-3f2930aad51f');
    if (error) {
        console.error('Error deleting article:', error);
    } else {
        console.log('Successfully deleted article 8eeba85c-b6b4-4c61-a56d-3f2930aad51f');
    }
}
run();
