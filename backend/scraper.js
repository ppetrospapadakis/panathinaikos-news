/**
 * Panathinaikos News — Direct HTML Scraper
 *
 * Architecture: Direct URL scraping with axios + cheerio (no RSS).
 * Targets specific Panathinaikos category pages per sport.
 * Groups related articles via Jaccard similarity → shared group_id.
 * Generates AI bullets + long-form content via Gemini API.
 *
 * Usage:  node backend/scraper.js [--dry-run]
 * Env:    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY), GEMINI_API_KEY, DOTENV_PATH
 */

'use strict';

const axios   = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const crypto  = require('crypto');
require('dotenv').config();

// ─── HTTP client ───────────────────────────────────────────────────────────────
const http = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'el-GR,el;q=0.9,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
    },
    maxRedirects: 5,
});

// ─── Target URLs per category ──────────────────────────────────────────────────
const SCRAPE_TARGETS = [
    // ── FOOTBALL ──────────────────────────────────────────────────────────────
    {
        category: 'Ποδόσφαιρο',
        name: 'SDNA Football',
        url: 'https://www.sdna.gr/teams/panathinaikos/podosfairo',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.entry-title a', 'article a', '.post-title a', 'a[href*="/football/"]', 'a[href*="/podosfairo/"]'],
        baseUrl: 'https://www.sdna.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Sportal Football',
        url: 'https://www.sportal.gr/podosfairo/panathinaikos-551',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.teaser-title a', '.headline a', 'a[href*="/podosfairo/"]', 'article a'],
        baseUrl: 'https://www.sportal.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Sport24 Football',
        url: 'https://www.sport24.gr/football/tag/panathinaikos/',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.story-title a', '.headline a', 'a[href*="/football/"]'],
        baseUrl: 'https://www.sport24.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Gazzetta Football',
        url: 'https://www.gazzetta.gr/football/panathinaikos',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.entry-title a', 'a[href*="/football/"]', 'a[href*="panathinaikos"]'],
        baseUrl: 'https://www.gazzetta.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Athletiko Football',
        url: 'https://www.athletiko.gr/panathinaikos-podosfairo',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.post-title a', 'a[href*="panathinaikos"]'],
        baseUrl: 'https://www.athletiko.gr',
    },
    // ── BASKETBALL ────────────────────────────────────────────────────────────
    {
        category: 'Μπάσκετ',
        name: 'SDNA Basketball',
        url: 'https://www.sdna.gr/teams/panathinaikos-aktor',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.entry-title a', 'article a', 'a[href*="/basket"]'],
        baseUrl: 'https://www.sdna.gr',
    },
    {
        category: 'Μπάσκετ',
        name: 'Gazzetta Basketball',
        url: 'https://www.gazzetta.gr/basketball/panathinaikos',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', 'a[href*="/basketball/"]', 'a[href*="panathinaikos"]'],
        baseUrl: 'https://www.gazzetta.gr',
    },
    {
        category: 'Μπάσκετ',
        name: 'Sport24 Basketball',
        url: 'https://www.sport24.gr/basket/tag/panathinaikos/',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.story-title a', 'a[href*="/basket/"]'],
        baseUrl: 'https://www.sport24.gr',
    },
    {
        category: 'Μπάσκετ',
        name: 'Athletiko Basketball',
        url: 'https://www.athletiko.gr/panathinaikos-mpasket',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.post-title a', 'a[href*="panathinaikos"]'],
        baseUrl: 'https://www.athletiko.gr',
    },
    // ── AMATEUR / VOLLEYBALL ─────────────────────────────────────────────────
    {
        category: 'Ερασιτέχνης',
        name: 'Gazzetta Volleyball',
        url: 'https://www.gazzetta.gr/volleyball/panathinaikos',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', 'a[href*="/volleyball/"]'],
        baseUrl: 'https://www.gazzetta.gr',
    },
    {
        category: 'Ερασιτέχνης',
        name: 'SDNA Volleyball',
        url: 'https://www.sdna.gr/teams/panathinaikos/bolei',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', 'article a'],
        baseUrl: 'https://www.sdna.gr',
    },
    {
        category: 'Ερασιτέχνης',
        name: 'Gazzetta Polo',
        url: 'https://www.gazzetta.gr/polo/panathinaikos',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', 'a[href*="/polo/"]'],
        baseUrl: 'https://www.gazzetta.gr',
    },
];

