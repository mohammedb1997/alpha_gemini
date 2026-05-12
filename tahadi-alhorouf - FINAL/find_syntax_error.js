const fs = require('fs');
const src = fs.readFileSync('C:/Users/lol/AppData/Local/Temp/opencode/tahadi-alhorouf/dist/bundle.html', 'utf8');
const m = src.match(/<script>([\s\S]*?)<\/script>/g);
console.log('Number of script tag pairs:', m ? m.length : 0);
// Find the one that's our inline script (has content)
for (let i = 0; i < m.length; i++) {
  const inner = m[i].replace(/<script>/, '').replace(/<\/script>/, '');
  if (inner.trim().length > 100) {
    console.log('Found inline script, length:', inner.length);
    try {
      new Function(inner);
      console.log('NO SYNTAX ERROR');
    } catch (e) {
      console.log('SYNTAX ERROR:', e.message.substring(0, 200));
      const posMatch = e.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        console.log('Context:', inner.substring(Math.max(0, pos - 80), pos + 80));
      }
    }
    break;
  }
}
