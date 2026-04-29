-- Add new RSS feeds (Fox News, MSNBC, AP via RSSHub if needed, etc.)
INSERT INTO rss_feeds (name, url, category, enabled) VALUES
    ('Fox News', 'https://moxie.foxnews.com/google-publisher/latest.xml', 'General', true),
    ('Fox News Politics', 'https://moxie.foxnews.com/google-publisher/politics.xml', 'Politics', true),
    ('Fox Business', 'https://moxie.foxnews.com/google-publisher/business.xml', 'Finance', true),
    ('MSNBC Top Stories', 'https://feeds.nbcnews.com/msnbc/public/all', 'General', true),
    ('Reuters World', 'https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best', 'General', true)
ON CONFLICT (url) DO NOTHING;
