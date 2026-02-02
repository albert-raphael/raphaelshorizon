const https = require('https');
const fs = require('fs');
const token = process.env.GH_TOKEN || process.env.GH_PAT;
if (!token) {
  console.error('GH_TOKEN missing'); process.exit(2);
}
const owner = 'albert-raphael';
const repo = 'raphaelshorizon';
const tag = 'v0.0.3-test-2';

function getRelease() {
  return new Promise((resolve,reject)=>{
    const opts = { hostname: 'api.github.com', path: `/repos/${owner}/${repo}/releases/tags/${tag}`, headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}` } };
    https.get(opts, res => { let d=''; res.on('data', c => d+=c); res.on('end', ()=>{ if (res.statusCode !== 200) return reject(new Error('fetch failed '+res.statusCode+' '+d)); resolve(JSON.parse(d)); }); }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve,reject)=>{
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname+ (u.search||''), method: 'GET', headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}` } };
    const file = fs.createWriteStream(dest);
    https.get(opts, res => { if (res.statusCode >= 400) return reject(new Error('HTTP ' + res.statusCode)); res.pipe(file); file.on('finish', () => file.close(resolve)); }).on('error', reject);
  });
}

(async ()=>{
  try {
    const rel = await getRelease();
    if (!fs.existsSync('artifacts')) fs.mkdirSync('artifacts');
    for (const a of rel.assets || []) {
      const dest = `artifacts/${a.name}`;
      console.log('Downloading', a.name);
      await download(a.browser_download_url, dest);
      console.log('Saved', dest);
    }
  } catch(err) { console.error(err.message); process.exit(1); }
})();