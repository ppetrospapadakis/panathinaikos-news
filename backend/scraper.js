
// ─── Helper for generating slug URL ──────────────────────────────────────────
function getArticleSlugUrl(category, title, id) {
    let catPath = 'podosfairo';
    const cat = (category || '').toLowerCase();
    if (cat.includes('μπάσκετ') || cat.includes('basket')) catPath = 'basket';
    else if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) catPath = 'erasitexnis';
    else if (cat.includes('άποψη') || cat.includes('opinion')) catPath = 'apopsi';

    let cleanTitle = (title || '').toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0370-\u03FF\u1F00-\u1FFF-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '') || 'arthro';
    if (cleanTitle.length > 45) {
        const truncated = cleanTitle.substring(0, 45).replace(/-[^-]*$/, '');
        cleanTitle = truncated.length > 10 ? truncated : cleanTitle.substring(0, 45);
    }
    const shortId = (id || '').substring(0, 8);
    return `https://www.panathinaikosnews.gr/${catPath}/${cleanTitle}-id=${shortId}`;
}

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
const { publishToInstagram } = require('./instagram_poster');

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
    let targetUrl = url;
    let headers = { ...extraHeaders };

    // SDNA bypass via Jina AI reader (bypasses Cloudflare Bot Fight Mode 403 on Vercel/GitHub Actions)
    if (url.includes('sdna.gr') && !url.includes('r.jina.ai')) {
        targetUrl = 'https://r.jina.ai/' + url;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await axios.get(targetUrl, { timeout: timeoutMs || 25000 });
            } catch (err) {
                console.warn(`[RETRY JINA ${attempt}/${retries}] SDNA via Jina failed on ${targetUrl}: ${err.message}`);
                if (attempt < retries) await new Promise(r => setTimeout(r, 2000 * attempt));
                else throw err;
            }
        }
    }

    const baseOrigin = (() => { try { return new URL(url).origin + '/'; } catch { return undefined; } })();
    if (url.includes('sdna.gr')) {
        headers['User-Agent'] = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    }
    if (baseOrigin) headers['Referer'] = baseOrigin;
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
            
            // Special handling: Silently drop SDNA 403 errors to avoid log spam, as Vercel is permanently blocked by Cloudflare Bot Fight Mode.
            if (status === 403 && url.includes('sdna.gr')) {
                err.isSilentSDNA403 = true;
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
    {
        category: 'Γενικά',
        name: 'Sportime',
        url: 'https://sportime.gr/panathinaikos',
        articleLinkSelectors: [
            'a[href*="sportime.gr/panathinaikos/"]',
            'a[href*="sportime.gr/podosfairo/"]',
            'a[href*="sportime.gr/basket/"]'
        ],
        baseUrl: 'https://sportime.gr',
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
        category: 'Γενικά',
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

// ─── Jaccard similarity & Text Normalization ──────────────────────────────────
function stripGreekAccents(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function stemGreekWord(word) {
    if (word.length <= 4) return word;
    return word.replace(/(εισ|εων|ουσ|ους|ιασ|ιας|ικος|ικη|ικης|ικου|ικων|ικα|ικο|ιο|ια|ιου|ιων|ησ|ης|ου|ων|οσ|ος|ασ|ας|εσ|ες|α|η|ο|υ|ε)$/, '');
}

function getCanonicalArticleId(urlStr) {
    if (!urlStr) return '';
    try {
        const u = new URL(urlStr.trim());
        const hostname = u.hostname.toLowerCase();
        const path = u.pathname;

        if (hostname.includes('sport-fm.gr')) {
            const m = path.match(/\/(\d+)\/?$/);
            if (m) return `sport-fm:${m[1]}`;
        }
        if (hostname.includes('sdna.gr')) {
            const m = path.match(/\/(\d+)_[^\/]+/);
            if (m) return `sdna:${m[1]}`;
        }
        if (hostname.includes('gazzetta.gr')) {
            const m = path.match(/\/(\d+)\/[^\/]+/);
            if (m) return `gazzetta:${m[1]}`;
        }
        if (hostname.includes('sportal.gr')) {
            const m = path.match(/\/article\/([^\/]+)/);
            if (m) return `sportal:${m[1]}`;
        }
        if (hostname.includes('sport24.gr')) {
            const m = path.match(/\/([^\/]+)\/?$/);
            if (m) return `sport24:${m[1]}`;
        }
        if (hostname.includes('pao.gr')) {
            const m = path.match(/\/([^\/]+)\/?$/);
            if (m) return `pao:${m[1]}`;
        }
        return `${hostname}:${path.replace(/\/+$/, '')}`;
    } catch (_) {
        return urlStr;
    }
}

function cleanTextToWords(text) {
    const unaccented = stripGreekAccents(text || '');
    const greekStopwords = new Set([
        'και','το','του','της','στον','στην','απο','με','για','στα','στις','στους',
        'ο','η','οι','τα','ενα','μια','στο','σε','πως','οτι','που','αλλα','ως',
        'τον','την','των','τους','τις','αμα','αν','στη','στο','στον','κι',
        'ειναι','ηταν','θα','να','δεν','μην','προς','μετα','υπο','κατα','παρα'
    ]);
    const words = unaccented
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !greekStopwords.has(w))
        .map(w => stemGreekWord(w));
    return new Set(words);
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

        // Extract article URLs from SDNA Jina Markdown text with upfront relevance filtering
        if (target.name === 'SDNA' || (typeof html === 'string' && (html.startsWith('Title:') || html.includes('Markdown Content:')))) {
            const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?sdna\.gr\/[a-z0-9-]+\/\d+_[^)]+)\)/gi;
            let match;
            while ((match = markdownLinkRegex.exec(html)) !== null) {
                const anchorText = match[1].trim();
                const cleanHref = match[2].split('?')[0].split('#')[0];
                
                // Exclude non-PAO categories and TV guides from sidebars/footers upfront
                const excludedCategories = ['/kallitehniki-kolymbisi/', '/tenis/', '/formula-1/', '/moto-gp/', '/polo/', 'tileoptikes-metadoseis', 'tileoptiki-metadosi'];
                if (excludedCategories.some(cat => cleanHref.includes(cat))) continue;

                // Extract URL slug text (e.g. "petaei-pros-tin-ellada-gia-ton-panathinaiko-o-libai-gkarsia")
                const slugText = cleanHref.split('/').pop().replace(/^\d+_/, '').replace(/-/g, ' ');

                // Check PAO relevance on anchor text and URL slug upfront
                const isAnchorPao = anchorText.length > 5 && isPanathinaikosArticle(anchorText, anchorText);
                const isSlugPao = isPanathinaikosArticle(slugText, slugText);

                if (isAnchorPao || isSlugPao) {
                    links.add(cleanHref);
                }
            }

            // Fallback if no markdown links matched
            if (links.size === 0) {
                const rawRegex = /https?:\/\/(www\.)?sdna\.gr\/[a-z0-9-]+\/\d+_[a-z0-9-]+/gi;
                const rawMatches = html.match(rawRegex) || [];
                for (const href of rawMatches) {
                    const cleanHref = href.split('?')[0].split('#')[0];
                    const slugText = cleanHref.split('/').pop().replace(/^\d+_/, '').replace(/-/g, ' ');
                    if (isPanathinaikosArticle(slugText, slugText)) {
                        links.add(cleanHref);
                    }
                }
            }
        }

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
                        
                        const blacklist = [
                            '/archive/', '/author/', '/tag/', '/category/', '/video/', '/webtv/', '/en/',
                            'galacticos', 'interwetten', 'gazz-floor', '/podcast', '/tv', '/shows/', '/live-',
                            '/recommendation/', '/recommendations/', 'proinos-typos', 'proinos_typos',
                            'papatheodwroy', 'papatheodorou', 'tileoptikes-metadoseis', 'tileoptiki-metadosi',
                            'tv-guide', 'ti-tha-deite'
                        ];
                        if (blacklist.some(b => u.pathname.toLowerCase().includes(b))) return;
                        
                        // For sources with sdnaNumericOnly, only accept paths with a numeric article ID (e.g. /podosfairo/1449282_title)
                        if (target.sdnaNumericOnly && !/\/\d{5,}/.test(u.pathname)) return;

                        // Sport-FM specific filter: skip radio comments / audio recaps containing 'sxolia' or 'sxolio'
                        if (u.hostname.includes('sport-fm.gr') && (u.pathname.toLowerCase().includes('sxolia') || u.pathname.toLowerCase().includes('sxolio'))) return;

                        // Sportime specific filter: skip articles containing 'papatheodwroy' or 'papatheodorou'
                        if (u.hostname.includes('sportime.gr') && (u.pathname.toLowerCase().includes('papatheodwroy') || u.pathname.toLowerCase().includes('papatheodorou'))) return;
                        
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

