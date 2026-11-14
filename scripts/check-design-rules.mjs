/**
 * Mechanical checks for the design rules that a linter does not know about
 * (landing page design skill, Part B). Fails the build when a rule is broken.
 *
 *  - spacing utilities only use the approved scale (0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 px)
 *  - font sizes only come from the Tailwind scale, never arbitrary values
 *  - no italics, no ultra bold, no background gradients, no single sided card borders
 *  - no Material icon sets, no banned fonts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../src', import.meta.url).pathname;
const SPACING_OK = new Set(['0', '0.5', '1', '2', '3', '4', '6', '8', '10', '12', '16', '20', '24', 'px', 'auto', 'full']);
const SPACING_RE = /(?<![\w-])(-?)(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(\d+(?:\.\d+)?|px)(?![\w.\[/-])/g;

const rules = [
  { name: 'arbitrary font size', re: /\btext-\[\d/g },
  { name: 'italic text', re: /(?<![\w-])italic(?![\w-])|font-style:\s*italic/g },
  { name: 'ultra bold weight', re: /\bfont-(black|extrabold)\b|font-weight:\s*[89]00/g },
  { name: 'background gradient', re: /\bbg-gradient-|\bbg-linear-|\bbg-radial-|background(?:-image)?:\s*[^;]*gradient/g, allow: (file, line) => line.includes('clip-text') || line.includes('backgroundImage') },
  { name: 'single sided border on a surface', re: /\bborder-(l|r)(?:-\d+)?\b(?!-)/g },
  { name: 'Material icons', re: /material-icons|material-symbols|@mui\/icons/gi },
  { name: 'banned font', re: /font-family:[^;]*\b(Inter|Roboto|Arial|Helvetica|Open Sans)\b/gi },
  { name: 'window.alert', re: /\balert\(/g },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith('.d.ts') && !/\.test\./.test(name)) yield p;
  }
}

let failures = 0;
for (const file of walk(root)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    for (const m of line.matchAll(SPACING_RE)) {
      if (!SPACING_OK.has(m[2])) {
        console.error(`${relative(root, file)}:${i + 1} spacing value "${m[0]}" is not on the approved scale`);
        failures++;
      }
    }
    for (const r of rules) {
      for (const m of line.matchAll(r.re)) {
        if (r.allow?.(file, line)) continue;
        console.error(`${relative(root, file)}:${i + 1} ${r.name}: "${m[0]}"`);
        failures++;
      }
    }
  });
}
if (failures) {
  console.error(`\n${failures} design rule violation(s).`);
  process.exit(1);
}
console.log('Design rules: no violations.');
