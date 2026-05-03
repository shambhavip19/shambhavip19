import fs from "fs";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER   = "shambhavip19";
const YEAR          = new Date().getFullYear();

const WIDTH  = 1200;
const HEIGHT = 620;
const MONTHS = 12;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const BASE_COLORS = [
  [255, 160, 190], [255, 130, 130], [155, 210, 200],
  [180, 140, 255], [130, 210, 255], [200, 180, 180],
  [150, 230, 170], [255, 160, 220], [160, 220, 255],
  [110, 200, 230], [200, 160, 255], [130, 240, 200],
];

function shadeColor([r, g, b], factor) {
  if (factor === 0) {
    // 0 contributions = very pale, almost white
    const pale = 0.45;
    return `rgb(${Math.floor(r * pale + 255 * (1 - pale))},${Math.floor(g * pale + 255 * (1 - pale))},${Math.floor(b * pale + 255 * (1 - pale))})`;
  }
  // 1-9 contributions = light to deep dark
  const darken = 0.3 + factor * 0.8;
  return `rgb(${Math.floor(r * darken)},${Math.floor(g * darken)},${Math.floor(b * darken)})`;
}

// ── Fetch real GitHub contributions ──
async function fetchContributions() {
  const query = `{
    user(login: "${GITHUB_USER}") {
      contributionsCollection(
        from: "${YEAR}-01-01T00:00:00Z",
        to:   "${YEAR}-12-31T23:59:59Z"
      ) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `bearer ${GITHUB_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;

  // Flatten all days: "YYYY-MM-DD" -> count
  const dayMap = {};
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      dayMap[day.date] = day.contributionCount;
    }
  }

  // Build 12 months of daily counts
  const monthData = [];
  for (let m = 0; m < 12; m++) {
    const days = [];
    for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
      const mm  = String(m + 1).padStart(2, "0");
      const dd  = String(d).padStart(2, "0");
      const key = `${YEAR}-${mm}-${dd}`;
      days.push(dayMap[key] ?? 0);
    }
    monthData.push(days);
  }

  return monthData;
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

const PS      = 14;
const GAP     = 2;
const STEP    = PS + GAP;
const ROWS    = tulipShape.length;
const COLS_   = tulipShape[0].length;
const HEAD_W  = COLS_ * STEP;  // 96px
const HEAD_H  = ROWS  * STEP;  // 96px

const STEM_TALL  = 280;
const STEM_SHORT = 140;
const STEM_W     = 9;

const MARGIN  = 12;
const SPACING = Math.floor((WIDTH - MARGIN * 2) / MONTHS); // 98px — HEAD_W=96 fits ✓

const GROUND_Y = 560;

function drawFlower(cx, data, baseColor, tall) {
  const stemH    = tall ? STEM_TALL : STEM_SHORT;
  const stemTop  = GROUND_Y - stemH;
  const headTopY = stemTop - HEAD_H;

  let svg = "";
  let dayIndex = 0;

  tulipShape.forEach((row, rowIdx) => {
    row.split("").forEach((cell, colIdx) => {
      if (cell === "1") {
        const count     = data[dayIndex] ?? 0;
        dayIndex++;
        const intensity = Math.min(count / 9, 1);
        const color     = shadeColor(baseColor, intensity);
        svg += `<rect x="${cx + colIdx * STEP}" y="${headTopY + rowIdx * STEP}" width="${PS}" height="${PS}" rx="2" fill="${color}" opacity="0.95"/>`;
      }
    });
  });

  const stemX = cx + Math.floor(HEAD_W / 2) - Math.floor(STEM_W / 2);
  svg += `<rect x="${stemX}" y="${stemTop}" width="${STEM_W}" height="${stemH}" rx="2" fill="#3a9a5c"/>`;

  const leafSize = tall ? 1.4 : 1.0;
  const lx = stemX - Math.round(20 * leafSize);
  const ly = stemTop + Math.round(stemH * 0.35);
  svg += `<ellipse cx="${lx}" cy="${ly}" rx="${Math.round(22 * leafSize)}" ry="${Math.round(8 * leafSize)}" fill="#4dbd74" transform="rotate(-30,${lx},${ly})"/>`;

  const rx2 = stemX + STEM_W + Math.round(20 * leafSize);
  const ry2 = stemTop + Math.round(stemH * 0.6);
  svg += `<ellipse cx="${rx2}" cy="${ry2}" rx="${Math.round(22 * leafSize)}" ry="${Math.round(8 * leafSize)}" fill="#42a866" transform="rotate(30,${rx2},${ry2})"/>`;

  return svg;
}

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

function drawCloud(cx, cy, scale = 1) {
  const s = scale;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${60*s}" ry="${22*s}" fill="white" opacity="0.95"/>
    <ellipse cx="${cx-30*s}" cy="${cy+10*s}" rx="${40*s}" ry="${18*s}" fill="white" opacity="0.95"/>
    <ellipse cx="${cx+35*s}" cy="${cy+8*s}" rx="${42*s}" ry="${20*s}" fill="white" opacity="0.95"/>
  `;
}

// ── MAIN ──
async function main() {
  console.log("🌷 Fetching contributions from GitHub...");
  const monthData = await fetchContributions();
  console.log("✅ Got data! Generating SVG...");

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

  for (let i = 0; i < MONTHS; i++) {
    const data = monthData[i];
    const base = BASE_COLORS[i % BASE_COLORS.length];
    const slotStart = MARGIN + i * SPACING;
    const cx   = slotStart + Math.floor((SPACING - HEAD_W) / 2);
    const tall = (i % 2 === 0);
    svg += drawFlower(cx, data, base, tall);
  }

  svg += `</svg>`;

  fs.writeFileSync("flower.svg", svg);
  console.log("🌷 flower.svg generated with your real GitHub contributions!");
}

main().catch(console.error);
