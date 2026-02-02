const http = require('http');
const paths = ['/','/blog','/blog/some-post','/admin','/admin/login_admin.html','/books','/books/unknown','/nonexistent'];
const port = process.env.PORT ? parseInt(process.env.PORT,10) : (process.argv[2] ? parseInt(process.argv[2],10) : 3000);
function request(path) {
  return new Promise(resolve => {
    const req = http.get({hostname:'localhost', port, path, timeout:5000}, res => {
      let data='';
      res.on('data', c=> data += c);
      res.on('end', () => resolve({path, status: res.statusCode, len: data.length, type: res.headers['content-type']}));
    });
    req.on('error', e => resolve({path, error: e.message}));
    req.on('timeout', () => { req.abort(); resolve({path, error: 'timeout'}); });
  });
}

(async()=>{
  for (const p of paths) {
    const r = await request(p);
    if (r.error) console.log(`${r.path} => ERROR: ${r.error}`);
    else console.log(`${r.path} => ${r.status} | Len:${r.len} | Type:${r.type || ''}`);
  }
})();
