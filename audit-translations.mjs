import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { glob } from 'fs/promises';

const ROOT = 'c:/Users/RCG/Desktop/skillion-next/app';
const MSGS = join(ROOT, 'messages');

// Helper: flatten nested JSON object into dot-notation keys
function flattenKeys(obj, prefix = '') {
    let keys = [];
    for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null) {
            keys = keys.concat(flattenKeys(v, full));
        } else {
            keys.push(full);
        }
    }
    return keys;
}

// Extract all t("...") keys from a file's content
function extractUsedKeys(content) {
    const re = /t\(["'`]([^"'`]+)["'`]\)/g;
    const keys = [];
    let m;
    while ((m = re.exec(content)) !== null) {
        keys.push(m[1]);
    }
    return keys;
}

// Read all TSX/TS files in app (excluding messages dir and node_modules)
function readAllComponents(dir) {
    let usedKeys = new Set();
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory() && !['node_modules', '.next', 'messages'].includes(e.name)) {
            const sub = readAllComponents(full);
            sub.forEach(k => usedKeys.add(k));
        } else if (e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.ts'))) {
            const content = readFileSync(full, 'utf8');
            extractUsedKeys(content).forEach(k => usedKeys.add(k));
        }
    }
    return usedKeys;
}

// Run audit
const usedKeys = readAllComponents(ROOT);
console.log(`\n📌 Total unique translation keys used in components: ${usedKeys.size}\n`);

const langs = ['en', 'it', 'es', 'fr', 'de'];
const results = {};

for (const lang of langs) {
    const jsonPath = join(MSGS, `${lang}.json`);
    const json = JSON.parse(readFileSync(jsonPath, 'utf8'));
    const availableKeys = new Set(flattenKeys(json));

    const missing = [...usedKeys].filter(k => !availableKeys.has(k));
    const unused = [...availableKeys].filter(k => !usedKeys.has(k));

    results[lang] = { missing, unused, total: availableKeys.size };

    console.log(`\n🌍 ${lang.toUpperCase()} — ${availableKeys.size} keys available`);
    if (missing.length === 0) {
        console.log(`  ✅ All keys present`);
    } else {
        console.log(`  ❌ ${missing.length} MISSING keys:`);
        missing.forEach(k => console.log(`    - ${k}`));
    }
}

console.log('\n\n=== SUMMARY ===');
for (const [lang, r] of Object.entries(results)) {
    const status = r.missing.length === 0 ? '✅' : `❌ ${r.missing.length} missing`;
    console.log(`  ${lang.toUpperCase()}: ${status}`);
}
