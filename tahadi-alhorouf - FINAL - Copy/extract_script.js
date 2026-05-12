const fs = require('fs');
const src = fs.readFileSync('C:/Users/lol/AppData/Local/Temp/opencode/tahadi-alhorouf/dist/bundle.html', 'utf8');
const match = src.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  fs.writeFileSync('C:/Users/lol/AppData/Local/Temp/opencode/extracted_script.js', match[1], 'utf8');
  console.log('Extracted', match[1].length, 'bytes');
}