// ─── Panathinaikos relevance keywords (strict matching) ───────────────────────
const PAO_KEYWORDS = [
    'παναθηναϊκ', 'panathinaikos', 'pao fc', 'pao bc', 'καε παναθηναϊκός', 'παε παναθηναϊκός',
    'τριφύλλι', 'trifilli', 'οακα', 'oaka', 'λεωφόρος', 'leoforos', 'βοτανικός', 'votanikos',
    'αταμάν', 'ataman', 'σλούκας', 'sloukas', 'ιωαννίδης', 'ioannidis', 'τετέ', 'tete',
    'μπακασέτας', 'bakasetas', 'πελίστρι', 'pellistri', 'νίστρουπ', 'neestrup', 'μαξίμοβιτς',
    'μπαλτσερόφσκι', 'ναν', 'kendrick nunn', 'lessort', 'λεσόρ', 'grant', 'γκραντ',
    'γκριγκόνις', 'grigonis', 'ερνανγκόμεθ', 'hernangomez', 'χουάντσο', 'papapetrou',
    'παπαπέτρου', 'μητογλου', 'mitoglou', 'καλαϊτζάκης', 'kalaitzakis', 'γιούρτσεβεν',
    'yurtseven', 'osman', 'όσμαν', 'green heretics', 'θύρα 13', 'gate 13', 'πράσινοι', 'πράσινους'
];

function isPanathinaikosArticle(title, text) {
    const combined = `${title || ''} ${text || ''}`.toLowerCase();
    
    // Quick keyword scan of specific keywords
    const hasKeyword = PAO_KEYWORDS.some(kw => combined.includes(kw));
    if (hasKeyword) return true;

    // Unicode-safe word boundary check for "παο" or "pao" (excludes "παοκ", "παουλίνιο", κλπ)
    const paoRegex = /(?<=^|[^a-zA-Z0-9α-ωΑ-Ωίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώ])(pao|παο)(?=$|[^a-zA-Z0-9α-ωΑ-Ωίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώ])/i;
    return paoRegex.test(combined);
}

// ─── Jaccard similarity ────────────────────────────────────────────────────────
function cleanTextToWords(text) {
    const greekStopwords = new Set([
        'και','το','του','της','στον','στην','από','με','για','στα','στις','στους',
        'ο','η','οι','τα','ένα','μια','στο','σε','πως','ότι','που','αλλά','ωσ',
    ]);
    return new Set(
        (text || '').toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !greekStopwords.has(w))
    );
}

function jaccardSimilarity(a, b) {
    const wa = cleanTextToWords(a), wb = cleanTextToWords(b);
    if (wa.size === 0 || wb.size === 0) return 0;
    let inter = 0;
    for (const w of wa) if (wb.has(w)) inter++;
    return inter / (wa.size + wb.size - inter);
}

