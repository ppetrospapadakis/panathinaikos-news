require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
    const articleId = '4a14291e-7161-4a9c-a693-d55837b0f446';
    
    const { error: updateErr } = await supabase
        .from('articles')
        .update({ image_url: '/logo.png' })
        .eq('id', articleId);
    
    if (updateErr) {
        console.error('Error updating article image:', updateErr);
    } else {
        console.log('Successfully updated article image to /logo.png');
    }
}

main();
