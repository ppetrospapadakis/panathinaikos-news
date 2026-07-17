const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { article_id, action, article_ids } = req.query;

            if (action === 'batch_counts' && article_ids) {
                const ids = article_ids.split(',').map(id => id.trim()).filter(Boolean);
                if (ids.length === 0) {
                    return res.status(200).json({});
                }
                const { data, error } = await supabase
                    .from('article_comments')
                    .select('article_id')
                    .in('article_id', ids);

                if (error) throw error;

                const counts = {};
                (data || []).forEach(item => {
                    counts[item.article_id] = (counts[item.article_id] || 0) + 1;
                });
                return res.status(200).json(counts);
            }

            if (!article_id) {
                return res.status(400).json({ error: 'Missing article_id parameter' });
            }

            const { data, error } = await supabase
                .from('article_comments')
                .select('id, user_name, comment_text, created_at')
                .eq('article_id', article_id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return res.status(200).json(data || []);
        }

        if (req.method === 'POST') {
            const { article_id, user_name, comment_text } = req.body || {};

            if (!article_id || !user_name || !comment_text) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const cleanName = user_name.trim();
            const cleanText = comment_text.trim();

            if (cleanName.length < 2 || cleanName.length > 50) {
                return res.status(400).json({ error: 'Το όνομα πρέπει να είναι μεταξύ 2 και 50 χαρακτήρων.' });
            }
            if (cleanText.length < 3 || cleanText.length > 1000) {
                return res.status(400).json({ error: 'Το σχόλιο πρέπει να είναι μεταξύ 3 και 1000 χαρακτήρων.' });
            }

            const hasLink = /https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|gr|net|org|info|edu|gov|eu|club|xyz|site)/i.test(cleanText) ||
                            /https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|gr|net|org|info|edu|gov|eu|club|xyz|site)/i.test(cleanName);
            if (hasLink) {
                return res.status(400).json({ error: 'Δεν επιτρέπονται σύνδεσμοι (links) στα σχόλια.' });
            }

            const curseWords = [
                'μαλακ', 'πουστ', 'γαμησ', 'γαμω', 'γαμι', 'μουνι', 'μουνια', 'πουτανα', 'κωλο',
                'σκατα', 'fucking', 'fuck', 'bitch', 'asshole', 'shit', 'pussy', 'cunt', 'γαμημενη',
                'γαμημενο', 'γαμιολη', 'ξεκωλο', 'παπαρα', 'παπαρια', 'αρχιδια', 'αρχιδι'
            ];
            const lowerText = cleanText.toLowerCase();
            const lowerName = cleanName.toLowerCase();
            if (curseWords.some(word => lowerText.includes(word)) || curseWords.some(word => lowerName.includes(word))) {
                return res.status(400).json({ error: 'Το σχόλιό σας περιέχει ανάρμοστο λεξιλόγιο.' });
            }

            const { data, error } = await supabase
                .from('article_comments')
                .insert([{ article_id, user_name: cleanName, comment_text: cleanText }])
                .select('*')
                .single();

            if (error) throw error;
            return res.status(201).json(data);
        }

        if (req.method === 'DELETE') {
            const { id, token } = req.body || {};
            if (!token || token !== 'admin_secure_session') {
                return res.status(401).json({ error: 'Unauthorized delete action.' });
            }
            if (!id) {
                return res.status(400).json({ error: 'Missing comment ID' });
            }

            const { error } = await supabase
                .from('article_comments')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });
    } catch (err) {
        console.error('Comments API Exception:', err);
        return res.status(500).json({ error: err.message });
    }
};
