import fs from "fs";

const WIDTH = 1200;
const HEIGHT = 620;
const MONTHS = 12;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const BASE_COLORS = [
  [255, 160, 190], [255, 130, 130], [255, 210, 100],
  [180, 140, 255], [130, 210, 255], [255, 180, 100],
  [150, 230, 170], [255, 160, 220], [160, 220, 255],
  [255, 200, 130], [200, 160, 255], [130, 240, 200],
];

function shadeColor([r, g, b], factor) {
  const darken = 0.25 + factor * 0.75;
  return `rgb(${Math.floor(r * darken)},${Math.floor(g * darken)},${Math.floor(b * darken)})`;
}

function genMonth(numDays) {
  return Array.from({ length: numDays }, () => Math.floor(Math.random() * 10));
}

// Tulip shape
const tulipShape = [
  "101101",
  "101101",
  "111111",
  "111111",
  "111111",
  "111111",
];

// Fixed pixel size for ALL flowers — same size tulip head always
const PS      = 14;   // pixel size
const GAP     = 2;
const STEP    = PS + GAP;
const ROWS    = tulipShape.length;
const COLS_   = tulipShape[0].length;
const HEAD_W  = COLS_ * STEP;   // 6*16 = 96px
const HEAD_H  = ROWS  * STEP;   // 6*16 = 96px

// Stem heights: tall vs short (only difference between big/small)
const STEM_TALL  = 280;
const STEM_SHORT = 140;
const STEM_W     = 11;

// Spacing: CENTER all 12 flowers, no overlap
// Each flower occupies HEAD_W px. We need gaps between them.
// Total flowers width if packed = 12 * HEAD_W = 12*96 = 1152
// Available = WIDTH - 2*margin = 1200 - 40 = 1160
// So spacing per flower = floor(1160/12) = 96 — exactly fits with 1px gap each!
// Let's use spacing = 98 to give 2px breathing room and center it
const MARGIN  = 12;
const SPACING = Math.floor((WIDTH - MARGIN * 2) / MONTHS); // = 98px
// HEAD_W=96 < SPACING=98 → 2px gap between flowers ✓ NO OVERLAP

const GROUND_Y = 560;

function drawFlower(cx, data, baseColor, tall) {
  const stemH = tall ? STEM_TALL : STEM_SHORT;
  // tulip head sits on top of stem
  // stem top = GROUND_Y - stemH
  // head bottom = stem top
  // head top = stem top - HEAD_H
  const stemTop  = GROUND_Y - stemH;
  const headTopY = stemTop - HEAD_H;

  let svg = "";
  let dayIndex = 0;

  tulipShape.forEach((row, rowIdx) => {
    row.split("").forEach((cell, colIdx) => {
      if (cell === "1") {
        const count     = data[dayIndex] || 0;
        dayIndex++;
        const intensity = Math.min(count / 9, 1);
        const color     = shadeColor(baseColor, intensity);
        svg += `<rect 
          x="${cx + colIdx * STEP}" 
          y="${headTopY + rowIdx * STEP}" 
          width="${PS}" height="${PS}" rx="2"
          fill="${color}" opacity="0.95"
        />`;
      }
    });
  });

  // Stem
  const stemX = cx + Math.floor(HEAD_W / 2) - Math.floor(STEM_W / 2);
  svg += `<rect x="${stemX}" y="${stemTop}" width="${STEM_W}" height="${stemH}" rx="2" fill="#3a9a5c"/>`;

  // Leaves — scale with stem height a little
  const leafSize = tall ? 1.4 : 1.0;
  const lx = stemX - Math.round(20 * leafSize);
  const ly = stemTop + Math.round(stemH * 0.35);
  svg += `<ellipse cx="${lx}" cy="${ly}" rx="${Math.round(22 * leafSize)}" ry="${Math.round(8 * leafSize)}" fill="#4dbd74" transform="rotate(-30,${lx},${ly})"/>`;

  const rx2 = stemX + STEM_W + Math.round(20 * leafSize);
  const ry2 = stemTop + Math.round(stemH * 0.6);
  svg += `<ellipse cx="${rx2}" cy="${ry2}" rx="${Math.round(22 * leafSize)}" ry="${Math.round(8 * leafSize)}" fill="#42a866" transform="rotate(30,${rx2},${ry2})"/>`;

  return svg;
}

// Grass blades
function drawGrassBlades(groundY) {
  let svg = "";
  for (let i = 0; i < 100; i++) {
    const x    = Math.random() * WIDTH;
    const h    = 10 + Math.random() * 35;
    const tilt = (Math.random() - 0.5) * 20;
    svg += `<ellipse cx="${x}" cy="${groundY}" rx="3" ry="${h}" fill="#2e8b57" transform="rotate(${tilt},${x},${groundY})"/>`;
  }
  return svg;
}

// Clouds
function drawCloud(cx, cy, scale = 1) {
  const s = scale;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${60*s}" ry="${22*s}" fill="white" opacity="0.95"/>
    <ellipse cx="${cx-30*s}" cy="${cy+10*s}" rx="${40*s}" ry="${18*s}" fill="white" opacity="0.95"/>
    <ellipse cx="${cx+35*s}" cy="${cy+8*s}" rx="${42*s}" ry="${20*s}" fill="white" opacity="0.95"/>
  `;
}

// ── BUILD SVG ──
let svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3399de"/>
      <stop offset="100%" stop-color="#89c1e6"/>
    </linearGradient>
    <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7ecb50"/>
      <stop offset="100%" stop-color="#399a0b"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#skyGrad)"/>
`;

svg += drawCloud(200, 80, 1.0);
svg += drawCloud(600, 60, 1.2);
svg += drawCloud(950, 90, 0.9);
svg += drawCloud(750, 90, 1.3);
svg += drawCloud(400, 70, 0.9);

svg += `<rect x="0" y="${GROUND_Y}" width="${WIDTH}" height="${HEIGHT - GROUND_Y}" fill="url(#groundGrad)"/>`;
svg += drawGrassBlades(GROUND_Y);

// ── 12 month flowers — same head size, alternating tall/short stem ──
for (let i = 0; i < MONTHS; i++) {
  const numDays = DAYS_IN_MONTH[i];
  const data    = genMonth(numDays);
  const base    = BASE_COLORS[i % BASE_COLORS.length];

  // Center each flower within its SPACING slot
  const slotStart = MARGIN + i * SPACING;
  const cx        = slotStart + Math.floor((SPACING - HEAD_W) / 2);

  // Alternate tall/short — no size difference in head at all
  const tall = (i % 2 === 0);

  svg += drawFlower(cx, data, base, tall);
}

svg += `</svg>`;

fs.writeFileSync("flower.svg", svg);
console.log(`🌷 Done! HEAD_W=${HEAD_W}px SPACING=${SPACING}px gap=${SPACING - HEAD_W}px`);