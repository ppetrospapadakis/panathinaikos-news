const { createClient } = require('@supabase/supabase-js');
const url = 'https://rctltbuiitdnqlxizlym.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('articles').select('*').limit(1);
  console.log("Error:", error);
  console.log("Keys returned:", data ? Object.keys(data[0]) : "none");
  console.log("First row:", data ? data[0] : "none");
}
check();
