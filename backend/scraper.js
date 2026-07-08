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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'el-GR,el;q=0.9,en;q=0.8',
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
    // ── OFFICIAL PORTALS ───────────────────────────────────────────────────────
    {
        category: 'Ποδόσφαιρο',
        name: 'PAO Official',
        url: 'https://www.pao.gr/',
        articleLinkSelectors: ['.latest-news a', 'h2 a', 'h3 a', '.article-title a', '.entry-title a', 'article a', 'a[href*="/news/"]', '.news-item a'],
        baseUrl: 'https://www.pao.gr',
        isOfficial: true,
    },
    {
        category: 'Ερασιτέχνης',
        name: 'PAO1908 Official',
        url: 'https://www.pao1908.com/category/nea/',
        articleLinkSelectors: ['.post a', 'h2 a', 'h3 a', '.entry-title a', 'article a'],
        baseUrl: 'https://www.pao1908.com',
        isOfficial: true,
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
    const combinedTitle = (title || '').toLowerCase();
    const combinedText = (text || '').toLowerCase();
    
    // Unicode-safe word boundary check for "παο" or "pao"
    const paoRegex = /(?<=^|[^a-zA-Z0-9α-ωΑ-Ωίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώ])(pao|παο)(?=$|[^a-zA-Z0-9α-ωΑ-Ωίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώ])/i;

    // 1. Check title relevance first (highest authority)
    const titleHasKeyword = PAO_KEYWORDS.some(kw => combinedTitle.includes(kw));
    if (titleHasKeyword || paoRegex.test(combinedTitle)) {
        return true;
    }

    // 2. If title doesn't have keywords, require at least 3 occurrences in the body (to filter out promo links)
    let matchCount = 0;
    
    for (const kw of PAO_KEYWORDS) {
        let idx = combinedText.indexOf(kw);
        while (idx !== -1) {
            matchCount++;
            idx = combinedText.indexOf(kw, idx + kw.length);
        }
    }
    
    const matches = combinedText.match(new RegExp(paoRegex.source, 'gi'));
    if (matches) {
        matchCount += matches.length;
    }

    return matchCount >= 3;
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
        const response = await http.get(target.url);
        console.log(`[HTTP GET] ${target.url} | Status: ${response.status}`);
        const html = response.data;
        const $ = cheerio.load(html);
        const links = new Set();

        for (const sel of target.articleLinkSelectors) {
            try {
                const elements = $(sel);
                if (elements.length === 0) {
                    console.log(`  [PARSING WARNING] Selector '${sel}' returned no elements on ${target.url}`);
                }
                elements.each((_, el) => {
                    let href = $(el).attr('href') || '';
                    if (!href) {
                        console.log(`  [PARSING WARNING] Element matched by '${sel}' is missing href attribute`);
                        return;
                    }
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
            } catch (selErr) {
                console.error(`  [PARSING ERROR] Selector '${sel}' failed: ${selErr.message}`);
            }
        }

        const arr = [...links].slice(0, 25); // max 25 articles per source
        console.log(`[${target.name}] Found ${arr.length} candidate links on ${target.url} (Total URLs extracted: ${arr.length})`);
        return arr;
    } catch (err) {
        console.warn(`[${target.name}] Failed to scrape listing page: ${err.message}`);
        return [];
    }
}

// ─── Programmatic Image Watermark Sanitizer ──────────────────────────────────
function sanitizeImageUrl(scrapedImg) {
    if (!scrapedImg || typeof scrapedImg !== 'string') return '';
    let cleaned = scrapedImg.trim();
    // Strip dynamic watermark folders: e.g. /thumbnails/, /wm/
    cleaned = cleaned.replace(/\/(wm|thumbnails)\//gi, '/');
    // Strip query parameters
    cleaned = cleaned.split('?')[0];
    return cleaned;
}

// ─── Scrape individual article page ───────────────────────────────────────────
async function scrapeArticlePage(url, categoryHint) {
    try {
        const response = await http.get(url);
        console.log(`[HTTP GET] ${url} | Status: ${response.status}`);
        const html = response.data;
        const $ = cheerio.load(html);

        // ── Title ──────────────────────────────────────────────────────────────
        let title = '';
        try {
            title = (
                $('h1').first().text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                $('title').text().split('|')[0].trim() ||
                ''
            ).substring(0, 300);
            if (!title) {
                console.log(`  [PARSING WARNING] Title element resolved to empty string for ${url}`);
            }
        } catch (e) {
            console.error(`  [PARSING ERROR] Title extraction failed for ${url}: ${e.message}`);
        }

        if (!title || title.length < 10) return null;

        // ── Image ──────────────────────────────────────────────────────────────
        const DEFAULT_STADIUM_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWqLWdMtuYcKiqRBma1U3nbxLwo4s_LzWCRXGbhUk-hwbLCLpyJBvisEVIxAkafTxr--Na_6-HCaJwViznYo-evYvrmshakfxaQsm7ozviLuvdS7swiPkDUkMLDSS6qrhzlxZxizr_IHS3SCZJM8I8qTRX2SUlET9W3bVjeOlWNe7_f4bUtOyn6gJcy_pKwQQ994O0mJ_';

        // ── Build image URL (Node-safe, no DOM dependencies) ───────────────────
        const scrapedImg = (
            $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('article img').first().attr('src') ||
            $('img').first().attr('src') ||
            ''
        );
        let imageUrl = DEFAULT_STADIUM_IMG;
        const cleanedImg = sanitizeImageUrl(scrapedImg);
        if (cleanedImg && cleanedImg.startsWith('http')) {
            try {
                const u = new URL(cleanedImg);
                const pathParts = u.pathname.toLowerCase().split('/');
                const filename = pathParts[pathParts.length - 1] || '';
                const parentPath = pathParts.slice(0, -1).join('/');

                // Only generic/structural branding keywords in the FILENAME itself
                const filenameBrandingIndicators = [
                    'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
                    'og-image', 'og_image', 'site-logo', 'site_logo', 'default-image', 'default_image',
                    'noimage', 'no-image', 'blank', 'generic', 'share-image', 'share_image'
                ];

                // Structural branding PARENT PATHS that indicate non-article images
                const pathBrandingIndicators = [
                    '/logos/', '/logo/', '/brand/', '/branding/',
                    '/default_images/', '/default-images/',
                    '/assets/images/', '/site-assets/'
                ];

                let isBranding = filenameBrandingIndicators.some(ind => filename.includes(ind));
                if (!isBranding) {
                    isBranding = pathBrandingIndicators.some(p => ('/' + parentPath + '/').includes(p));
                }

                if (!isBranding) {
                    imageUrl = cleanedImg;
                } else {
                    console.log(`  [PARSING INFO] Extracted image '${cleanedImg}' detected as branding; using fallback.`);
                }
            } catch (_) {}
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
            try {
                const els = $(sel);
                if (els.length > 0) {
                    // Strip scripts, ads, share buttons
                    els.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"]').remove();
                    bodyText = els.text().replace(/\s+/g, ' ').trim();
                    if (bodyText.length > 100) break;
                }
            } catch (e) {
                console.error(`  [PARSING ERROR] Body parsing failed for selector '${sel}': ${e.message}`);
            }
        }

        if (!bodyText) {
            console.log(`  [PARSING WARNING] Body text is empty for ${url}`);
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
        if (bullets.length >= 2) break;
        if (!bullets.some(b => b.includes(s.substring(0, 15)))) bullets.push(s);
    }
    while (bullets.length < 2) bullets.push('Παρακολουθήστε την εξέλιξη στο Panathinaikos News.');
    return bullets.slice(0, 2);
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

// ─── Quota exhaustion tracker ──────────────────────────────────────────────────
// If we hit the daily limit, stop wasting time on further API calls this run
let quotaExhausted = false;

// ─── Retry helper for 429 rate limits (per-minute throttle, not daily limit) ──
async function retryWithBackoff(fn, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const is429 = err.status === 429 || (err.message && err.message.includes('429'));
            if (!is429) throw err; // non-quota error — bubble up immediately

            // Check if it's a daily limit (cannot retry) vs per-minute throttle (can retry)
            const isDailyLimit = err.message && err.message.includes('per_day');
            if (isDailyLimit) {
                quotaExhausted = true;
                throw err;
            }

            if (attempt < maxRetries) {
                const waitMs = (attempt + 1) * 30000; // 30s, 60s
                console.log(`    [AI] Rate limit hit — waiting ${waitMs/1000}s before retry ${attempt + 1}/${maxRetries}...`);
                await sleep(waitMs);
            } else {
                throw err;
            }
        }
    }
}

// ─── Gemini API: bullets ───────────────────────────────────────────────────────
async function generateAiBullets(title, text, isOfficial = false) {
    const ai = getAiClient();
    if (!ai || quotaExhausted) return generateFallbackBullets(title, text);

    const cleanText = (text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\bσύμφωνα με\s+\S+/gi, '')
        .replace(/\b(gazzetta|sport24|sdna|sportal|athletiko|sport-fm)\b[\s.,]*/gi, '')
        .replace(/\s+/g, ' ').trim().substring(0, 4000);

    const toneInstruction = isOfficial 
        ? 'Επειδή πρόκειται για επίσημη πηγή της ομάδας, διατήρησε ένα απόλυτα έγκυρο, επίσημο ύφος δελτίου τύπου του συλλόγου (authoritative, official club press-release tone).' 
        : 'Γράφεις ΩΣ ανεξάρτητη αθλητική σύνταξη. ΠΟΤΕ μην αναφέρεις πού βρήκες την πληροφορία (καμία αναφορά σε άλλα portals, sites, «Σύμφωνα με...»).';

    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Είσαι in-house αθλητικός συντάκτης του Panathinaikos News. Βάσει των παρακάτω πληροφοριών, δημιούργησε ακριβώς 2 δυναμικά bullet points ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.

ΑΠΑΡΑΙΤΗΤΕΣ ΟΔΗΓΙΕΣ:
1. ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ να αντιγράψεις αυτούσιες φράσεις από το κείμενο. Κάνε πλήρη αναδιατύπωση των γεγονότων.
2. ${toneInstruction}
3. Κάθε bullet πρέπει να ξεκινάει με τον χαρακτήρα "•" και να αποτελείται ΑΥΣΤΗΡΑ από ακριβώς μία (1) πρόταση.

Έξοδος: Επίστρεψε ΜΟΝΟ τις 2 γραμμές με τα bullets (ξεκινώντας με "•"). Μην γράψεις κανένα άλλο εισαγωγικό ή επεξηγηματικό κείμενο.

Τίτλος: ${title}
Κείμενο: ${cleanText}`
        }));

        const textResponse = response.text.trim();
        const bullets = textResponse.split('\n')
            .map(line => line.trim())
            .filter(line => /^[\u2022\-*\s]/.test(line))
            .map(line => line.replace(/^[\u2022\-*\s]+/, '').trim())
            .filter(line => line.length > 5);
        if (bullets.length >= 2) return bullets.slice(0, 2);
        throw new Error('Found only ' + bullets.length + ' bullets');
    } catch (err) {
        if (quotaExhausted) console.warn('[AI] Daily quota exhausted — using fallback bullets.');
        else console.warn('[AI] Bullets fallback:', err.message?.substring(0, 80));
        return generateFallbackBullets(title, text);
    }
}

// ─── Gemini API: long-form article ────────────────────────────────────────────
async function generateLongFormContent(title, text, isOfficial = false) {
    const ai = getAiClient();
    if (!ai || quotaExhausted) return null;

    const cleanText = (text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\bσύμφωνα με\s+\S+/gi, '')
        .replace(/\b(gazzetta|sport24|sdna|sportal|athletiko|sport-fm)\b[\s.,]*/gi, '')
        .replace(/\s+/g, ' ').trim().substring(0, 6000);

    const toneInstruction = isOfficial 
        ? 'Επειδή πρόκειται για επίσημη πηγή της ομάδας, διατήρησε ένα απόλυτα έγκυρο, επίσημο ύφος δελτίου τύπου του συλλόγου (authoritative, official club press-release tone).' 
        : 'ΠΟΤΕ μην αναφέρεις την αρχική πηγή ή άλλα μέσα ενημέρωσης. Απαγορεύονται φράσεις όπως «Σύμφωνα με...», «Το Sportal/Gazzetta/SDNA αναφέρει...», «Όπως γράφεται...».';

    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Είσαι in-house αθλητικός αρχισυντάκτης του Panathinaikos News. Η συντακτική σου ομάδα παράγει αποκλειστικό, πρωτότυπο περιεχόμενο.
Βάσει των παρακάτω πληροφοριών, γράψε ένα πλήρες, 100% αυθεντικό, αυτόνομο αθλητικό άρθρο ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.

ΚΑΝΟΝΕΣ ZERO-TOLERANCE ΓΙΑ COPY-PASTE (ΑΥΣΤΗΡΑ):
1. ΑΠΑΓΟΡΕΥΕΤΑΙ ΡΗΤΑ να αντιγράψεις αυτούσιες προτάσεις, φράσεις ή παραγράφους από το πηγαίο υλικό.
2. Διάβασε το πηγαίο κείμενο, κράτησε ΜΟΝΟ τα βασικά γεγονότα (ποιος, τι, πότε, πού, γιατί) και γράψε ένα εντελώς νέο άρθρο από το μηδέν με δικό σου ύφος, εναλλακτικό λεξιλόγιο και διαφορετική δομή προτάσεων.
3. ${toneInstruction}
4. Το κείμενο πρέπει να είναι εκτενές (5-7 παράγραφοι, 400-600 λέξεις) και να αναλύει σε βάθος το θέμα, τις επιπτώσεις στην ομάδα, το context και το ιστορικό background.
5. ΜΟΝΟ καθαρό κείμενο, χωρίς HTML tags, χωρίς markdown (bolding, lists, stars κλπ.).
6. Διαχώρισε τις παραγράφους με μία κενή γραμμή.

Τίτλος: ${title}
Πληροφορίες: ${cleanText}

Γράψε ΜΟΝΟ το άρθρο, χωρίς τίτλο, χωρίς υπογραφή.`,
            config: {
                temperature: 0.8,
                maxOutputTokens: 2048
            }
        }));

        const articleText = response.text.trim();
        if (articleText && articleText.length > 100) {
            console.log(`[AI] Long-form generated: ${articleText.length} chars`);
            return articleText;
        }
    } catch (err) {
        if (quotaExhausted) console.warn('[AI] Daily quota exhausted — skipping long-form.');
        else console.warn(`[AI] Long-form failed: ${err.message?.substring(0, 80)}`);
    }
    return null;
}

