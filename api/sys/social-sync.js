const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
    return (text || '').toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0370-\u03FF\u1F00-\u1FFF-]+/g, '') // preserve Greek characters
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function getCategoryCleanName(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('ποδόσφαιρο') || cat.includes('football')) return 'podosfairo';
    if (cat.includes('μπάσκετ') || cat.includes('basketball')) return 'basket';
    if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) return 'erasitexnis';
    if (cat.includes('άποψη') || cat.includes('opinion')) return 'apopsi';
    if (cat.includes('μεταγραφές') || cat.includes('transfers')) return 'metagrafes';
    return 'pao';
}

function getCategoryEmoji(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('ποδόσφαιρο') || cat.includes('football')) return '⚽';
    if (cat.includes('μπάσκετ') || cat.includes('basketball')) return '🏀';
    if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) return '☘️';
    if (cat.includes('άποψη') || cat.includes('opinion')) return '✍️';
    if (cat.includes('μεταγραφές') || cat.includes('transfers')) return '🔄';
    return '🟢';
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 1. Authorization Check (using SYS_SECRET env or fallback)
    const secret = req.query.secret || (req.body && req.body.secret);
    const expectedSecret = process.env.SYS_SECRET || 'pao_social_sync_secret_123';
    
    if (secret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized. Invalid secret key.' });
    }

    try {
        // 2. Fetch the OLDEST unposted article to post in chronological order
        const { data: articles, error: fetchErr } = await supabase
            .from('articles')
            .select('id, title, category, created_at')
            .eq('twitter_posted', false)
            .not('category', 'eq', 'SystemRoster')
            .not('category', 'eq', 'SYSTEMROSTER')
            .order('created_at', { ascending: true })
            .limit(1);

        if (fetchErr) throw fetchErr;

        if (!articles || articles.length === 0) {
            return res.status(200).json({ success: true, posted: false, message: 'No new articles to post.' });
        }

        const article = articles[0];
        const cleanCat = getCategoryCleanName(article.category);
        const cleanSlug = slugify(article.title);
        const domain = 'https://www.panathinaikosnews.gr';
        const url = `${domain}/${cleanCat}/${cleanSlug}-id=${article.id}`;
        
        // 3. Format Tweet Text (Max 280 chars, URL counts as 23)
        const emoji = getCategoryEmoji(article.category);
        
        // Truncate title if too long (280 - 23 (link) - 10 (spacing/emoji) = 247)
        let displayTitle = article.title;
        if (displayTitle.length > 230) {
            displayTitle = displayTitle.substring(0, 227) + '...';
        }
        
        const tweetText = `${emoji} ${displayTitle}\n\n👉 ${url}`;

        const payload = {
            id: article.id,
            title: article.title,
            category: article.category,
            url: url,
            tweet_text: tweetText
        };

        const webhookUrl = process.env.SOCIAL_WEBHOOK_URL;

        if (webhookUrl) {
            console.log(`[Social Sync] Sending payload to webhook:`, JSON.stringify(payload));
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Webhook responded with status ${response.status}: ${text}`);
            }
            console.log(`[Social Sync] Webhook responded with status: ${response.status}`);
        } else {
            console.warn(`[Social Sync] SOCIAL_WEBHOOK_URL env variable is not set. Simulating webhook success.`);
        }

        // 4. Mark as posted in the database
        const { error: updateErr } = await supabase
            .from('articles')
            .update({ twitter_posted: true })
            .eq('id', article.id);

        if (updateErr) throw updateErr;

        return res.status(200).json({
            success: true,
            posted: true,
            article: {
                id: article.id,
                title: article.title,
                url: url
            }
        });

    } catch (err) {
        console.error('[Social Sync Exception]:', err);
        return res.status(500).json({ error: err.message });
    }
};
