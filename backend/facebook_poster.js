/**
 * Facebook Auto-Poster for PanathinaikosNews.gr
 * Publishes news articles to the official Facebook Page via Meta Graph API.
 * Required because Meta Graph API does NOT auto-crosspost API-generated Instagram posts.
 */
const FACEBOOK_AUTOPOST_ENABLED = true;

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

/**
 * Publishes an article to the Facebook Page.
 * @param {Object} article - { id, title, summary, category, source, is_official, image_url, url }
 * @returns {Promise<string|null>} Facebook Post ID if successful, null otherwise.
 */
async function publishToFacebook(article) {
    if (!FACEBOOK_AUTOPOST_ENABLED) {
        console.log('[Facebook] Auto-post is disabled via MASTER TOGGLE.');
        return null;
    }

    if (!article || !article.title) {
        console.warn('[Facebook] Invalid article object provided.');
        return null;
    }

    const pageId = process.env.FACEBOOK_PAGE_ID || '1298518146670029';
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!pageId || !accessToken) {
        console.log('[Facebook] FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN / FACEBOOK_ACCESS_TOKEN not set in environment. Skipping auto-post.');
        return null;
    }

    // Filter: Do NOT post Amateur (Ερασιτέχνης) or Official sources/categories to Facebook
    const cat = (article.category || '').toLowerCase();
    const src = (article.source || '').toLowerCase();
    const isAmateur = cat.includes('ερασιτέχνης') || cat.includes('erasitexnis') || cat.includes('amateur') || src.includes('1908');
    const isOfficial = article.is_official === true || cat.includes('official') || src.includes('official') || src.includes('επίσημ');

    if (isAmateur || isOfficial) {
        console.log(`[Facebook] Skipping auto-post: Article is Amateur/Official (${cat || src}) — "${article.title}"`);
        return null;
    }

    // SAFETY GUARD 1: Rate Limiting — Ensure at least 2 hours have passed since the LAST Facebook post
    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data: lastPosted } = await supabase
                .from('articles')
                .select('updated_at, created_at')
                .eq('facebook_posted', true)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (lastPosted && lastPosted.length > 0) {
                const lastPostTime = new Date(lastPosted[0].updated_at || lastPosted[0].created_at).getTime();
                const hoursSinceLastPost = (Date.now() - lastPostTime) / (1000 * 60 * 60);
                if (hoursSinceLastPost < 2.0) {
                    console.log(`[Facebook Safety] Only ${hoursSinceLastPost.toFixed(1)}h passed since last post (min 2.0h required). Skipping to avoid Meta rate-limits.`);
                    return null;
                }
            }
        } catch (rateErr) {
            console.warn('[Facebook Safety Warning]: Could not verify rate limit:', rateErr.message);
        }
    }

    // SAFETY GUARD 2: Deduplication — Check if THIS article was already posted
    if (supabaseUrl && supabaseKey && article.id) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data: dbArt } = await supabase.from('articles').select('facebook_posted').eq('id', article.id).single();
            if (dbArt && dbArt.facebook_posted) {
                console.log(`[Facebook] Article id=${article.id} already posted to Facebook. Skipping.`);
                return null;
            }
        } catch (_) {}
    }

    try {
        console.log(`[Facebook] Preparing post for: "${article.title}"...`);

        const articleLink = article.url
            ? (article.url.startsWith('http') ? article.url : `https://www.panathinaikosnews.gr${article.url}`)
            : 'https://www.panathinaikosnews.gr';

        let fullSummary = article.summary ? article.summary.trim() : '';
        if (fullSummary.length > 400) {
            const truncated = fullSummary.substring(0, 400);
            const lastSpace = truncated.lastIndexOf(' ');
            fullSummary = (lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated) + '...';
        } else if (fullSummary && !/[.!?…]$/.test(fullSummary)) {
            fullSummary += '...';
        }

        const catLower = (article.category || '').toLowerCase();
        let sportTags = '#PAOFC #PAOBC';
        if (catLower.includes('ποδόσφαιρο') || catLower.includes('football')) sportTags = '#PAOFC';
        else if (catLower.includes('μπάσκετ') || catLower.includes('basket')) sportTags = '#PAOBC';

        const message = `☘️ ${article.title}\n\n${fullSummary}\n\n🔗 Διαβάστε το πλήρες άρθρο στο PanathinaikosNews.gr:\n${articleLink}\n\n#Panathinaikos #PAO #PanathinaikosNews ${sportTags}`;

        console.log(`[Facebook] Publishing post to Page ID ${pageId}...`);
        const postRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, null, {
            params: {
                message: message,
                link: articleLink,
                access_token: accessToken
            }
        });

        const postFbId = postRes.data?.id;
        console.log(`[Facebook] Successfully published post to Facebook Page! Post ID: ${postFbId}`);

        if (postFbId && supabaseUrl && supabaseKey && article.id) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                await supabase.from('articles').update({ facebook_posted: true }).eq('id', article.id);
            } catch (_) {}
        }

        return postFbId;
    } catch (error) {
        console.error('[Facebook] Auto-posting failed:', error.response?.data || error.message);
        return null;
    }
}

module.exports = {
    publishToFacebook
};
