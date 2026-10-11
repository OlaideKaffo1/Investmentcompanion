// Draws the app icon and writes every size the phone and browser need.
// Run with: node scripts/make-icons.mjs
import sharp from "sharp";

const BG = "#1f6b4f";

// `pad` shrinks the drawing toward the centre. Maskable icons need extra
// room because Android may crop them to a circle.
function svg({ rounded, pad }) {
  const s = 512;
  const inner = s * (1 - 2 * pad);
  const o = s * pad;
  const p = (x, y) => `${o + x * inner},${o + y * inner}`;
  const line = [p(0.18, 0.72), p(0.4, 0.5), p(0.56, 0.62), p(0.82, 0.3)].join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${rounded ? 112 : 0}" fill="${BG}"/>
  <polyline points="${line}" fill="none" stroke="#ffffff" stroke-width="${inner * 0.085}"
    stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${o + 0.82 * inner}" cy="${o + 0.3 * inner}" r="${inner * 0.075}" fill="#f2c94c"/>
</svg>`;
}

const out = [
  ["public/icons/icon-192.png", 192, { rounded: true, pad: 0.06 }],
  ["public/icons/icon-512.png", 512, { rounded: true, pad: 0.06 }],
  ["public/icons/icon-maskable-512.png", 512, { rounded: false, pad: 0.16 }],
  // iOS rounds the corners itself, so the home-screen icon is square.
  ["src/app/apple-icon.png", 180, { rounded: false, pad: 0.08 }],
  ["src/app/icon.png", 64, { rounded: true, pad: 0.04 }],
];

for (const [file, size, opts] of out) {
  await sharp(Buffer.from(svg(opts))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
