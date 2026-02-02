const fs = require('fs');
const path = require('path');
const p = path.resolve(process.cwd(), 'dist', 'win-unpacked', 'resources', 'app.asar');
const out = path.resolve(process.cwd(), 'tools', 'app_asar_stat.txt');
try {
  fs.writeFileSync(out, 'cwd=' + process.cwd() + '\n');
  const s = fs.statSync(p);
  fs.appendFileSync(out, `exists size=${s.size} mtime=${s.mtime.toISOString()}`);
  try {
    fs.unlinkSync(p);
    fs.appendFileSync(out, '\ndeleted: ' + (!fs.existsSync(p)));
  } catch (e) {
    fs.appendFileSync(out, '\ndelete_error: ' + e.message);
  }
} catch (e) {
  fs.appendFileSync(out, 'not_found: ' + e.message);
}
console.log('check complete');
