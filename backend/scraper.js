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
// Uses full Chrome 136 browser fingerprint to avoid anti-bot detection.
// Missing sec-fetch-* and Referer headers cause 403/503 on modern sites.
const http = axios.create({
    timeout: 25000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'el-GR,el;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
    },
    maxRedirects: 5,
});

// ─── HTTP GET with retry (for transient 503/429/network errors) ───────────────
// retryOn403: some sites (SDNA, PAO BC) use 403 as a temporary CDN rate-limit,
// not a permanent block. Setting retryOn403=true will retry those with longer backoff.
async function httpGetWithRetry(url, extraHeaders = {}, retries = 3, retryOn403 = false, timeoutMs = null) {
    const baseOrigin = (() => { try { return new URL(url).origin + '/'; } catch { return undefined; } })();
    const headers = baseOrigin ? { 'Referer': baseOrigin, ...extraHeaders } : extraHeaders;
    const reqConfig = timeoutMs ? { headers, timeout: timeoutMs } : { headers };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await http.get(url, reqConfig);
        } catch (err) {
            const status = err.response?.status;
            const isTransient = !status || status === 503 || status === 429 || status === 502 || status === 520 || status === 521;
            const isTreatable403 = retryOn403 && status === 403;
            if ((isTransient || isTreatable403) && attempt < retries) {
                // Longer backoff for 403 (CDN throttle) vs normal transient errors
                const delay = isTreatable403 ? attempt * 10000 : attempt * 5000;
                console.warn(`[RETRY ${attempt}/${retries}] ${status || err.code} on ${url} — retrying in ${delay/1000}s`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw err; // permanent block or max retries reached → propagate
        }
    }
}

