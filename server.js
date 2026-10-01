// Run: node server.js [port] — serves only the standalone game on the local network.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.argv[2] || 8080);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('Choose a port from 1024 to 65535.');
  process.exit(1);
}
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { res.writeHead(400); return res.end(); }
  const asset=/^\/(assets[12])\/([a-z_]+\.png)$/.exec(pathname);
  if (asset) {
    const file=path.join(__dirname,asset[1],asset[2]);
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':'image/png','Content-Length':data.length,'Cache-Control':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:data);});
    return;
  }
  if (!['/', '/game.html', '/index.html'].includes(pathname)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  const gameFile=fs.existsSync(path.join(__dirname,'game.web.html'))?'game.web.html':'game.html';
  fs.readFile(path.join(__dirname, gameFile), (error, html) => {
    if (error) { res.writeHead(500); return res.end('Game file unavailable'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : html);
  });
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use; run node server.js with another port.` : error.message);
  process.exit(1);
});
server.listen(port, '0.0.0.0', () => console.log(`Game server running on port ${port}. Local: http://localhost:${port}/ — Stop: Ctrl+C`));
