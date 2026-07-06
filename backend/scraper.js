/**
 * Panathinaikos News - RSS Scraper Script
 * 
 * Dependencies: rss-parser, @supabase/supabase-js, dotenv
 * Execution: node backend/scraper.js [--dry-run]
 */

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const crypto = require('crypto');

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['enclosure', 'enclosure'],
            ['image', 'image']
        ]
    }
});

// Helper to split text into unique normalized words for Jaccard Similarity
function cleanTextToWords(text) {
    const greekStopwords = new Set([
        'και', 'το', 'του', 'της', 'στον', 'στην', 'από', 'με', 'για', 'στα', 'στις', 'στους', 'ο', 'η', 'οι', 'τα', 'ένα', 'μια', 'στο', 'σε', 'πως', 'ότι', 'που'
    ]);
    return new Set(
        (text || '')
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !greekStopwords.has(word))
    );
}

// Helper to calculate Jaccard similarity score (word overlap ratio) between two strings
function calculateJaccardSimilarity(textA, textB) {
    const wordsA = cleanTextToWords(textA);
    const wordsB = cleanTextToWords(textB);
    
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    
    let intersectionCount = 0;
    for (const word of wordsA) {
        if (wordsB.has(word)) {
            intersectionCount++;
        }
    }
    
    const unionSize = wordsA.size + wordsB.size - intersectionCount;
    return intersectionCount / unionSize;
}

// Heuristic fallback for generating 3 bullet summaries if Gemini API key is not configured or fails
function generateFallbackBullets(title, content) {
    const cleanContent = (content || '').replace(/<[^>]*>/g, ' ').trim();
    const sentences = cleanContent
        .split(/[.;!]+/g)
        .map(s => s.trim())
        .filter(s => s.length > 20 && !s.includes('http') && !s.includes('www'));
    
    const bullets = [];
    bullets.push(`Νέο ρεπορτάζ: ${title}`);
    
    for (const s of sentences) {
        if (bullets.length >= 3) break;
        if (!bullets.some(b => b.includes(s.substring(0, 15)))) {
            bullets.push(s);
        }
    }
    
    while (bullets.length < 3) {
        bullets.push('Συνεχής ενημέρωση για την εξέλιξη του θέματος.');
    }
    
    return bullets.slice(0, 3);
}

