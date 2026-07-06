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
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['enclosure', 'enclosure'],
            ['image', 'image']
        ]
    }
});

// Configure RSS feeds for Panathinaikos
const RSS_FEEDS = [
    {
        name: 'Gazzetta Panathinaikos',
        url: 'https://www.gazzetta.gr/rss/sports/football/panathinaikos',
        defaultCategory: 'Ποδόσφαιρο'
    },
    {
        name: 'Sport24 Panathinaikos',
        url: 'https://www.sport24.gr/rss/panathinaikos',
        defaultCategory: 'Ποδόσφαιρο'
    },
    {
        name: 'SDNA',
        url: 'https://www.sdna.gr/rss',
        defaultCategory: 'All News'
    }
];

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
