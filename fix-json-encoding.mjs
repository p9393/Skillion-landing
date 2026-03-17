/**
 * patch-json-characters.mjs  
 * Direct byte-level replacement of known corrupted sequences.
 * 
 * The corruption pattern is: UTF-8 multi-byte char was read as Latin-1
 * and re-encoded as UTF-8, creating doubled sequences.
 * 
 * We read the file as binary (latin1) and do string replacements,
 * then write back as UTF-8.
 */

import { readFileSync, writeFileSync } from 'fs';

// Read as latin1 (each byte = one char) to avoid any re-interpretation
// Then we can map the corrupted sequences correctly

// What we see in the file (read as UTF-8, so these are the JS string values)
// We need to replace them with the correct Unicode chars

const fixes = {
    // em-dash U+2014
    // UTF-8 of U+2014 is E2 80 94 
    // When misread as latin1 and re-encoded: â€" (a-hat, euro, left-double-quote)
    'â\u20AC\u201C': '\u2014',  // em-dash
    'â\u20AC\u201D': '\u201D',  // right double quote  
    'â\u20AC\u201C': '\u2014',

    // arrow right U+2192: UTF-8 is E2 86 92 
    'â\u020C\u00A2': '\u2192',

    // bullet U+2022: UTF-8 is E2 80 A2
    'â\u20AC\u00A2': '\u2022',

    // Emoji: 🔒 U+1F512: UTF-8 is F0 9F 94 92
    // Read as latin1: ð (F0) Ÿ (9F) " (94) ' (92) 
    '\u00F0\u009F\u0094\u0092': '\uD83D\uDD12',
    // 🔑 U+1F511: F0 9F 94 91
    '\u00F0\u009F\u0094\u0091': '\uD83D\uDD11',
    // 🛡 U+1F6E1: F0 9F 9B A1
    '\u00F0\u009F\u009B\u00A1': '\uD83D\uDEE1',
    // 📐 U+1F4D0: F0 9F 93 90
    '\u00F0\u009F\u0093\u0090': '\uD83D\uDCD0',
    // � U+1F50A: F0 9F 94 8A
    '\u00F0\u009F\u0094\u008A': '\uD83D\uDD0A',
    // � U+1F507: F0 9F 94 87
    '\u00F0\u009F\u0094\u0087': '\uD83D\uDD07',

    // ⚖ U+2696: UTF-8 is E2 9A 96
    '\u00E2\u009A\u0096': '\u2696\uFE0F',

    // Italian/French/Spanish accented chars
    // è U+00E8: UTF-8 is C3 A8 -> read as latin1: Ã¨
    '\u00C3\u00A8': '\u00E8',
    // é U+00E9: C3 A9 -> Ã©  
    '\u00C3\u00A9': '\u00E9',
    // à U+00E0: C3 A0 -> Ã 
    '\u00C3\u00A0': '\u00E0',
    // ì U+00EC: C3 AC -> Ã¬
    '\u00C3\u00AC': '\u00EC',
    // ò U+00F2: C3 B2 -> Ã²
    '\u00C3\u00B2': '\u00F2',
    // ù U+00F9: C3 B9 -> Ã¹
    '\u00C3\u00B9': '\u00F9',
    // À U+00C0: C3 80 -> Ã€
    '\u00C3\u0080': '\u00C0',
    // È U+00C8: C3 88 -> Ãˆ
    '\u00C3\u0088': '\u00C8',
    // É U+00C9: C3 89
    '\u00C3\u0089': '\u00C9',
    // ö U+00F6: C3 B6 -> Ã¶
    '\u00C3\u00B6': '\u00F6',
    // ü U+00FC: C3 BC -> Ã¼
    '\u00C3\u00BC': '\u00FC',
    // ä U+00E4: C3 A4 -> Ã¤
    '\u00C3\u00A4': '\u00E4',
    // Ö U+00D6: C3 96 -> Ã–
    '\u00C3\u0096': '\u00D6',
    // Ü U+00DC: C3 9C -> Ãœ
    '\u00C3\u009C': '\u00DC',
    // Ä U+00C4: C3 84 -> Ã„
    '\u00C3\u0084': '\u00C4',
    // ñ U+00F1: C3 B1 -> Ã±
    '\u00C3\u00B1': '\u00F1',
    // ó U+00F3: C3 B3 -> Ã³
    '\u00C3\u00B3': '\u00F3',
    // í U+00ED: C3 AD -> Ã­
    '\u00C3\u00AD': '\u00ED',
    // á U+00E1: C3 A1 -> Ã¡
    '\u00C3\u00A1': '\u00E1',
    // ú U+00FA: C3 BA -> Ã º
    '\u00C3\u00BA': '\u00FA',
    // middle dot ·: C2 B7 -> Â·
    '\u00C2\u00B7': '\u00B7',
    // non-breaking space / not-sign: C2 AC -> Â¬
    '\u00C2\u00AC': '',
};

const files = [
    'app/messages/en.json',
    'app/messages/it.json',
    'app/messages/es.json',
    'app/messages/fr.json',
    'app/messages/de.json'
];

function fixFile(filepath) {
    // Read as binary (latin1) to get raw bytes as chars
    const raw = readFileSync(filepath, 'latin1');

    let s = raw;

    // Remove UTF-8 BOM (EF BB BF read as latin1 = ï»¿)
    if (s.startsWith('\xEF\xBB\xBF')) {
        s = s.slice(3);
        console.log('  BOM removed');
    }

    let count = 0;
    for (const [bad, good] of Object.entries(fixes)) {
        let prev = s;
        // We need to search for the exact bytes
        // When read as latin1, each byte is directly a char
        s = s.split(bad).join(good);
        if (s !== prev) count++;
    }

    // Convert the fixed string (which is now a mix of latin1 and unicode)
    // to a proper Buffer: treat as latin1 -> get bytes -> encode as UTF-8
    // Actually we need to re-encode: the fixed string has:
    // - ASCII chars (from the JSON structure, keys, etc.)  
    // - Correctly decoded unicode chars (U+00E8 etc.) from our fixes
    // - Remaining un-fixed latin1 bytes that we need to handle

    // Write as UTF-8: since our fixes converted the problematic sequences
    // to actual Unicode codepoints, writing as UTF-8 will encode them correctly
    const outBuf = Buffer.from(s, 'latin1');

    // Parse to validate
    const utf8str = outBuf.toString('utf8');
    try {
        JSON.parse(utf8str);
    } catch (e) {
        console.error(`  JSON INVALID: ${e.message.split('\n')[0]}`);
        return false;
    }

    writeFileSync(filepath, outBuf);
    console.log(`  OK - ${count} fix patterns applied`);

    // Show sample of t1-t5 and footer for verification
    const sample = utf8str.match(/"t[1-5]"[^,]+/g) || [];
    if (sample.length > 0) {
        console.log('  Sample:', sample.join(' | ').substring(0, 120));
    }

    return true;
}

let allOk = true;
for (const f of files) {
    console.log(`\n${f}`);
    allOk = fixFile(f) && allOk;
}

console.log('\nDone. All OK:', allOk);
process.exit(allOk ? 0 : 1);
