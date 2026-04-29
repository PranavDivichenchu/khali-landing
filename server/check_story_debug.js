require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const id = '55074e02-2ab2-463f-8b39-a4b18aae07ec';
    console.log(`Checking ${id}...`);

    const { data: agg, error: aggErr } = await supabase.from('aggregated_stories').select('*').eq('id', id);
    if (agg && agg[0]) console.log('Agg Keys:', Object.keys(agg[0]));

    const { data: news, error: newsErr } = await supabase.from('news_items').select('id, title').eq('id', id);
    console.log('News Items:', news, newsErr);
}

check();
