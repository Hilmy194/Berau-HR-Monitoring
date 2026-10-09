const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const srcFile = path.resolve(__dirname, '../data/private/data-atasan-karyawan.md');
if (fs.existsSync(srcFile)) {
  const content = fs.readFileSync(srcFile);
  const compressed = zlib.gzipSync(content).toString('base64');
  
  const runnerContent = `const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const b64 = "${compressed}";
const targetDir = path.resolve(__dirname, '../data/private');
const targetFile = path.join(targetDir, 'data-atasan-karyawan.md');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(targetFile, zlib.gunzipSync(Buffer.from(b64, 'base64')));
console.log('✅ File data-atasan-karyawan.md berhasil dibuat di ' + targetFile);
`;

  fs.writeFileSync(path.resolve(__dirname, 'restore_data.cjs'), runnerContent, 'utf-8');
  console.log('Generated scripts/restore_data.cjs');
}
