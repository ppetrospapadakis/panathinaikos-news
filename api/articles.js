import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co".trim();
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI".trim();

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const from = (page - 1) * 20;
    const to = from + 19;
    
    let query = supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (req.query.category && req.query.category !== 'all' && req.query.category !== '') {
      query = query.eq('category', req.query.category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack, name: err.name });
  }
}
