require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking podcast_captions column...');
    const { data, error } = await supabase
        .from('aggregated_stories')
        .select('id, title, podcast_captions')
        .not('podcast_captions', 'is', null)
        .limit(5);

    if (error) {
        console.error('Error (Column likely missing):', error.message);
    } else {
        console.log(`Found ${data.length} rows with captions.`);
        if (data.length > 0) {
            console.log('Sample:', JSON.stringify(data[0].podcast_captions).substring(0, 100));
        }
    }
}

check();
