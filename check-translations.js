const fs = require('fs');

const content = fs.readFileSync('./data/restaurant-data.ts', 'utf-8');

// Extract language sections
const translationsStart = content.indexOf('translations: {');
const translationsEnd = content.lastIndexOf('},');
const translationsContent = content.substring(translationsStart + 15, translationsEnd);

// Find all language codes and their starting positions
const langRegex = /\n\s{4}([a-z]{2}):\s*{/g;
const languages = [];
let match;
while ((match = langRegex.exec(translationsContent)) !== null) {
  languages.push(match[1]);
}

console.log('Languages found:', languages);

// Now extract all keys from English as reference
const enStart = translationsContent.indexOf('en: {');
const enEnd = translationsContent.indexOf('},', enStart);
const enSection = translationsContent.substring(enStart, enEnd);

// Extract all translation keys
const keyRegex = /^\s+([a-zA-Z_]+):\s/gm;
const enKeys = new Set();
let keyMatch;
while ((keyMatch = keyRegex.exec(enSection)) !== null) {
  enKeys.add(keyMatch[1]);
}

console.log('\nTotal keys in English:', enKeys.size);
console.log('Keys:', Array.from(enKeys).sort().join(', '));

// Check each language
console.log('\n--- Translation Completeness Check ---\n');
languages.forEach(lang => {
  const langStart = translationsContent.indexOf(`${lang}: {`);
  const langEnd = translationsContent.indexOf('},', langStart);
  const langSection = translationsContent.substring(langStart, langEnd);
  
  const langKeys = new Set();
  const keyRegex = /^\s+([a-zA-Z_]+):\s/gm;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(langSection)) !== null) {
    langKeys.add(keyMatch[1]);
  }
  
  const missing = Array.from(enKeys).filter(k => !langKeys.has(k));
  const extra = Array.from(langKeys).filter(k => !enKeys.has(k));
  
  console.log(`Language: ${lang.toUpperCase()}`);
  console.log(`  Total keys: ${langKeys.size}`);
  console.log(`  Complete: ${langKeys.size === enKeys.size ? '✓ YES' : '✗ NO'}`);
  if (missing.length > 0) {
    console.log(`  Missing (${missing.length}): ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.log(`  Extra (${extra.length}): ${extra.join(', ')}`);
  }
  console.log();
});
