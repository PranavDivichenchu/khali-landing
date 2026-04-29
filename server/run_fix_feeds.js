require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const dbService = require('./services/dbService');

async function runFix() {
    if (!dbService.supabase) {
        console.error('❌ Supabase not initialized');
        process.exit(1);
    }

    // 1. Fix Fox News
    console.log('Fixing Fox News URL...');
    const { error: e1 } = await dbService.supabase
        .from('rss_feeds')
        .update({ url: 'http://feeds.foxnews.com/foxnews/politics' })
        .eq('name', 'Fox News Politics');
    if (e1) console.error(e1);

    // 2. Disable Treehugger
    console.log('Disabling Treehugger...');
    const { error: e2 } = await dbService.supabase
        .from('rss_feeds')
        .update({ enabled: false })
        .eq('name', 'Treehugger');

    // 3. Disable LA Times
    console.log('Disabling LA Times World...');
    const { error: e3 } = await dbService.supabase
        .from('rss_feeds')
        .update({ enabled: false })
        .eq('name', 'L.A. Times World');

    // 4. Disable OpenAI Blog (floods with tech content)
    console.log('Disabling OpenAI Blog...');
    const { error: e4 } = await dbService.supabase
        .from('rss_feeds')
        .update({ enabled: false })
        .eq('name', 'OpenAI Blog');
    if (e4) console.error(e4);

    console.log('✅ Feeds updated.');
}

runFix();