// Generate 3 concise bullet points using Gemini API, with automatic fallback
async function generateAiBullets(title, text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log(`[AI] GEMINI_API_KEY missing. Using heuristic fallback bullets.`);
        return generateFallbackBullets(title, text);
    }

    try {
        console.log(`[AI] Generating bullets using Gemini API...`);
        const cleanContent = (text || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\bσύμφωνα με (τ\w+|το|την|τον)\b/gi, '')
            .replace(/\b(γράφει|αναφέρει|επισημαίνει|αποκαλύπτει|μεταδίδει)\b/gi, '')
            .replace(/\b(gazzetta|sport24|sdna|sportal|sport-fm|athletiko|το site|η ιστοσελίδα|το portal|το μέσο)\b/gi, '')
            .replace(/\s+/g, ' ').trim()
            .substring(0, 4000);
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Είσαι in-house αθλητικός συντάκτης για τον Παναθηναϊκό. Βάσει των παρακάτω πληροφοριών, δημιούργησε ακριβώς 3 δυναμικά bullet points στα Ελληνικά.

ΑΠΑΡΑΙΤΗΤΕΣ ΟΔΗΓΙΕΣ:
- Γράφεις ΩΣ ανεξάρτητη αθλητική σύνταξη — ΠΟΤΕ μην αναφέρεις πού βρήκες την πληροφορία
- ΑΠΑΓΟΡΕΥΕΤΑΙ: «Σύμφωνα με...», «Το X γράφει...», «Ανακοίνωσε η ιστοσελίδα...», «Μεταδίδεται από...»
- Γράφε σε άμεσο, αυθεντικό δημοσιογραφικό ύφος σαν να το ξέρεις ο ίδιος
- Κάθε bullet πρέπει να είναι συγκεκριμένο και να αποφεύγει γενικολογίες

Επίστρεψε ΜΟΝΟ ένα JSON array από 3 strings. Χωρίς markdown.

Τίτλος: ${title}
Περιεχόμενο: ${cleanContent}`
                        }]
                    }],
                    generationConfig: { responseMimeType: 'application/json' }
                })
            }
        );

        if (!response.ok) throw new Error(`Gemini API returned status ${response.status}`);

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text.trim();
        const bullets = JSON.parse(responseText);
        
        if (Array.isArray(bullets) && bullets.length === 3) {
            return bullets;
        } else {
            throw new Error('Gemini response was not a 3-element JSON array');
        }
    } catch (error) {
        console.error(`[AI ERROR] Failed to generate AI bullets, using fallback:`, error.message);
        return generateFallbackBullets(title, text);
    }
}

// Generate a comprehensive long-form sports article in Greek using Gemini API
async function generateLongFormContent(title, text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log(`[AI] GEMINI_API_KEY missing. Skipping long-form content generation.`);
        return null;
    }

    try {
        console.log(`[AI] Generating long-form article using Gemini API...`);
        const cleanContent = (text || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\bσύμφωνα με (τ\w+|το|την|τον)\b/gi, '')
            .replace(/\b(gazzetta|sport24|sdna|sportal|sport-fm|athletiko|το site|η ιστοσελίδα|το portal|το μέσο|το ρεπορτάζ προέρχεται)\b/gi, '')
            .replace(/\s+/g, ' ').trim()
            .substring(0, 6000);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Είσαι in-house αθλητικός αρχισυντάκτης που καλύπτει αποκλειστικά τον Παναθηναϊκό. Η συνταξιακή ομάδα σου δημοσιεύει πρωτότυπα ρεπορτάζ — δεν αναδημοσιεύεις από άλλες πηγές.

Βάσει των παρακάτω πληροφοριών, γράψε ένα πλήρες, αυθεντικό αθλητικό άρθρο ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.

ΑΠΑΡΑΙΤΗΤΕΣ ΟΔΗΓΙΕΣ — ΑΥΣΤΗΡΑ:
1. ΠΟΤΕ μην αναφέρεις πού βρέθηκε η πληροφορία (καμία αναφορά σε portal, ιστοσελίδα, ΜΜΕ, «ανακοίνωσε το X»)
2. ΑΠΑΓΟΡΕΥΟΝΤΑΙ φράσεις: «Σύμφωνα με...», «Όπως μεταδίδει...», «Το Sportal/Gazzetta/Sport24 αναφέρει...», «Γράφεται ότι...», «Σε δημοσίευμα...»
3. Γράφε σε πρώτο πρόσωπο συνταξιακής ομάδας ή σε τρίτο πρόσωπο για τους αθλητές/ομάδα — ΠΑΝΤΑ αυθεντικά
4. Ελάχιστον 5-7 παράγραφοι (400-600 λέξεις)
5. Κάλυψε: κύριο γεγονός, αθλητικό context, επιπτώσεις στην ομάδα, ιστορικό background, προοπτικές
6. Μόνο καθαρό κείμενο — χωρίς HTML tags, χωρίς markdown, παράγραφοι χωρισμένες με κενή γραμμή
7. Ύφος: επαγγελματικό, δυναμικό, σαν κορυφαίο αθλητικό ρεπορτάζ

Τίτλος: ${title}
Πληροφορίες: ${cleanContent}

Γράψε ΜΟΝΟ το άρθρο, χωρίς τίτλο, χωρίς εισαγωγικά, χωρίς υπογραφή.`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.75,
                        maxOutputTokens: 2048
                    }
                })
            }
        );

        if (!response.ok) throw new Error(`Gemini API returned status ${response.status}`);

        const data = await response.json();
        const articleText = data.candidates[0].content.parts[0].text.trim();
        
        if (articleText && articleText.length > 100) {
            console.log(`[AI] Long-form article generated (${articleText.length} chars).`);
            return articleText;
        }
        return null;
    } catch (error) {
        console.error(`[AI ERROR] Failed to generate long-form content:`, error.message);
        return null;
    }
}

