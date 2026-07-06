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
        const cleanContent = (text || '').replace(/<[^>]*>/g, ' ').substring(0, 4000);
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analyze the following Greek sports news article. Generate exactly 3 concise, high-impact bullet points in Greek summarizing the key facts for an 'F5 fan' who wants a 5-second update (quick-takes). Output the response as a JSON array of 3 strings (e.g., ["bullet 1", "bullet 2", "bullet 3"]). Output ONLY the JSON array, no markdown wrappers like \`\`\`json.
                            
Title: ${title}
Content: ${cleanContent}`
                        }]
                    }],
                    generationConfig: {
                        responseMimeType: 'application/json'
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API returned status ${response.status}`);
        }

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

// Helper to determine category based on content keywords
function determineCategory(item, defaultCategory) {
    const textToSearch = `${item.title || ''} ${item.content || ''} ${item.contentSnippet || ''}`.toLowerCase();
    
    if (textToSearch.includes('μπάσκετ') || textToSearch.includes('basketball') || textToSearch.includes('sloukas') || textToSearch.includes('σλούκας') || textToSearch.includes('οακα')) {
        return 'Μπάσκετ';
    }
    if (textToSearch.includes('μεταγραφές') || textToSearch.includes('μεταγραφή') || textToSearch.includes('transfer')) {
        return 'Μεταγραφές';
    }
    if (textToSearch.includes('opinion') || textToSearch.includes('άποψη') || textToSearch.includes('σχόλιο')) {
        return 'Opinion';
    }
    if (textToSearch.includes('ερασιτέχνης') || textToSearch.includes('ερασιτέχνη') || textToSearch.includes('αο')) {
        return 'Ερασιτέχνης';
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

                    // 2. AI Summarization logic
                    const bullets = await generateAiBullets(title, content || summary);

                    // Insert the new article with group_id and bullets
                    const { data, error } = await supabase
                        .from('articles')
                        .insert({
                            title,
                            summary,
                            content,
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
