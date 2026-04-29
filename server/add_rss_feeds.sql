-- Add new RSS feeds to the database
INSERT INTO rss_feeds (name, url, category) VALUES
    -- Additional Major News Sources
    ('Reuters Top News', 'https://www.reuters.com/rssFeed/topNews', 'General'),
    ('AP News', 'https://feeds.apnews.com/rss/apf-topnews', 'General'),
    ('The Guardian', 'https://www.theguardian.com/world/rss', 'General'),
    ('Washington Post', 'https://www.washingtonpost.com/rss/world', 'General'),
    ('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'General'),
    ('Fox News', 'https://www.foxnews.com/about/rss/foxnews/latest', 'General'),
    ('CBS News', 'https://www.cbsnews.com/rss/news/', 'General'),
    ('ABC News', 'https://abcnews.go.com/rss', 'General'),
    ('NBC News', 'https://www.nbcnews.com/rss/news', 'General'),
    ('USA Today', 'https://www.usatoday.com/rss/news', 'General'),
    -- Business & Finance
    ('Bloomberg', 'https://www.bloomberg.com/feed/news/rss.xml', 'Finance'),
    ('Financial Times', 'https://www.ft.com/rss/home', 'Finance'),
    ('MarketWatch', 'https://www.marketwatch.com/rss/topstories', 'Finance'),
    ('Yahoo Finance', 'https://finance.yahoo.com/news/rssindex', 'Finance'),
    ('Forbes', 'https://www.forbes.com/rss/', 'Business'),
    ('Fortune', 'https://fortune.com/feed/', 'Business'),
    -- Technology
    ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'Tech'),
    ('Engadget', 'https://www.engadget.com/rss.xml', 'Tech'),
    ('Gizmodo', 'https://gizmodo.com/rss', 'Tech'),
    ('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'Tech'),
    ('IEEE Spectrum', 'https://spectrum.ieee.org/rss/fulltext', 'Tech'),
    -- International News
    ('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'International'),
    ('Deutsche Welle', 'https://rss.dw.com/xml/rss-de-all', 'International'),
    ('France 24', 'https://www.france24.com/en/rss', 'International'),
    ('CBC Canada', 'https://www.cbc.ca/cmlink/rss-topstories', 'International'),
    ('The Economist', 'https://www.economist.com/rss', 'International'),
    -- Specialty News
    ('Politico', 'https://www.politico.com/rss/articles.xml', 'Politics'),
    ('The Hill', 'https://thehill.com/rss/feed/', 'Politics'),
    ('Roll Call', 'https://rollcall.com/feed/', 'Politics'),
    ('Sports Illustrated', 'https://www.si.com/rss/si_topstories.rss', 'Sports'),
    ('ESPN', 'https://www.espn.com/espn/rss/news', 'Sports'),
    ('Bleacher Report', 'https://bleacherreport.com/articles.rss', 'Sports'),
    ('Entertainment Weekly', 'https://ew.com/rss.xml', 'Entertainment'),
    ('Variety', 'https://variety.com/feed/', 'Entertainment'),
    ('Hollywood Reporter', 'https://www.hollywoodreporter.com/feed/', 'Entertainment'),
    -- Regional US News
    ('Los Angeles Times', 'https://www.latimes.com/rss', 'Regional'),
    ('Chicago Tribune', 'https://www.chicagotribune.com/rss', 'Regional'),
    ('Boston Globe', 'https://www.bostonglobe.com/rss/', 'Regional'),
    ('Houston Chronicle', 'https://www.houstonchronicle.com/rss/', 'Regional'),
    -- Wire Services
    ('Agence France-Presse', 'https://www.afp.com/en/rss/824', 'Wire'),
    ('Xinhua', 'http://www.xinhuanet.com/english/rss/news.xml', 'Wire')
ON CONFLICT (url) DO NOTHING;