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

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => reject(err));
  });
}

(async function(){
  for (const a of assets) {
    const name = a.name;
    console.log('Downloading', name);
    try {
      await download(a.browser_download_url, `artifacts/${name}`);
      console.log('Saved', name);
    } catch(err) {
      console.error('Failed to download', name, err.message);
    }
  }
})();