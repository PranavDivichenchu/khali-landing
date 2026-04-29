require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkColumns() {
    console.log("Checking columns for 'aggregated_stories'...");

    // Simple way to check columns is to select one row and look at keys
    const { data, error } = await supabase
        .from('aggregated_stories')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found on row:", Object.keys(data[0]));
    } else {
        console.log("No data found, cannot check keys via select *.");
        // Try invalid query to get hint?
    }
}

checkColumns();
