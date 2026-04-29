require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkCounts() {
    const { count: aggCount } = await supabase.from('aggregated_stories').select('*', { count: 'exact', head: true });
    console.log("Total aggregated_stories:", aggCount);

    const { count: aggReady } = await supabase.from('aggregated_stories').select('*', { count: 'exact', head: true }).eq('status', 'AGGREGATED');
    console.log("aggregated_stories with status='AGGREGATED':", aggReady);

    const { count: newsCount } = await supabase.from('news_items').select('*', { count: 'exact', head: true });
    console.log("Total news_items:", newsCount);

    const { data } = await supabase.from('aggregated_stories')
        .select('title, audio_script')
        .ilike('title', '%Airport Safety Remains%')
        .limit(1);

    console.log("Audio Script Check:", JSON.stringify(data, null, 2));
}

checkCounts();
