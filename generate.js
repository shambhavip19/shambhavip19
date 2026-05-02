import fs from "fs";
import axios from "axios";

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

// 🌈 color intensity (UNCHANGED)
function shadeColor([r, g, b], factor) {
  const darken = 0.25 + factor * 0.75;
  return `rgb(${Math.floor(r * darken)},${Math.floor(g * darken)},${Math.floor(b * darken)})`;
}

// ❌ REMOVED RANDOM DATA — now real GitHub data
async function getGitHubData(shambhavip19) {
  const res = await axios.get(
    `https://github.com/users/${shambhavip19}/contributions`
  );

  const matches = [...res.data.matchAll(
    /data-date="(.*?)".*?data-count="(.*?)"/g
  )];

  return matches.map(m => ({
    date: m[1],
    count: Number(m[2])
  }));
}

// 📦 split into months
function splitByMonth(data) {
  const months = Array.from({ length: 12 }, () => []);

  data.forEach(d => {
    const month = new Date(d.date).getMonth();
    months[month].push(d.count);
  });

  return months;
}

// 🌷 your ORIGINAL tulip shape (UNCHANGED)
const tulipShape = [
 "101101",
 "101101",
 "111111",
 "111111",
 "111111",
 "111111",
];

function drawFlower(cx, groundY, data, baseColor, sizeFactor = 8.0) {
  const ps = Math.round(12 * sizeFactor);
  const gap = 2;
  const step = ps + gap;
  let svg = "";
  let dayIndex = 0;

  tulipShape.forEach((row, rowIdx) => {
    row.split("").forEach((cell, colIdx) => {
      if (cell === "1") {
        const count = data[dayIndex] || 0;
        dayIndex++;

        const intensity = Math.min(count / 9, 1);
        const color = shadeColor(baseColor, intensity);

        svg += `<rect 
          x="${cx + colIdx * step}" 
          y="${groundY - (tulipShape.length - rowIdx) * step - 60 * sizeFactor}" 
          width="${ps}" height="${ps}" rx="2"
          fill="${color}" opacity="0.95"
        />`;
      }
    });
  });

  const flowerW = tulipShape[0].length * step;

  // 🌟 FIX: small spacing between flowers (IMPORTANT CHANGE)
  const stemX = cx + Math.round(flowerW / 2) - Math.round(2 * sizeFactor) + 6;

  const stemTop = groundY - 60 * sizeFactor;
  const stemH = Math.round(200 * sizeFactor);
  const stemW = Math.max(4, Math.round(9 * sizeFactor));

  svg += `<rect x="${stemX}" y="${stemTop}" width="${stemW}" height="${stemH}" rx="2" fill="#3a9a5c"/>`;

  const lx = stemX - Math.round(20 * sizeFactor);
  const ly = stemTop + Math.round(18 * sizeFactor);
  svg += `<ellipse cx="${lx}" cy="${ly}" rx="${22 * sizeFactor}" ry="${8 * sizeFactor}" fill="#4dbd74" transform="rotate(-30, ${lx}, ${ly})"/>`;

  const rx2 = stemX + stemW + Math.round(20 * sizeFactor);
  const ry2 = stemTop + Math.round(36 * sizeFactor);
  svg += `<ellipse cx="${rx2}" cy="${ry2}" rx="${22 * sizeFactor}" ry="${8 * sizeFactor}" fill="#42a866" transform="rotate(30, ${rx2}, ${ry2})"/>`;

  return svg;
}

// 🌿 grass (UNCHANGED)
function drawGrassBlades(groundY) {
  let svg = "";
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * WIDTH;
    const h = 10 + Math.random() * 35;
    const y = groundY - h;
    const tilt = (Math.random() - 0.5) * 20;
    svg += `<ellipse cx="${x}" cy="${groundY}" rx="3" ry="${h}" fill="#2e8b57" transform="rotate(${tilt},${x},${groundY})"/>`;
  }
  return svg;
}

// ☁️ clouds (UNCHANGED)
function drawCloud(cx, cy, scale = 1) {
  const s = scale;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${60 * s}" ry="${22 * s}" fill="white" opacity="0.95"/>
    <ellipse cx="${cx - 30 * s}" cy="${cy + 10 * s}" rx="${40 * s}" ry="${18 * s}" fill="white" opacity="0.95"/>
    <ellipse cx="${cx + 35 * s}" cy="${cy + 8 * s}" rx="${42 * s}" ry="${20 * s}" fill="white" opacity="0.95"/>
  `;
}

const GROUND_Y = 560;

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

// clouds (UNCHANGED)
svg += drawCloud(200, 80, 1.0);
svg += drawCloud(600, 60, 1.2);
svg += drawCloud(950, 90, 0.9);
svg += drawCloud(750, 90, 1.3);
svg += drawCloud(400, 70, 0.9);

// ground
svg += `<rect x="0" y="${GROUND_Y}" width="${WIDTH}" height="${HEIGHT - GROUND_Y}" fill="url(#groundGrad)"/>`;
svg += drawGrassBlades(GROUND_Y);

// 🌸 REAL DATA CONNECTION
const username = "shambhavip19";

const raw = await getGitHubData(username);
const monthsData = splitByMonth(raw);

// 🌷 flowers
const spacing = 100; // 🔥 increased slightly to prevent touching
const startX = 20;

for (let i = 0; i < MONTHS; i++) {
  const data = monthsData[i] || [];
  const base = BASE_COLORS[i % BASE_COLORS.length];
  const x = startX + i * spacing;

  const sf = (i % 2 === 0) ? 1.0 : 1.2;

  svg += drawFlower(x, GROUND_Y, data, base, sf);
}

svg += `</svg>`;

fs.writeFileSync("flower.svg", svg);
console.log("🌷 REAL GitHub flower garden generated!");