const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace divisors in the math calculation to make blowing ~50% harder
  content = content.replace(/\/ 50/g, '/ 100');
  content = content.replace(/\/ 100/g, '/ 160');
  content = content.replace(/\/ 120/g, '/ 180');
  content = content.replace(/\/ 150/g, '/ 220');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated sensitivity in ${file}`);
  }
});
