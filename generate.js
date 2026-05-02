import fs from "fs";
import axios from "axios";

const WIDTH = 1200;
const HEIGHT = 620;

const MONTHS = 12;
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

const YEAR = 2026;

const BASE_COLORS = [
  [255,160,190],[255,130,130],[255,210,100],
  [180,140,255],[130,210,255],[255,180,100],
  [150,230,170],[255,160,220],[160,220,255],
  [255,200,130],[200,160,255],[130,240,200]
];

function shadeColor([r,g,b], factor) {
  const darken = 0.25 + factor * 0.75;
  return `rgb(${Math.floor(r*darken)},${Math.floor(g*darken)},${Math.floor(b*darken)})`;
}

/* ───────── FIX 1: USE STABLE API ───────── */
async function getGitHubData(username) {
  const res = await axios.get(
    `https://github-contributions-api.jogruber.de/v4/${username}?y=${YEAR}`
  );

  // returns structured daily data
  const data = res.data.contributions;

  const map = {};
  data.forEach(d => {
    map[d.date] = d.count;
  });

  return map;
}

/* ───────── FIX 2: CORRECT DATE HANDLING ───────── */
function buildMonthData(raw, year, monthIndex, daysInMonth) {
  const result = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(monthIndex + 1).padStart(2,'0');
    const dd = String(day).padStart(2,'0');

    const date = `${year}-${mm}-${dd}`;

    result.push(raw[date] || 0);
  }

  return result;
}

/* ───────── FLOWER SHAPE ───────── */
const tulipShape = [
 "101101",
 "101101",
 "111111",
 "111111",
 "111111",
 "111111",
];

function drawFlower(cx, groundY, data, baseColor, sizeFactor=8) {
  const ps = Math.round(12 * sizeFactor);
  const gap = 2;
  const step = ps + gap;

  let svg = "";
  let i = 0;

  for (let r = 0; r < tulipShape.length; r++) {
    for (let c = 0; c < tulipShape[r].length; c++) {

      if (tulipShape[r][c] === "1") {

        const count = data[i] || 0;
        const intensity = Math.min(count / 9, 1);
        const color = shadeColor(baseColor, intensity);

        svg += `
          <rect
            x="${cx + c * step}"
            y="${groundY - (tulipShape.length - r) * step - 60 * sizeFactor}"
            width="${ps}"
            height="${ps}"
            rx="2"
            fill="${color}"
            opacity="0.95"
          />
        `;

        i++;
      }
    }
  }

  const stemX = cx + 30;
  const stemTop = groundY - 60 * sizeFactor;

  svg += `<rect x="${stemX}" y="${stemTop}" width="8" height="${200*sizeFactor}" fill="#3a9a5c"/>`;

  return svg;
}

/* ───────── BACKGROUND ───────── */
function drawCloud(cx, cy, s=1) {
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${60*s}" ry="${22*s}" fill="white" opacity="0.9"/>
  `;
}

/* ───────── MAIN ───────── */
const GROUND_Y = 560;

let svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">

<rect width="${WIDTH}" height="${HEIGHT}" fill="#89c1e6"/>

${drawCloud(200,80,1)}
${drawCloud(600,60,1.2)}
${drawCloud(900,90,1)}

<rect x="0" y="${GROUND_Y}" width="${WIDTH}" height="${HEIGHT-GROUND_Y}" fill="#4caf50"/>
`;

/* ───────── DATA ───────── */
const username = "shambhavip19";
const raw = await getGitHubData(username);

const spacing = 95;
const startX = 20;

for (let m = 0; m < 12; m++) {
  const data = buildMonthData(raw, YEAR, m, DAYS_IN_MONTH[m]);

  const base = BASE_COLORS[m];
  const x = startX + m * spacing;

  svg += drawFlower(x, GROUND_Y, data, base);
}

svg += `</svg>`;

fs.writeFileSync("flower.svg", svg);

console.log("DONE 🌸");