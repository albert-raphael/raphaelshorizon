const https = require('https');

const owner = 'albert-raphael';
const repo = 'raphaelshorizon';
const token = process.env.GH_TOKEN || process.env.GH_PAT;
if (!token) return console.error('GH_TOKEN or GH_PAT env var required');

function getRuns() {
  return new Promise((resolve, reject) => {
    https.get({
      host: 'api.github.com',
      path: `/repos/${owner}/${repo}/actions/runs?per_page=50`,
      headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}` }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error('Failed to fetch runs: ' + res.statusCode));
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.workflow_runs || []);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

(async function() {
  try {
    const runs = await getRuns();
    runs.slice(0,20).forEach(r => {
      console.log(`${r.id} | ${r.name} | ${r.event} | ${r.status} | ${r.conclusion || ''} | head_branch:${r.head_branch} | head_sha:${r.head_sha} | url:${r.html_url}`);
    });
  } catch (err) {
    console.error(err.message);
  }
})();