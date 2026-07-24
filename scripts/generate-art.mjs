// Generates the product bottle artwork as self-contained SVGs in /public.
// Run once: node scripts/generate-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

// [file, bg, glassTop, glassBottom, liquid, cap, label, subtitle?]
const palettes = [
  ["oudh-kalakassi", "#ebe3d5", "#6b5232", "#2e2013", "#241808", "#a8823f", "Oudh Kalakassi", "ATTAR · PURE OIL"],
  ["mitti-attar", "#efe8dc", "#c99b6d", "#8a5f38", "#75512f", "#3d2c1a", "Mitti Attar", "ATTAR · PURE OIL"],
  ["gulab-e-lahore", "#f3eaea", "#e3b7bb", "#b06a74", "#a05a66", "#4a2430", "Gulab-e-Lahore", "ATTAR · PURE OIL"],
  ["aurore", "#f3ead9", "#f7e3c8", "#d9a86c", "#c98f4e", "#2b241c", "Aurore"],
  ["noir-oud", "#eae4da", "#4a4038", "#241e19", "#1a1512", "#a8823f", "Noir Oud"],
  ["fleur-blanche", "#f2ede4", "#fdfbf5", "#e8ddc4", "#f1e6cf", "#b9a77a", "Fleur Blanche"],
  ["vert-sauvage", "#edf0e6", "#b9c7a5", "#6f8358", "#5a7047", "#2f3a28", "Vert Sauvage"],
  ["ambre-nuit", "#f1e8dc", "#d9a05b", "#8a4b25", "#7a3e1d", "#3a2417", "Ambre Nuit"],
  ["rose-poudre", "#f5ecec", "#f2d5d2", "#d9989b", "#cd8288", "#5c2e2e", "Rose Poudrée"],
  ["agrume-dor", "#f6f0dd", "#f4dd9a", "#dfae3e", "#d29c2a", "#3d3320", "Agrume d'Or"],
  ["bois-fume", "#ece7e0", "#a08a76", "#5d4a3b", "#4a3a2e", "#201805", "Bois Fumé"],
  ["lune-de-miel", "#f4eee0", "#eed9ae", "#c9a25e", "#b98f4a", "#2b2118", "Lune de Miel"],
  ["marine-sel", "#e9eef0", "#bcd2d8", "#7ba3ad", "#65929e", "#22333b", "Marine & Sel"],
  ["violette-encre", "#eeeaf1", "#c5b6d4", "#7d6a96", "#6a5584", "#241d31", "Violette Encre"],
  ["cuir-safran", "#f0e9df", "#c98f4e", "#8a5a28", "#6f471e", "#2b1d10", "Cuir Safran"],
];

function bottle([file, bg, top, bottom, liquid, cap, label, subtitle = "EAU DE PARFUM"]) {
  // Sanitize any accidental bad hex (defensive; palettes are hand-written)
  const fix = (c) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : "#3a3a3a");
  top = fix(top); bottom = fix(bottom); liquid = fix(liquid); cap = fix(cap); bg = fix(bg);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" role="img" aria-label="${label} perfume bottle">
  <defs>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
    <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${liquid}" stop-opacity="0.92"/>
      <stop offset="1" stop-color="${liquid}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="750" fill="${bg}"/>
  <rect width="600" height="750" fill="url(#halo)"/>
  <ellipse cx="300" cy="650" rx="170" ry="26" fill="#000000" opacity="0.10"/>
  <rect x="262" y="120" width="76" height="70" rx="10" fill="${cap}"/>
  <rect x="272" y="128" width="14" height="54" rx="7" fill="#ffffff" opacity="0.14"/>
  <rect x="279" y="188" width="42" height="34" rx="6" fill="url(#glass)" opacity="0.85"/>
  <path d="M210 250 q-38 24 -38 78 v250 q0 70 60 70 h136 q60 0 60 -70 v-250 q0 -54 -38 -78 q-25 -16 -90 -16 t-90 16z" fill="url(#glass)"/>
  <path d="M186 372 v206 q0 70 46 70 h136 q46 0 46 -70 v-206 q-56 -18 -114 -18 t-114 18z" fill="url(#liq)"/>
  <path d="M214 262 q-30 20 -30 66 v240 q0 20 6 34 l0 -280 q0 -40 24 -60z" fill="url(#shine)"/>
  <rect x="228" y="400" width="144" height="132" rx="6" fill="${bg}" opacity="0.96"/>
  <rect x="236" y="408" width="128" height="116" rx="4" fill="none" stroke="${cap}" stroke-width="1.5" opacity="0.7"/>
  <text x="300" y="452" text-anchor="middle" font-family="Georgia, serif" font-size="17" letter-spacing="3" fill="${cap}">LUMIÈRE</text>
  <line x1="262" y1="466" x2="338" y2="466" stroke="${cap}" stroke-width="1" opacity="0.6"/>
  <text x="300" y="492" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-style="italic" letter-spacing="1" fill="${cap}" opacity="0.9">${label}</text>
  <text x="300" y="514" text-anchor="middle" font-family="Georgia, serif" font-size="9" letter-spacing="2" fill="${cap}" opacity="0.7">${subtitle}</text>
</svg>`;
}

for (const p of palettes) {
  writeFileSync(join(outDir, `${p[0]}.svg`), bottle(p), "utf8");
  console.log(`wrote public/products/${p[0]}.svg`);
}

// Hero artwork: layered abstract composition used on the home page.
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" role="img" aria-label="Perfume bottles still life">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#efe6d4"/>
      <stop offset="1" stop-color="#e2d4bb"/>
    </linearGradient>
    <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7e3c8"/><stop offset="1" stop-color="#c98f4e"/>
    </linearGradient>
    <linearGradient id="b2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a4038"/><stop offset="1" stop-color="#1a1512"/>
    </linearGradient>
    <linearGradient id="b3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2d5d2"/><stop offset="1" stop-color="#cd8288"/>
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#sky)"/>
  <circle cx="450" cy="360" r="260" fill="#ffffff" opacity="0.35"/>
  <ellipse cx="450" cy="770" rx="360" ry="40" fill="#000000" opacity="0.08"/>
  <g transform="translate(160,300)">
    <rect x="52" y="-40" width="46" height="44" rx="8" fill="#2b241c"/>
    <path d="M20 30 q-20 14 -20 46 v260 q0 44 38 44 h74 q38 0 38 -44 v-260 q0 -32 -20 -46 q-14 -10 -55 -10 t-55 10z" fill="url(#b1)"/>
  </g>
  <g transform="translate(370,180)">
    <rect x="62" y="-50" width="56" height="52" rx="9" fill="#a8823f"/>
    <path d="M25 40 q-25 16 -25 55 v330 q0 55 45 55 h90 q45 0 45 -55 v-330 q0 -39 -25 -55 q-18 -12 -65 -12 t-65 12z" fill="url(#b2)"/>
    <rect x="40" y="180" width="100" height="90" rx="5" fill="#eae4da" opacity="0.95"/>
  </g>
  <g transform="translate(620,340)">
    <rect x="44" y="-36" width="40" height="38" rx="7" fill="#5c2e2e"/>
    <path d="M16 26 q-16 12 -16 40 v230 q0 40 34 40 h64 q34 0 34 -40 v-230 q0 -28 -16 -40 q-12 -9 -50 -9 t-50 9z" fill="url(#b3)"/>
  </g>
</svg>`;
writeFileSync(join(root, "public", "hero.svg"), hero, "utf8");
console.log("wrote public/hero.svg");
