const fs = require('fs');
const path = require('path');

const replacements = {
  'dark:bg-[#0d1117]': 'dark:bg-gray-900',
  'dark:bg-[#161b22]': 'dark:bg-gray-800',
  'dark:bg-[#21262d]': 'dark:bg-gray-700',
  'dark:border-[#30363d]': 'dark:border-gray-700',
  'dark:text-[#8b949e]': 'dark:text-gray-400',
  'dark:text-[#c9d1d9]': 'dark:text-gray-200',
  'dark:hover:bg-[#21262d]': 'dark:hover:bg-gray-700',
  'dark:hover:bg-[#30363d]': 'dark:hover:bg-gray-700',
  'dark:hover:text-[#c9d1d9]': 'dark:hover:text-gray-200',
  'bg-[#0d1117]': 'bg-gray-900',
  'text-[#c9d1d9]': 'text-gray-200',
  'border-[#30363d]': 'border-gray-700',
  'background: #30363d': 'background: #4b5563',
  'background: #484f58': 'background: #6b7280',
  'background-color: #161b22': 'background-color: #1f2937',
  'prose-pre:bg-[#f6f8fa] ': '',
  'dark:prose-pre:bg-[#161b22] ': '',
  'dark:prose-pre:border ': '',
  'dark:prose-pre:border-[#30363d] ': ''
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
