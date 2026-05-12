const fs = require('fs');
const src = fs.readFileSync('C:/Users/lol/AppData/Local/Temp/opencode/tahadi-alhorouf/dist/bundle.html', 'utf8');
const match = src.match(/<script>([\s\S]*?)<\/script>/);
if (!match) { console.log('no inline script found'); process.exit(1); }
const code = match[1];
try {
  new Function(code);
  console.log('SYNTAX OK');
} catch (e) {
  console.log('Error type:', e.constructor.name);
  console.log('Message:', e.message);
  console.log('Stack:', e.stack ? e.stack.substring(0, 500) : 'none');
}
