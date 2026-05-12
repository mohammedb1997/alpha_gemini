const fs = require('fs');
const src = fs.readFileSync('C:/Users/lol/AppData/Local/Temp/opencode/tahadi-alhorouf/dist/bundle.html', 'utf8');
const match = src.match(/<script>([\s\S]*?)<\/script>/);
if (!match) { console.log('no inline script found'); process.exit(1); }
const code = match[1];

function check(start, end) {
  const segment = code.substring(start, end);
  try {
    new Function(segment);
    return true;
  } catch (e) {
    return false;
  }
}

let lo = 0, hi = code.length;
// Find first failing position
while (lo < hi - 1) {
  const mid = Math.floor((lo + hi) / 2);
  if (check(0, mid)) {
    lo = mid;
  } else {
    hi = mid;
  }
}
console.log('First error near position:', hi);
const ctx = code.substring(Math.max(0, hi - 100), Math.min(code.length, hi + 200));
console.log('Context:');
console.log(ctx);
