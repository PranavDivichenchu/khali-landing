const dbService = require('./services/dbService');

async function test() {
    console.log("Testing exclusion...");
    try {
        const feed = await dbService.getReadyFeed(100, []);
        const categories = [...new Set(feed.map(i => i.category))];
        console.log("Categories found in DB feed:", categories);

        const sportsItems = feed.filter(i => i.category === 'Sports');
        console.log(`Explicit 'Sports' items count: ${sportsItems.length}`);

        // Check for case sensitivity
        const lowerSports = feed.filter(i => i.category && i.category.toLowerCase() === 'sports' && i.category !== 'Sports');
        if (lowerSports.length > 0) {
            console.log("FOUND CASE MISMATCH:", lowerSports.map(i => i.category));
        }

        console.log("Testing exclusion of 'Sports'...");
        const excludedFeed = await dbService.getReadyFeed(50, ['Sports']);
        const failedExclusion = excludedFeed.filter(i => i.category === 'Sports');
        console.log(`Items with 'Sports' after exclusion: ${failedExclusion.length}`);
    } catch (e) {
        console.error(e);
    }
}
test();
