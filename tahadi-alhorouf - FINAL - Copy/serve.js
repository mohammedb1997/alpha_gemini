const h = require('http'), f = require('fs'), p = require('path'), u = require('url');
const dir = p.join(__dirname, 'dist');
h.createServer((q, r) => {
  const pathname = u.parse(q.url).pathname;
  let fp = pathname === '/' ? p.join(dir, 'bundle.html') : p.join(dir, pathname);
  if (f.existsSync(fp)) { r.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' }); r.end(f.readFileSync(fp)); }
  else { r.writeHead(404); r.end('Not found'); }
}).listen(8081, () => console.log('http://localhost:8081'));
