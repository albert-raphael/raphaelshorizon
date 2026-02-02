const https = require('https');
const fs = require('fs');
const path = require('path');
const token = process.env.GH_TOKEN || process.env.GH_PAT;
if (!token) {
  console.error('GH_TOKEN missing');
  process.exit(2);
}
const owner = 'albert-raphael';
const repo = 'raphaelshorizon';
const tag = 'v0.0.3-test-2';
const name = tag;

function createRelease() {
  return new Promise((resolve,reject)=>{
    const payload = JSON.stringify({ tag_name: tag, name, body: 'Automated test release', draft: false, prerelease: true });
    const req = https.request({ hostname: 'api.github.com', path: `/repos/${owner}/${repo}/releases`, method: 'POST', headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if (res.statusCode >= 400) return reject(new Error('create release failed '+res.statusCode+' '+d)); resolve(JSON.parse(d)); });
    });
    req.on('error',reject);
    req.write(payload); req.end();
  });
}
function uploadAsset(uploadUrl, filePath) {
  return new Promise((resolve,reject)=>{
    const name = path.basename(filePath);
    const url = uploadUrl.replace('{?name,label}', `?name=${encodeURIComponent(name)}`);
    const stat = fs.statSync(filePath);
    const opts = new URL(url);
    const req = https.request({ hostname: opts.hostname, path: opts.pathname + opts.search, method: 'POST', headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}`, 'Content-Type': 'application/octet-stream', 'Content-Length': stat.size } }, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if (res.statusCode >= 400) return reject(new Error('upload failed '+res.statusCode+' '+d)); resolve(JSON.parse(d)); });
    });
    req.on('error',reject);
    fs.createReadStream(filePath).pipe(req);
  });
}
(async ()=>{
  try {
    const rel = await createRelease();
    console.log('Release created:', rel.html_url);
    const uploadUrl = rel.upload_url;
    const candidates = [
      'local-dist2\\RHorizon-win32-x64\\RHorizon.exe',
      'electron\\binaries\\win\\backend.exe'
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        console.log('Uploading', c);
        const res = await uploadAsset(uploadUrl, c);
        console.log('Uploaded', res.browser_download_url);
      } else {
        console.log('Missing', c);
      }
    }
  } catch (err) { console.error(err.message); process.exit(1); }
})();