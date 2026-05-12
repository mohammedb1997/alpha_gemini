const fs = require('fs');
const path = require('path');
require('./backup.js');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

// Read all JS files in order
const jsFiles = [
  'core/logger.js',
  'core/hex-engine.js', 
  'core/utils.js',
  'network/peer-config.js',
  'data/qbank.js',
  'screens/local-game.js',
  'screens/judge-game.js',
  'screens/player.js',
  'screens/display.js',
  'index.js'
];

// Build the output
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

// Read and inline each JS file
let scripts = '';
for (const f of jsFiles) {
  const filePath = path.join(SRC, f);
  if (fs.existsSync(filePath)) {
    scripts += '\n' + fs.readFileSync(filePath, 'utf8') + '\n';
  }
}

// Replace <script> placeholder with actual scripts
// The HTML has <!-- SCRIPTS --> comment as placeholder
html = html.replace('<!-- SCRIPTS -->', '<script>\n' + scripts + '\n</script>');

// Update PeerJS CDN version
html = html.replace('peerjs@1.5.1', 'peerjs@1.5.5');

// Write output
const outPath = path.join(DIST, 'bundle.html');
fs.writeFileSync(outPath, html, 'utf8');

const srcSize = jsFiles.reduce((acc, f) => {
  const p = path.join(SRC, f);
  return acc + (fs.existsSync(p) ? fs.statSync(p).size : 0);
}, 0) + fs.statSync(path.join(SRC, 'index.html')).size;

const outSize = fs.statSync(outPath).size;
console.log(`Source: ${(srcSize/1024).toFixed(1)} KB → Dist: ${(outSize/1024).toFixed(1)} KB`);