// Configure RSS feeds for the 6 Greek sports portals
const RSS_FEEDS = [
    {
        name: 'Gazzetta.gr',
        url: 'https://www.gazzetta.gr/rss',
        defaultCategory: 'Ποδόσφαιρο',
        requiresKeywordFilter: true
    },
    {
        name: 'Sport24.gr',
        url: 'https://www.sport24.gr/rss/panathinaikos',
        defaultCategory: 'Ποδόσφαιρο',
        requiresKeywordFilter: false
    },
    {
        name: 'SDNA.gr',
        url: 'https://www.sdna.gr/rss.xml',
        defaultCategory: 'All News',
        requiresKeywordFilter: true
    },
    {
        name: 'Sportal.gr',
        url: 'https://www.sportal.gr/rss',
        defaultCategory: 'All News',
        requiresKeywordFilter: true
    },
    {
        name: 'Sport-fm.gr',
        url: 'https://www.sport-fm.gr/rss',
        defaultCategory: 'All News',
        requiresKeywordFilter: true
    },
    {
        name: 'Athletiko.gr',
        url: 'https://athletiko.gr/feed/',
        defaultCategory: 'All News',
        requiresKeywordFilter: true
    }
];

// Helper to check if an article is relevant to Panathinaikos
function isPanathinaikosNews(item) {
    const title = (item.title || '').toLowerCase();
    const summary = (item.contentSnippet || item.summary || '').toLowerCase();
    const content = (item.content || '').toLowerCase();

    // Core Panathinaikos keywords (safe for substring matching)
    const keywords = [
        'παναθηναϊκός', 'παναθηναϊκού', 'παναθηναϊκό', 'παναθηναϊκή', 'παναθηναϊκά', 'παναθηναϊκές',
        'παναθηναικος', 'παναθηναικου', 'παναθηναικο', 'παναθηναικη', 'παναθηναικα',
        'πράσινοι', 'πράσινο', 'πράσινους', 'πράσινης', 'πράσινου', 'πράσινα', 'πρασινοι', 'πρασινο', 'πρασινη',
        'τριφύλλι', 'τριφύλλια', 'τριφυλλιού', 'τριφυλλι', 'trifili',
        'panathinaikos', 'gate 13', 'gate13', 'οακα', 'λεωφόρος', 'λεωφορος',
        'ιωαννίδης', 'σλούκας', 'αταμάν', 'γιούρτσεβεν', 'μπακασέτας', 'τετέ', 'πελίστρι', 'γιεντβάι',
        'ινγκασον', 'ντραγκόφσκι', 'βαγιαννίδης', 'παπαπέτρου', 'sloukas', 'ionnidis', 'ataman'
    ];

    const hasKeyword = keywords.some(keyword => 
        title.includes(keyword) || 
        summary.includes(keyword) || 
        content.includes(keyword)
    );

    if (hasKeyword) return true;

    // Use regex word boundaries for short terms like 'pao' / 'παο' to avoid false positives (e.g. matching 'paok')
    const textToSearch = `${title} ${summary} ${content}`;
    return /\b(pao|παο)\b/i.test(textToSearch);
}

