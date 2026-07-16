require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const supabaseUrl = process.env.SUPABASE_URL.trim().replace(/^['"]|['"]$/g, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY).trim().replace(/^['"]|['"]$/g, '');
const db = createClient(supabaseUrl, supabaseKey);

const apiKey = process.env.GEMINI_API_KEY;
const aiClientInstance = new GoogleGenAI({ apiKey });

async function generateArticleData(title, text) {
    const ai = aiClientInstance;
    const cleanText = (text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\bσύμφωνα με\s+\S+/gi, '')
        .replace(/\b(gazzetta|sport24|sdna|sportal|athletiko|sport-fm)\b[\s.,]*/gi, '')
        .replace(/\s+/g, ' ').trim().substring(0, 6000);

    const toneInstruction = 'ΠΟΤΕ μην αναφέρεις την αρχική πηγή ή άλλα μέσα ενημέρωσης. Απαγορεύονται φράσεις όπως «Σύμφωνα με...», «Το Sportal/Gazzetta/SDNA αναφέρει...», «Όπως γράφεται...». Γράφεις ΩΣ ανεξάρτητη αθλητική σύνταξη.';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Είσαι in-house αθλητικός αρχισυντάκτης του Panathinaikos News.
Βάσει των παρακάτω πληροφοριών, αξιολόγησε τη σχετικότητα του θέματος με τον Παναθηναϊκό (ποδόσφαιρο, μπάσκετ, ερασιτέχνη, διοίκηση, μεταγραφές κλπ.) και γράψε ένα αντικειμενικό, υψηλής ποιότητας, αναδιατυπωμένο άρθρο (summary) και 2 bullets ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά.

ΑΠΑΝΤΗΣΕ ΑΠΟΚΛΕΙΣΤΙΚΑ σε μορφή JSON, με τα εξής keys (ΧΩΡΙΣ Markdown code blocks, ΧΩΡΙΣ "json"):
{
  "is_panathinaikos_relevant": true,
  "title": "ο αναδιατυπωμένος τίτλος (ελαφρώς διαφορετικός από τον αρχικό, πιο clicky/attractive αλλά ακριβής, χωρίς υπερβολές)",
  "content": "το αναδιατυπωμένο άρθρο (σύμφωνα με τους κανόνες παρακάτω)",
  "bullets": ["Bullet 1", "Bullet 2"]
}

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΟ content:
1. Μορφή & Μήκος: Γράψε μια συμπαγή, φυσική σύνοψη ακριβώς δύο (2) παραγράφων που να αντιπροσωπεύει περίπου το 60% των βασικών γεγονότων. Αποέφυγε τη μονολεκτική ή μονογραμμική υπερ-συμπίεση, αλλά και τις περιττές σάλτσες. Πρέπει να διαβάζεται στρωτά ως 2 ολοκληρωμένες παράγραφοι.
2. Ακρίβεια: Διατήρησε 100% τα ακριβή πραγματικά περιστατικά, ονόματα, νούμερα και δεδομένα.
3. Αναδιατύπωση: Το άρθρο πρέπει να είναι πλήρως ξαναγραμμένο με δικές σου λέξεις.
4. ${toneInstruction}
5. Διαχώρισε τις παραγράφους με μία κενή γραμμή (\\n\\n). ΜΟΝΟ καθαρό κείμενο.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΓΙΑ ΤΑ bullets:
1. Ακριβώς 2 bullets (strings μέσα στο array).
2. Κάθε bullet πρέπει να παρουσιάζει διαφορετικά δεδομένα.
3. Ακριβώς μία (1) πρόταση ανά bullet. Μην βάζεις σύμβολα όπως "•" στην αρχή.

Τίτλος: ${title}
Πληροφορίες: ${cleanText}`,
            config: { temperature: 0.8, maxOutputTokens: 2048 }
        });

        const rawResponse = response.text.trim();
        const jsonString = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(jsonString);

        if (parsed.is_panathinaikos_relevant === false) return { isRelevant: false };

        return { 
            isRelevant: true, 
            content: parsed.content.trim(), 
            title: (parsed.title || title).trim(), 
            bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 2) : [] 
        };
    } catch (err) {
        console.error('Error generating AI:', err);
    }
    return null;
}

async function fix() {
    console.log("Fetching top 30 recent articles...");
    const { data, error } = await db.from('articles').select('*').order('created_at', { ascending: false }).limit(30);
    
    if (error) { console.error(error); return; }
    
    let targetArticles = [];
    
    for (let art of data) {
        // Find raw articles by checking if they have fallback bullets (first bullet equals title)
        if (art.bullets && art.bullets.length > 0 && art.bullets[0] === art.title) { 
             targetArticles.push(art);
        }
    }
    
    console.log(`\nFound ${targetArticles.length} likely RAW articles.`);
    
    for (let art of targetArticles) {
        console.log(`Processing: ${art.title}`);
        const aiResult = await generateArticleData(art.title, art.content);
        if (aiResult && aiResult.isRelevant) {
            console.log(`  -> AI rewritten successfully.`);
            const { error: updErr } = await db.from('articles').update({
                title: aiResult.title,
                content: aiResult.content,
                summary: aiResult.content.substring(0, 300),
                bullets: aiResult.bullets
            }).eq('id', art.id);
            if (updErr) console.error("  -> DB Update Failed:", updErr);
            else console.log("  -> DB Update OK.");
        } else {
             console.log("  -> AI deemed irrelevant or failed.");
        }
    }
}
fix();
