const fs = require('fs');
const src = fs.readFileSync('C:/Users/lol/AppData/Local/Temp/opencode/tahadi-alhorouf/dist/bundle.html', 'utf8');
const match = src.match(/<script>([\s\S]*?)<\/script>/);
if (!match) { console.log('no inline script found'); process.exit(1); }
const code = match[1];

const len = code.length;
const segmentSize = 10000;

for (let i = 0; i < len; i += segmentSize) {
  const end = Math.min(i + segmentSize, len);
  const segment = code.substring(i, end);
  try {
    new Function(segment);
    console.log('Bytes', i, '-', end, ': OK');
  } catch (e) {
    console.log('Bytes', i, '-', end, ': ERROR -', e.message.substring(0, 100));
    const ctx = segment.substring(0, 200);
    console.log('Start:', ctx.substring(0, 100));
  }
}