// ─── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
// ─── Staggering configuration ───────────────────────────────────────────────────────
// Wait 2 minutes (120,000 ms) between processing each source target to avoid rate‑limit spikes.
// Skipped during dry‑run for faster testing.
const TARGET_STAGGER_MS = 120000;

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

            // Cross-category URL guard: prevent basketball articles leaking into football source and vice versa
            const urlLower = articleUrl.toLowerCase();
            const isBasketUrl = /\/(mpasket|basket|basketball)\//.test(urlLower);
            const isFootballUrl = /\/(podosfairo|football|soccer)\//.test(urlLower);
            if (target.category === 'Ποδόσφαιρο' && isBasketUrl) {
                console.log(`  [SKIP] Basketball URL in football source: ${scraped.title.substring(0, 50)}`);
                continue;
            }
            if (target.category === 'Μπάσκετ' && isFootballUrl) {
                console.log(`  [SKIP] Football URL in basketball source: ${scraped.title.substring(0, 50)}`);
                continue;
            }

            console.log(`  [NEW] ${scraped.title.substring(0, 70)}`);

            // ── Group ID via Jaccard (disabled) ──────────────────────────
            // Previously, articles could be grouped by similarity. The new production requirement is to ingest EVERY new article without grouping.
            // We assign a fresh unique group_id for each article.
            const group_id = crypto.randomUUID();
            // The JACCARD_THRESHOLD and similarity loop have been removed.
            // This ensures each article is treated as a distinct story.

            // ── AI Generation ─────────────────────────────────────────────────
            const bullets = await generateAiBullets(scraped.title, scraped.content || scraped.summary, target.isOfficial);
            const longFormContent = await generateLongFormContent(scraped.title, scraped.content || scraped.summary, target.isOfficial);

            if (isDryRun) {
                console.log(`    Category:  ${target.category}`);
                console.log(`    URL:       ${articleUrl}`);
                console.log(`    Image:     ${scraped.imageUrl || 'none'}`);
                console.log(`    Summary:   ${scraped.summary.substring(0, 100)}...`);
                console.log(`    Bullets:   ${JSON.stringify(bullets)}`);
                console.log(`    Long-form: ${longFormContent ? longFormContent.substring(0, 80) + '...' : 'AI unavailable'}`);
                totalNew++;
                continue;
            }

            // If AI failed (quota exceeded), skip to avoid storing verbatim source text
            if (!longFormContent) {
                console.log(`    [SKIP] AI generation failed — skipping to avoid verbatim content.`);
                continue;
            }

            // ── Insert to DB ──────────────────────────────────────────────────
            const dbPayload = {
                title:      scraped.title,
                summary:    scraped.summary,
                content:    longFormContent,
                source_url: articleUrl,
                image_url:  scraped.imageUrl,
                category:   target.category,
                created_at: scraped.created_at,
                group_id,
                bullets,
                updated_at: new Date().toISOString(),
            };
            console.log(`[DB PAYLOAD] Inserting to Supabase:`, JSON.stringify(dbPayload, null, 2));

            const { data: inserted, error: insertErr } = await db.from('articles').insert(dbPayload).select('id');

            if (insertErr) {
                console.error(`[DB ERROR] Supabase insert failed:`, JSON.stringify(insertErr, null, 2));
                if (insertErr.code === '23505') {
                    console.log(`    → Duplicate content, skipped.`);
                } else {
                    console.error(`    → DB insert error: ${insertErr.message}`);
                }
                continue;
            } else {
                console.log(`[DB RESPONSE] Insert success:`, JSON.stringify(inserted, null, 2));
            }

            existingUrls.add(articleUrl);
            existingArticles.unshift({ id: inserted[0].id, title: scraped.title, source_url: articleUrl, group_id, created_at: scraped.created_at });
            totalNew++;
            console.log(`    ✅ Inserted (id=${inserted[0].id})`);

            // Rate limit between AI calls
            await sleep(1500);
        }
        // After finishing all articles for this source, stagger before next target (skip in dry‑run)
        if (!isDryRun) {
            console.log(`[STAGGER] Pausing ${TARGET_STAGGER_MS/1000}s before next source to regulate Gemini API traffic`);
            await new Promise(resolve => setTimeout(resolve, TARGET_STAGGER_MS));
        }
    }

    console.log(`\n[SCRAPER] Done. New: ${totalNew} | Skipped: ${totalSkipped} | ${new Date().toISOString()}`);
    return { totalNew, totalSkipped };
}

if (require.main === module) {
    main().catch(err => {
        console.error('[FATAL] Scraper crashed:', err.message);
        process.exit(1);
    });
}

module.exports = { main };