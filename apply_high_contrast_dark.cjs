const fs = require('fs');
const path = require('path');

const replacements = {
  'dark:bg-gray-900': 'dark:bg-[#121212]',
  'dark:bg-gray-800': 'dark:bg-[#1e1e1e]',
  'dark:bg-gray-700': 'dark:bg-[#2d2d2d]',
  'dark:border-gray-700': 'dark:border-[#333333]',
  'dark:hover:bg-gray-700': 'dark:hover:bg-[#2d2d2d]',
  'dark:hover:bg-gray-800': 'dark:hover:bg-[#333333]',
  'dark:text-gray-400': 'dark:text-[#a0a0a0]',
  'dark:text-gray-200': 'dark:text-[#e0e0e0]',
  'dark:text-white': 'dark:text-white',
  'bg-gray-900': 'bg-[#121212]',
  'bg-gray-800': 'bg-[#1e1e1e]',
  'border-gray-700': 'border-[#333333]',
  'text-gray-200': 'text-[#e0e0e0]',
  'text-gray-400': 'text-[#a0a0a0]',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
      processFile(fullPath);
    }
  }
}

walkDir('./src');
