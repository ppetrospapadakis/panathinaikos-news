/**
 * Instagram Auto-Poster & News Card Generator for PanathinaikosNews.gr
 * Generates branded 1080x1350 News Cards (0 AI cost) and publishes to Instagram Feed.
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  MASTER TOGGLE — change false → true to re-enable       ║
 * ╚══════════════════════════════════════════════════════════╝
 */
const INSTAGRAM_AUTOPOST_ENABLED = false;

const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

/// ── Text Wrapping Helper for SVG Headlines ──────────────────────────────────
function wrapText(text, maxCharsPerLine = 24) {
    const words = (text || '').split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines; // Return all lines to ensure titles are complete sentences
}

// ── XML/SVG Text Escaper ───────────────────────────────────────────────────
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ── Create 1080x1350 News Card JPEG Buffer ──────────────────────────────────
async function createNewsCardBuffer(title, sourceImageUrl) {
    const width = 1080;
    const height = 1350;

    // 1. Fetch source image or generate fallback dark background
    let bgBuffer;
    try {
        if (sourceImageUrl && sourceImageUrl.startsWith('http')) {
            const response = await axios.get(sourceImageUrl, { responseType: 'arraybuffer', timeout: 5000 });
            bgBuffer = Buffer.from(response.data);
        }
    } catch (e) {
        console.warn('[Instagram] Could not fetch source image for background, using fallback background:', e.message);
    }

    if (!bgBuffer) {
        // Create solid dark green canvas as fallback
        bgBuffer = await sharp({
            create: {
                width: width,
                height: height,
                channels: 3,
                background: { r: 16, g: 30, b: 22 }
            }
        }).png().toBuffer();
    }

    // 2. Process background: Resize to 1080x1350, crop, and apply heavy blur
    const processedBg = await sharp(bgBuffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .blur(18)
        .toBuffer();

    // 3. Prepare Logo Overlay
    let logoBase64 = '';
    try {
        const logoPath = path.join(__dirname, '..', 'logo.png');
        if (fs.existsSync(logoPath)) {
            const logoData = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        }
    } catch (err) {
        console.warn('[Instagram] Logo file not found:', err.message);
    }

    // 4. Dynamic Typography & Wrap Title Text (Zero truncation - full complete title)
    let maxCharsPerLine = 24;
    let fontSize = 64;
    let lineHeight = 84;

    const titleLen = (title || '').length;
    if (titleLen > 110) {
        fontSize = 44;
        lineHeight = 58;
        maxCharsPerLine = 34;
    } else if (titleLen > 70) {
        fontSize = 52;
        lineHeight = 70;
        maxCharsPerLine = 28;
    }

    const lines = wrapText(title, maxCharsPerLine);
    const escapedLines = lines.map(l => escapeXml(l));

    // Calculate vertical position for text (centered nicely)
    const totalTextHeight = lines.length * lineHeight;
    const startY = Math.max(420, 720 - Math.floor(totalTextHeight / 2));

    const titleSvgSpans = escapedLines.map((line, idx) => {
        const yPos = startY + (idx * lineHeight);
        return `<tspan x="90" y="${yPos}">${line}</tspan>`;
    }).join('\n');

    // 5. Generate SVG Overlay (Gradient, Branding, Title & Footer)
    const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <!-- Heavy Dark Moody Green Gradient -->
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0a120c" stop-opacity="0.85"/>
                <stop offset="35%" stop-color="#0d1810" stop-opacity="0.75"/>
                <stop offset="70%" stop-color="#070c08" stop-opacity="0.92"/>
                <stop offset="100%" stop-color="#040805" stop-opacity="0.98"/>
            </linearGradient>

            <!-- Card Border Glow -->
            <linearGradient id="primaryGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#10b981"/>
                <stop offset="50%" stop-color="#059669"/>
                <stop offset="100%" stop-color="#047857"/>
            </linearGradient>

            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8"/>
            </filter>
        </defs>

        <!-- Gradient Dark Overlay -->
        <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>

        <!-- Top Decorative Bar -->
        <rect x="0" y="0" width="${width}" height="10" fill="url(#primaryGlow)"/>

        <!-- Top Left Official Logo (Enlarged further) -->
        <g transform="translate(80, 80)">
            ${logoBase64 ? `<image href="${logoBase64}" x="0" y="0" width="560" height="118"/>` : `
            <text x="0" y="60" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="48" fill="#ffffff" letter-spacing="2">
                PANATHINAIKOS<tspan fill="#10b981">NEWS</tspan>
            </text>
            `}
        </g>

        <!-- Center Article Headline -->
        <g filter="url(#shadow)">
            <!-- Category Tag line -->
            <text x="90" y="${startY - 45}" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="24" fill="#10b981" letter-spacing="3">
                ΠΑΝΑΘΗΝΑΪΚΟΣ NEWS
            </text>

            <text font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="${fontSize}" fill="#ffffff" letter-spacing="-1.5">
                ${titleSvgSpans}
            </text>
        </g>

        <!-- Footer Accent Line & Domain -->
        <g transform="translate(90, 1220)">
            <rect x="0" y="0" width="80" height="4" fill="#10b981" rx="2"/>
            <text x="100" y="6" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="22" fill="#a1a1aa" letter-spacing="2">
                PANATHINAIKOSNEWS.GR
            </text>
        </g>
    </svg>
    `;

    // 6. Composite SVG overlay onto background image
    const finalBuffer = await sharp(processedBg)
        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
        .jpeg({ quality: 92 })
        .toBuffer();

    return finalBuffer;
}

// ── Publish to Instagram Feed & Post 1st Comment ─────────────────────────────
async function publishToInstagram(article) {
    // Master toggle is defined at the top of this file (INSTAGRAM_AUTOPOST_ENABLED)
    if (!INSTAGRAM_AUTOPOST_ENABLED) {
        console.log('[Instagram] Auto-posting is currently PAUSED (INSTAGRAM_AUTOPOST_ENABLED = false). Skipping.');
        return null;
    }

    const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!igUserId || !accessToken) {
        console.log('[Instagram] INSTAGRAM_BUSINESS_ACCOUNT_ID or FACEBOOK_ACCESS_TOKEN not set in environment. Skipping auto-post.');
        return null;
    }

    // Filter: Do NOT post Amateur (Ερασιτέχνης) or Official sources/categories to Instagram!
    const cat = (article.category || '').toLowerCase();
    const src = (article.source || '').toLowerCase();
    const isAmateur = cat.includes('ερασιτέχνης') || cat.includes('erasitexnis') || cat.includes('amateur') || src.includes('1908');
    const isOfficial = article.is_official === true || cat.includes('official') || src.includes('official') || src.includes('επίσημ');

    if (isAmateur || isOfficial) {
        console.log(`[Instagram] Skipping auto-post: Article is Amateur/Official (${cat || src}) — "${article.title}"`);
        return null;
    }

    // Deduplication Guard: Check if article was already posted to Instagram
    if (supabaseUrl && supabaseKey && article.id) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data: dbArt } = await supabase.from('articles').select('instagram_posted').eq('id', article.id).single();
            if (dbArt && dbArt.instagram_posted) {
                console.log(`[Instagram] Article id=${article.id} already posted to Instagram. Skipping.`);
                return null;
            }
        } catch (_) {}
    }

    try {
        console.log(`[Instagram] Generating News Card for: "${article.title}"...`);
        const cardBuffer = await createNewsCardBuffer(article.title, article.image_url || article.image);

        // 1. Upload card buffer to Supabase Storage bucket 'instagram-cards'
        let imageUrl = null;
        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const fileName = `card_${article.id || Date.now()}.jpg`;
            const { data, error } = await supabase.storage
                .from('instagram-cards')
                .upload(fileName, cardBuffer, { contentType: 'image/jpeg', upsert: true });

            if (!error && data) {
                const { data: publicUrlData } = supabase.storage.from('instagram-cards').getPublicUrl(fileName);
                imageUrl = publicUrlData?.publicUrl;
            } else {
                console.warn('[Instagram] Storage upload warning:', error?.message);
            }
        }

        if (!imageUrl) {
            console.error('[Instagram] Could not obtain public image URL for Meta API. Ensure "instagram-cards" storage bucket is public.');
            return null;
        }

        // 2. Prepare Caption & Post Container (Includes Full AI Summary + Direct Article Link)
        const articleLink = article.url ? (article.url.startsWith('http') ? article.url : `https://www.panathinaikosnews.gr${article.url}`) : 'https://www.panathinaikosnews.gr';

        // Format summary nicely with word boundary truncation & 3 dots
        let fullSummary = article.summary ? article.summary.trim() : '';
        if (fullSummary.length > 350) {
            const truncated = fullSummary.substring(0, 350);
            const lastSpace = truncated.lastIndexOf(' ');
            fullSummary = (lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated) + '...';
        } else if (fullSummary && !/[.!?…]$/.test(fullSummary)) {
            fullSummary += '...';
        }

        // Determine category hashtags
        const catLower = (article.category || '').toLowerCase();
        let sportTags = '#PAOFC #PAOBC';
        if (catLower.includes('ποδόσφαιρο') || catLower.includes('football')) sportTags = '#PAOFC';
        else if (catLower.includes('μπάσκετ') || catLower.includes('basket')) sportTags = '#PAOBC';

        const caption = `☘️ ${article.title}\n\n${fullSummary}\n\n🔗 Διαβάστε το πλήρες άρθρο: ${articleLink}\n\n#Panathinaikos #PAO #PanathinaikosNews ${sportTags}`;

        console.log(`[Instagram] Creating container on Meta Graph API...`);
        const containerRes = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, null, {
            params: {
                image_url: imageUrl,
                caption: caption,
                access_token: accessToken
            }
        });

        const containerId = containerRes.data?.id;
        if (!containerId) throw new Error('Failed to get container ID from Meta API');

        // Wait 3 seconds for Meta to process image
        await new Promise(res => setTimeout(res, 3000));

        // 3. Publish Container
        console.log(`[Instagram] Publishing post ID: ${containerId}...`);
        const publishRes = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, null, {
            params: {
                creation_id: containerId,
                access_token: accessToken
            }
        });

        const mediaId = publishRes.data?.id;
        console.log(`[Instagram] Successfully published post! Media ID: ${mediaId}`);

        // 4. Post 1st Comment with Article Link (optional)
        if (mediaId && article.url) {
            try {
                console.log(`[Instagram] Posting 1st comment with link...`);
                const articleLink = article.url.startsWith('http') ? article.url : `https://www.panathinaikosnews.gr${article.url}`;
                await axios.post(`https://graph.facebook.com/v19.0/${mediaId}/comments`, null, {
                    params: {
                        message: `🔗 Διαβάστε το πλήρες άρθρο εδώ: ${articleLink}`,
                        access_token: accessToken
                    }
                });
                console.log(`[Instagram] 1st comment posted successfully!`);
            } catch (commentErr) {
                console.warn(`[Instagram] 1st comment warning (post published successfully):`, commentErr.response?.data?.error?.message || commentErr.message);
            }
        }

        // Mark article as published to Instagram in DB
        if (mediaId && supabaseUrl && supabaseKey && article.id) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                await supabase.from('articles').update({ instagram_posted: true }).eq('id', article.id);
            } catch (_) {}
        }

        return mediaId;
    } catch (error) {
        console.error('[Instagram] Auto-posting failed:', error.response?.data || error.message);
        return null;
    }
}

module.exports = {
    createNewsCardBuffer,
    publishToInstagram
};
