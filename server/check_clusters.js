require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkClusters() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    console.log('--- Cluster Debug Check ---');

    // 1. Count Total Clusters
    const { count: clusterCount, error: countError } = await supabase
        .from('event_clusters')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Clusters: ${clusterCount}`);

    // 2. Fetch recent clusters and their article counts
    const { data: clusters, error: listError } = await supabase
        .from('event_clusters')
        .select('id, representative_title, article_count, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (listError) console.error('Error fetching clusters:', listError);
    else {
        console.log('\n--- Recent 10 Clusters ---');
        clusters.forEach(c => {
            console.log(`[${c.article_count}] ${c.representative_title} (ID: ${c.id})`);
        });
    }

    // 3. Check for clusters with 0 articles (Should shouldn't exist if increment works, unless just created)
    const { count: zeroCount } = await supabase
        .from('event_clusters')
        .select('*', { count: 'exact', head: true })
        .eq('article_count', 0);

    console.log(`\nClusters with 0 articles: ${zeroCount}`);

    // 4. Check one unclustered item to see if it's "stuck"
    const { data: stuckItems } = await supabase
        .from('news_items')
        .select('id, title, status, cluster_id')
        .is('cluster_id', null)
        .limit(3);

    console.log('\n--- Sample Unclustered Items ---');
    stuckItems.forEach(i => console.log(`[${i.status}] ${i.title}`));
}

checkClusters();
