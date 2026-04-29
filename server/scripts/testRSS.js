const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ingestService = require('../services/ingestService');

async function test() {
    console.log('Testing RSS Ingestion...');
    await ingestService.ingestNews();
    console.log('Done.');
}

test();
