const supabaseUrl = "https://rctltbuiltdnqlxizlym.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; 

export default async function handler(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const from = (page - 1) * 20;
    const to = from + 19;
    
    let targetUrl = `${supabaseUrl}/rest/v1/articles?select=*&order=created_at.desc`;
    
    if (req.query.category && req.query.category !== 'all' && req.query.category !== '') {
      targetUrl += `&category=eq.${encodeURIComponent(req.query.category)}`;
    }
    
    // Fallback key injection if process.env is empty on Vercel UI
    const finalKey = supabaseKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI"; 

    const response = await fetch(targetUrl, {
      headers: {
        'apikey': finalKey,
        'Authorization': `Bearer ${finalKey}`,
        'Range': `${from}-${to}`
      }
    });
    
    const data = await response.json();
    
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