const DEFAULT_STADIUM_IMG = '/logo.png';

// ─── Programmatic Image Watermark Sanitizer ──────────────────────────────────
function sanitizeImageUrl(scrapedImg) {
    if (!scrapedImg || typeof scrapedImg !== 'string') return '';
    let cleaned = scrapedImg.trim();

    // Clean Sportime watermark / og-branded overlay images
    if (cleaned.toLowerCase().includes('sportime.gr')) {
        cleaned = cleaned
            .replace(/-og-branded/gi, '-1320')
            .replace(/-branded/gi, '-1320');
    }

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

function stripJournalistFromTitle(title) {
    if (!title || typeof title !== 'string') return title;
    let t = title.trim();
    // Strip category/section code prefixes like "Α19:", "A:19", "K19:", "U19:", "Α15:", etc.
    t = t.replace(/^\s*([AΑ]:?\d{1,2}|U\d{1,2}|K\d{1,2})\s*:\s*/i, '');

    const journalistRegex = /^\s*(Αθανασίου|Νικολογιάννης|Πετρωτός|Σταύρου|Κετσετζόγλου|Χελάκης|Τσακίρης|Καρπετόπουλος|Παπαθεοδώρου|Αρναούτογλου|Athanasiou|Nikologiannis)(\s+στο[υςα-ώA-Za-z]+(\s+\w+)*)?\s*:\s*/i;
    t = t.replace(journalistRegex, '');
    t = t.replace(/^\s*(Αθανασίου|Νικολογιάννης|Πετρωτός|Σταύρου|Κετσετζόγλου|Χελάκης|Τσακίρης|Καρπετόπουλος|Παπαθεοδώρου|Αρναούτογλου|Athanasiou|Nikologiannis)\s+/i, '');
    return t.trim();
}

function capitalizeTitle(str) {
    if (!str || typeof str !== 'string') return str;
    let trimmed = stripJournalistFromTitle(str);
    if (!trimmed) return trimmed;
    return trimmed.replace(/^([«"'\s]*)([\p{L}])/u, (m, prefix, char) => prefix + char.toUpperCase());
}


function greekToLatin(text) {
    if (!text) return "";
    let str = text.toLowerCase();
    str = str
        .replace(/αι|αί/g, 'ai').replace(/ει|εί/g, 'ei').replace(/οι|οί/g, 'oi')
        .replace(/ου|ού/g, 'ou').replace(/αυ|αύ/g, 'av').replace(/ευ|εύ/g, 'ev')
        .replace(/μπ/g, 'b').replace(/ντ/g, 'nt').replace(/γκ/g, 'gk')
        .replace(/γγ/g, 'ng').replace(/τζ/g, 'tz').replace(/τσ/g, 'ts')
        .replace(/θ/g, 'th').replace(/χ/g, 'ch').replace(/ψ/g, 'ps').replace(/ξ/g, 'x');

    const singleMap = {
        'α': 'a', 'ά': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'έ': 'e',
        'ζ': 'z', 'η': 'i', 'ή': 'i', 'ι': 'i', 'ί': 'i', 'ϊ': 'i', 'ΐ': 'i',
        'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ο': 'o', 'ό': 'o', 'π': 'p',
        'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'ύ': 'y', 'ϋ': 'y',
        'ΰ': 'y', 'φ': 'f', 'ω': 'o', 'ώ': 'o'
    };

    let res = '';
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        res += singleMap[c] !== undefined ? singleMap[c] : c;
    }
    return res;
}

function slugify(text) {
    if (!text) return "arthro";
    try {
        let latin = greekToLatin(text);
        let slug = latin
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        if (slug.length > 60) {
            let truncated = slug.substring(0, 60);
            const lastDash = truncated.lastIndexOf('-');
            truncated = lastDash > 8 ? truncated.substring(0, lastDash) : truncated;
            slug = truncated.length > 8 ? truncated : slug.substring(0, 35);
        }
        return slug || "arthro";
    } catch(e) {
        return "arthro";
    }
}

function getCategoryCleanName(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('ποδόσφαιρο') || cat.includes('football')) return 'podosfairo';
    if (cat.includes('μπάσκετ') || cat.includes('basketball')) return 'basket';
    if (cat.includes('ερασιτέχνης') || cat.includes('amateur')) return 'erasitexnis';
    if (cat.includes('άποψη') || cat.includes('opinion')) return 'apopsi';
    return 'pao';
}

// ─── Cache Warmup (Pre-warming CDN & Image Proxy) ──────────────────────────
function warmUpArticleCache(imageUrl, articleTitle, articleId, category) {
    try {
        // 1. Warm up wsrv.nl WebP Image Proxy CDN
        if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('wsrv.nl') && !imageUrl.includes('logo.png') && !imageUrl.includes('favicon')) {
            const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=1200&output=webp&q=82`;
            console.log(`  [CACHE WARMUP] Pre-warming WebP image proxy for: ${imageUrl.substring(0, 60)}...`);
            httpGetWithRetry(wsrvUrl, {}, 1, false, 8000).catch(() => {});
        }

        // 2. Warm up Article SSR Page & Homepage Edge Cache
        if (articleTitle && articleId) {
            const cleanCat = getCategoryCleanName(category);
            const cleanSlug = slugify(articleTitle);
            const shortId = (articleId || '').substring(0, 8);
            const articleUrl = `https://www.panathinaikosnews.gr/${cleanCat}/${cleanSlug}-id=${shortId}`;
            
            console.log(`  [CACHE WARMUP] Pre-warming SSR page: ${articleUrl}`);
            httpGetWithRetry(articleUrl, {}, 1, false, 8000).catch(() => {});
            httpGetWithRetry('https://www.panathinaikosnews.gr/', {}, 1, false, 8000).catch(() => {});
        }
    } catch (_) {}
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
    if (url.toLowerCase().includes('sport-fm.gr') && (url.toLowerCase().includes('sxolia') || url.toLowerCase().includes('sxolio'))) {
        console.log(`[SCRAPE SKIPPED] Sport-FM audio/comments recap URL skipped: ${url}`);
        return null;
    }
    if (url.toLowerCase().includes('sportime.gr') && (url.toLowerCase().includes('papatheodwroy') || url.toLowerCase().includes('papatheodorou'))) {
        console.log(`[SCRAPE SKIPPED] Sportime papatheodwroy article URL skipped: ${url}`);
        return null;
    }
    if (url.toLowerCase().includes('galacticos') || url.toLowerCase().includes('interwetten')) {
        console.log(`[SCRAPE SKIPPED] URL contains blacklisted galacticos/interwetten term: ${url}`);
        return null;
    }
    try {
        const retryOn403 = url.includes('sdna.gr') || url.includes('paobc.gr');
        const response = await httpGetWithRetry(url, {}, 3, retryOn403);
        console.log(`[HTTP GET] ${url} | Status: ${response.status}`);
        const html = response.data;

        // Custom Jina Markdown parser for SDNA articles
        if (url.includes('sdna.gr') && typeof html === 'string' && (html.startsWith('Title:') || html.includes('Markdown Content:'))) {
            let title = '';
            let created_at = new Date().toISOString();
            let imageUrl = null;

            const titleMatch = html.match(/^Title:\s*(.+)$/m);
            if (titleMatch) title = titleMatch[1].trim();

            const timeMatch = html.match(/^Published Time:\s*(.+)$/m);
            if (timeMatch) {
                const d = new Date(timeMatch[1].trim());
                if (!isNaN(d.getTime())) {
                    const ageHours = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60);
                    if (ageHours > 4) {
                        console.log(`  [SDNA PARSING WARNING] Article is too old (Published: ${d.toISOString()}, Age: ${ageHours.toFixed(1)}h). Skipping ${url}`);
                        return { status: 'skipped_older', length: 0 };
                    }
                }
            }

            const imgMatches = html.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g) || [];
            for (const imgMarkdown of imgMatches) {
                const srcMatch = imgMarkdown.match(/\((https?:\/\/[^\s\)]+)\)/);
                if (srcMatch) {
                    const src = srcMatch[1];
                    if (src.includes('/styles/') || src.includes('/public/')) {
                        imageUrl = src.replace('/styles/og_image/', '/styles/main/').replace(/\/(wm|thumbnails)\//gi, '/');
                        break;
                    }
                }
            }

            let bodyText = html;
            const splitPos = html.indexOf('Markdown Content:');
            if (splitPos !== -1) bodyText = html.substring(splitPos + 'Markdown Content:'.length).trim();

            const lines = bodyText.split('\n');
            const cleanLines = [];
            for (let line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (trimmed.startsWith('Title:') || trimmed.startsWith('URL Source:') || trimmed.startsWith('Published Time:')) continue;
                if (trimmed.includes('Do Not Process My Personal Information') || trimmed.includes('IAB’s List')) continue;
                if (trimmed.includes('Opted In') || trimmed.includes('Opted Out') || trimmed.includes('Personal Data Processing') || trimmed.includes('ΕΝΕΡΓΟΠΟΙΗΜΕΝΟ') || trimmed.includes('ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΟ')) continue;
                if (trimmed.includes('Κατέβασε τώρα και ζήσε τη μοναδική εμπειρία')) continue;
                if (trimmed.includes('Χρόνος ανάγνωσης')) continue;
                if (trimmed.startsWith('*   [') || trimmed.startsWith('![Image')) continue;

                if (trimmed.length > 20 && /[α-ωΑ-Ω]/i.test(trimmed)) {
                    cleanLines.push(trimmed);
                }
            }

            const cleanContent = cleanLines.join('\n\n');
            const summary = (cleanContent.substring(0, 300) || title) + '...';

            return {
                status: 'success',
                title: title || 'SDNA Article',
                summary,
                content: cleanContent.length > 100 ? cleanContent : bodyText.substring(0, 2000),
                imageUrl: imageUrl || '/logo.png',
                created_at,
                sourceUrl: url
            };
        }

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
        const DEFAULT_STADIUM_IMG = '/logo.png';

        // ── Build image URL (Node-safe, no DOM dependencies) ───────────────────
        const isBrandingOrAuthorImage = (imgUrl) => {
            if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return true;
            try {
                const u = new URL(imgUrl);
                const fullPath = u.pathname.toLowerCase();
                const filename = fullPath.split('/').pop() || '';

                const brandingAndAuthorKeywords = [
                    'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
                    'site-logo', 'site_logo', 'default-image', 'default_image',
                    'noimage', 'no-image', 'blank', 'generic',
                    'author', 'writer', 'columnist', 'sintaktis', 'syntaktis', 'editor', 'reporter',
                    'headshot', 'profile-pic', 'profile_pic', 'user-pic', 'user_pic', 'bio-pic'
                ];

                const brandingPaths = [
                    '/logos/', '/logo/', '/brand/', '/branding/', '/default_images/', '/default-images/',
                    '/assets/images/', '/site-assets/', '/authors/', '/author/', '/users/', '/avatars/',
                    '/profiles/', '/columnists/', '/reporters/', '/editors/', '/sintaktes/'
                ];

                const hasKeyword = brandingAndAuthorKeywords.some(ind => filename.includes(ind));
                const hasPath = brandingPaths.some(p => fullPath.includes(p));
                return hasKeyword || hasPath;
            } catch (_) {
                return true;
            }
        };

        const scrapedImg = (
            $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            ''
        );

        let imageUrl = DEFAULT_STADIUM_IMG;
        const cleanedImg = sanitizeImageUrl(scrapedImg);

        if (cleanedImg && !isBrandingOrAuthorImage(cleanedImg)) {
            imageUrl = cleanedImg;
        } else {
            const candidateImages = [];
            $('article img, .article-body img, #article-body img, main img').each((_, el) => {
                const src = $(el).attr('src') || $(el).attr('data-src');
                if (src) {
                    const cleanCandidate = sanitizeImageUrl(src);
                    if (cleanCandidate && cleanCandidate.startsWith('http') && !isBrandingOrAuthorImage(cleanCandidate)) {
                        candidateImages.push(cleanCandidate);
                    }
                }
            });

            if (candidateImages.length > 0) {
                imageUrl = candidateImages[0];
            } else if (cleanedImg && cleanedImg.startsWith('http')) {
                imageUrl = cleanedImg;
            }
        }
        
        // ── Published date & Age Validation ────────────────────────────────────
        let extractedDateStr = 
            $('meta[property="article:published_time"]').attr('content') ||
            $('meta[name="article:published_time"]').attr('content') ||
            $('meta[property="og:updated_time"]').attr('content') ||
            $('meta[itemprop="datePublished"]').attr('content') ||
            $('time[datetime]').first().attr('datetime') ||
            $('time[pubdate]').first().attr('datetime');

        if (!extractedDateStr) {
            try {
                $('script[type="application/ld+json"]').each((_, el) => {
                    const raw = $(el).html();
                    if (raw && raw.includes('datePublished')) {
                        const parsed = JSON.parse(raw);
                        if (parsed.datePublished) extractedDateStr = parsed.datePublished;
                        else if (Array.isArray(parsed['@graph'])) {
                            const item = parsed['@graph'].find(g => g.datePublished);
                            if (item) extractedDateStr = item.datePublished;
                        }
                    }
                });
            } catch (_) {}
        }

        const now = new Date();
        let created_at = now.toISOString();

        if (extractedDateStr) {
            const pubDate = new Date(extractedDateStr);
            if (!isNaN(pubDate.getTime())) {
                const ageHours = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
                
                // MAX AGE CHECK: Skip articles published more than 4 hours ago!
                if (ageHours > 4) {
                    console.log(`  [PARSING WARNING] Article is too old (Published: ${pubDate.toISOString()}, Age: ${ageHours.toFixed(1)}h). Maximum allowed age is 4h. Skipping ${url}`);
                    return { status: 'skipped_older', length: 0 };
                }
            }
        }

        // ── Body text ──────────────────────────────────────────────────────────
        // Try progressively more specific selectors (strictly targeted at single-article containers)
        const bodySelectors = [
            'article .article-body', 'article .content', '.article-content',
            '.article-body', '.story-body', '.entry-content', '.post-content', '.html-content',
            '[class*="article-text"]', '[class*="article-content"]',
            '.single-article-content', '.article__body',
            '.single_article__body', '.single_article', '[class*="single_article"]',
            '.prose', 'div.prose', 'article', 'main'
        ];
        let bodyText = '';
        for (const sel of bodySelectors) {
            try {
                const els = $(sel);
                if (els.length > 0) {
                    const clone = els.clone();
                    // Strip scripts, ads, share buttons, seo promos
                    clone.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"], .seo_promo').remove();
                    
                    // Extract text from paragraphs and list items
                    const paragraphs = [];
                    clone.find('p, li').each((i, el) => {
                        let t = $(el).text().replace(/[ \t]+/g, ' ').trim();
                        if ((el.name === 'li' || el.tagName === 'li') && t) t = '• ' + t;
                        if (t && t.length > 15) paragraphs.push(t);
                    });
                    
                    let candidateText = paragraphs.length > 0 ? paragraphs.join('\n\n') : clone.text().replace(/[ \t]+/g, ' ').trim();
                    
                    // Clean promotional junk
                    candidateText = candidateText.replace(/Μην χάνεις είδηση[\s\S]{0,100}στην Google/gi, '').trim();
                    candidateText = candidateText.replace(/Ακολουθήστε το .*? στο Google News/gi, '').trim();
                    candidateText = candidateText.replace(/Βάλε το .*? στην Google/gi, '').trim();
                    
                    // Keep the largest bodyText found across candidate selectors
                    if (candidateText.length > bodyText.length) {
                        bodyText = candidateText;
                    }
                    if (bodyText.length > 500) break; // Only break early if we have a full long-form body
                }
            } catch (e) {
                console.error(`  [PARSING ERROR] Body parsing failed for selector '${sel}': ${e.message}`);
            }
        }

        const isOfficial = url.includes('pao.gr') || url.includes('paobc.gr') || url.includes('pao1908.com');
        const minLength = isOfficial ? 100 : 380;

        if (!bodyText || bodyText.length < minLength) {
            console.log(`  [PARSING WARNING] Body text is too short or empty for ${url} (Length: ${bodyText.length}). Minimum is ${minLength}. Likely a video-only article. Skipping.`);
            return { status: 'skipped_size', length: bodyText ? bodyText.length : 0, created_at };
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
        if (!err.isSilentSDNA403) {
            console.warn(`[SCRAPER] Failed to scrape article ${url}: ${err.message}`);
        }
        return { status: 'failed_crawl', error: err.message, isSilent: err.isSilentSDNA403 };
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

// Track whether the last AI failure was retryable (quota/throttle) vs permanent (parse/content error)
// Retryable = should not be permanently blacklisted; will be retried on next run
let lastAiFailureWasRetryable = false;

// ─── Simple per-minute rate limiter (max 25 calls/60s) ───────────────────────
// Gemini free tier allows 30 RPM; we cap at 25 to stay safe.
const AI_RPM_LIMIT = 25;
const aiCallTimestamps = [];
async function throttleIfNeeded() {
    const now = Date.now();
    // Remove timestamps older than 60 seconds
    while (aiCallTimestamps.length > 0 && now - aiCallTimestamps[0] > 60000) {
        aiCallTimestamps.shift();
    }
    if (aiCallTimestamps.length >= AI_RPM_LIMIT) {
        // Wait until the oldest call is 60s old
        const waitMs = 60000 - (now - aiCallTimestamps[0]) + 500;
        console.log(`    [RATE LIMITER] At ${aiCallTimestamps.length} calls/min. Waiting ${(waitMs/1000).toFixed(1)}s to stay under RPM limit...`);
        await sleep(waitMs);
        // Re-clean after waiting
        const nowAfter = Date.now();
        while (aiCallTimestamps.length > 0 && nowAfter - aiCallTimestamps[0] > 60000) {
            aiCallTimestamps.shift();
        }
    }
    aiCallTimestamps.push(Date.now());
}

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
            // Throttle before every API call to stay under RPM limit
            await throttleIfNeeded();
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

            // Distinguish between per-minute rate limit (RPM/throttle) vs true daily quota limit (RPD / per_day)
            const msgLower = (err.message || '').toLowerCase();
            const isDailyLimit = msgLower.includes('per_day') || msgLower.includes('day') || msgLower.includes('daily') || (msgLower.includes('quota') && msgLower.includes('day'));

            if (isDailyLimit) {
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

function sanitizeGreekText(str) {
    if (!str || typeof str !== 'string') return str;
    return str
        .replace(/κεραυνόβραστη/gi, 'αστραπιαία')
        .replace(/κεραυνοβραστη/gi, 'αστραπιαία')
        .replace(/\u0DAF\u0DCF/g, 'δια')
        .replace(/\bηδα\s+[\u0590-\u05FF\u0D80-\u0DFF]*/g, 'γρίφος')
        .replace(/[\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0D80-\u0DFF\u0E00-\u0E7F\u4E00-\u9FFF]/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, (m) => m.includes('\n') ? '\n' : ' ')
        .trim();
}

// ─── Gemini API: combined article data (bullets + long-form) ────────────────
async function generateArticleData(title, text, isOfficial = false) {
    const ai = getAiClient();
    if (!ai || quotaExhausted) {
        lastAiFailureWasRetryable = true; // quota exhaustion is always retryable
        return null;
    }

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
Βάσει των παρακάτω πληροφοριών, αξιολόγησε τη σχετικότητα του θέματος με τον Παναθηναϊκό (ποδόσφαιρο, μπάσκετ, ερασιτέχνη, διοίκηση, μεταγραφές κλπ.) και γράψε ένα αντικειμενικό, υψηλής ποιότητας, αναδιατυπωμένο άρθρο (summary) και 2 bullets ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά (ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η χρήση χαρακτήρων από αλλόγλωσσα αλφάβητα όπως εβραϊκά, αραβικά, ασιατικά κλπ.).

ΑΠΑΝΤΗΣΕ ΑΠΟΚΛΕΙΣΤΙΚΑ σε μορφή JSON, με τα εξής keys (ΧΩΡΙΣ Markdown code blocks, ΧΩΡΙΣ "json"):
{
  "is_panathinaikos_relevant": true ή false (βάλε false αν το άρθρο αφορά γενική διεθνή ειδησεογραφία, άλλα αθλήματα/ομάδες χωρίς καμία σύνδεση με τον Παναθηναϊκό, ή άσχετα παγκόσμια γεγονότα),
  "title": "ο αναδιατυπωμένος τίτλος (ελαφρώς διαφορετικός από τον αρχικό, φυσικός, σοβαρός και δημοσιογραφικός. ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η χρήση ανύπαρκτων, παράδοξων, τεχνητών ή ακραίων σύνθετων λέξεων όπως «κεραυνόβραστη». Χρησιμοποίησε ΜΟΝΟ δόκιμες, καθαρά ελληνικές λέξεις της αθλητικής δημοσιογραφίας. ΠΟΤΕ μην χρησιμοποιείς τη λέξη «μπες» - χρησιμοποίησε «μπάσιμο» ή «κίνηση». ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η συμπερίληψη ονομάτων δημοσιογράφων/συντακτών όπως Αθανασίου, Νικολογιάννης, Παπαθεοδώρου, κλπ στον τίτλο)",
  "content": "το αναδιατυπωμένο άρθρο (σύμφωνα με τους κανόνες παρακάτω)",
  "bullets": ["Bullet 1", "Bullet 2"]
}

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΟ content:
1. Μορφή & Μήκος: Γράψε ένα πλήρες, φυσικό άρθρο που να καλύπτει περίπου το 70% έως 90% των πληροφοριών, γεγονότων και λεπτομερειών της αρχικής πηγής. Χώρισε το κείμενο σε φυσικές παραγράφους (χωρίς περιορισμό στον αριθμό παραγράφων). Απόφυγε τη μονολεκτική συμπίεση αλλά και τις περιττές σάλτσες.
2. Ακρίβεια: Διατήρησε 100% τα ακριβή πραγματικά περιστατικά, ονόματα, νούμερα και δεδομένα. Απαγορεύεται η προσθήκη μη επιβεβαιωμένων πληροφοριών.
3. Αναδιατύπωση: Το άρθρο πρέπει να είναι πλήρως ξαναγραμμένο με δικές σου λέξεις. Απαγορεύεται το copy-paste.
4. ${toneInstruction}
5. Άμεση & Φακτουαλική Γραφή: Γράψε ΑΜΕΣΑ και ΑΝΤΙΚΕΙΜΕΝΙΚΑ, παρουσιάζοντας τα γεγονότα ως δεδομένα. ΑΠΑΓΟΡΕΥΟΝΤΑΙ αόριστες παθητικές διατυπώσεις ή ασαφείς αναφορές 3ου προσώπου όπως «διαψεύστηκαν σενάρια», «λέγεται ότι», «αναφέρθηκε πως», «κρίνεται αναγκαία», «ακούγεται ότι». Αντί για αόριστο «διαψεύστηκαν τα σενάρια για τον X», γράψε καθαρά και άμεσα «Δεν υφίσταται θέμα με τον X».
6. Διαχώρισε τις παραγράφους με μία κενή γραμμή (\n\n). ΜΟΝΟ καθαρό κείμενο.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΑ bullets:
1. Ακριβώς 2 bullets (strings μέσα στο array). Απαγορεύεται η αντιγραφή από το κείμενο.
2. Κάθε bullet πρέπει να παρουσιάζει διαφορετικά δεδομένα. Απαγορεύεται η επανάληψη.
3. Ακριβώς μία (1) πρόταση ανά bullet. Μην βάζεις σύμβολα όπως "•" στην αρχή του string.

Τίτλος: ${title}
Πληροφορίες: ${cleanText}`,
            config: {
                temperature: 0.4,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json'
            }
        }));

        const rawResponse = (response.text || '').trim();
        let jsonString = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonString);
        } catch (_) {
            // Fallback: repair raw control characters inside multi-line JSON values
            const repaired = jsonString.replace(/[\u0000-\u001F]+/g, (m) => m.includes('\n') ? '\\n' : ' ');
            parsed = JSON.parse(repaired);
        }

        if (parsed.is_panathinaikos_relevant === false) {
            console.log(`  [AI EVALUATION] Article determined NOT relevant: "${title}"`);
            return { isRelevant: false, content: null, title: null, bullets: [] };
        }

        let newTitle = capitalizeTitle(sanitizeGreekText((parsed.title || title).trim()));
        // Replace unwanted slang terms in title
        newTitle = newTitle
            .replace(/«μπες»/gi, '«μπάσιμο»')
            .replace(/\bμπες\b/gi, 'μπάσιμο');
        newTitle = capitalizeTitle(newTitle);
        const bullets = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 2).map(b => sanitizeGreekText(b)) : [];
        const articleText = sanitizeGreekText((parsed.content || text || '').trim());

        if (articleText && articleText.length > 20) {
            console.log(`  [AI] Article Data generated: ${articleText.length} chars, ${bullets.length} bullets. Title: ${newTitle}`);
            return { isRelevant: true, content: articleText, title: newTitle, bullets };
        }
    } catch (err) {
        console.warn(`[AI] Article generation warning/error: ${err.message?.substring(0, 80)}`);
    }
    return null;
}

// ─── Gemini API: semantic deduplication ────────────────────────────────────────────
async function checkSemanticDuplicate(newTitle, newSummary, candidateArticles) {
    if (!candidateArticles || candidateArticles.length === 0) return null;
    const ai = getAiClient();
    if (!ai || quotaExhausted) return null;

    const candidatesList = candidateArticles.map(a => {
        const snippet = a.summary ? `\n   Σύνοψη: ${a.summary.substring(0, 150)}` : '';
        return `ID: ${a.id}\n   Τίτλος: ${a.title}${snippet}`;
    }).join('\n\n');

    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Αξιολόγησε αν το ΝΕΟ ΑΡΘΡΟ αναφέρεται ΑΚΡΙΒΩΣ ΣΤΗΝ ΙΔΙΑ ΕΙΔΗΣΗ / ΣΥΓΚΕΚΡΙΜΕΝΟ ΓΕΓΟΝΟΣ με κάποιο από τα ΠΙΘΑΝΑ ΥΠΑΡΧΟΝΤΑ ΑΡΘΡΑ.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
1. ΣΥΓΧΩΝΕΥΟΝΤΑΙ ΜΟΝΟ ΑΡΘΡΑ ΠΟΥ ΚΑΛΥΠΤΟΥΝ ΤΟ ΙΔΙΟ ΣΥΓΚΕΚΡΙΜΕΝΟ ΓΕΓΟΝΟΣ:
   - Δύο άρθρα που ανακοινώνουν την ΙΔΙΑ επίσημη μεταγραφή (π.χ. «Επίσημο: Στον Παναθηναϊκό ο Γκαρσία» και «Ανακοίνωσε τον Γκαρσία ο Παναθηναϊκός»).
   - Δύο άρθρα που καλύπτουν την ΙΔΙΑ εξέλιξη αγώνα ή τις ΙΔΙΕΣ δηλώσεις στη συνέντευξη τύπου.

2. ΑΠΑΓΟΡΕΥΕΤΑΙ Η ΣΥΓΧΩΝΕΥΣΗ ΔΙΑΦΟΡΕΤΙΚΩΝ ΘΕΜΑΤΩΝ / ΓΩΝΙΩΝ ΡΕΠΟΡΤΑΖ, ΑΚΟΜΑ ΚΙ ΑΝ ΑΝΑΦΕΡΟΝΤΑΙ ΣΤΟ ΙΔΙΟ ΠΡΟΣΩΠΟ:
   - ΑΝΑΛΥΣΕΙΣ & ΠΡΟΦΙΛ (π.χ. τακτική ανάλυση, καριέρα παίκτη) ΔΕΝ συγχωνεύονται με ειδήσεις ανακοίνωσης ή οικονομικά ρεπορτάζ.
   - ΟΙΚΟΝΟΜΙΚΑ ΡΕΠΟΡΤΑΖ (π.χ. συνολικά έξοδα Αλαφούζου, μπάτζετ) ΔΕΝ συγχωνεύονται με μεταγραφικά νέα συγκεκριμένου παίκτη.
   - ΛΕΠΤΟΜΕΡΕΙΕΣ ΡΟΣΤΕΡ/ΑΡΙΘΜΟΙ (π.χ. ποιο νούμερο φανέλας διάλεξε, προθεσμία λίστας UEFA) ΔΕΝ συγχωνεύονται με γενικές αναλύσεις.

3. Αν η θεματολογία ή η οπτική γωνία διαφέρει, ΕΠΙΣΤΡΕΨΕ "null". Είναι προτιμότερο να υπάρχουν 2 ξεχωριστά άρθρα παρά ένα λανθασμένο merge.

Αν ταυτίζεται ΑΠΟΛΥΤΑ στο ίδιο συγκεκριμένο γεγονός με κάποιο άρθρο, επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ το ID του. Αν όχι, επίστρεψε "null". ΜΗΝ δικαιολογήσεις την απάντησή σου.

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
Έχεις λάβει ΔΥΟ διαφορετικά ρεπορτάζ από διαφορετικές πηγές που αφορούν το ΙΔΙΟ ακριβώς γεγονός. Πρέπει να τα συνδυάσεις και να γράψεις ΕΝΑ, ενιαίο, αντικειμενικό, υψηλής ποιότητας άρθρο (summary) ΚΑΙ 2 bullets ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά (ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η χρήση χαρακτήρων από αλλόγλωσσα αλφάβητα όπως εβραϊκά, αραβικά, ασιατικά κλπ.), το οποίο να περιέχει ΟΛΕΣ τις μοναδικές λεπτομέρειες και από τα δύο κείμενα (π.χ. οικονομικά δεδομένα από το ένα, δηλώσεις από το άλλο).

ΑΠΑΝΤΗΣΕ ΑΠΟΚΛΕΙΣΤΙΚΑ σε μορφή JSON, με τα εξής keys (ΧΩΡΙΣ Markdown code blocks, ΧΩΡΙΣ "json"):
{
  "title": "ο νέος, ενιαίος τίτλος (φυσικός, σοβαρός και δημοσιογραφικός. ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η χρήση ανύπαρκτων, παράδοξων, τεχνητών ή ακραίων σύνθετων λέξεων όπως «κεραυνόβραστη». Χρησιμοποίησε ΜΟΝΟ δόκιμες, καθαρά ελληνικές λέξεις της αθλητικής δημοσιογραφίας. ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η συμπερίληψη ονομάτων δημοσιογράφων/συντακτών όπως Αθανασίου, Νικολογιάννης, Παπαθεοδώρου, κλπ στον τίτλο)",
  "content": "το αναδιατυπωμένο και συνδυασμένο άρθρο (σύμφωνα με τους κανόνες)",
  "bullets": ["Bullet 1", "Bullet 2"]
}

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΟ content:
1. Μορφή & Μήκος: Γράψε ένα πλήρες, φυσικό άρθρο που να καλύπτει περίπου το 70% έως 90% των πληροφοριών, γεγονότων και λεπτομερειών και από τις δύο πηγές. Χώρισε το κείμενο σε φυσικές παραγράφους (χωρίς περιορισμό στον αριθμό παραγράφων).
2. Ακρίβεια: Διατήρησε 100% τα ακριβή πραγματικά περιστατικά. Ενσωμάτωσε ΟΛΑ τα σημαντικά δεδομένα και από τις δύο πηγές.
3. Αναδιατύπωση: Απαγορεύεται το copy-paste αυτούσιων φράσεων.
4. ${toneInstruction}
5. Άμεση & Φακτουαλική Γραφή: Γράψε ΑΜΕΣΑ και ΑΝΤΙΚΕΙΜΕΝΙΚΑ, παρουσιάζοντας τα γεγονότα ως δεδομένα. ΑΠΑΓΟΡΕΥΟΝΤΑΙ αόριστες παθητικές διατυπώσεις ή ασαφείς αναφορές 3ου προσώπου όπως «διαψεύστηκαν σενάρια», «λέγεται ότι», «αναφέρθηκε πως», «κρίνεται αναγκαία», «ακούγεται ότι». Αντί για αόριστο «διαψεύστηκαν τα σενάρια για τον X», γράψε καθαρά και άμεσα «Δεν υφίσταται θέμα με τον X».
6. ΜΟΝΟ καθαρό κείμενο, χωρίς HTML tags, χωρίς markdown.
7. Διαχώρισε τις παραγράφους με μία κενή γραμμή.

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
                temperature: 0.4,
                maxOutputTokens: 2048
            }
        }));

        const rawResponse = response.text.trim();
        const jsonString = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(jsonString);

        if (parsed.content && parsed.content.length > 100) {
            const bullets = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 2).map(b => sanitizeGreekText(b)) : [];
            const newTitle = capitalizeTitle(sanitizeGreekText((parsed.title || articleA.title).trim()));
            const newContent = sanitizeGreekText(parsed.content.trim());
            console.log(`  [AI] Combined Article Data generated: ${newContent.length} chars, ${bullets.length} bullets. Title: ${newTitle}`);
            return { content: newContent, title: newTitle, bullets };
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
            .select('id, title, summary, source_url, group_id, created_at, category')
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
                a.source_url.split(',').forEach(u => {
                    const cleanU = u.trim();
                    if (cleanU) {
                        existingUrls.add(cleanU);
                        const canonId = getCanonicalArticleId(cleanU);
                        if (canonId) existingUrls.add(canonId);
                    }
                });
            }
            // Only add valid, non-ignored, recent articles (< 48h) to existingArticles for merge matching
            const isIgnored = a.group_id === 'IGNORED_URLS' || (a.title && a.title.includes('[IGNORED')) || a.category === 'SystemRoster' || a.category === 'DELETED';
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

        let links = await scrapeArticleLinks(target, (msg) => logRunError(target.name, target.url, 'listing_fetch', msg));
        if (links === null) {
            runStats.sources[target.name].skipped_crawling_failed++;
            runStats.totals.skipped_crawling_failed++;
            logSkippedArticle(target.name, target.url, 'Listing Page Index', 'crawling_failed', 'Αδυναμία φόρτωσης αρχικής σελίδας (503/403/Timeout)');
            continue;
        }
        if (links.length === 0) { console.log(`  → No links found, skipping.`); continue; }

        // Hack for Sportime first run to not flood with 30 old articles
        if (target.name === 'Sportime') {
            // Clean & filter links to ensure only actual article pages are processed
            const cleanLinks = links.filter(l => !l.endsWith('/feed') && !l.endsWith('/panathinaikos') && !l.endsWith('/panathinaikos/') && !l.includes('/category/') && l.length > 35);
            links = Array.from(new Set(cleanLinks));

            const newLinks = links.filter(l => !existingUrls.has(l));
            if (newLinks.length > 2) {
                console.log(`[SPORTIME] First run detected! Processing latest article "${newLinks[0]}" and ignoring ${newLinks.length - 1} older articles.`);
                for (let i = 1; i < newLinks.length; i++) {
                    
                }
            }
        }

        runStats.sources[target.name].scraped += links.length;
        runStats.totals.scraped += links.length;

        for (const articleUrl of links) {
            const canonicalArticleId = getCanonicalArticleId(articleUrl);
            if (!isDryRun && (existingUrls.has(articleUrl) || (canonicalArticleId && existingUrls.has(canonicalArticleId)))) {
                totalSkipped++;
                runStats.sources[target.name].skipped_duplicate++;
                runStats.totals.skipped_duplicate++;
                continue;
            }

            // Skip specific promotional/irrelevant articles by keyword in URL
            const skipKeywords = ['back2mpak', 'live-stis', 'back2back', 'football-zone', 'recommendations', '/recommendation/'];
            const lowerUrl = articleUrl.toLowerCase();
            if (skipKeywords.some(kw => lowerUrl.includes(kw))) {
                console.log(`[SKIP] Promotional/Live show article ignored by URL: ${articleUrl}`);
                runStats.sources[target.name].skipped_other++;
                runStats.totals.skipped_other++;
                logSkippedArticle(target.name, articleUrl, 'Unknown Title (Excluded by URL)', 'promo', 'Φίλτρο διεύθυνσης URL (Promo/Live show)');
                existingUrls.add(articleUrl);
                if (!isDryRun) {
                    db.from('articles').insert({
                        title: `[SKIPPED] ${articleUrl.substring(0, 40)}`,
                        summary: 'Skipped - Promo URL',
                        content: 'Skipped',
                        source_url: articleUrl,
                        category: 'DELETED',
                        created_at: new Date().toISOString()
                    }).then(() => {}).catch(() => {});
                }
                continue;
            }

            // Rate limit: 1s between article fetches (3s for SDNA to avoid 403)
            const delayMs = target.name === 'SDNA' ? 3000 : 1000;
            await sleep(delayMs);

            const scraped = await scrapeArticlePage(articleUrl, target.category);
            if (!scraped || scraped.status === 'failed_crawl') {
                const errMsg = scraped ? scraped.error : 'Unknown HTTP crawl failure';
                if (!scraped || !scraped.isSilent) { logRunError(target.name, articleUrl, 'article_fetch', errMsg); }
                runStats.sources[target.name].skipped_crawling_failed++;
                runStats.totals.skipped_crawling_failed++;
                if (!scraped || !scraped.isSilent) { logSkippedArticle(target.name, articleUrl, 'Unknown Title (Fetch Failed)', 'crawling_failed', `Αποτυχία λήψης άρθρου: ${errMsg.substring(0, 50)}`);
                
                
                }
                continue;
            }
            if (scraped.status === 'skipped_older') {
                runStats.sources[target.name].skipped_other++;
                runStats.totals.skipped_other++;
                logSkippedArticle(target.name, articleUrl, 'Unknown Title (Too Old)', 'promo', 'Παλαιότερο των 4 ωρών');
                existingUrls.add(articleUrl);
                if (!isDryRun) {
                    db.from('articles').insert({
                        title: `[SKIPPED] ${articleUrl.substring(0, 40)}`,
                        summary: 'Skipped - Too Old',
                        content: 'Skipped',
                        source_url: articleUrl,
                        category: 'DELETED',
                        created_at: scraped.created_at || new Date().toISOString()
                    }).then(() => {}).catch(() => {});
                }
                continue;
            }
            if (scraped.status === 'skipped_video') {
                runStats.sources[target.name].skipped_size++;
                runStats.totals.skipped_size++;
                logSkippedArticle(target.name, articleUrl, 'Unknown Title (Video)', 'size', 'Βίντεο/Media άρθρο');
                existingUrls.add(articleUrl);
                if (!isDryRun) {
                    db.from('articles').insert({
                        title: `[SKIPPED] ${articleUrl.substring(0, 40)}`,
                        summary: 'Skipped - Video',
                        content: 'Skipped',
                        source_url: articleUrl,
                        category: 'DELETED',
                        created_at: scraped.created_at || new Date().toISOString()
                    }).then(() => {}).catch(() => {});
                }
                continue;
            }
            if (scraped.status === 'skipped_size') {
                runStats.sources[target.name].skipped_size++;
                runStats.totals.skipped_size++;
                logSkippedArticle(target.name, articleUrl, 'Unknown Title (Too Short)', 'size', `Πολύ μικρό κείμενο: ${scraped.length || 0} χαρακτήρες (Video/Gallery)`);
                
                // Smart re-check: If breaking news stub was published < 25 minutes ago, do NOT cache URL,
                // so subsequent scraper runs can re-evaluate if content gets expanded!
                // If > 25 minutes old, cache in-memory (no DB garbage) to avoid redundant HTTP requests.
                const articleAgeMins = scraped.created_at ? (Date.now() - new Date(scraped.created_at).getTime()) / (1000 * 60) : 999;
                if (articleAgeMins > 25) {
                    existingUrls.add(articleUrl);
                    if (!isDryRun) {
                        db.from('articles').insert({
                            title: `[SKIPPED] ${scraped.title ? scraped.title.substring(0, 40) : 'Too Short'}`,
                            summary: 'Skipped - Too Short',
                            content: 'Skipped',
                            source_url: articleUrl,
                            category: 'DELETED',
                            created_at: scraped.created_at || new Date().toISOString()
                        }).then(() => {}).catch(() => {});
                    }
                } else {
                    console.log(`    [SMART RETRY] Fresh short stub (${articleAgeMins.toFixed(0)}m old). Will re-check on next run if expanded.`);
                }
                
                continue;
            }
            if (scraped.status !== 'success' || !scraped.title) {
                continue;
            }

            // Check PAO relevance
            if (!isPanathinaikosArticle(scraped.title, scraped.content)) {
                console.log(`  [SKIP] Not PAO-relevant: ${scraped.title.substring(0, 50)}`);
                runStats.sources[target.name].skipped_relevance++;
                runStats.totals.skipped_relevance++;
                logSkippedArticle(target.name, articleUrl, scraped.title, 'relevance', 'Τοπικό φίλτρο λέξεων (Not PAO-relevant)');
                existingUrls.add(articleUrl);
                if (!isDryRun) {
                    db.from('articles').insert({
                        title: `[SKIPPED] ${scraped.title.substring(0, 40)}`,
                        summary: 'Skipped - Irrelevant',
                        content: 'Skipped',
                        source_url: articleUrl,
                        category: 'DELETED',
                        created_at: scraped.created_at || new Date().toISOString()
                    }).then(() => {}).catch(() => {});
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
                existingUrls.add(articleUrl);
                if (!isDryRun) {
                    db.from('articles').insert({
                        title: `[SKIPPED] ${scraped.title.substring(0, 40)}`,
                        summary: 'Skipped - Promo Title',
                        content: 'Skipped',
                        source_url: articleUrl,
                        category: 'DELETED',
                        created_at: scraped.created_at || new Date().toISOString()
                    }).then(() => {}).catch(() => {});
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
                existingUrls.add(articleUrl);
                if (!isDryRun) {
                    db.from('articles').insert({
                        title: `[SKIPPED] ${scraped.title.substring(0, 40)}`,
                        summary: 'Skipped - Cross Category',
                        content: 'Skipped',
                        source_url: articleUrl,
                        category: 'DELETED',
                        created_at: scraped.created_at || new Date().toISOString()
                    }).then(() => {}).catch(() => {});
                }
                continue;
            }
            if (target.category === 'Μπάσκετ' && isFootballUrl) {
                console.log(`  [SKIP] Football URL in basketball source: ${scraped.title.substring(0, 50)}`);
                runStats.sources[target.name].skipped_other++;
                runStats.totals.skipped_other++;
                logSkippedArticle(target.name, articleUrl, scraped.title, 'promo', 'Διαχωρισμός κατηγορίας (Ποδόσφαιρο σε Μπάσκετ)');
                existingUrls.add(articleUrl);
                if (!isDryRun) {
                    db.from('articles').insert({
                        title: `[SKIPPED] ${scraped.title.substring(0, 40)}`,
                        summary: 'Skipped - Cross Category',
                        content: 'Skipped',
                        source_url: articleUrl,
                        category: 'DELETED',
                        created_at: scraped.created_at || new Date().toISOString()
                    }).then(() => {}).catch(() => {});
                }
                continue;
            }

            console.log(`  [NEW] ${scraped.title.substring(0, 70)}`);

            // ── Cross-Source Cross-Publishing Deduplication ──────────────────
            const currentScrapedTime = new Date(scraped.created_at);
            const canonicalScraped = getCanonicalArticleId(articleUrl);
            
            // Collect candidates from the last 4 hours (240 mins)
            const candidateArticles = existingArticles.filter(art => {
                const dbTime = new Date(art.created_at);
                const timeDiffMinutes = Math.abs(currentScrapedTime - dbTime) / (60 * 1000);
                
                const maxWindow = 240; // 4 hours (240 mins) candidate window
                if (timeDiffMinutes > maxWindow) return false;

                // If candidate already contains this URL or canonical ID, include as top candidate
                const dbUrls = (art.source_url || '').split(',').map(u => u.trim());
                const hasCanonicalMatch = dbUrls.some(u => u === articleUrl || (canonicalScraped && getCanonicalArticleId(u) === canonicalScraped));
                if (hasCanonicalMatch) return true;
                
                const scrapedDomain = getSourceNameFromUrl(articleUrl);
                const dbDomains = dbUrls.map(u => getSourceNameFromUrl(u));
                const sameDomainOnly = dbDomains.length > 0 && dbDomains.every(d => d === scrapedDomain);
                if (sameDomainOnly) {
                    const sim = jaccardSimilarity(scraped.title, art.title);
                    if (sim < 0.2) return false;
                }
                
                return true;
            });

            let duplicateArticleId = null;

            if (candidateArticles.length > 0) {
                // Helper to check if image is a real article image (not default logo/stadium)
                const isRealImage = (img) => img && img !== '/logo.png' && !img.includes('logo.png') && img !== DEFAULT_STADIUM_IMG;

                // Direct match by URL / canonical ID / identical non-fallback image
                const directCanonicalMatch = candidateArticles.find(art => {
                    const dbUrls = (art.source_url || '').split(',').map(u => u.trim());
                    const urlMatch = dbUrls.some(u => u === articleUrl || (canonicalScraped && getCanonicalArticleId(u) === canonicalScraped));
                    const imgMatch = isRealImage(scraped.imageUrl) && isRealImage(art.image_url) && scraped.imageUrl === art.image_url;
                    return urlMatch || imgMatch;
                });

                if (directCanonicalMatch) {
                    duplicateArticleId = directCanonicalMatch.id;
                } else {
                    // Fast pass Jaccard (if title similarity > 0.35 OR summary similarity > 0.25)
                    const exactMatch = candidateArticles.find(art => 
                        jaccardSimilarity(scraped.title, art.title) > 0.35 ||
                        jaccardSimilarity(scraped.summary, art.summary) > 0.25
                    );
                    if (exactMatch) {
                        duplicateArticleId = exactMatch.id;
                    } else {
                        // Check if any candidate shares title keywords (>3 chars) OR has title/summary similarity
                        const hasPossibleMatch = candidateArticles.some(art => {
                            const stopWords = ['απο', 'τον', 'της', 'του', 'για', 'την', 'στην', 'κοντρα', 'μετα', 'στον', 'στους', 'στις', 'οτι', 'παναθηναικος', 'παναθηναικο', 'παναθηναικου', 'τριφυλλι', 'πρασινοι', 'αλαφουζος', 'πρασινα'];
                            const words1 = scraped.title.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3 && !stopWords.includes(w));
                            const words2 = art.title.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3 && !stopWords.includes(w));
                            const titleWordOverlap = words1.some(w => words2.some(w2 => w.includes(w2) || w2.includes(w)));
                            
                            return titleWordOverlap ||
                                   jaccardSimilarity(scraped.title, art.title) > 0.08 ||
                                   jaccardSimilarity(scraped.summary, art.summary) > 0.12;
                        });
                        
                        if (!hasPossibleMatch) {
                            console.log(`  [AI DEDUPLICATION BYPASS] Jaccard similarity too low. Assuming unique event.`);
                        } else {
                            // Fallback to Semantic AI Match for borderline cases
                            console.log(`  [AI DEDUPLICATION] Checking semantic match for "${scraped.title.substring(0, 40)}..." against ${candidateArticles.length} candidates.`);
                            duplicateArticleId = await checkSemanticDuplicate(scraped.title, scraped.summary, candidateArticles);
                        }
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

                        // We will update source_url ensuring each source appears at most once
                        let mergedSourceUrls = (dbArt.source_url || duplicateArticle.source_url || '').split(',').map(u => u.trim()).filter(Boolean);
                        
                        if (!mergedSourceUrls.includes(articleUrl)) {
                            // Remove any old link from the SAME source to keep only the latest
                            mergedSourceUrls = mergedSourceUrls.filter(u => getSourceNameFromUrl(u) !== sourceName);
                            
                            if (isScrapedOfficial) {
                                // Put official source first
                                mergedSourceUrls.unshift(articleUrl);
                            } else {
                                // Put new source last
                                mergedSourceUrls.push(articleUrl);
                            }
                        }
                        let newSourceUrl = mergedSourceUrls.join(',');

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

                        // Prefer real article image over fallback logo, and prefer non-SDNA image
                        const isFallbackImage = (img) => !img || img === '/logo.png' || img.includes('logo.png') || img === DEFAULT_STADIUM_IMG;

                        let newImageUrl = dbArt.image_url;
                        const isDbWatermarked = (dbArt.source_url || '').toLowerCase().includes('sdna.gr') || (dbArt.source_url || '').toLowerCase().includes('sportime.gr');
                        const isScrapedWatermarked = articleUrl.toLowerCase().includes('sdna.gr') || articleUrl.toLowerCase().includes('sportime.gr');
                        
                        if ((isFallbackImage(newImageUrl) || !newImageUrl) && scraped.imageUrl && !isFallbackImage(scraped.imageUrl)) {
                            newImageUrl = scraped.imageUrl;
                        } else if (isDbWatermarked && !isScrapedWatermarked && scraped.imageUrl && !isFallbackImage(scraped.imageUrl)) {
                            newImageUrl = scraped.imageUrl; // Swap SDNA/Sportime image with clean external portal image
                        }

                        // Category resolution: if any merged article belongs to a specific sport category, assign it to the merged article
                        const specificCategories = ['Ποδόσφαιρο', 'Μπάσκετ', 'Ερασιτέχνης'];
                        const scrapedCategory = detectCategoryFromUrl(articleUrl, target.category);
                        let newCategory = dbArt.category || 'Ποδόσφαιρο';

                        if (specificCategories.includes(scrapedCategory)) {
                            newCategory = scrapedCategory;
                        } else if (!specificCategories.includes(newCategory)) {
                            newCategory = scrapedCategory || target.category || 'Ποδόσφαιρο';
                        }

                        const { error: updateErr } = await db.from('articles')
                            .update({ 
                                title: newTitle,
                                content: newContent, 
                                summary: newSummary,
                                bullets: newBullets,
                                source_url: newSourceUrl,
                                image_url: newImageUrl,
                                category: newCategory,
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
                            existingUrls.add(articleUrl);
                            if (canonicalScraped) existingUrls.add(canonicalScraped);
                            warmUpArticleCache(newImageUrl, newTitle, duplicateArticle.id, newCategory);
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

                
                continue;
            }

            // Skip insertion if AI failed. We DO NOT want raw content, and we DO NOT poison the URL in DB.
            if (!aiResult) {
                console.log(`    [SKIP] AI generation failed or returned null — leaving URL for retry: ${articleUrl}`);
                logRunError(target.name, articleUrl, 'ai_error', 'Gemini AI response failed or returned null');
                runStats.sources[target.name].skipped_technical_error++;
                runStats.totals.skipped_technical_error++;
                continue;
            }

            let finalContent = aiResult.content;
            let finalTitle = aiResult.title;
            let finalBullets = aiResult.bullets || [];

            // ── Insert to DB ──────────────────────────────────────────────────
            const dbPayload = {
                title:      capitalizeTitle(finalTitle),
                summary:    finalContent ? finalContent.substring(0, 300) : (scraped.summary || ''),
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
            warmUpArticleCache(scraped.imageUrl, finalTitle, inserted[0].id, dbPayload.category);

            // Auto-Publish to Instagram Feed (if credentials exist)
            if (!isDryRun) {
                const articleForIg = {
                    id: inserted[0].id,
                    title: dbPayload.title,
                    summary: dbPayload.summary,
                    category: dbPayload.category,
                    source: target.name,
                    is_official: target.name.toLowerCase().includes('official') || target.name.toLowerCase().includes('επίσημ'),
                    image_url: scraped.imageUrl,
                    url: getArticleSlugUrl(dbPayload.category, dbPayload.title, inserted[0].id)
                };
                try {
                    await publishToInstagram(articleForIg);
                } catch (igErr) {
                    console.error('[Instagram] Publish error:', igErr.message);
                }
            }
        }
        // Rate limit between article processing — always pause, not just on success
        if (!process.env.VERCEL) {
            await sleep(2000);
        }
        // After finishing all articles for this source, stagger before next target (15s pause to protect Gemini API Rate Limits)
        if (!isDryRun) {
            const staggerMs = 15000; // 15 seconds
            console.log(`[STAGGER] Pausing ${staggerMs/1000}s before next source to regulate Gemini API traffic`);
            await new Promise(resolve => setTimeout(resolve, staggerMs));
        }
    }

    // Instagram Catch-Up Check: Try to publish any unposted eligible article from the last 24 hours
    if (!isDryRun && db) {
        try {
            const { data: unposted } = await db.from('articles')
                .select('id, title, summary, category, image_url, source_url, created_at')
                .eq('instagram_posted', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (unposted && unposted.length > 0) {
                const eligible = unposted.find(a => {
                    const cat = (a.category || '').toLowerCase();
                    return !cat.includes('ερασιτέχνης') && !cat.includes('official');
                });
                if (eligible) {
                    console.log(`[Instagram Catch-Up] Attempting auto-post for unposted article: "${eligible.title}"`);
                    const articleForIg = {
                        id: eligible.id,
                        title: eligible.title,
                        summary: eligible.summary,
                        category: eligible.category,
                        source: 'CatchUp',
                        is_official: false,
                        image_url: eligible.image_url,
                        url: getArticleSlugUrl(eligible.category, eligible.title, eligible.id)
                    };
                    await publishToInstagram(articleForIg);
                }
            }
        } catch (igErr) {
            console.warn('[Instagram Catch-Up Warning]:', igErr.message);
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
                    masked: key ? (key.slice(0, 8) + '...' + key.slice(-4)) : `Key #${idx + 1}`,
                    status: idx < currentKeyIndex ? 'exhausted' : (idx === currentKeyIndex ? (quotaExhausted ? 'exhausted' : 'active') : 'active')
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
            console.warn('[ANALYTICS] Scraping run stats write skipped:', logErr.message);
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