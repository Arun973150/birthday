const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Function to copy single file
function copyFile(src, dest) {
  fs.copyFileSync(src, path.join(dest, path.basename(src)));
}

// Copy all assets to dist folder
const distPath = path.join(__dirname, 'dist');

console.log('Copying assets to dist folder...');

// Copy directories
['fonts', 'img', 'music', 'style'].forEach(dir => {
  console.log(`Copying ${dir}/...`);
  copyDir(path.join(__dirname, dir), path.join(distPath, dir));
});

// Copy files
console.log('Copying index.html...');
copyFile(path.join(__dirname, 'index.html'), distPath);

console.log('Copying wishes.json...');
copyFile(path.join(__dirname, 'wishes.json'), distPath);

console.log('✅ All assets copied successfully!');
