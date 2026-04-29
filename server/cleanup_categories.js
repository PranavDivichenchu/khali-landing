require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const dbService = require('./services/dbService');

const STANDARD_CATEGORIES = [
    'politics', 'technology', 'business', 'sports', 'entertainment',
    'health', 'science', 'lifestyle', 'environment', 'world'
];

function mapToStandardCategory(rawCategory) {
    if (!rawCategory) return 'world';
    const cat = rawCategory.toLowerCase().trim();

    // Already standard?
    if (STANDARD_CATEGORIES.includes(cat)) return cat;

    // Direct Mappings
    if (cat === 'finance' || cat === 'economy' || cat === 'retail' || cat === 'economics' || cat === 'real estate' || cat === 'business & finance') return 'business';
    if (cat === 'us politics' || cat === 'world politics' || cat === 'elections' || cat === 'congress' || cat === 'geopolitics' || cat === 'international relations' || cat === 'legal' || cat === 'immigration' || cat === 'military') return 'politics';
    if (cat === 'tech' || cat === 'ai' || cat === 'cryptocurrency' || cat === 'software' || cat === 'gaming' || cat === 'aerospace' || cat === 'cybersecurity') return 'technology';
    if (cat === 'film' || cat === 'music' || cat === 'celebrity' || cat === 'arts' || cat === 'music industry' || cat === 'arts & culture') return 'entertainment';
    if (cat === 'climate' || cat === 'nature' || cat === 'sustainability' || cat === 'environmental science') return 'environment';
    if (cat === 'medicine' || cat === 'wellness' || cat === 'psychology' || cat === 'public health' || cat === 'health policy') return 'health';
    if (cat === 'society' || cat === 'lifestyle' || cat === 'culture' || cat === 'travel' || cat === 'food' || cat === 'education' || cat === 'community') return 'lifestyle';
    if (cat === 'space' || cat === 'physics' || cat === 'biology' || cat === 'research' || cat === 'paleontology') return 'science';

    // Keyword based Mappings
    if (cat.includes('tech') || cat.includes('ai') || cat.includes('crypto')) return 'technology';
    if (cat.includes('financ') || cat.includes('market') || cat.includes('econ')) return 'business';
    if (cat.includes('politics') || cat.includes('govern')) return 'politics';
    if (cat.includes('music') || cat.includes('movie') || cat.includes('film')) return 'entertainment';
    if (cat.includes('health') || cat.includes('med')) return 'health';
    if (cat.includes('science')) return 'science';
    if (cat.includes('sport')) return 'sports';
    if (cat.includes('environment') || cat.includes('climate')) return 'environment';

    return 'world';
}

async function cleanup() {
    console.log('🚀 Starting Category Cleanup...');

    if (!dbService.supabase) {
        console.error('❌ Supabase not initialized');
        process.exit(1);
    }

    // 1. Process aggregated_stories
    console.log('\n--- Processing aggregated_stories ---');
    let storyCount = 0;
    let hasMoreStories = true;
    let lastStoryId = null;

    while (hasMoreStories) {
        let query = dbService.supabase
            .from('aggregated_stories')
            .select('id, category')
            .order('id', { ascending: true })
            .limit(1000);

        if (lastStoryId) {
            query = query.gt('id', lastStoryId);
        }

        const { data: stories, error: storiesError } = await query;

        if (storiesError) throw storiesError;
        if (!stories || stories.length === 0) {
            hasMoreStories = false;
            break;
        }

        console.log(`   Processing batch of ${stories.length} stories...`);
        for (const story of stories) {
            const standard = mapToStandardCategory(story.category);
            if (standard !== story.category) {
                const { error: updateError } = await dbService.supabase
                    .from('aggregated_stories')
                    .update({ category: standard })
                    .eq('id', story.id);

                if (!updateError) storyCount++;
                else console.error(`   Error updating story ${story.id}:`, updateError.message);
            }
            lastStoryId = story.id;
        }

        if (stories.length < 1000) hasMoreStories = false;
    }
    console.log(`✅ Updated ${storyCount} stories to standard categories.`);

    // 2. Process news_items
    console.log('\n--- Processing news_items ---');
    let itemCount = 0;
    let hasMoreItems = true;
    let lastItemId = null;

    while (hasMoreItems) {
        let query = dbService.supabase
            .from('news_items')
            .select('id, category')
            .order('id', { ascending: true })
            .limit(1000);

        if (lastItemId) {
            query = query.gt('id', lastItemId);
        }

        const { data: items, error: itemsError } = await query;

        if (itemsError) throw itemsError;
        if (!items || items.length === 0) {
            hasMoreItems = false;
            break;
        }

        console.log(`   Processing batch of ${items.length} news items...`);
        for (const item of items) {
            const standard = mapToStandardCategory(item.category);
            if (standard !== item.category) {
                const { error: updateError } = await dbService.supabase
                    .from('news_items')
                    .update({ category: standard })
                    .eq('id', item.id);

                if (!updateError) itemCount++;
            }
            lastItemId = item.id;
        }

        if (items.length < 1000) hasMoreItems = false;
    }
    console.log(`✅ Updated ${itemCount} news items to standard categories.`);

    console.log('\n🎉 Cleanup Complete!');
}

cleanup();