// ─── Scrape listing page → article URLs ───────────────────────────────────────
async function scrapeArticleLinks(target) {
    try {
        const { data: html } = await http.get(target.url);
        const $ = cheerio.load(html);
        const links = new Set();

        for (const sel of target.articleLinkSelectors) {
            $(sel).each((_, el) => {
                let href = $(el).attr('href') || '';
                if (!href) return;
                // Make absolute
                if (href.startsWith('/')) href = target.baseUrl + href;
                if (!href.startsWith('http')) return;
                // Filter: must be same domain, must look like an article (has numeric or slug segment)
                try {
                    const u = new URL(href);
                    if (!href.includes(target.baseUrl.replace('https://www.','').replace('https://',''))) return;
                    if (u.pathname === '/' || u.pathname === '') return;
                    links.add(href.split('?')[0].split('#')[0]); // strip query/hash
                } catch (_) {}
            });
        }

        const arr = [...links].slice(0, 25); // max 25 articles per source
        console.log(`[${target.name}] Found ${arr.length} candidate links on ${target.url}`);
        return arr;
    } catch (err) {
        console.warn(`[${target.name}] Failed to scrape listing page: ${err.message}`);
        return [];
    }
}

// ─── Scrape individual article page ───────────────────────────────────────────
async function scrapeArticlePage(url, categoryHint) {
    try {
        const { data: html } = await http.get(url);
        const $ = cheerio.load(html);

        // ── Title ──────────────────────────────────────────────────────────────
        const title = (
            $('h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            $('title').text().split('|')[0].trim() ||
            ''
        ).substring(0, 300);

        if (!title || title.length < 10) return null;

        // ── Image ──────────────────────────────────────────────────────────────
        const DEFAULT_STADIUM_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWqLWdMtuYcKiqRBma1U3nbxLwo4s_LzWCRXGbhUk-hwbLCLpyJBvisEVIxAkafTxr--Na_6-HCaJwViznYo-evYvrmshakfxaQsm7ozviLuvdS7swiPkDUkMLDSS6qrhzlxZxizr_IHS3SCZJM8I8qTRX2SUlET9W3bVjeOlWNe7_f4bUtOyn6gJcy_pKwQQ994O0mJ_YI0cs4tJJ1Dlwz9B7Lzk5wo5qIKk8vUMgIZPJ5glPisSWJJxaaZKKS_6iaukJSB059iM';
        
        let scrapedImg = (
            $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('article img, .article-image img, .featured-image img, figure img').first().attr('src') ||
            $('img[src*="jpg"], img[src*="jpeg"], img[src*="webp"], img[src*="png"]')
                .filter((_, el) => {
                    const src = $(el).attr('src') || '';
                    return !src.includes('logo') && !src.includes('icon') && !src.includes('1x1') && !src.includes('avatar');
                })
                .first().attr('src') ||
            null
        );

        if (scrapedImg && scrapedImg.startsWith('/')) {
            try {
                scrapedImg = new URL(url).origin + scrapedImg;
            } catch (_) {}
        }

        // Validate image: Bypass generic competitor logos, default shares, and watermark placeholders
        let imageUrl = DEFAULT_STADIUM_IMG;
        if (scrapedImg && typeof scrapedImg === 'string' && scrapedImg.startsWith('http')) {
            const lowerImg = scrapedImg.toLowerCase();
            const brandingIndicators = [
                'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
                'sportal_logo', 'sdna_logo', 'gazzetta_logo', 'sport24_logo', 'default_image',
                'facebook_share', 'og_image_default', 'default-share', 'site-logo', 'author'
            ];
            const isBranding = brandingIndicators.some(ind => lowerImg.includes(ind));
            if (!isBranding) {
                imageUrl = scrapedImg;
            }
        }
        
        // ── Published date ─────────────────────────────────────────────────────
        const dateStr = (
            $('meta[property="article:published_time"]').attr('content') ||
            $('time').first().attr('datetime') ||
            $('[class*="date"], [class*="time"]').first().text().trim() ||
            new Date().toISOString()
        );
        const created_at = new Date(dateStr).toISOString().split('Z')[0] + '+00:00';

        // ── Body text ──────────────────────────────────────────────────────────
        // Try progressively more specific selectors
        const bodySelectors = [
            'article .article-body', 'article .content', '.article-content',
            '.article-body', '.story-body', '.entry-content', '.post-content',
            '[class*="article-text"]', '[class*="article-content"]',
            'article p', '.content-area p', 'main p',
        ];
        let bodyText = '';
        for (const sel of bodySelectors) {
            const els = $(sel);
            if (els.length > 0) {
                // Strip scripts, ads, share buttons
                els.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"]').remove();
                bodyText = els.text().replace(/\s+/g, ' ').trim();
                if (bodyText.length > 100) break;
            }
        }

        // ── Summary (meta description) ─────────────────────────────────────────
        const summary = (
            $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            bodyText.substring(0, 200) ||
            title
        ).substring(0, 500);

        return { title, summary, content: bodyText, imageUrl, created_at, sourceUrl: url };
    } catch (err) {
        console.warn(`[SCRAPER] Failed to scrape article ${url}: ${err.message}`);
        return null;
    }
}

// ─── Fallback bullets ──────────────────────────────────────────────────────────
function generateFallbackBullets(title, content) {
    const clean = (content || '').replace(/<[^>]*>/g, ' ').trim();
    const sentences = clean.split(/[.;!]+/g)
        .map(s => s.trim())
        .filter(s => s.length > 20 && !s.includes('http'));
    const bullets = [`${title}`];
    for (const s of sentences) {
        if (bullets.length >= 3) break;
        if (!bullets.some(b => b.includes(s.substring(0, 15)))) bullets.push(s);
    }
    while (bullets.length < 3) bullets.push('Παρακολουθήστε την εξέλιξη στο Panathinaikos News.');
    return bullets.slice(0, 3);
}

// ─── Gemini API: SDK Initialization Helper ────────────────────────────────────
let aiClientInstance = null;
function getAiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!aiClientInstance) {
        const { GoogleGenAI } = require('@google/genai');
        aiClientInstance = new GoogleGenAI({ apiKey });
    }
    return aiClientInstance;
}