// ─── Target URLs per category ──────────────────────────────────────────────────
const SCRAPE_TARGETS = [
    // ── FOOTBALL ──────────────────────────────────────────────────────────────
    {
        category: 'Γενικά',
        name: 'Sport-FM',
        url: 'https://www.sport-fm.gr/tag/pao',
        articleLinkSelectors: [
            '.archive-posts-col .archive-row-tile > a[href*="/article/"]',
            '.archive-posts-col .archive-row-tile > a',
            '.archive-left a[href*="/article/"]',
        ],
        baseUrl: 'https://www.sport-fm.gr',
    },
    {
        category: 'Ερασιτέχνης', // default fallback — detectCategoryFromUrl() will override to Football/Basketball based on article URL
        name: 'SDNA',
        url: 'https://www.sdna.gr/teams/panathinaikos',
        articleLinkSelectors: ['.split-content__main a[href*="/podosfairo/"]', '.split-content__main a[href*="/mpasket/"]', '.split-content__main a[href*="/bolei/"]', '.split-content__main a[href*="/polo/"]', '.split-content__main a[href*="/stivos/"]'],
        baseUrl: 'https://www.sdna.gr',
        retryOn403: true,
        sdnaNumericOnly: true, // filter: only accept links that contain a numeric article ID
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Sportal Football',
        url: 'https://www.sportal.gr/podosfairo/panathinaikos-551',
        articleLinkSelectors: [
            '.archive__main-col h3.card__title a',
            '.archive__main-col .card__link',
            '.main-posts-vertical-stack h3 a',
            '.main-posts-vertical-stack .card__link',
            '.archive__main-col h2 a',
            '.archive__main-col article h3 a',
        ],
        baseUrl: 'https://www.sportal.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Sport24 Football',
        url: 'https://www.sport24.gr/football/tag/panathinaikos/',
        articleLinkSelectors: [
            '.category__content h2 a',
            '.category__content h3 a',
            '.category__content .article-title a',
            '.category__content .story-title a',
            '.category__content .headline a',
            '.category__content a[href*="/football/"]'
        ],
        baseUrl: 'https://www.sport24.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Gazzetta Football',
        url: 'https://www.gazzetta.gr/football/panathinaikos',
        articleLinkSelectors: [
            '.list-article__info a.link-overall',
            '.list-article__info h3 a'
        ],
        baseUrl: 'https://www.gazzetta.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'Athletiko Football',
        url: 'https://www.athletiko.gr/panathinaikos-podosfairo',
        articleLinkSelectors: [
            '#ajax-content h2 a',
            '#ajax-content h3 a',
            '#ajax-content .article-title a',
            '#ajax-content .post-title a',
            '#ajax-content a[href*="panathinaikos"]'
        ],
        baseUrl: 'https://www.athletiko.gr',
    },
    // Sportdog Football: DISABLED — site uses JavaScript rendering, static scraper gets only matchzone links, no articles.
    // {
    //     category: 'Ποδόσφαιρο',
    //     name: 'Sportdog Football',
    //     url: 'https://www.sportdog.gr/teams/panathinaikos/panathinaikos-fc',
    //     articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.entry-title a', 'article a', 'a[href*="/sports/"]'],
    //     baseUrl: 'https://www.sportdog.gr',
    // },
    {
        category: 'Ποδόσφαιρο',
        name: 'Monobala Football',
        url: 'https://monobala.gr/category/teams/sl1/panathinaikos/',
        articleLinkSelectors: [
            '.post-list .sec-news-post h3 a',
            '.post-list article h3 a',
            '.content.post-list h3 a',
        ],
        baseUrl: 'https://monobala.gr',
    },
    // ── BASKETBALL ────────────────────────────────────────────────────────────
    {
        category: 'Μπάσκετ',
        name: 'Gazzetta Basketball',
        url: 'https://www.gazzetta.gr/basketball/panathinaikos',
        articleLinkSelectors: [
            '.list-article__info a.link-overall',
            '.list-article__info h3 a'
        ],
        baseUrl: 'https://www.gazzetta.gr',
    },
    {
        category: 'Μπάσκετ',
        name: 'Sport24 Basketball',
        url: 'https://www.sport24.gr/basket/tag/panathinaikos/',
        articleLinkSelectors: [
            '.category__content h2 a',
            '.category__content h3 a',
            '.category__content .article-title a',
            '.category__content .story-title a',
            '.category__content a[href*="/basket/"]'
        ],
        baseUrl: 'https://www.sport24.gr',
    },
    {
        category: 'Μπάσκετ',
        name: 'Athletiko Basketball',
        url: 'https://www.athletiko.gr/panathinaikos-mpasket',
        articleLinkSelectors: [
            '#ajax-content h2 a',
            '#ajax-content h3 a',
            '#ajax-content .article-title a',
            '#ajax-content .post-title a',
            '#ajax-content a[href*="panathinaikos"]'
        ],
        baseUrl: 'https://www.athletiko.gr',
    },
    // ── OFFICIAL PORTALS ───────────────────────────────────────────────────────
    {
        category: 'Ποδόσφαιρο',
        name: 'PAO Official',
        url: 'https://www.pao.gr/',
        articleLinkSelectors: [
            'article.postTiles h3 a',
            'article.postTiles .mask-image a'
        ],
        baseUrl: 'https://www.pao.gr',
        isOfficial: true,
    },
    {
        category: 'Ερασιτέχνης',
        name: 'PAO1908 Official',
        url: 'https://www.pao1908.com/category/nea/',
        articleLinkSelectors: ['.post a', 'h2 a', 'h3 a', '.entry-title a', 'article a', 'a[href*="/nea/"]'],
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

function getSourceNameFromUrl(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        if (hostname.includes('sdna.gr')) return 'SDNA';
        if (hostname.includes('sportal.gr')) return 'Sportal';
        if (hostname.includes('sport24.gr')) return 'Sport24';
        if (hostname.includes('gazzetta.gr')) return 'Gazzetta';
        if (hostname.includes('athletiko.gr')) return 'Athletiko';
        if (hostname.includes('sportdog.gr')) return 'Sportdog';
        if (hostname.includes('pao.gr')) return 'PAO Official';
        if (hostname.includes('pao1908.com')) return 'PAO1908 Official';
        if (hostname.includes('paobc.gr')) return 'PAO BC Official';
        const parts = hostname.replace('www.', '').split('.');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch (_) {
        return 'News';
    }
}

function isPanathinaikosArticle(title, text) {
    const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const combinedTitle = removeAccents(title || '');
    const combinedText = removeAccents(text || '');
    
    // Core Panathinaikos identifiers (unaccented)
    const coreKeywords = [
        'παναθηναικ', 'panathinaikos', 'pao fc', 'pao bc', 'καε παναθηναικος', 'παε παναθηναικος',
        'τριφυλλι', 'trifilli', 'οακα', 'oaka', 'λεωφορος', 'leoforos', 'βοτανικος', 'votanikos',
        'πρασιν', 'θυρα 13', 'gate 13', 'green heretics'
    ];

    // Player and coach names (both Greek and English/transliterated, unaccented)
    const personnelKeywords = [
        'αταμαν', 'ataman', 'σλουκας', 'sloukas', 'ιωαννιδης', 'ioannidis', 'τετε', 'tete',
        'μπακασετας', 'bakasetas', 'πελιστρι', 'pellistri', 'νιστρουπ', 'neestrup', 'μαξιμοβιτς',
        'μπαλτσεροφσκι', 'balcerowski', 'ναν', 'nunn', 'lessort', 'λεσορ', 'grant', 'γκραντ',
        'γκριγκονις', 'grigonis', 'ερνανγκομεθ', 'hernangomez', 'χουαντσο', 'juancho', 'papapetrou',
        'παπαπετρου', 'μητογλου', 'mitoglou', 'καλαιτζακης', 'kalaitzakis', 'γιουρτσεβεν',
        'yurtseven', 'osman', 'οσμαν', 'alonzo', 'alonza', 'αλονζο', 'αλονζα', 'κριστιανσεν',
        'christiansen', 'ντε φραι', 'de vrij'
    ];

    const isWordMatch = (word, text) => {
        const regex = new RegExp(`(?<=^|[^a-z0-9α-ω])${word}(?=$|[^a-z0-9α-ω])`, 'i');
        return regex.test(text);
    };

    // Helper to check match in a string
    const checkMatch = (str) => {
        const hasCore = coreKeywords.some(kw => str.includes(kw));
        const hasPersonnel = personnelKeywords.some(kw => {
            if (kw.length <= 4) return isWordMatch(kw, str);
            return str.includes(kw);
        });
        const hasPao = isWordMatch('παο', str) || isWordMatch('pao', str);
        return hasCore || hasPersonnel || hasPao;
    };

    // If either Title or Body matches, it passes this pre-filter.
    return checkMatch(combinedTitle) || checkMatch(combinedText);
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
async function scrapeArticleLinks(target, logErrorCallback) {
    try {
        const response = await httpGetWithRetry(target.url, {}, 3, target.retryOn403 || false, target.timeout || null);
        console.log(`[HTTP GET] ${target.url} | Status: ${response.status}`);
        const html = response.data;
        const $ = cheerio.load(html);
        const links = new Set();
        const isSitemap = target.url.endsWith('.xml') || target.url.includes('sitemap');

        for (const sel of target.articleLinkSelectors) {
            try {
                const elements = $(sel);
                if (elements.length === 0) {
                    console.log(`  [PARSING WARNING] Selector '${sel}' returned no elements on ${target.url}`);
                }
                elements.each((_, el) => {
                    let href = '';
                    if (isSitemap) {
                        href = $(el).text().trim();
                    } else {
                        href = $(el).attr('href') || '';
                    }
                    if (!href) {
                        console.log(`  [PARSING WARNING] Element matched by '${sel}' is missing URL value`);
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
                        
                        const blacklist = ['/archive/', '/author/', '/tag/', '/category/', '/video/', '/webtv/', '/en/'];
                        if (blacklist.some(b => u.pathname.includes(b))) return;
                        
                        // For sources with sdnaNumericOnly, only accept paths with a numeric article ID (e.g. /podosfairo/1449282_title)
                        if (target.sdnaNumericOnly && !/\/\d{5,}/.test(u.pathname)) return;
                        
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
        if (logErrorCallback) logErrorCallback(err.message);
        return null; // Return null instead of [] on error to indicate failure
    }
}

// ─── Programmatic Image Watermark Sanitizer ──────────────────────────────────
function sanitizeImageUrl(scrapedImg) {
    if (!scrapedImg || typeof scrapedImg !== 'string') return '';
    let cleaned = scrapedImg.trim();
    // Clean SDNA watermark styles (only for sdna.gr domains, since others don't have watermarks and styles/main might not exist)
    if (cleaned.toLowerCase().includes('sdna.gr')) {
        cleaned = cleaned.replace('/styles/og_image/', '/styles/main/');
    }
    // Strip dynamic watermark folders: e.g. /thumbnails/, /wm/
    cleaned = cleaned.replace(/\/(wm|thumbnails)\//gi, '/');
    // Strip query parameters
    cleaned = cleaned.split('?')[0];
    return cleaned;
}

// ─── Dynamic Category Router ─────────────────────────────────────────────────
function detectCategoryFromUrl(url, categoryHint) {
    const urlLower = url.toLowerCase();
    
    // Explicit sport keywords in URL path
    if (/\/(polo|volleyball|bolei|handball|erasitexnis|erasitechnis|amateur|water-polo|kolymvisi|stivos|skaki|ping-pong|skopia|pin-pon)\//.test(urlLower)) {
        return 'Ερασιτέχνης';
    }
    if (/\/(podosfairo|football|soccer|superleague)\//.test(urlLower)) {
        return 'Ποδόσφαιρο';
    }
    if (/\/(mpasket|basket|basketball|euroleague)\//.test(urlLower)) {
        return 'Μπάσκετ';
    }
    
    return categoryHint;
}

// ─── Scrape individual article page ───────────────────────────────────────────
async function scrapeArticlePage(url, categoryHint) {
    try {
        const response = await httpGetWithRetry(url);
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
        const DEFAULT_STADIUM_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMSNHvf5YF-W7L97CbaiKx5VJRD4gV0Hg4hF4QJSCrqJ8NRDKT2mlrcYM9-HeVPSFN1hVnIoxPXYMDPNA9MZrNmRakqPmQAux7v_bA3iFoShF9g6EU7kcRpDcXeidSSrY8OeI2ssBxitBmYyfDNjYXif_X0l2yHU-wLeYDUPFLq1a6yRhBP2W0ll-ZwL7GM0DTq3159q6_uDSqdy-hT99NVqtdu3pW82SXsf1d7ZLUfysmIvfYNJqOX2X9n5IZpEH51_snSOxd1CY';

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
        // User requested: Ignore source's specified time and always use the exact time we scrape it
        let created_at = new Date().toISOString();

        // ── Body text ──────────────────────────────────────────────────────────
        // Try progressively more specific selectors
        const bodySelectors = [
            'article .article-body', 'article .content', '.article-content',
            '.article-body', '.story-body', '.entry-content', '.post-content',
            '[class*="article-text"]', '[class*="article-content"]',
            '.single-article', 'article p', '.content-area p', 'main p',
        ];
        let bodyText = '';
        for (const sel of bodySelectors) {
            try {
                const els = $(sel);
                if (els.length > 0) {
                    // Strip scripts, ads, share buttons
                    els.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"]').remove();
                    // Map block elements to lines to preserve paragraph structure
                    const paragraphs = [];
                    els.find('p, div, br, li').each((i, el) => {
                        let t = $(el).text().replace(/[ \t]+/g, ' ').trim();
                        if ((el.name === 'li' || el.tagName === 'li') && t) t = '• ' + t;
                        if (t) paragraphs.push(t);
                    });
                    if (paragraphs.length > 0) {
                        bodyText = paragraphs.join('\n\n');
                    } else {
                        bodyText = els.text().replace(/[ \t]+/g, ' ').trim();
                    }
                    
                    // Clean promotional junk
                    bodyText = bodyText.replace(/Μην χάνεις είδηση[\s\S]{0,100}στην Google/gi, '').trim();
                    bodyText = bodyText.replace(/Ακολουθήστε το .*? στο Google News/gi, '').trim();
                    bodyText = bodyText.replace(/Βάλε το .*? στην Google/gi, '').trim();
                    
                    if (bodyText.length > 100) break;
                }
            } catch (e) {
                console.error(`  [PARSING ERROR] Body parsing failed for selector '${sel}': ${e.message}`);
            }
        }

        const isOfficial = url.includes('pao.gr') || url.includes('paobc.gr') || url.includes('pao1908.com');
        const minLength = isOfficial ? 0 : 500;

        if (!bodyText || bodyText.length < minLength) {
            console.log(`  [PARSING WARNING] Body text is too short or empty for ${url} (Length: ${bodyText.length}). Minimum is ${minLength}. Likely a video-only article. Skipping.`);
            return { status: 'skipped_size', length: bodyText ? bodyText.length : 0 };
        }

        const isVideoStub = (bodyText.includes('Δείτε το σχετικό απόσπασμα') || bodyText.includes('Πατήστε Play')) && bodyText.length < 800;
        if (isVideoStub) {
            console.log(`  [PARSING WARNING] Article is a video stub (Watch the video) with length ${bodyText.length}. Skipping.`);
            return { status: 'skipped_video_stub', length: bodyText.length };
        }

        // ── Summary (meta description) ─────────────────────────────────────────
        const summary = (
            $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            bodyText.substring(0, 200) ||
            title
        ).substring(0, 500);

        return { status: 'success', title, summary, content: bodyText, imageUrl, created_at, sourceUrl: url };
    } catch (err) {
        console.warn(`[SCRAPER] Failed to scrape article ${url}: ${err.message}`);
        return { status: 'failed_crawl', error: err.message };
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
let apiKeys = [];
let currentKeyIndex = 0;
let aiClientInstance = null;

// If we hit the daily limit across ALL keys, stop wasting time on further API calls
let quotaExhausted = false;
const geminiCallsPerKey = {};

function getAiClient() {
    if (apiKeys.length === 0) {
        const rawKey1 = process.env.GEMINI_API_KEY || '';
        const rawKey2 = process.env.GEMINI_API_KEY_2 || '';
        apiKeys = rawKey1.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (rawKey2) apiKeys.push(...rawKey2.split(',').map(k => k.trim()).filter(k => k.length > 0));
    }
    if (apiKeys.length === 0 || quotaExhausted) return null;

    if (!aiClientInstance) {
        const { GoogleGenAI } = require('@google/genai');
        aiClientInstance = new GoogleGenAI({ apiKey: apiKeys[currentKeyIndex] });
    }
    return aiClientInstance;
}

function rotateAiClient() {
    currentKeyIndex++;
    if (currentKeyIndex >= apiKeys.length) {
        quotaExhausted = true;
        console.warn(`[AI] CRITICAL: All ${apiKeys.length} API keys have exhausted their daily quota!`);
        return false;
    }
    console.warn(`[AI] Quota exhausted. Swapping to fallback key ${currentKeyIndex + 1}/${apiKeys.length}...`);
    aiClientInstance = null; // force re-initialization
    return true;
}

// ─── Retry helper for rate limits (throttle and daily quota fallback) ──────────
async function retryWithBackoff(fn, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fn();
            // Track successful calls per key index
            if (!geminiCallsPerKey[currentKeyIndex]) geminiCallsPerKey[currentKeyIndex] = 0;
            geminiCallsPerKey[currentKeyIndex]++;
            return res;
        } catch (err) {
            const status = err.status || err.code;
            const msg = (err.message || '').toLowerCase();
            const isRetryable = status === 429 || status === 503 || status === 500 || status === 502 || 
                                msg.includes('429') || msg.includes('503') || msg.includes('500') || 
                                msg.includes('502') || msg.includes('fetch failed') || 
                                msg.includes('econnreset') || msg.includes('timeout') || msg.includes('socket');
            if (!isRetryable) throw err; // non-retryable error — bubble up immediately

            // A 429 can mean per-minute throttle OR daily quota exhaustion
            // The new SDK usually says "Quota exceeded for metric..." or "Resource has been exhausted"
            const msgLower = (err.message || '').toLowerCase();
            const isResourceExhausted = msgLower.includes('quota exceeded') || msgLower.includes('exhausted') || msgLower.includes('quota');
            const isDailyLimit = msgLower.includes('per_day');

            if (isResourceExhausted || isDailyLimit) {
                if (rotateAiClient()) {
                    attempt--; // Don't count against retries, it's a new key
                    continue; // Try immediately with the new key
                } else {
                    throw err; // All keys exhausted
                }
            }

            if (attempt < maxRetries) {
                const waitMs = (attempt + 1) * 30000; // 30s, 60s
                console.log(`    [AI] Rate limit hit (throttle) — waiting ${waitMs/1000}s before retry ${attempt + 1}/${maxRetries}...`);
                await sleep(waitMs);
            } else {
                throw err;
            }
        }
    }
}

// ─── Gemini API: combined article data (bullets + long-form) ────────────────
async function generateArticleData(title, text, isOfficial = false) {
    const ai = getAiClient();
    if (!ai || quotaExhausted) return null;

    const cleanText = (text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\bσύμφωνα με\s+\S+/gi, '')
        .replace(/\b(gazzetta|sport24|sdna|sportal|athletiko|sport-fm)\b[\s.,]*/gi, '')
        .replace(/\s+/g, ' ').trim().substring(0, 6000);

    const toneInstruction = isOfficial 
        ? 'Επειδή πρόκειται για επίσημη πηγή της ομάδας, διατήρησε ένα απόλυτα έγκυρο, επίσημο ύφος δελτίου τύπου του συλλόγου (authoritative, official club press-release tone).' 
        : 'ΠΟΤΕ μην αναφέρεις την αρχική πηγή ή άλλα μέσα ενημέρωσης. Απαγορεύονται φράσεις όπως «Σύμφωνα με...», «Το Sportal/Gazzetta/SDNA αναφέρει...», «Όπως γράφεται...». Γράφεις ΩΣ ανεξάρτητη αθλητική σύνταξη.';

    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Είσαι in-house αθλητικός αρχισυντάκτης του Panathinaikos News.
Βάσει των παρακάτω πληροφοριών, αξιολόγησε τη σχετικότητα του θέματος με τον Παναθηναϊκό (ποδόσφαιρο, μπάσκετ, ερασιτέχνη, διοίκηση, μεταγραφές κλπ.) και γράψε ένα αντικειμενικό, υψηλής ποιότητας, αναδιατυπωμένο άρθρο (summary) και 2 bullets ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.

ΑΠΑΝΤΗΣΕ ΑΠΟΚΛΕΙΣΤΙΚΑ σε μορφή JSON, με τα εξής keys (ΧΩΡΙΣ Markdown code blocks, ΧΩΡΙΣ "json"):
{
  "is_panathinaikos_relevant": true ή false (βάλε false αν το άρθρο αφορά γενική διεθνή ειδησεογραφία, άλλα αθλήματα/ομάδες χωρίς καμία σύνδεση με τον Παναθηναϊκό, ή άσχετα παγκόσμια γεγονότα),
  "title": "ο αναδιατυπωμένος τίτλος (ελαφρώς διαφορετικός από τον αρχικό, πιο clicky/attractive αλλά ακριβής, χωρίς υπερβολές)",
  "content": "το αναδιατυπωμένο άρθρο (σύμφωνα με τους κανόνες παρακάτω)",
  "bullets": ["Bullet 1", "Bullet 2"]
}

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΟ content:
1. Μορφή & Μήκος: Γράψε μια συμπαγή, φυσική σύνοψη ακριβώς δύο (2) παραγράφων που να αντιπροσωπεύει περίπου το 60% των βασικών γεγονότων. Αποέφυγε τη μονολεκτική ή μονογραμμική υπερ-συμπίεση, αλλά και τις περιττές σάλτσες. Πρέπει να διαβάζεται στρωτά ως 2 ολοκληρωμένες παράγραφοι.
2. Ακρίβεια: Διατήρησε 100% τα ακριβή πραγματικά περιστατικά, ονόματα, νούμερα και δεδομένα. Απαγορεύεται η προσθήκη μη επιβεβαιωμένων πληροφοριών.
3. Αναδιατύπωση: Το άρθρο πρέπει να είναι πλήρως ξαναγραμμένο με δικές σου λέξεις. Απαγορεύεται το copy-paste.
4. ${toneInstruction}
5. Διαχώρισε τις παραγράφους με μία κενή γραμμή (\\n\\n). ΜΟΝΟ καθαρό κείμενο.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΑ bullets:
1. Ακριβώς 2 bullets (strings μέσα στο array). Απαγορεύεται η αντιγραφή από το κείμενο.
2. Κάθε bullet πρέπει να παρουσιάζει διαφορετικά δεδομένα. Απαγορεύεται η επανάληψη.
3. Ακριβώς μία (1) πρόταση ανά bullet. Μην βάζεις σύμβολα όπως "•" στην αρχή του string.

Τίτλος: ${title}
Πληροφορίες: ${cleanText}`,
            config: {
                temperature: 0.8,
                maxOutputTokens: 2048
            }
        }));

        const rawResponse = response.text.trim();
        const jsonString = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(jsonString);

        if (parsed.is_panathinaikos_relevant === false) {
            console.log(`  [AI EVALUATION] Article determined NOT relevant: "${title}"`);
            return { isRelevant: false, content: null, title: null, bullets: [] };
        }

        const articleText = (parsed.content || '').trim();
        const newTitle = (parsed.title || title).trim();
        const bullets = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 2) : [];
        
        if (articleText && articleText.length > 100) {
            console.log(`  [AI] Article Data generated: ${articleText.length} chars, ${bullets.length} bullets. Title: ${newTitle}`);
            return { isRelevant: true, content: articleText, title: newTitle, bullets };
        }
    } catch (err) {
        if (quotaExhausted) console.warn('[AI] Daily quota exhausted — skipping article generation.');
        else console.warn(`[AI] Article generation failed: ${err.message?.substring(0, 80)}`);
    }
    return null;
}

// ─── Gemini API: semantic deduplication ────────────────────────────────────────────
async function checkSemanticDuplicate(newTitle, newSummary, candidateArticles) {
    if (!candidateArticles || candidateArticles.length === 0) return null;
    const ai = getAiClient();
    if (!ai || quotaExhausted) return null;

    const candidatesList = candidateArticles.map(a => `ID: ${a.id}\nΤίτλος: ${a.title}`).join('\n\n');

    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Αξιολόγησε αν το ΝΕΟ ΑΡΘΡΟ αναφέρεται ΣΤΟ ΙΔΙΟ ΑΚΡΙΒΩΣ γεγονός (ίδιο κύριο πρόσωπο/οντότητα ΚΑΙ ίδια ακριβώς ενέργεια/γεγονός) με κάποιο από τα ΠΙΘΑΝΑ ΥΠΑΡΧΟΝΤΑ ΑΡΘΡΑ.
Αν ναι, επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ το ID του ταυτιζόμενου άρθρου. Αν όχι, επίστρεψε "null". ΜΗΝ δικαιολογήσεις την απάντησή σου.

ΝΕΟ ΑΡΘΡΟ:
Τίτλος: ${newTitle}
Σύνοψη: ${newSummary ? newSummary.substring(0, 200) : ''}

ΠΙΘΑΝΑ ΥΠΑΡΧΟΝΤΑ ΑΡΘΡΑ:
${candidatesList}`,
            config: {
                temperature: 0.1,
                maxOutputTokens: 20
            }
        }));

        const result = response.text.trim();
        if (result && result !== 'null' && result.length > 5) {
            return result;
        }
    } catch (err) {
        console.warn(`[AI] Semantic deduplication check failed: ${err.message?.substring(0, 80)}`);
    }
    return null;
}

// ─── Gemini API: combined article data (bullets + long-form) ────────────────
async function generateCombinedArticleData(articleA, articleB, isOfficial = false) {
    const ai = getAiClient();
    if (!ai || quotaExhausted) return null;

    const toneInstruction = isOfficial 
        ? 'Επειδή πρόκειται για επίσημη πηγή της ομάδας, διατήρησε ένα απόλυτα έγκυρο, επίσημο ύφος δελτίου τύπου του συλλόγου.' 
        : 'ΠΟΤΕ μην αναφέρεις την αρχική πηγή ή άλλα μέσα ενημέρωσης. Απαγορεύονται φράσεις όπως «Σύμφωνα με...», «Το Sportal/Gazzetta/SDNA αναφέρει...».';

    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Είσαι in-house αθλητικός αρχισυντάκτης του Panathinaikos News.
Έχεις λάβει ΔΥΟ διαφορετικά ρεπορτάζ από διαφορετικές πηγές που αφορούν το ΙΔΙΟ ακριβώς γεγονός. Πρέπει να τα συνδυάσεις και να γράψεις ΕΝΑ, ενιαίο, αντικειμενικό, υψηλής ποιότητας άρθρο (summary) ΚΑΙ 2 bullets ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά, το οποίο να περιέχει ΟΛΕΣ τις μοναδικές λεπτομέρειες και από τα δύο κείμενα (π.χ. οικονομικά δεδομένα από το ένα, δηλώσεις από το άλλο).

ΑΠΑΝΤΗΣΕ ΑΠΟΚΛΕΙΣΤΙΚΑ σε μορφή JSON, με τα εξής keys (ΧΩΡΙΣ Markdown code blocks, ΧΩΡΙΣ "json"):
{
  "title": "ο νέος, ενιαίος τίτλος",
  "content": "το αναδιατυπωμένο και συνδυασμένο άρθρο (σύμφωνα με τους κανόνες)",
  "bullets": ["Bullet 1", "Bullet 2"]
}

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΟ content:
1. Μορφή & Μήκος: Γράψε μια συμπαγή, φυσική σύνοψη ακριβώς δύο (2) παραγράφων.
2. Ακρίβεια: Διατήρησε 100% τα ακριβή πραγματικά περιστατικά. Ενσωμάτωσε ΟΛΑ τα σημαντικά δεδομένα και από τις δύο πηγές.
3. Αναδιατύπωση: Απαγορεύεται το copy-paste αυτούσιων φράσεων.
4. ${toneInstruction}
5. ΜΟΝΟ καθαρό κείμενο, χωρίς HTML tags, χωρίς markdown.
6. Διαχώρισε τις παραγράφους με μία κενή γραμμή.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΑ bullets:
1. Ακριβώς 2 bullets (strings μέσα στο array).
2. Κάθε bullet πρέπει να παρουσιάζει διαφορετικά δεδομένα. Απαγορεύεται η επανάληψη.
3. Ακριβώς μία (1) πρόταση ανά bullet. Μην βάζεις σύμβολα όπως "•" στην αρχή του string.

ΠΗΓΗ 1:
Τίτλος: ${articleA.title}
Κείμενο: ${(articleA.content || '').substring(0, 3000)}

ΠΗΓΗ 2:
Τίτλος: ${articleB.title}
Κείμενο: ${(articleB.content || '').substring(0, 3000)}`,
            config: {
                temperature: 0.5,
                maxOutputTokens: 2048
            }
        }));

        const rawResponse = response.text.trim();
        const jsonString = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(jsonString);

        if (parsed.content && parsed.content.length > 100) {
            const bullets = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 2) : [];
            console.log(`  [AI] Combined Article Data generated: ${parsed.content.length} chars, ${bullets.length} bullets. Title: ${parsed.title}`);
            return { content: parsed.content.trim(), title: (parsed.title || '').trim(), bullets };
        }
    } catch (err) {
        console.warn(`[AI] Combined Long-form failed: ${err.message?.substring(0, 80)}`);
    }
    return null;
}

// ─── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
// ─── Staggering configuration ───────────────────────────────────────────────────────
// Wait 20 seconds (20000 ms) between processing each source target.
// Skipped during dry‑run for faster testing.
const TARGET_STAGGER_MS = 20000;

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`\n[SCRAPER] Panathinaikos Direct Scraper — Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE-SYNC'}`);
    console.log(`[SCRAPER] Targets: ${SCRAPE_TARGETS.length} sources | ${new Date().toISOString()}\n`);

    const runStartTime = new Date().toISOString();
    const runStats = {
        totals: {
            scraped: 0,
            added: 0,
            merged: 0,
            skipped_duplicate: 0,
            skipped_relevance: 0,
            skipped_size: 0,
            skipped_crawling_failed: 0,
            skipped_technical_error: 0,
            skipped_other: 0
        },
        sources: {},
        recent_errors: []
    };

    function logRunError(sourceName, url, type, message) {
        if (!runStats.recent_errors) runStats.recent_errors = [];
        if (runStats.recent_errors.length < 20) {
            runStats.recent_errors.push({
                time: new Date().toISOString(),
                source: sourceName,
                url: url || null,
                type: type, // 'crawl', 'parse', 'api', 'db'
                message: message
            });
        }
    }

    function logSkippedArticle(sourceName, url, title, reason, details) {
        if (!runStats.skipped_details) runStats.skipped_details = [];
        if (runStats.skipped_details.length < 100) {
            runStats.skipped_details.push({
                source: sourceName,
                url: url || '',
                title: title || 'Unknown Title',
                reason: reason, // 'relevance', 'size', 'promo', 'crawling_failed'
                details: details || ''
            });
        }
    }
    
    // Initialize stats per source target
    SCRAPE_TARGETS.forEach(target => {
        runStats.sources[target.name] = {
            scraped: 0,
            added: 0,
            merged: 0,
            skipped_duplicate: 0,
            skipped_relevance: 0,
            skipped_size: 0,
            skipped_crawling_failed: 0,
            skipped_technical_error: 0,
            skipped_other: 0
        };
    });

    // ── Supabase ──────────────────────────────────────────────────────────────
    let db = null;
    let existingUrls = new Set();
    let existingArticles = [];

    if (!isDryRun) {
        const rawUrl = process.env.SUPABASE_URL;
        const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        const url = rawUrl ? rawUrl.trim().replace(/^['"]|['"]$/g, '') : '';
        const key = rawKey ? rawKey.trim().replace(/^['"]|['"]$/g, '') : '';
        if (!url || !key) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
        }
        db = createClient(url, key);

        // Load existing articles from the last 30 days for deduping ignored URLs,
        // but limit duplicate group merging candidates to the last 48 hours.
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await db.from('articles')
            .select('id, title, source_url, group_id, created_at, category')
            .gte('created_at', thirtyDaysAgo)
            .order('created_at', { ascending: false })
            .limit(10000);

        if (error) {
            throw new Error(`DB error: ${error.message}`);
        }
        const rawDbArticles = data || [];
        existingUrls = new Set();
        existingArticles = [];

        const twoDaysAgoMs = Date.now() - 48 * 60 * 60 * 1000;

        rawDbArticles.forEach(a => {
            if (a.source_url) {
                a.source_url.split(',').forEach(u => existingUrls.add(u.trim()));
            }
            // Only add valid, non-ignored, recent articles (< 48h) to existingArticles for merge matching
            const isIgnored = a.group_id === 'IGNORED_URLS' || (a.title && a.title.includes('[IGNORED')) || a.category === 'SystemRoster';
            if (!isIgnored) {
                const createdMs = new Date(a.created_at).getTime();
                if (createdMs >= twoDaysAgoMs) {
                    existingArticles.push(a);
                }
            }
        });
        console.log(`[DB] Loaded ${existingUrls.size} URLs for deduplication and ${existingArticles.length} recent articles for group merging.\n`);
    }

    let totalNew = 0, totalSkipped = 0;

    // ── Process each source ───────────────────────────────────────────────────
    for (const target of SCRAPE_TARGETS) {
        console.log(`\n[SOURCE] ${target.name} | ${target.category}`);

        const links = await scrapeArticleLinks(target, (msg) => logRunError(target.name, target.url, 'listing_fetch', msg));
        if (links === null) {
            runStats.sources[target.name].skipped_crawling_failed++;
            runStats.totals.skipped_crawling_failed++;
            logSkippedArticle(target.name, target.url, 'Listing Page Index', 'crawling_failed', 'Αδυναμία φόρτωσης αρχικής σελίδας (503/403/Timeout)');
            continue;
        }
        if (links.length === 0) { console.log(`  → No links found, skipping.`); continue; }

        runStats.sources[target.name].scraped += links.length;
        runStats.totals.scraped += links.length;

        for (const articleUrl of links) {
            // Skip if already in DB
            if (!isDryRun && existingUrls.has(articleUrl)) {
                totalSkipped++;
                runStats.sources[target.name].skipped_duplicate++;
                runStats.totals.skipped_duplicate++;
                continue;
            }

            // Skip specific promotional/irrelevant articles by keyword in URL
            const skipKeywords = ['back2mpak', 'live-stis', 'back2back', 'football-zone'];
            const lowerUrl = articleUrl.toLowerCase();
            if (skipKeywords.some(kw => lowerUrl.includes(kw))) {
                console.log(`[SKIP] Promotional/Live show article ignored by URL: ${articleUrl}`);
                runStats.sources[target.name].skipped_other++;
                runStats.totals.skipped_other++;
                logSkippedArticle(target.name, articleUrl, 'Unknown Title (Excluded by URL)', 'promo', 'Φίλτρο διεύθυνσης URL (Promo/Live show)');
                continue;
            }

            // Rate limit: 1s between article fetches
            await sleep(1000);

            const scraped = await scrapeArticlePage(articleUrl, target.category);
            if (!scraped || scraped.status === 'failed_crawl') {
                const errMsg = scraped ? scraped.error : 'Unknown HTTP crawl failure';
                logRunError(target.name, articleUrl, 'article_fetch', errMsg);
                runStats.sources[target.name].skipped_crawling_failed++;
                runStats.totals.skipped_crawling_failed++;
                logSkippedArticle(target.name, articleUrl, 'Unknown Title (Fetch Failed)', 'crawling_failed', `Αποτυχία λήψης άρθρου: ${errMsg.substring(0, 50)}`);
                continue;
            }
            if (scraped.status === 'skipped_size') {
                runStats.sources[target.name].skipped_size++;
                runStats.totals.skipped_size++;
                logSkippedArticle(target.name, articleUrl, 'Unknown Title (Too Short)', 'size', `Πολύ μικρό κείμενο: ${scraped.length || 0} χαρακτήρες (Video/Gallery)`);
                
                // Save ignored URL to prevent re-crawling
                if (!isDryRun) {
                    try {
                        await db.from('articles').insert({
                            id: `ignored_${crypto.randomUUID()}`,
                            title: '[IGNORED_SIZE]',
                            summary: '[IGNORED_SIZE]',
                            content: '[IGNORED_SIZE]',
                            source_url: articleUrl,
                            category: 'SystemRoster',
                            group_id: 'IGNORED_URLS',
                            created_at: new Date().toISOString()
                        });
                        existingUrls.add(articleUrl);
                    } catch (e) {
                        console.error(`    [DB ERROR] Failed to save ignored size URL: ${e.message}`);
                    }
                }
                continue;
            }

            // Check PAO relevance
            if (!isPanathinaikosArticle(scraped.title, scraped.content)) {
                console.log(`  [SKIP] Not PAO-relevant: ${scraped.title.substring(0, 50)}`);
                runStats.sources[target.name].skipped_relevance++;
                runStats.totals.skipped_relevance++;
                logSkippedArticle(target.name, articleUrl, scraped.title, 'relevance', 'Τοπικό φίλτρο λέξεων (Not PAO-relevant)');
                
                // Save ignored URL to prevent re-crawling
                if (!isDryRun) {
                    try {
                        await db.from('articles').insert({
                            id: `ignored_${crypto.randomUUID()}`,
                            title: '[IGNORED_IRRELEVANT]',
                            summary: '[IGNORED_IRRELEVANT]',
                            content: '[IGNORED_IRRELEVANT]',
                            source_url: articleUrl,
                            category: 'SystemRoster',
                            group_id: 'IGNORED_URLS',
                            created_at: new Date().toISOString()
                        });
                        existingUrls.add(articleUrl);
                    } catch (e) {
                        console.error(`    [DB ERROR] Failed to save ignored irrelevant URL: ${e.message}`);
                    }
                }
                continue;
            }

            // Skip specific promotional/irrelevant articles by keyword in Title
            const lowerTitle = scraped.title.toLowerCase();
            if (skipKeywords.some(kw => lowerTitle.includes(kw)) || /\blive\b/.test(lowerTitle) || /\bαναμονή\b/.test(lowerTitle)) {
                console.log(`[SKIP] Promotional/Live show article ignored by Title: ${scraped.title}`);
                runStats.sources[target.name].skipped_other++;
                runStats.totals.skipped_other++;
                logSkippedArticle(target.name, articleUrl, scraped.title, 'promo', 'Φίλτρο τίτλου (Promo/Live show)');
                
                // Save ignored URL to prevent re-crawling
                if (!isDryRun) {
                    try {
                        await db.from('articles').insert({
                            id: `ignored_${crypto.randomUUID()}`,
                            title: '[IGNORED_PROMO]',
                            summary: '[IGNORED_PROMO]',
                            content: '[IGNORED_PROMO]',
                            source_url: articleUrl,
                            category: 'SystemRoster',
                            group_id: 'IGNORED_URLS',
                            created_at: new Date().toISOString()
                        });
                        existingUrls.add(articleUrl);
                    } catch (e) {
                        console.error(`    [DB ERROR] Failed to save ignored promo URL: ${e.message}`);
                    }
                }
                continue;
            }

            // Cross-category URL guard: prevent basketball articles leaking into football source and vice versa
            const urlLower = articleUrl.toLowerCase();
            const isBasketUrl = /\/(mpasket|basket|basketball)\//.test(urlLower);
            const isFootballUrl = /\/(podosfairo|football|soccer)\//.test(urlLower);
            if (target.category === 'Ποδόσφαιρο' && isBasketUrl) {
                console.log(`  [SKIP] Basketball URL in football source: ${scraped.title.substring(0, 50)}`);
                runStats.sources[target.name].skipped_other++;
                runStats.totals.skipped_other++;
                logSkippedArticle(target.name, articleUrl, scraped.title, 'promo', 'Διαχωρισμός κατηγορίας (Μπάσκετ σε Ποδόσφαιρο)');
                
                // Save ignored URL to prevent re-crawling
                if (!isDryRun) {
                    try {
                        await db.from('articles').insert({
                            id: `ignored_${crypto.randomUUID()}`,
                            title: '[IGNORED_CROSS_BASKET]',
                            summary: '[IGNORED_CROSS_BASKET]',
                            content: '[IGNORED_CROSS_BASKET]',
                            source_url: articleUrl,
                            category: 'SystemRoster',
                            group_id: 'IGNORED_URLS',
                            created_at: new Date().toISOString()
                        });
                        existingUrls.add(articleUrl);
                    } catch (e) {
                        console.error(`    [DB ERROR] Failed to save ignored cross URL: ${e.message}`);
                    }
                }
                continue;
            }
            if (target.category === 'Μπάσκετ' && isFootballUrl) {
                console.log(`  [SKIP] Football URL in basketball source: ${scraped.title.substring(0, 50)}`);
                runStats.sources[target.name].skipped_other++;
                runStats.totals.skipped_other++;
                logSkippedArticle(target.name, articleUrl, scraped.title, 'promo', 'Διαχωρισμός κατηγορίας (Ποδόσφαιρο σε Μπάσκετ)');
                
                // Save ignored URL to prevent re-crawling
                if (!isDryRun) {
                    try {
                        await db.from('articles').insert({
                            id: `ignored_${crypto.randomUUID()}`,
                            title: '[IGNORED_CROSS_FOOTBALL]',
                            summary: '[IGNORED_CROSS_FOOTBALL]',
                            content: '[IGNORED_CROSS_FOOTBALL]',
                            source_url: articleUrl,
                            category: 'SystemRoster',
                            group_id: 'IGNORED_URLS',
                            created_at: new Date().toISOString()
                        });
                        existingUrls.add(articleUrl);
                    } catch (e) {
                        console.error(`    [DB ERROR] Failed to save ignored cross URL: ${e.message}`);
                    }
                }
                continue;
            }

            console.log(`  [NEW] ${scraped.title.substring(0, 70)}`);

            // ── Cross-Source Cross-Publishing Deduplication ──────────────────
            const currentScrapedTime = new Date(scraped.created_at);
            
            // Collect candidates from the last 120/240 minutes in the same category
            const candidateArticles = existingArticles.filter(art => {
                const dbTime = new Date(art.created_at);
                const timeDiffMinutes = Math.abs(currentScrapedTime - dbTime) / (60 * 1000);
                
                const scrapedCategory = detectCategoryFromUrl(articleUrl, target.category);
                const isAmateur = (art.category && art.category.includes('Ερασιτέχνης')) || 
                                 (scrapedCategory && scrapedCategory.includes('Ερασιτέχνης'));
                const maxWindow = isAmateur ? 360 : 120;
                
                if (timeDiffMinutes > maxWindow) return false;
                
                const scrapedDomain = getSourceNameFromUrl(articleUrl);
                const dbDomain = getSourceNameFromUrl(art.source_url);
                if (scrapedDomain === dbDomain) return false; // same source, usually not a duplicate event but a different article
                
                return true;
            });

            let duplicateArticleId = null;

            if (candidateArticles.length > 0) {
                // First try Jaccard as a fast-pass (if extremely similar title)
                const exactMatch = candidateArticles.find(art => jaccardSimilarity(scraped.title, art.title) > 0.45);
                if (exactMatch) {
                    duplicateArticleId = exactMatch.id;
                } else {
                    // Check if any candidate has a similarity > 0.05 (at least 1 common word). If not, bypass AI completely
                    const hasPossibleMatch = candidateArticles.some(art => jaccardSimilarity(scraped.title, art.title) > 0.05);
                    
                    if (!hasPossibleMatch) {
                        console.log(`  [AI DEDUPLICATION BYPASS] Jaccard similarity too low. Assuming unique event.`);
                    } else {
                        // Fallback to Semantic AI Match for borderline cases
                        console.log(`  [AI DEDUPLICATION] Checking semantic match for "${scraped.title.substring(0, 40)}..." against ${candidateArticles.length} candidates.`);
                        duplicateArticleId = await checkSemanticDuplicate(scraped.title, scraped.summary, candidateArticles);
                    }
                }
            }
            
            const duplicateArticle = duplicateArticleId ? existingArticles.find(a => a.id === duplicateArticleId || a.id.startsWith(duplicateArticleId)) : null;

            if (duplicateArticle) {
                console.log(`  [DEDUPLICATION] Semantic Match found! Merging: "${scraped.title.substring(0, 50)}" with ID: ${duplicateArticle.id}`);
                if (!isDryRun) {
                    const { data: dbArt, error: fetchErr } = await db.from('articles')
                        .select('*')
                        .eq('id', duplicateArticle.id)
                        .single();
                    
                    if (!fetchErr && dbArt) {
                        const sourceName = getSourceNameFromUrl(articleUrl);
                        const isDbArtOfficial = (dbArt.source_url || '').toLowerCase().includes('pao.gr') || 
                                                (dbArt.source_url || '').toLowerCase().includes('paobc.gr') || 
                                                (dbArt.source_url || '').toLowerCase().includes('pao1908.com');
                        const isScrapedOfficial = !!target.isOfficial;

                        // We will update source_url
                        let newSourceUrl = dbArt.source_url || duplicateArticle.source_url || '';
                        if (!newSourceUrl.includes(articleUrl)) {
                            if (isScrapedOfficial) {
                                // Put official source first
                                newSourceUrl = articleUrl + ',' + newSourceUrl;
                            } else {
                                // Put new source last
                                newSourceUrl = newSourceUrl + ',' + articleUrl;
                            }
                        }

                        let newContent = dbArt.content;
                        let newTitle = dbArt.title;
                        let newBullets = dbArt.bullets;

                        if (isDbArtOfficial) {
                            console.log(`  [DEDUPLICATION] Existing article is official. Keeping verbatim content.`);
                        } else if (isScrapedOfficial) {
                            console.log(`  [DEDUPLICATION] Scraped article is official. Overwriting with official verbatim content.`);
                            newContent = scraped.content || scraped.summary;
                            newTitle = scraped.title;
                            newBullets = generateFallbackBullets(scraped.title, scraped.content || scraped.summary);
                        } else {
                            // Generate Combined Article Data (Long-form + Bullets) using AI
                            const combinedResult = await generateCombinedArticleData(dbArt, scraped, target.isOfficial);
                            newContent = combinedResult ? combinedResult.content : (dbArt.content || scraped.content);
                            newTitle = combinedResult ? combinedResult.title : dbArt.title;
                            newBullets = combinedResult ? combinedResult.bullets : dbArt.bullets;
                        }
                        
                        // Fallback bullets if missing
                        if (!newBullets || newBullets.length === 0) {
                            newBullets = generateFallbackBullets(newTitle, newContent);
                        }
                        const newSummary = newContent.substring(0, 300); // basic summary

                        // Prefer non-SDNA image
                        let newImageUrl = dbArt.image_url;
                        const isDbSdna = (dbArt.source_url || '').toLowerCase().includes('sdna.gr');
                        const isScrapedSdna = articleUrl.toLowerCase().includes('sdna.gr');
                        
                        if (!newImageUrl && scraped.imageUrl) {
                            newImageUrl = scraped.imageUrl;
                        } else if (isDbSdna && !isScrapedSdna && scraped.imageUrl) {
                            newImageUrl = scraped.imageUrl; // Swap SDNA watermark image with the clean one
                        }

                        const { error: updateErr } = await db.from('articles')
                            .update({ 
                                title: newTitle,
                                content: newContent, 
                                summary: newSummary,
                                bullets: newBullets,
                                source_url: newSourceUrl,
                                image_url: newImageUrl,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', duplicateArticle.id);
                            
                        if (updateErr) {
                            console.error(`  [DB ERROR] Failed to update merged sources:`, updateErr.message);
                            logRunError(target.name, articleUrl, 'database_error', updateErr.message);
                            runStats.sources[target.name].skipped_technical_error++;
                            runStats.totals.skipped_technical_error++;
                        } else {
                            console.log(`  ✅ Merged successfully (appended source ${sourceName} and bumped to top)`);
                            runStats.sources[target.name].merged++;
                            runStats.totals.merged++;
                            // update local cache to prevent redundant merges
                            duplicateArticle.created_at = new Date().toISOString(); 
                        }
                    }
                } else {
                    // Dry run merge simulation
                    runStats.sources[target.name].merged++;
                    runStats.totals.merged++;
                }
                totalSkipped++;
                continue;
            }

            const group_id = crypto.randomUUID();

            // ── AI Generation ─────────────────────────────────────────────────
            let aiResult = null;
            if (target.isOfficial) {
                // Bypass AI for official sources and use verbatim text
                aiResult = {
                    title: scraped.title,
                    content: scraped.content || scraped.summary,
                    bullets: generateFallbackBullets(scraped.title, scraped.content || scraped.summary),
                    isRelevant: true
                };
            } else {
                // Pre-AI Keyword Filter (Zero-cost relevance check)
                const combinedText = (scraped.title + ' ' + (scraped.content || scraped.summary)).toLowerCase();
                const paoKeywords = ['παναθηναϊκ', 'παναθηναικ', 'παο ', ' pao', 'pao ', 'τριφυλλ', 'πρασιν', 'οακα', 'λεωφορ', 'αταμαν', 'αλονσο', 'γιαννακοπουλ', 'αλαφουζ', 'τεριμ', 'γιοβανοβιτ', 'ντιεγκο αλονσο', 'συλλογος μεγαλος', 'εξαστερος', 'επταστερος'];
                const isLikelyRelated = paoKeywords.some(kw => combinedText.includes(kw));

                if (!isLikelyRelated) {
                    console.log(`    [PRE-FILTER] Article rejected (No PAO keywords): "${scraped.title}"`);
                    aiResult = { isRelevant: false };
                } else {
                    aiResult = await generateArticleData(scraped.title, scraped.content || scraped.summary, target.isOfficial);
                }
            }
            const bullets = (aiResult && aiResult.bullets) ? aiResult.bullets : generateFallbackBullets(scraped.title, scraped.content || scraped.summary);

            if (isDryRun) {
                console.log(`    Category:  ${target.category}`);
                console.log(`    URL:       ${articleUrl}`);
                console.log(`    Image:     ${scraped.imageUrl || 'none'}`);
                console.log(`    Summary:   ${scraped.summary.substring(0, 100)}...`);
                console.log(`    Bullets:   ${JSON.stringify(bullets)}`);
                console.log(`    Long-form: ${aiResult ? (aiResult.isRelevant ? aiResult.content.substring(0, 80) + '...' : 'Irrelevant article') : 'AI unavailable'}`);
                runStats.sources[target.name].added++;
                runStats.totals.added++;
                totalNew++;
                continue;
            }

            // If AI evaluated as NOT relevant (either via pre-filter or Gemini)
            if (aiResult && aiResult.isRelevant === false) {
                console.log(`    [SKIP] AI evaluated article as NOT relevant: "${scraped.title}"`);
                runStats.sources[target.name].skipped_relevance++;
                runStats.totals.skipped_relevance++;
                logSkippedArticle(target.name, articleUrl, scraped.title, 'relevance', 'Μη σχετικό περιεχόμενο (Relevance)');

                // FIX: Save irrelevant URLs to prevent infinite retries
                if (!isDryRun) {
                    try {
                        await db.from('articles').insert({
                            id: `ignored_${crypto.randomUUID()}`,
                            title: '[IGNORED]',
                            summary: '[IGNORED]',
                            content: '[IGNORED]',
                            source_url: articleUrl,
                            category: 'SystemRoster', // Frontend ignores this category
                            group_id: 'IGNORED_URLS',
                            created_at: new Date().toISOString()
                        });
                        existingUrls.add(articleUrl);
                    } catch (e) {
                        console.error(`    [DB ERROR] Failed to save ignored URL: ${e.message}`);
                    }
                }
                continue;
            }

            // Skip insertion if AI failed (e.g., quota exhausted). We DO NOT want raw content.
            if (!aiResult) {
                console.log(`    [SKIP] AI generation failed or quota exhausted. Skipping article so it can be retried later.`);
                logRunError(target.name, articleUrl, 'ai_error', 'Gemini AI response failed or quota exhausted');
                runStats.sources[target.name].skipped_technical_error++;
                runStats.totals.skipped_technical_error++;
                continue;
            }

            let finalContent = aiResult.content;
            let finalTitle = aiResult.title;
            let finalBullets = aiResult.bullets || [];

            // ── Insert to DB ──────────────────────────────────────────────────
            const dbPayload = {
                title:      finalTitle,
                summary:    scraped.summary || (finalContent ? finalContent.substring(0, 300) : ''),
                content:    finalContent,
                source_url: articleUrl,
                image_url:  scraped.imageUrl,
                category:   detectCategoryFromUrl(articleUrl, target.category),
                created_at: scraped.created_at,
                group_id,
                bullets:    finalBullets,
                updated_at: new Date().toISOString(),
            };
            console.log(`[DB PAYLOAD] Inserting to Supabase:`, JSON.stringify(dbPayload, null, 2));

            const { data: inserted, error: insertErr } = await db.from('articles').insert(dbPayload).select('id');

            if (insertErr) {
                console.error(`[DB ERROR] Supabase insert failed:`, JSON.stringify(insertErr, null, 2));
                if (insertErr.code === '23505') {
                    console.log(`    → Duplicate content, skipped.`);
                    runStats.sources[target.name].skipped_duplicate++;
                    runStats.totals.skipped_duplicate++;
                } else {
                    console.error(`    → DB insert error: ${insertErr.message}`);
                    logRunError(target.name, articleUrl, 'database_error', insertErr.message);
                    runStats.sources[target.name].skipped_technical_error++;
                    runStats.totals.skipped_technical_error++;
                }
                continue;
            } else {
                console.log(`[DB RESPONSE] Insert success:`, JSON.stringify(inserted, null, 2));
                runStats.sources[target.name].added++;
                runStats.totals.added++;
            }

            existingUrls.add(articleUrl);
            existingArticles.unshift({ id: inserted[0].id, title: scraped.title, source_url: articleUrl, group_id, created_at: scraped.created_at });
            totalNew++;
            console.log(`    ✅ Inserted (id=${inserted[0].id})`);

            // Rate limit between AI calls (skip in Vercel serverless environment to prevent timeouts)
            if (!process.env.VERCEL) {
                await sleep(1500);
            }
        }
        // After finishing all articles for this source, stagger before next target (skip in dry‑run or Vercel serverless environment)
        if (!isDryRun && !process.env.VERCEL) {
            console.log(`[STAGGER] Pausing ${TARGET_STAGGER_MS/1000}s before next source to regulate Gemini API traffic`);
            await new Promise(resolve => setTimeout(resolve, TARGET_STAGGER_MS));
        }
    }

    const runEndTime = new Date().toISOString();
    console.log(`\n[SCRAPER] Done. New: ${totalNew} | Skipped: ${totalSkipped} | ${runEndTime}`);

    if (!isDryRun && db) {
        // Populate Gemini keys usage info
        getAiClient();
        runStats.gemini = {
            key_count: apiKeys.length,
            current_index: currentKeyIndex,
            quota_exhausted: quotaExhausted,
            calls_by_key: geminiCallsPerKey,
            keys_status: apiKeys.map((key, idx) => {
                return {
                    index: idx,
                    masked: key.slice(0, 8) + '...' + key.slice(-4),
                    status: idx < currentKeyIndex ? 'exhausted' : (idx === currentKeyIndex && !quotaExhausted ? 'active' : 'exhausted')
                };
            })
        };

        console.log('[ANALYTICS] Writing run stats to scraping_runs table...');
        const { error: logErr } = await db.from('scraping_runs').insert({
            started_at: runStartTime,
            completed_at: runEndTime,
            status: 'success',
            stats: runStats
        });
        if (logErr) {
            console.error('[ANALYTICS] Failed to log scraping run stats:', logErr.message);
        } else {
            console.log('[ANALYTICS] Scraping run logged successfully.');
        }
    }

    return { totalNew, totalSkipped };
}

if (require.main === module) {
    main().catch(async (err) => {
        console.error('[FATAL] Scraper crashed:', err.message);
        process.exit(1);
    });
}

module.exports = { main };