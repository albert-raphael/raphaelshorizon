const https = require('https');
const fs = require('fs');
const token = process.env.GH_TOKEN || process.env.GH_PAT;
if (!token) { console.error('GH_TOKEN missing'); process.exit(2); }
const owner = 'albert-raphael';
const repo = 'raphaelshorizon';
const runId = process.argv[2] || '20683485376';

function getJobs() {
  return new Promise((resolve,reject)=>{
    const opts = { hostname: 'api.github.com', path: `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`, headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}` } };
    https.get(opts, res => { let d=''; res.on('data', c=>d+=c); res.on('end', ()=>{ if (res.statusCode !== 200) return reject(new Error('jobs fetch failed '+res.statusCode+' '+d)); resolve(JSON.parse(d)); }); }).on('error', reject);
  });
}

async function downloadLog(url, dest) {
  return new Promise((resolve,reject)=>{
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + (u.search||''), headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}` } };
    const file = fs.createWriteStream(dest);
    https.get(opts, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // follow redirect
        const loc = res.headers.location;
        if (!loc) return reject(new Error('redirect without Location'));
        return downloadLog(loc, dest).then(resolve).catch(reject);
      }
      if (res.statusCode >= 400) return reject(new Error('HTTP ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

(async ()=>{
  try {
    const jobsResp = await getJobs();
    const jobs = jobsResp.jobs || [];
    if (!fs.existsSync('ci-logs')) fs.mkdirSync('ci-logs');
    for (const j of jobs) {
      console.log('Job:', j.name, 'status:', j.status, 'conclusion:', j.conclusion);
      const logsUrl = j.logs_url;
      const dest = `ci-logs/job-${j.id}.log`;
      await downloadLog(logsUrl, dest);
      console.log('Saved logs to', dest);
    }
  } catch(err) { console.error(err.message); process.exit(1); }
})();