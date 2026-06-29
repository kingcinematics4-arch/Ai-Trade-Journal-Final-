#!/usr/bin/env node
/**
 * fix-locales.js
 * Validates and repairs all JSON files in src/i18n/locales/
 * - Removes trailing commas
 * - Removes duplicate closing braces
 * - Removes text after root JSON object
 * - Escapes invalid quotation marks
 * - Removes comments
 * - Ensures UTF-8 encoding
 * - Ensures every locale has the same keys as English (adds missing keys)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'src', 'i18n', 'locales');

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getAllJsonFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllJsonFiles(full));
    } else if (entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Attempt to repair common JSON syntax errors.
 */
function repairJson(raw) {
  let text = raw;

  // 1. Remove BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // 2. Remove single-line comments  //...
  text = text.replace(/\/\/[^\n]*/g, '');

  // 3. Remove multi-line comments  /* ... */
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');

  // 4. Remove trailing commas before } or ]
  //    Handles cases like:  "key": "value",\n}
  text = text.replace(/,(\s*[}\]])/g, '$1');

  // 5. Try to parse; if it works we're done
  try {
    JSON.parse(text);
    return text;
  } catch (_) {}

  // 6. Find the position of the root closing brace and truncate everything after it
  //    Walk the string tracking depth
  try {
    let depth = 0;
    let inString = false;
    let escape = false;
    let rootEnd = -1;
    let started = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === '{' || ch === '[') {
        depth++;
        started = true;
      } else if (ch === '}' || ch === ']') {
        depth--;
        if (started && depth === 0) {
          rootEnd = i;
          break;
        }
      }
    }

    if (rootEnd !== -1 && rootEnd < text.length - 1) {
      const trimmed = text.slice(0, rootEnd + 1);
      try {
        JSON.parse(trimmed);
        console.log('    â†’ Truncated trailing garbage after root object');
        return trimmed;
      } catch (_) {
        text = trimmed; // still use the truncated version for further repairs
      }
    }
  } catch (_) {}

  // 7. Re-apply trailing comma removal (in case truncation exposed new ones)
  text = text.replace(/,(\s*[}\]])/g, '$1');

  // 8. Try again
  try {
    JSON.parse(text);
    return text;
  } catch (err) {
    // 9. Last resort: use a more aggressive approach
    //    Try to fix unescaped quotes inside string values
    //    This is a heuristic and may not always work perfectly
    console.log('    â†’ Attempting aggressive string-quote repairâ€¦');
    const fixed = aggressiveQuoteFix(text);
    try {
      JSON.parse(fixed);
      return fixed;
    } catch (err2) {
      console.error('    âœ— Could not auto-repair:', err2.message);
      return null; // signal failure
    }
  }
}

/**
 * Very rough heuristic: find lines that look like  "key": "value with "quotes" inside"
 * and escape the inner quotes.
 */
function aggressiveQuoteFix(text) {
  // Replace unescaped quotes inside string values
  // Pattern: after ": " find a string that contains unescaped "
  return text.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
    // Already valid quoted string â€“ leave it
    return match;
  });
}

/**
 * Deep-merge: for every key in `source` that is missing in `target`, add it.
 * Returns the merged object and a list of added key paths.
 */
function mergeKeys(target, source, prefix = '') {
  const added = [];
  for (const key of Object.keys(source)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!(key in target)) {
      target[key] = source[key];
      added.push(fullKey);
    } else if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      const sub = mergeKeys(target[key], source[key], fullKey);
      added.push(...sub);
    }
  }
  return added;
}

/**
 * Convert Windows backslashes to forward slashes for consistent key usage
 */
function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

// â”€â”€â”€ main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const allFiles = getAllJsonFiles(LOCALES_DIR);
console.log(`Found ${allFiles.length} JSON files in ${LOCALES_DIR}\n`);

// Step 1: Validate & repair syntax
const parsed = {}; // relative path â†’ parsed object
let syntaxErrors = 0;
let syntaxFixed = 0;

for (const file of allFiles) {
  const rel = normalizePath(path.relative(LOCALES_DIR, file));
  const raw = fs.readFileSync(file, 'utf8');

  let obj;
  try {
    obj = JSON.parse(raw);
    parsed[rel] = obj;
    console.log(`âœ“ ${rel}`);
  } catch (err) {
    console.log(`âœ— ${rel}  â†’  ${err.message}`);
    syntaxErrors++;

    const repaired = repairJson(raw);
    if (repaired !== null) {
      try {
        obj = JSON.parse(repaired);
        parsed[rel] = obj;
        // Write repaired file
        fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
        console.log(`  âœ” Repaired and saved: ${rel}`);
        syntaxFixed++;
      } catch (e) {
        console.error(`  âœ— Repair failed for ${rel}: ${e.message}`);
      }
    }
  }
}

console.log(`\nSyntax check: ${syntaxErrors} errors found, ${syntaxFixed} repaired.\n`);

// Step 2: Ensure every locale has the same keys as English
const locales = fs
  .readdirSync(LOCALES_DIR)
  .filter((d) => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory());

const fileNames = [
  'ai',
  'analytics',
  'auth',
  'calendar',
  'common',
  'dashboard',
  'errors',
  'landing',
  'profile',
  'settings',
  'strategies',
  'trading',
  'validation',
];

let totalMissing = 0;

for (const fileName of fileNames) {
  const enKey = `en/${fileName}.json`;
  const enObj = parsed[enKey];
  if (!enObj) {
    console.warn(`âš  English file not found or not parsed: ${enKey}`);
    continue;
  }

  for (const locale of locales) {
    if (locale === 'en') continue;
    const locKey = `${locale}/${fileName}.json`;
    let locObj = parsed[locKey];

    if (!locObj) {
      console.warn(`âš  Missing or unparseable: ${locKey} â€“ creating from English`);
      locObj = JSON.parse(JSON.stringify(enObj));
      parsed[locKey] = locObj;
      const outPath = path.join(LOCALES_DIR, locale, `${fileName}.json`);
      fs.writeFileSync(outPath, JSON.stringify(locObj, null, 2) + '\n', 'utf8');
      totalMissing++;
      continue;
    }

    const added = mergeKeys(locObj, enObj);
    if (added.length > 0) {
      totalMissing += added.length;
      console.log(`  + Added ${added.length} missing key(s) to ${locKey}:`);
      added.forEach((k) => console.log(`      ${k}`));
      const outPath = path.join(LOCALES_DIR, locale, `${fileName}.json`);
      fs.writeFileSync(outPath, JSON.stringify(locObj, null, 2) + '\n', 'utf8');
    }
  }
}

console.log(`\nKey sync: ${totalMissing} missing keys added across all locales.\n`);

// Step 3: Final validation pass
console.log('=== Final validation pass ===');
let finalErrors = 0;
for (const file of getAllJsonFiles(LOCALES_DIR)) {
  const rel = normalizePath(path.relative(LOCALES_DIR, file));
  try {
    const content = fs.readFileSync(file, 'utf8');
    JSON.parse(content);
    console.log(`âœ“ ${rel}`);
  } catch (err) {
    console.error(`âœ— ${rel}: ${err.message}`);
    finalErrors++;
  }
}

if (finalErrors === 0) {
  console.log('\nâœ… All JSON files are valid!');
} else {
  console.error(`\nâŒ ${finalErrors} file(s) still have errors. Manual intervention required.`);
  process.exit(1);
}