import { readFileSync, writeFileSync } from 'fs';

const files = [
    'app/messages/en.json',
    'app/messages/it.json',
    'app/messages/es.json',
    'app/messages/fr.json',
    'app/messages/de.json'
];

function fixFile(f) {
    const raw = readFileSync(f, 'utf8');
    let s = raw;

    // Remove BOM
    if (s.charCodeAt(0) === 0xFEFF) { s = s.slice(1); }

    // Fix Windows-1252 double-encoding: em-dash, quotes
    s = s.replaceAll('\u00e2\u20ac\u201c', '\u2014'); // em-dash
    s = s.replaceAll('\u00e2\u20ac\u009c', '\u201c'); // left double quote
    s = s.replaceAll('\u00e2\u20ac\u009d', '\u201d'); // right double quote
    s = s.replaceAll('\u00e2\u20ac\u02dc', '\u2018'); // left single quote
    s = s.replaceAll('\u00e2\u20ac\u2122', '\u2019'); // right single quote
    s = s.replaceAll('\u00e2\u20ac\u00a2', '\u2022'); // bullet
    s = s.replaceAll('\u00e2\u2020\u2019', '\u2192'); // arrow right
    s = s.replaceAll('\u00c3\u00a8', '\u00e8'); // e grave
    s = s.replaceAll('\u00c3\u00a9', '\u00e9'); // e acute
    s = s.replaceAll('\u00c3\u00a0', '\u00e0'); // a grave
    s = s.replaceAll('\u00c3\u00ac', '\u00ec'); // i grave
    s = s.replaceAll('\u00c3\u00b2', '\u00f2'); // o grave
    s = s.replaceAll('\u00c3\u00b9', '\u00f9'); // u grave
    s = s.replaceAll('\u00c3\u2026', '\u00c0'); // A grave cap
    s = s.replaceAll('\u00c3\u02c6', '\u00c8'); // E grave cap
    s = s.replaceAll('\u00c3\u00b6', '\u00f6'); // o umlaut
    s = s.replaceAll('\u00c3\u00bc', '\u00fc'); // u umlaut
    s = s.replaceAll('\u00c3\u00a4', '\u00e4'); // a umlaut
    s = s.replaceAll('\u00c3\u2013', '\u00d6'); // O umlaut cap
    s = s.replaceAll('\u00c3\u0153', '\u00dc'); // U umlaut cap
    s = s.replaceAll('\u00c3\u201e', '\u00c4'); // A umlaut cap
    s = s.replaceAll('\u00c3\u00b1', '\u00f1'); // n tilde
    s = s.replaceAll('\u00c3\u00b3', '\u00f3'); // o acute
    s = s.replaceAll('\u00c3\u00ad', '\u00ed'); // i acute
    s = s.replaceAll('\u00c3\u00a1', '\u00e1'); // a acute
    s = s.replaceAll('\u00c3\u00ba', '\u00fa'); // u acute
    s = s.replaceAll('\u00c3\u030a', '\u00c9'); // E acute cap
    s = s.replaceAll('\u00c3\u2030', '\u00ca'); // E circumflex cap
    s = s.replaceAll('\u00c2\u00b7', '\u00b7'); // middle dot
    s = s.replaceAll('\u00c2\u00ac', ''); // not sign (often garbage)
    // Emoji double-encode
    s = s.replaceAll('\u00f0\u0178\u201d\u2019', '\ud83d\udd12'); // lock emoji
    s = s.replaceAll('\u00f0\u0178\u009b\u00a1', '\ud83d\udee1'); // shield emoji
    s = s.replaceAll('\u00f0\u0178\u201d\u0090', '\ud83d\udd10'); // key emoji
    s = s.replaceAll('\u00f0\u0178\u201d\u2021', '\ud83d\udd07'); // speaker off emoji
    s = s.replaceAll('\u00f0\u0178\u201d\u160a', '\ud83d\udd0a'); // speaker on emoji
    s = s.replaceAll('\u00e2\u009a\u0096', '\u2696'); // scales emoji

    // Italian specific multi-byte issues
    s = s.replaceAll('Capacit\u00c3\u00a0', 'Capacit\u00e0');
    s = s.replaceAll('utilit\u00c3\u00a0', 'utilit\u00e0');
    s = s.replaceAll('maturit\u00c3\u00a0', 'maturit\u00e0');
    s = s.replaceAll('Qualit\u00c3\u00a0', 'Qualit\u00e0');
    s = s.replaceAll('Stabilit\u00c3\u00a0', 'Stabilit\u00e0');
    s = s.replaceAll('profondit\u00c3\u00a0', 'profondit\u00e0');
    s = s.replaceAll('velocit\u00c3\u00a0', 'velocit\u00e0');
    s = s.replaceAll('Credibilit\u00c3\u00a0', 'Credibilit\u00e0');
    s = s.replaceAll('Verificabilit\u00c3\u00a0', 'Verificabilit\u00e0');
    s = s.replaceAll('visibilit\u00c3\u00a0', 'visibilit\u00e0');
    s = s.replaceAll('stabilit\u00c3\u00a0', 'stabilit\u00e0');
    s = s.replaceAll('\u00c3\u0160', '\u00c8'); // E grave
    s = s.replaceAll('n\u00c3\u00a9', 'n\u00e9');
    s = s.replaceAll('N\u00c3\u2030', 'N\u00c9');


    // Validate
    try {
        JSON.parse(s);
        writeFileSync(f, Buffer.from(s, 'utf8'));
        console.log('OK:', f);
        return true;
    } catch (e) {
        console.error('ERR:', f, e.message.split('\n')[0]);
        return false;
    }
}

let ok = true;
for (const f of files) ok = fixFile(f) && ok;
process.exit(ok ? 0 : 1);
