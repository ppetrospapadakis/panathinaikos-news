const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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

function percentEncode(str) {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateOAuthHeader(method, url, oauthParams, consumerSecret, tokenSecret) {
    const sortedKeys = Object.keys(oauthParams).sort();
    const parameterParts = [];
    for (const key of sortedKeys) {
        parameterParts.push(`${percentEncode(key)}=${percentEncode(oauthParams[key])}`);
    }
    const parameterString = parameterParts.join('&');

    const signatureBaseString = [
        method.toUpperCase(),
        percentEncode(url),
        percentEncode(parameterString)
    ].join('&');

    const signingKey = [
        percentEncode(consumerSecret),
        percentEncode(tokenSecret)
    ].join('&');

    const signature = crypto
        .createHmac('sha1', signingKey)
        .update(signatureBaseString)
        .digest('base64');

    const headerParams = { ...oauthParams, oauth_signature: signature };
    const headerParts = [];
    for (const key of Object.keys(headerParams).sort()) {
        headerParts.push(`${percentEncode(key)}="${percentEncode(headerParams[key])}"`);
    }

    return 'OAuth ' + headerParts.join(', ');
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const secret = req.query.secret || (req.body && req.body.secret);
    const expectedSecret = process.env.SYS_SECRET || 'pao_social_sync_secret_123';
    
    if (secret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized. Invalid secret key.' });
    }

    try {
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
        
        const emoji = getCategoryEmoji(article.category);
        let displayTitle = article.title;
        if (displayTitle.length > 230) {
            displayTitle = displayTitle.substring(0, 227) + '...';
        }
        
        const tweetText = `${emoji} ${displayTitle}\n\n👉 ${url}`;

        // Send to Twitter API v2 directly using OAuth 1.0a
        const twitterEndpoint = 'https://api.twitter.com/2/tweets';
        const consumerKey = process.env.TWITTER_CONSUMER_KEY;
        const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
        const accessToken = process.env.TWITTER_ACCESS_TOKEN;
        const accessSecret = process.env.TWITTER_ACCESS_SECRET;

        if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
            throw new Error('Missing Twitter API OAuth 1.0a environment variables.');
        }

        const oauthParams = {
            oauth_consumer_key: consumerKey,
            oauth_nonce: crypto.randomBytes(16).toString('hex'),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_token: accessToken,
            oauth_version: '1.0'
        };

        const authHeader = generateOAuthHeader('POST', twitterEndpoint, oauthParams, consumerSecret, accessSecret);

        const twitterRes = await fetch(twitterEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: tweetText })
        });

        const resData = await twitterRes.json().catch(() => ({}));

        if (!twitterRes.ok) {
            throw new Error(`Twitter API error (${twitterRes.status}): ${JSON.stringify(resData)}`);
        }

        console.log(`[Twitter Sync] Successfully posted tweet. Twitter response:`, JSON.stringify(resData));

        // Mark as posted in the database
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
            },
            twitter_response: resData
        });

    } catch (err) {
        console.error('[Twitter Sync Exception]:', err);
        return res.status(500).json({ error: err.message });
    }
};
