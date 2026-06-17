const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(rootDir, '.next', 'standalone', 'public');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(rootDir, '.next', 'standalone', '.next', 'static');

console.log('[Build Helper] Copying public files to standalone/public...');
if (fs.existsSync(publicSrc)) {
  copyDirSync(publicSrc, publicDest);
} else {
  console.log('[Build Helper] Warning: public folder not found at ' + publicSrc);
}

console.log('[Build Helper] Copying static files to standalone/.next/static...');
if (fs.existsSync(staticSrc)) {
  copyDirSync(staticSrc, staticDest);
} else {
  console.log('[Build Helper] Warning: static folder not found at ' + staticSrc);
}

console.log('[Build Helper] Standalone asset copying complete!');
