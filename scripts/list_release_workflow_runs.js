const https = require('https');
const token = process.env.GH_TOKEN || process.env.GH_PAT;
console.log('token present:', !!token, 'len:', token ? token.length : 0);
if (!token) return console.error('GH_TOKEN or GH_PAT env var required');
const owner = 'albert-raphael';
const repo = 'raphaelshorizon';

function getWorkflows() {
  return new Promise((resolve,reject)=>{
    https.get({host:'api.github.com', path:`/repos/${owner}/${repo}/actions/workflows`, headers:{'User-Agent':'node.js','Authorization':`token ${token}`}}, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if(res.statusCode!==200) { console.error('GET /workflows failed', res.statusCode, d); return reject(new Error('wf fetch failed '+res.statusCode)); } try { resolve(JSON.parse(d).workflows); } catch(e){ console.error('parse error', e.message, d); reject(e); } });
    }).on('error',err=>{ console.error('request error', err.message); reject(err); });
  });
}
function getRuns(workflow_id) {
  return new Promise((resolve,reject)=>{
    https.get({host:'api.github.com', path:`/repos/${owner}/${repo}/actions/workflows/${workflow_id}/runs?per_page=50`, headers:{'User-Agent':'node.js','Authorization':`token ${token}`}}, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if(res.statusCode!==200) return reject(new Error('runs fetch failed '+res.statusCode)); resolve(JSON.parse(d).workflow_runs);});
    }).on('error',reject);
  });
}
(async ()=>{
  try {
    const wfs = await getWorkflows();
    const target = wfs.find(w=>w.name === 'Release: Build and Publish Electron App');
    if(!target) return console.error('Release workflow not found');
    console.log('Found workflow id', target.id);
    // Dispatch the workflow for our tag (workflow supports workflow_dispatch)
    const dispatch = await new Promise((resolve,reject)=>{
      const payload = JSON.stringify({ref: 'v0.0.3-test-20260104'});
      const req = https.request({hostname:'api.github.com', path:`/repos/${owner}/${repo}/actions/workflows/${target.id}/dispatches`, method:'POST', headers:{'User-Agent':'node.js','Authorization':`token ${token}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}}, res=>{
        let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ resolve({status:res.statusCode, body:d}); });
      });
      req.on('error', e=>reject(e));
      req.write(payload);
      req.end();
    });
    console.log('Dispatch result', dispatch.status);
    // Poll for runs after dispatch
    for (let i=0;i<20;i++) {
      const runs = await getRuns(target.id);
      const newRun = runs.find(r => r.head_ref === 'v0.0.3-test-20260104' || r.head_branch === 'v0.0.3-test-20260104');
      if (newRun) {
        console.log('New run found:', `${newRun.id} | ${newRun.event} | ${newRun.status} | ${newRun.conclusion || ''} | head_branch:${newRun.head_branch} | head_ref:${newRun.head_ref} | head_sha:${newRun.head_sha} | url:${newRun.html_url}`);
        return;
      }
      console.log('No new run yet, sleeping 15s...');
      await new Promise(r=>setTimeout(r,15000));
    }
    console.log('No run detected after polling');
  } catch(err){ console.error(err.message)}
})();