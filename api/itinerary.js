const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const dataPath = path.join(process.cwd(), 'data', 'itinerary.json');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return res.status(200).send(data);
    }
    // Fallback embedded
    const fallbackPath = path.join(process.cwd(), 'public', 'data', 'itinerary.json');
    if (fs.existsSync(fallbackPath)) {
      const data = fs.readFileSync(fallbackPath, 'utf8');
      return res.status(200).send(data);
    }
    return res.status(404).json({ error: 'Data not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
