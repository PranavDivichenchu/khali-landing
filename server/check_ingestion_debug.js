require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkIngestionStatus() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    console.log('--- Database Status Check ---');

    // 1. Raw News Items Count
    const { count: rawCount, error: rawError } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true });

    if (rawError) console.error('Error fetching news_items count:', rawError);
    else console.log(`Raw News Items (news_items): ${rawCount}`);

    // 2. Unclustered Raw Items
    // Assuming there's a status or cluster_id field
    const { count: unclusteredCount, error: unclusteredError } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .is('cluster_id', null);

    if (unclusteredError) console.error('Error fetching unclustered count:', unclusteredError);
    else console.log(`Unclustered Raw Items: ${unclusteredCount}`);

    // 3. Aggregated Stories Breakdown
    const { data: aggStatus, error: aggStatusError } = await supabase
        .from('aggregated_stories')
        .select('status');

    if (aggStatusError) {
        console.error('Error fetching aggregated_stories status:', aggStatusError);
    } else {
        const breakdown = aggStatus.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});
        console.log('Aggregated Stories Status Breakdown:', breakdown);
    }
}

checkIngestionStatus();
