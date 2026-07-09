const { createClient } = require('@supabase/supabase-js');
const url = 'https://rctltbuiitdnqlxizlym.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdGx0YnVpaXRkbnFseGl6bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDc4MjMsImV4cCI6MjA5ODkyMzgyM30.DVTtDjeh1TM2HsmMhEsVVxtJ7CKBfy-2iHsWRX8oumI';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('articles')
    .select('*')
    .eq('id', '6f9820b3-2348-4059-84f5-97ff56d6af87')
    .single();
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}
check();
