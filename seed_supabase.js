const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lyjdyozhzbshffrnigor.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2osam1UwdDAU6UH6_WYbGw_CwPlkA1W';

const dataPath = path.join(__dirname, 'data', 'itinerary.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const itineraryData = JSON.parse(rawData);

const payload = JSON.stringify({
  id: 'main',
  data: itineraryData,
  updated_at: new Date().toISOString()
});

const url = new URL(`${SUPABASE_URL}/rest/v1/itinerary_store`);

const options = {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(url, options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response body:', body || '(empty / success)');
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(payload);
req.end();
