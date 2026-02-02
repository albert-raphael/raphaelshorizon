const https = require('https');
const fs = require('fs');
const token = process.env.GH_TOKEN || process.env.GH_PAT;
if (!token) { console.error('GH_TOKEN missing'); process.exit(2); }
const owner = 'albert-raphael';
const repo = 'raphaelshorizon';
const runId = process.argv[2] || '20688917357';
const maxAttempts = 60;
const delayMs = 15000;

function getRun() {
  return new Promise((resolve,reject)=>{
    const opts = { hostname: 'api.github.com', path: `/repos/${owner}/${repo}/actions/runs/${runId}`, headers: { 'User-Agent': 'node.js', 'Authorization': `token ${token}` } };
    https.get(opts, res => { let d=''; res.on('data', c=>d+=c); res.on('end', ()=>{ if (res.statusCode === 200) resolve(JSON.parse(d)); else reject(new Error('status '+res.statusCode)); }); }).on('error', reject);
  });
}

(async ()=>{
  for (let i=0;i<maxAttempts;i++){
    try{
      const run = await getRun();
      console.log(new Date().toISOString(), 'run', run.status, run.conclusion || '');
      if (run.status === 'completed'){
        console.log('Completed run. Saving run.json'); fs.writeFileSync('ci-logs/last-run.json', JSON.stringify(run, null, 2)); process.exit(0);
      }
    }catch(err){
      console.error('getRun err', err.message);
    }
    await new Promise(r=>setTimeout(r, delayMs));
  }
  console.log('timeout waiting for run completion'); process.exit(1);
})();