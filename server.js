const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'itinerary.json');
const BACKUP_FILE = path.join(DATA_DIR, 'itinerary.backup.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Backup initial file on startup if not yet backed up
if (fs.existsSync(DATA_FILE) && !fs.existsSync(BACKUP_FILE)) {
  try {
    fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  } catch (err) {
    console.error('Error creating backup file:', err);
  }
}

// API Routes
app.get('/api/itinerary', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(404).json({ error: 'ไม่พบไฟล์ข้อมูลกำหนดการ' });
    }
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(rawData);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(data);
  } catch (error) {
    console.error('Error reading itinerary:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอ่านข้อมูล: ' + error.message });
  }
});

// Helper to auto-commit and push to GitHub
function runGitSync() {
  return new Promise((resolve) => {
    exec('git status --porcelain data/itinerary.json public/data/itinerary.json', { cwd: __dirname }, (sErr, sOut) => {
      if (!sOut || sOut.trim().length === 0) {
        return resolve({ success: true, message: 'ข้อมูลตรงกับ GitHub ล่าสุดอยู่แล้ว' });
      }
      const cmd = 'git add data/itinerary.json public/data/itinerary.json && git commit -m "Auto-update itinerary data from Admin panel" && git push origin main && git push origin gh-pages';
      exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
          console.log('Git sync error:', stderr || error.message);
          resolve({ success: false, message: stderr || error.message });
        } else {
          console.log('Git push success:\n', stdout);
          resolve({ success: true, message: 'ส่งข้อมูลขึ้น GitHub เรียบร้อยแล้ว! 🚀', stdout });
        }
      });
    });
  });
}

app.post('/api/itinerary', async (req, res) => {
  try {
    const newData = req.body;
    if (!newData || !newData.days) {
      return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง (ต้องมีรายการ days)' });
    }
    // Write formatted JSON to local files
    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
    const publicDataFile = path.join(__dirname, 'public', 'data', 'itinerary.json');
    if (fs.existsSync(path.dirname(publicDataFile))) {
      fs.writeFileSync(publicDataFile, JSON.stringify(newData, null, 2), 'utf8');
    }

    // Auto Git Push in background
    let gitResult = { success: false, message: 'Skipped' };
    try {
      gitResult = await runGitSync();
    } catch (gErr) {
      console.error('Git sync error:', gErr);
    }

    res.json({
      success: true,
      message: gitResult.success ? 'บันทึกข้อมูลและส่งขึ้น GitHub เรียบร้อยแล้ว! 🚀' : 'บันทึกข้อมูลเรียบร้อยแล้ว',
      gitSync: gitResult.success,
      gitMessage: gitResult.message
    });
  } catch (error) {
    console.error('Error writing itinerary:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message });
  }
});

app.post('/api/git-sync', async (req, res) => {
  try {
    const result = await runGitSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/itinerary/reset', (req, res) => {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      fs.copyFileSync(BACKUP_FILE, DATA_FILE);
      const rawData = fs.readFileSync(DATA_FILE, 'utf8');
      res.json({ success: true, message: 'คืนค่ากำหนดการเริ่มต้นเรียบร้อยแล้ว', data: JSON.parse(rawData) });
    } else {
      res.status(404).json({ error: 'ไม่พบไฟล์ข้อมูลสำรองเริ่มต้น' });
    }
  } catch (error) {
    console.error('Error resetting itinerary:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการคืนค่า: ' + error.message });
  }
});

// Front-end routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/v2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'v2.html'));
});

app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

// Serve original photos/docs
app.use('/docs', express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper to get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log('========================================================');
  console.log(`🚀 กำหนดการเดินทาง Web Application พร้อมทำงานแล้ว!`);
  console.log(`📱 สำหรับผู้เข้าร่วม (Participant View):`);
  console.log(`   - เครื่องนี้ (Local):   http://localhost:${PORT}`);
  console.log(`   - มือถือ/อุปกรณ์อื่น (LAN): http://${localIP}:${PORT}`);
  console.log(`--------------------------------------------------------`);
  console.log(`⚙️ สำหรับจัดการหลังบ้าน (Admin Panel):`);
  console.log(`   - เครื่องนี้ (Local):   http://localhost:${PORT}/admin`);
  console.log(`   - มือถือ/อุปกรณ์อื่น (LAN): http://${localIP}:${PORT}/admin`);
  console.log('========================================================');
});
