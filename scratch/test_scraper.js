const axios = require('axios');
const cheerio = require('cheerio');

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

const SCRAPE_TARGETS = [
    {
        category: 'Γενικά',
        name: 'Sport-FM',
        url: 'https://www.sport-fm.gr/tag/pao',
        articleLinkSelectors: ['h2 a', 'h3 a', '.article-title a', '.entry-title a', 'article a', '.post-title a', '.title a'],
        baseUrl: 'https://www.sport-fm.gr',
    },
    {
        category: 'Ποδόσφαιρο',
        name: 'PAO Official',
        url: 'https://www.pao.gr/',
        articleLinkSelectors: ['.latest-news a', 'h2 a', 'h3 a', '.article-title a', '.entry-title a', 'article a', 'a[href*="/news/"]', '.news-item a'],
        baseUrl: 'https://www.pao.gr',
    },
    {
        category: 'Ερασιτέχνης',
        name: 'PAO1908 Official',
        url: 'https://www.pao1908.com/category/nea/',
        articleLinkSelectors: ['.post a', 'h2 a', 'h3 a', '.entry-title a', 'article a'],
        baseUrl: 'https://www.pao1908.com',
    },
];

async function testLinks(target) {
    try {
        const response = await http.get(target.url);
        const html = response.data;
        const $ = cheerio.load(html);
        const links = new Set();
        for (const sel of target.articleLinkSelectors) {
            $(sel).each((_, el) => {
                let href = $(el).attr('href') || '';
                if (href.startsWith('/')) href = target.baseUrl + href;
                if (!href.startsWith('http')) return;
                try {
                    const u = new URL(href);
                    if (!href.includes(target.baseUrl.replace('https://www.','').replace('https://',''))) return;
                    if (u.pathname === '/' || u.pathname === '') return;
                    
                    const blacklist = ['/archive/', '/author/', '/tag/', '/category/', '/video/', '/webtv/'];
                    if (blacklist.some(b => u.pathname.includes(b))) return;
                    
                    links.add(href.split('?')[0].split('#')[0]);
                } catch (_) {}
            });
        }
        console.log(`[${target.name}] Found ${links.size} links. Sample:`, [...links].slice(0, 3));
    } catch (err) {
        console.warn(`[${target.name}] Failed: ${err.message}`);
    }
}

async function testAll() {
    for (const t of SCRAPE_TARGETS) {
        await testLinks(t);
    }
}
testAll();