// ─── Gemini API: bullets ───────────────────────────────────────────────────────
async function generateAiBullets(title, text) {
    const ai = getAiClient();
    if (!ai) return generateFallbackBullets(title, text);

    const cleanText = (text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\bσύμφωνα με\s+\S+/gi, '')
        .replace(/\b(gazzetta|sport24|sdna|sportal|athletiko|sport-fm)\b[\s.,]*/gi, '')
        .replace(/\s+/g, ' ').trim().substring(0, 4000);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Είσαι in-house αθλητικός συντάκτης του Panathinaikos News. Βάσει των παρακάτω πληροφοριών, δημιούργησε ακριβώς 3 δυναμικά bullet points ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.

ΑΠΑΡΑΙΤΗΤΕΣ ΟΔΗΓΙΕΣ:
1. ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ να αντιγράψεις αυτούσιες φράσεις από το κείμενο. Κάνε πλήρη αναδιατύπωση των γεγονότων.
2. Γράφεις ΩΣ ανεξάρτητη αθλητική σύνταξη. ΠΟΤΕ μην αναφέρεις πού βρήκες την πληροφορία (καμία αναφορά σε άλλα portals, sites, «Σύμφωνα με...»).
3. Κάθε bullet πρέπει να είναι σύντομο, περιεκτικό, δυναμικό, 1-2 προτάσεις και 100% πρωτότυπο.

Επίστρεψε ΜΟΝΟ JSON array από 3 strings, π.χ.: ["bullet 1", "bullet 2", "bullet 3"]

Τίτλος: \${title}
Κείμενο: \${cleanText}`
        });

        let textResponse = response.text.trim();
        // Extract array substring to bypass conversational wrappers
        const startIdx = textResponse.indexOf('[');
        const endIdx = textResponse.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
            textResponse = textResponse.substring(startIdx, endIdx + 1);
        }
        const bullets = JSON.parse(textResponse);
        if (Array.isArray(bullets) && bullets.length === 3) return bullets;
        throw new Error('Bad response format');
    } catch (err) {
        console.warn(`[AI] Bullets fallback: ${err.message}`);
        return generateFallbackBullets(title, text);
    }
}

// ─── Gemini API: long-form article ────────────────────────────────────────────
async function generateLongFormContent(title, text) {
    const ai = getAiClient();
    if (!ai) return null;

    const cleanText = (text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\bσύμφωνα με\s+\S+/gi, '')
        .replace(/\b(gazzetta|sport24|sdna|sportal|athletiko|sport-fm)\b[\s.,]*/gi, '')
        .replace(/\s+/g, ' ').trim().substring(0, 6000);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Είσαι in-house αθλητικός αρχισυντάκτης του Panathinaikos News. Η συντακτική σου ομάδα παράγει αποκλειστικό, πρωτότυπο περιεχόμενο.
Βάσει των παρακάτω πληροφοριών, γράψε ένα πλήρες, 100% αυθεντικό, αυτόνομο αθλητικό άρθρο ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.

ΚΑΝΟΝΕΣ ZERO-TOLERANCE ΓΙΑ COPY-PASTE (ΑΥΣΤΗΡΑ):
1. ΑΠΑΓΟΡΕΥΕΤΑΙ ΡΗΤΑ να αντιγράψεις αυτούσιες προτάσεις, φράσεις ή παραγράφους από το πηγαίο υλικό.
2. Διάβασε το πηγαίο κείμενο, κράτησε ΜΟΝΟ τα βασικά γεγονότα (ποιος, τι, πότε, πού, γιατί) και γράψε ένα εντελώς νέο άρθρο από το μηδέν με δικό σου ύφος, εναλλακτικό λεξιλόγιο και διαφορετική δομή προτάσεων.
3. ΠΟΤΕ μην αναφέρεις την αρχική πηγή ή άλλα μέσα ενημέρωσης. Απαγορεύονται φράσεις όπως «Σύμφωνα με...», «Το Sportal/Gazzetta/SDNA αναφέρει...», «Όπως γράφεται...».
4. Το κείμενο πρέπει να είναι εκτενές (5-7 παράγραφοι, 400-600 λέξεις) και να αναλύει σε βάθος το θέμα, τις επιπτώσεις στην ομάδα, το context και το ιστορικό background.
5. ΜΟΝΟ καθαρό κείμενο, χωρίς HTML tags, χωρίς markdown (bolding, lists, stars κλπ.).
6. Διαχώρισε τις παραγράφους με μία κενή γραμμή.

Τίτλος: \${title}
Πληροφορίες: \${cleanText}

Γράψε ΜΟΝΟ το άρθρο, χωρίς τίτλο, χωρίς υπογραφή.`,
            config: {
                temperature: 0.8,
                maxOutputTokens: 2048
            }
        });

        const articleText = response.text.trim();
        if (articleText && articleText.length > 100) {
            console.log(`[AI] Long-form generated: ${articleText.length} chars`);
            return articleText;
        }
    } catch (err) {
        console.warn(`[AI] Long-form fallback: ${err.message}`);
    }
    return null;
}

