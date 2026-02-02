const https = require('https');
const fs = require('fs');

const owner = 'albert-raphael';
const repo = 'raphaelshorizon';
const tagToFind = 'v0.0.3-test-20260104';
const maxAttempts = 30;
const delayMs = 10000;

function fetchReleaseByTag() {
  return new Promise((resolve) => {
    const token = process.env.GH_TOKEN || process.env.GH_PAT;
    const headers = { 'User-Agent': 'node.js' };
    if (token) headers['Authorization'] = `token ${token}`;

    https.get({
      host: 'api.github.com',
      path: `/repos/${owner}/${repo}/releases/tags/${tagToFind}`,
      headers
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
            return;
          } catch (err) {
            resolve(null);
            return;
          }
        }
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

(async function poll() {
  for (let i = 0; i < maxAttempts; i++) {
    process.stdout.write(`Attempt ${i+1}/${maxAttempts}... `);
    const rel = await fetchReleaseByTag();
    if (rel && rel.tag_name === tagToFind) {
      fs.writeFileSync('releases.json', JSON.stringify(rel, null, 2));
      console.log('FOUND');
      process.exit(0);
    }
    console.log('not found');
    await new Promise(r => setTimeout(r, delayMs));
  }
  console.log('TIMEOUT');
  process.exit(2);
})();