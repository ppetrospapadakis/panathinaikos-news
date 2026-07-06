/**
 * Panathinaikos News - RSS Scraper Script
 * 
 * Dependencies: rss-parser, @supabase/supabase-js, dotenv
 * Execution: node backend/scraper.js [--dry-run]
 */

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
                } else {
                    // Save to Supabase using upsert to avoid duplicate source URLs
                    const { data, error } = await supabase
                        .from('articles')
                        .upsert(
                            {
                                title,
                                summary,
                                content,
                                source_url,
                                image_url,
                                category,
                                created_at,
                                updated_at: new Date().toISOString()
                            },
                            { onConflict: 'source_url' }
                        )
                        .select();

                    if (error) {
                        console.error(`[ERROR] Failed to save article "${title}":`, error.message);
                    } else {
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
