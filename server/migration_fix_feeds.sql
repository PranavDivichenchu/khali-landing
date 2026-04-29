-- Fix broken feeds reported in logs

-- 1. Fix Fox News Politics URL (Use standard feed)
UPDATE rss_feeds 
SET url = 'http://feeds.foxnews.com/foxnews/politics', enabled = true
WHERE name = 'Fox News Politics';

-- 2. Disable Treehugger (402 Payment Required / Broken)
UPDATE rss_feeds 
SET enabled = false 
WHERE name = 'Treehugger';

-- 3. Disable LA Times World (Feed not recognized / likely HTML or blocked)
UPDATE rss_feeds 
SET enabled = false 
WHERE name = 'L.A. Times World';

-- 4. Disable any other potential duplicates or issues if found
-- (None reported yet)