// Helper to extract image URL from RSS item
function extractImageUrl(item) {
    // 1. Check enclosure tag
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }
    // 2. Check custom media:content tag
    if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
        return item.mediaContent.$.url;
    }
    // 3. Try to extract image from content description HTML
    if (item.content || item.summary) {
        const text = item.content || item.summary;
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
        const match = imgRegex.exec(text);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Helper to determine category based on strict priority keyword rules
function determineCategory(item, defaultCategory) {
    const textToSearch = `${item.title || ''} ${item.content || ''} ${item.contentSnippet || ''}`.toLowerCase();

    // PRIORITY 1: Basketball — checked first (KAE/AKTOR entities are basketball-exclusive)
    const basketballKeywords = [
        'μπάσκετ', 'basketball', 'euroleague', 'basket league', 'κae', 'καε',
        'aktor', 'ακτωρ', 'sloukas', 'σλούκας', 'παπαπέτρου', 'ataman',
        'ευρωλίγκα', 'super1', 'οακα', 'oaka', 'mundobasket', 'μουντομπάσκετ',
        'γιούρτσεβεν', 'yurtseven', 'σενγκούν', 'λούντζης', 'μιτόγλου',
        'λαρεντζάκης', 'βουγιούκας', 'fiba', 'προκριματικά μπάσκετ',
        'βόλεϊ', 'volleyball', 'volley', 'αντετοκούνμπο', 'nba',
        'μπάλον', 'fenerbahce basket', 'real madrid basket', 'panathinaikos bc'
    ];
    if (basketballKeywords.some(kw => textToSearch.includes(kw))) {
        return 'Μπάσκετ';
    }

    // PRIORITY 2: Football — use only football-exclusive terms
    const footballKeywords = [
        'παε', 'super league', 'superleague', 'ποδόσφαιρο', 'ποδοσφαιρο',
        'σούπερ λιγκ', 'europa league', 'conference league', 'παγκόσμιο κύπελλο',
        'mundial', 'μουντιάλ', 'euro 2028', 'ποδοσφαιρ',
        'μπακασέτας', 'τετέ', 'πελίστρι', 'ντραγκόφσκι',
        'βαγιαννίδης', 'ioannidis', 'ιωαννίδης', 'τερματοφύλακας',
        'γκολ', 'offside', 'πέναλτι', 'φάουλ'
    ];
    if (footballKeywords.some(kw => textToSearch.includes(kw))) {
        return 'Ποδόσφαιρο';
    }

    // PRIORITY 3: Transfers
    if (textToSearch.includes('μεταγραφ') || textToSearch.includes('transfer') || textToSearch.includes('μεταγραφέ')) {
        return 'Μεταγραφές';
    }

    // PRIORITY 4: Amateur sports
    if (textToSearch.includes('ερασιτέχν') || textToSearch.includes('ερασιτεχν')) {
        return 'Ερασιτέχνης';
    }

    // PRIORITY 5: Opinion
    if (textToSearch.includes('άποψη') || textToSearch.includes('σχόλιο') || textToSearch.includes('opinion')) {
        return 'Opinion';
    }

    return defaultCategory || 'Ποδόσφαιρο';
}

// Main scrape function
async function scrapeNews() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`[SCRAPER] Starting Panathinaikos News Scraper. Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE-SYNC'}`);

    let supabase = null;
    if (!isDryRun) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[ERROR] Supabase credentials (SUPABASE_URL and SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY) are missing in environment variables.');
            process.exit(1);
        }
        supabase = createClient(supabaseUrl, supabaseKey);
    }

    let totalScraped = 0;
    let totalSaved = 0;

    for (const feed of RSS_FEEDS) {
        console.log(`\n[SCRAPER] Fetching RSS feed from: ${feed.name} (${feed.url})`);
        try {
            const parsedFeed = await parser.parseURL(feed.url);
            console.log(`[SCRAPER] Successfully parsed ${parsedFeed.items.length} items from ${feed.name}`);

            for (const item of parsedFeed.items) {
                // If feed is general, filter out articles that don't refer to Panathinaikos
                if (feed.requiresKeywordFilter && !isPanathinaikosNews(item)) {
                    continue;
                }

                totalScraped++;
                
                const title = item.title;
                const summary = item.contentSnippet || item.summary || '';
                const content = item.content || item.contentSnippet || '';
                const source_url = item.link;
                const image_url = extractImageUrl(item);
                const category = determineCategory(item, feed.defaultCategory);
                const created_at = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

                if (!title || !source_url) {
                    console.log(`[SCRAPER] Skipping item due to missing title or link.`);
                    continue;
                }

                if (isDryRun) {
                    console.log(`\n--- [DRY-RUN ITEM] ---`);
                    console.log(`Title:    ${title}`);
                    console.log(`Category: ${category}`);
                    console.log(`Source:   ${source_url}`);
                    console.log(`Image:    ${image_url || 'None'}`);
                    console.log(`Summary:  ${summary.substring(0, 100)}...`);
                    console.log(`Group ID: ${crypto.randomUUID()}`);
                    console.log(`Bullets:  ${JSON.stringify(generateFallbackBullets(title, content || summary))}`);
                } else {
                    // Check if article already exists in database to avoid duplicate work/calls
                    const { data: existingArticle, error: fetchError } = await supabase
                        .from('articles')
                        .select('id, group_id, bullets')
                        .eq('source_url', source_url)
                        .maybeSingle();

                    if (existingArticle) {
                        console.log(`[SCRAPER] Skipping already existing article: "${title}"`);
                        continue;
                    }

                    let group_id = null;

                    // 1. Grouping logic (Deduplication)
                    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
                    const { data: recentArticles, error: recentError } = await supabase
                        .from('articles')
                        .select('id, title, group_id, created_at')
                        .gt('created_at', twoHoursAgo);

                    if (recentArticles && recentArticles.length > 0) {
                        // Find a highly similar article by title
                        const similarArticle = recentArticles.find(art => 
                            calculateJaccardSimilarity(title, art.title) >= 0.35
                        );

                        if (similarArticle) {
                            console.log(`[DEDUPLICATION] Similar article found in last 2h: "${similarArticle.title}" (Score: ${calculateJaccardSimilarity(title, similarArticle.title).toFixed(2)})`);
                            if (similarArticle.group_id) {
                                group_id = similarArticle.group_id;
                            } else {
                                // Assign a new group UUID and update the first article in group
                                const newGroupId = crypto.randomUUID();
                                group_id = newGroupId;
                                
                                console.log(`[DEDUPLICATION] Creating new group ${newGroupId} for parent "${similarArticle.title}"`);
                                await supabase
                                    .from('articles')
                                    .update({ group_id: newGroupId })
                                    .eq('id', similarArticle.id);
                            }
                        }
                    }

                    // If no similar article exists, assign a new group ID so subsequent similar articles can group under it
                    if (!group_id) {
                        group_id = crypto.randomUUID();
                        console.log(`[DEDUPLICATION] No similar article found. Initialized group ${group_id} for "${title}"`);
                    }

                    // 2. AI Summarization logic (bullets + long-form article)
                    const bullets = await generateAiBullets(title, content || summary);
                    const longFormContent = await generateLongFormContent(title, content || summary);

                    // Insert the new article with group_id, bullets, and AI-generated long-form content
                    const { data, error } = await supabase
                        .from('articles')
                        .insert({
                            title,
                            summary,
                            content: longFormContent || content,
                            source_url,
                            image_url,
                            category,
                            created_at,
                            group_id,
                            bullets,
                            updated_at: new Date().toISOString()
                        })
                        .select();

                    if (error) {
                        console.error(`[ERROR] Failed to save article "${title}":`, error.message);
                    } else {
                        console.log(`[SUCCESS] Stored new article: "${title}" in group: ${group_id}`);
                        totalSaved++;
                    }
                }
            }
        } catch (error) {
            console.error(`[ERROR] Failed to fetch or parse feed ${feed.name}:`, error.message);
        }
    }

    console.log(`\n[SCRAPER] Completed. Total items processed: ${totalScraped}. Total items stored: ${totalSaved}`);
}

scrapeNews().catch(err => {
    console.error('[FATAL ERROR] Scraper crashed:', err);
    process.exit(1);
});
