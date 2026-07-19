const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://rctltbuiitdnqlxizlym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI";
const s = createClient(supabaseUrl, supabaseKey);

s.from('articles')
 .select('title, created_at, source_url')
 .eq('id', '722f98e5-e881-4607-afb2-ba4fcc080bd2')
 .then(r => console.log(JSON.stringify(r.data, null, 2)));
