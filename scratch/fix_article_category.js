const { createClient } = require('@supabase/supabase-js');
const url = 'https://rctltbuiitdnqlxizlym.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('articles')
    .update({ category: 'Ερασιτέχνης' })
    .eq('id', '559acaaf-9470-45fd-a02e-6fa314901ab2')
    .select('*');
    
  if (error) {
    console.error("Update error:", error);
  } else {
    console.log("Updated successfully:", data);
  }
}
run();