// ─── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`\n[SCRAPER] Panathinaikos Direct Scraper — Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE-SYNC'}`);
    console.log(`[SCRAPER] Targets: ${SCRAPE_TARGETS.length} sources | ${new Date().toISOString()}\n`);

    // ── Supabase ──────────────────────────────────────────────────────────────
    let db = null;
    let existingUrls = new Set();
    let existingArticles = [];

    if (!isDryRun) {
        const url  = process.env.SUPABASE_URL;
        const key  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        if (!url || !key) {
            console.error('[FATAL] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
            process.exit(1);
        }
        db = createClient(url, key);

        // Load existing articles for dedup + group matching
        const { data, error } = await db.from('articles')
            .select('id, title, source_url, group_id, created_at')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) { console.error('[FATAL] DB error:', error.message); process.exit(1); }
        existingArticles = data || [];
        existingUrls = new Set(existingArticles.map(a => a.source_url));
        console.log(`[DB] Loaded ${existingArticles.length} existing articles for deduplication.\n`);
    }

    let totalNew = 0, totalSkipped = 0;

    // ── Process each source ───────────────────────────────────────────────────
    for (const target of SCRAPE_TARGETS) {
        console.log(`\n[SOURCE] ${target.name} | ${target.category}`);

        const links = await scrapeArticleLinks(target);
        if (links.length === 0) { console.log(`  → No links found, skipping.`); continue; }

        for (const articleUrl of links) {
            // Skip if already in DB
            if (!isDryRun && existingUrls.has(articleUrl)) {
                totalSkipped++;
                continue;
            }

            // Rate limit: 1s between article fetches
            await sleep(1000);

            const scraped = await scrapeArticlePage(articleUrl, target.category);
            if (!scraped || !scraped.title) { continue; }

            // Check PAO relevance
            if (!isPanathinaikosArticle(scraped.title, scraped.content)) {
                console.log(`  [SKIP] Not PAO-relevant: ${scraped.title.substring(0, 50)}`);
                continue;
            }

            console.log(`  [NEW] ${scraped.title.substring(0, 70)}`);

            // ── Group ID via Jaccard ──────────────────────────────────────────
            let group_id = crypto.randomUUID();
            const JACCARD_THRESHOLD = 0.35;

            if (!isDryRun) {
                for (const existing of existingArticles) {
                    const sim = jaccardSimilarity(scraped.title, existing.title);
                    if (sim >= JACCARD_THRESHOLD) {
                        group_id = existing.group_id;
                        console.log(`    → Grouped with existing (sim=${sim.toFixed(2)}): ${existing.title.substring(0, 50)}`);
                        break;
                    }
                }
            }

            // ── AI Generation ─────────────────────────────────────────────────
            const bullets = await generateAiBullets(scraped.title, scraped.content || scraped.summary);
            const longFormContent = await generateLongFormContent(scraped.title, scraped.content || scraped.summary);

            if (isDryRun) {
                console.log(`    Category:  ${target.category}`);
                console.log(`    URL:       ${articleUrl}`);
                console.log(`    Image:     ${scraped.imageUrl || 'none'}`);
                console.log(`    Summary:   ${scraped.summary.substring(0, 100)}...`);
                console.log(`    Bullets:   ${JSON.stringify(bullets)}`);
                console.log(`    Long-form: ${longFormContent ? longFormContent.substring(0, 80) + '...' : 'fallback (no API key)'}`);
                totalNew++;
                continue;
            }

            // ── Insert to DB ──────────────────────────────────────────────────
            const { data: inserted, error: insertErr } = await db.from('articles').insert({
                title:      scraped.title,
                summary:    scraped.summary,
                content:    longFormContent || scraped.content || scraped.summary,
                source_url: articleUrl,
                image_url:  scraped.imageUrl,
                category:   target.category,
                created_at: scraped.created_at,
                group_id,
                bullets,
                updated_at: new Date().toISOString(),
            }).select('id');

            if (insertErr) {
                // Unique constraint violation = already exists (different URL, same content) → skip
                if (insertErr.code === '23505') {
                    console.log(`    → Duplicate content, skipped.`);
                } else {
                    console.error(`    → DB insert error: ${insertErr.message}`);
                }
                continue;
            }

            existingUrls.add(articleUrl);
            existingArticles.unshift({ id: inserted[0].id, title: scraped.title, source_url: articleUrl, group_id, created_at: scraped.created_at });
            totalNew++;
            console.log(`    ✅ Inserted (id=${inserted[0].id})`);

            // Rate limit between AI calls
            await sleep(1500);
        }
    }

    console.log(`\n[SCRAPER] Done. New: ${totalNew} | Skipped: ${totalSkipped} | ${new Date().toISOString()}`);
}

main().catch(err => {
    console.error('[FATAL] Scraper crashed:', err.message);
    process.exit(1);
});
