const https = require('https');
const fs = require('fs');

if (!fs.existsSync('releases.json')) {
  console.error('releases.json not found. Run poll_release.js first.');
  process.exit(1);
}
const rel = JSON.parse(fs.readFileSync('releases.json', 'utf8'));
const assets = rel.assets || [];
if (assets.length === 0) {
  console.log('No assets found in release.');
  process.exit(0);
}
if (!fs.existsSync('artifacts')) fs.mkdirSync('artifacts');

const token = process.env.GH_TOKEN || process.env.GH_PAT;
if (!token) {
  console.error('GH_TOKEN or GH_PAT must be present in the environment');
  process.exit(2);
}

function downloadFromUrl(url, dest) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.request({
      hostname: opts.hostname,
      path: opts.pathname + (opts.search || ''),
      method: 'GET',
      headers: {
        'User-Agent': 'node.js',
        'Authorization': `token ${token}`
      }
    }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // follow redirect
        return downloadFromUrl(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', reject);
    req.end();
  });
}

(async function(){
  for (const a of assets) {
    const name = a.name;
    const dest = `artifacts/${name}`;
    console.log('Downloading', name);
    try {
      await downloadFromUrl(a.browser_download_url, dest);
      console.log('Saved', dest);
    } catch(err) {
      console.error('Failed to download', name, err.message);
    }
  }
})();