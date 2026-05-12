const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;
const backupDir = path.join(root, 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dst = path.join(backupDir, 'backup_' + ts);

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const excludes = ['backups', 'node_modules', 'dist', 'backup.js', 'fix_encoding.js', 'verify_fix.js', 'start_server.bat', '.git'];
const items = fs.readdirSync(root);
for (const item of items) {
  if (excludes.includes(item) || item.startsWith('backup_') || item.startsWith('_')) continue;
  copyRecursive(path.join(root, item), path.join(dst, item));
}

console.log('Backup saved to: ' + dst);
