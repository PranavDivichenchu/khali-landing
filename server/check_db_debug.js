require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkDB() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Check news_items table for CLIP_READY
    const { count: newsReady, error: newsError } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CLIP_READY');

    if (newsError) {
        console.error('Error fetching news_items ready:', newsError);
    } else {
        console.log('CLIP_READY news_items:', newsReady);
    }

    const { data: newsSample } = await supabase
        .from('news_items')
        .select('id, status, title')
        .limit(5);
    console.log('Sample news_items:', newsSample);
}

checkDB();
