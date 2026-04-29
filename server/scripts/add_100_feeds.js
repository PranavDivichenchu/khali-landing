require('dotenv').config({ path: `${__dirname}/../.env` });
const dbService = require('../services/dbService');

const FEEDS = [
    // --- MAJOR WIRES / GENERAL NEWS ---
    { name: 'Reuters Top News', url: 'https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best', category: 'World Politics' },
    { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=world-news&post_type=best', category: 'World Politics' },
    { name: 'Associated Press', url: 'https://apnews.com/news-rss', category: 'World Politics' },
    { name: 'BBC News World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'World Politics' },
    { name: 'New York Times World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'World Politics' },
    { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/cnn_topstories.rss', category: 'US Politics' },
    { name: 'CNN World', url: 'http://rss.cnn.com/rss/cnn_world.rss', category: 'World Politics' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'World Politics' },
    { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'US Politics' },
    { name: 'Le Monde (English)', url: 'https://www.lemonde.fr/en/rss/full.xml', category: 'World Politics' },
    { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all', category: 'World Politics' },

    // --- US POLITICS ---
    { name: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml', category: 'US Politics' },
    { name: 'The Hill', url: 'https://thehill.com/feed/', category: 'US Politics' },
    { name: 'Axios', url: 'https://www.axios.com/feeds/feed.rss', category: 'US Politics' },
    { name: 'HuffPost Politics', url: 'https://www.huffpost.com/section/politics/feed', category: 'US Politics' },
    { name: 'New York Times Politics', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', category: 'US Politics' },

    // --- TECHNOLOGY & AI ---
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology & AI' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology & AI' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Technology & AI' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Technology & AI' },
    { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'Technology & AI' },
    { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', category: 'Technology & AI' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', category: 'Technology & AI' },
    { name: 'Mashable', url: 'https://mashable.com/feeds/rss/all', category: 'Technology & AI' },
    { name: 'Gizmodo', url: 'https://gizmodo.com/rss', category: 'Technology & AI' },
    { name: 'Y Combinator Hacker News', url: 'https://hnrss.org/best', category: 'Technology & AI' },
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', category: 'Technology & AI' },

    // --- BUSINESS & FINANCE ---
    { name: 'Wall Street Journal Business', url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', category: 'Economy & Business' },
    { name: 'CNBC Top News', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', category: 'Economy & Business' },
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.xml', category: 'Economy & Business' },
    { name: 'Financial Times', url: 'https://www.ft.com/?format=rss', category: 'Economy & Business' },
    { name: 'Forbes Business', url: 'https://www.forbes.com/business/feed/', category: 'Economy & Business' },
    { name: 'Fortune', url: 'https://fortune.com/feed/', category: 'Economy & Business' },
    { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', category: 'Economy & Business' },
    { name: 'Business Insider', url: 'https://feeds.businessinsider.com/custom/2012/10/business.rss', category: 'Economy & Business' },
    { name: 'The Economist', url: 'https://www.economist.com/business/rss.xml', category: 'Economy & Business' },

    // --- SCIENCE & HEALTH ---
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'Science' },
    { name: 'Nature', url: 'https://www.nature.com/nature.rss', category: 'Science' },
    { name: 'Scientific American', url: 'https://www.scientificamerican.com/feed/rss.xml', category: 'Science' },
    { name: 'New Atlas', url: 'https://newatlas.com/feed/', category: 'Science' },
    { name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'Science' },
    { name: 'Stat News', url: 'https://www.statnews.com/feed/', category: 'Health' },
    { name: 'WebMD', url: 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', category: 'Health' },
    { name: 'New York Times Health', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', category: 'Health' },
    { name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/feed', category: 'Health' },

    // --- ENTERTAINMENT & CULTURE ---
    { name: 'Variety', url: 'https://variety.com/feed/', category: 'Culture & Society' },
    { name: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/', category: 'Culture & Society' },
    { name: 'Rolling Stone', url: 'https://www.rollingstone.com/feed/', category: 'Culture & Society' },
    { name: 'Pitchfork', url: 'https://pitchfork.com/feed/feed-news/rss', category: 'Culture & Society' },
    { name: 'Billboard', url: 'https://www.billboard.com/feed/', category: 'Culture & Society' },
    { name: 'Deadline', url: 'https://deadline.com/feed/', category: 'Culture & Society' },
    { name: 'Vulture', url: 'https://www.vulture.com/rss.xml', category: 'Culture & Society' },
    { name: 'People Magazine', url: 'https://people.com/feed.rss', category: 'Culture & Society' },

    // --- SPORTS ---
    { name: 'ESPN Top News', url: 'https://www.espn.com/espn/rss/news', category: 'Entertainment' },
    { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/rss/', category: 'Entertainment' },
    { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/', category: 'Entertainment' },
    { name: 'Bleacher Report', url: 'https://bleacherreport.com/articles/feed', category: 'Entertainment' },
    { name: 'The Athletic', url: 'https://theathletic.com/rss/', category: 'Entertainment' },

    // --- ENVIRONMENT ---
    { name: 'Grist', url: 'https://grist.org/feed/', category: 'Environment' },
    { name: 'Treehugger', url: 'https://www.treehugger.com/feeds/latest', category: 'Environment' },
    { name: 'Inside Climate News', url: 'https://insideclimatenews.org/feed/', category: 'Environment' }
];

async function migrate() {
    console.log(`🚀 Starting migration of ${FEEDS.length} feeds...`);

    if (!dbService.supabase) {
        console.error('❌ Supabase not initialized. Check .env');
        process.exit(1);
    }

    let addedCount = 0;

    for (const feed of FEEDS) {
        try {
            const { error } = await dbService.supabase
                .from('rss_feeds')
                .upsert({
                    name: feed.name,
                    url: feed.url,
                    category: feed.category,
                    enabled: true,
                    failureCount: 0
                }, { onConflict: 'url' }); // Assuming URL is unique or handled by DB constraint?
            // Note: If no unique constraint on URL, this might duplicate if run multiple times.
            // Ideally we should match on URL. The schema might need checking, but usually URL is a good unique key.

            if (!error) {
                // console.log(`   ✅ Added/Updated: ${feed.name}`);
                addedCount++;
            } else {
                console.error(`   ❌ Failed to add ${feed.name}:`, error.message);
            }
        } catch (e) {
            console.error(`   ⚠️ Error processing ${feed.name}:`, e.message);
        }
    }

    console.log(`\n✨ Migration Complete. Added/Ensured ${addedCount} feeds.`);
    process.exit(0);
}

migrate();
