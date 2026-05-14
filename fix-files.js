const fs = require('fs');

function unescapeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = unescapeHtml(content);
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (e) {
    console.error(`Error fixing ${filePath}:`, e);
  }
}

// Fix all our component files
fixFile('src/pages/Home.tsx');
fixFile('src/components/Toolbar.tsx');
fixFile('src/components/MindMapCanvas.tsx');
fixFile('src/components/Node.tsx');
fixFile('src/hooks/useMindMapStore.ts');
