const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenAI } = require('@google/genai');

const http = axios.create({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });

function isPanathinaikosArticle(title, text) {
    const combinedTitle = (title || '').toLowerCase();
    const combinedText = (text || '').toLowerCase();
    const coreKeywords = ['παναθηναϊκ', 'panathinaikos', 'pao fc', 'pao bc', 'καε παναθηναϊκός', 'παε παναθηναϊκός', 'τριφύλλι', 'trifilli', 'οακα', 'oaka', 'λεωφόρος', 'leoforos', 'βοτανικός', 'votanikos'];
    const personnelKeywords = ['αταμάν', 'ataman', 'σλούκας', 'sloukas', 'ιωαννίδης', 'ioannidis', 'τετέ', 'tete', 'μπακασέτας', 'bakasetas', 'πελίστρι', 'pellistri', 'νίστρουπ', 'neestrup', 'μαξίμοβιτς', 'μπαλτσερόφσκι', 'balcerowski', 'ναν', 'nunn', 'lessort', 'λεσόρ', 'grant', 'γκραντ', 'γκριγκόνις', 'grigonis', 'ερνανγκόμεθ', 'hernangomez', 'χουάντσο', 'juancho', 'papapetrou', 'παπαπέτρου', 'μητογλου', 'mitoglou', 'καλαϊτζάκης', 'kalaitzakis', 'γιούρτσεβεν', 'yurtseven', 'osman', 'όσμαν', 'alonzo', 'alonza', 'αλονζο', 'αλονζα', 'κρίστιανσεν', 'christiansen', 'ντε φράι', 'de vrij'];
    
    const isWordMatch = (word, text) => {
        const regex = new RegExp(`(?<=^|[^a-zA-Z0-9α-ωΑ-Ωίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώ])${word}(?=$|[^a-zA-Z0-9α-ωΑ-Ωίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώίϊΐόάέύϋΰήώ])`, 'i');
        return regex.test(text);
    };

    const checkMatch = (str) => {
        const hasCore = coreKeywords.some(kw => str.includes(kw));
        const hasPersonnel = personnelKeywords.some(kw => {
            if (kw.length <= 4) return isWordMatch(kw, str);
            return str.includes(kw);
        });
        const hasPao = isWordMatch('παο', str) || isWordMatch('pao', str);
        return hasCore || hasPersonnel || hasPao;
    };
    return checkMatch(combinedTitle) || checkMatch(combinedText);
}

async function scrapeArticlePage(url) {
    try {
        const response = await http.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        let title = ($('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || $('title').text().split('|')[0].trim() || '').substring(0, 300);
        if (!title || title.length < 10) return null;

        const bodySelectors = ['article .article-body', 'article .content', '.article-content', '.article-body', '.story-body', '.entry-content', '.post-content', '[class*="article-text"]', '[class*="article-content"]', 'article p', '.content-area p', 'main p'];
        let bodyText = '';
        for (const sel of bodySelectors) {
            const els = $(sel);
            if (els.length > 0) {
                els.find('script, style, .share, .social, .ad, .advertisement, [class*="share"], [class*="social"]').remove();
                bodyText = els.text().replace(/\s+/g, ' ').trim();
                if (bodyText.length > 100) break;
            }
        }
        
        if (!bodyText || bodyText.length < 150) {
            console.log(`[SKIP] Body text is too short or empty for ${url} (Length: ${bodyText.length})`);
            return null;
        }

        const isRelevant = isPanathinaikosArticle(title, bodyText);
        console.log(`Scraped ${url}: Title="${title}", BodyLength=${bodyText.length}, Relevant=${isRelevant}`);
    } catch(e) {
        console.error(e.message);
    }
}

scrapeArticlePage('https://www.pao.gr/matches/proponisi-kai-apostoli-gia-to-filiko-me-ti-rapint-viennis/');
