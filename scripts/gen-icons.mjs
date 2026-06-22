// מחולל אייקוני PWA — PNG אמיתי ללא תלות חיצונית (zlib מובנה ב-Node).
// מצייר את אותו סמל "מוקד" (target/crosshair) של favicon.svg ל-192 ו-512.
// הרצה: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public');
mkdirSync(outDir, { recursive: true });

// --- CRC32 (טבלה) ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const COLORS = {
  bg: [11, 16, 32],
  emerald: [52, 211, 153],
  ring: [42, 51, 84],
  amber: [245, 158, 11],
};
function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function renderPng(size) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size / 64; // יחס סקאלה מול ה-viewBox המקורי
  const px = (raw, sw) => ({ r: raw * s, w: sw * s });
  const outer = px(19, 4);
  const inner = px(11, 3);
  const center = 5 * s;
  const crossW = 3 * s;
  const crossInner = 17 * s; // קצה פנימי של קווי הצלב
  const crossOuter = 30 * s; // ~ (32-6) חצי-אורך מהמרכז

  // RGBA פר-פיקסל + filter byte לכל שורה
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  const aa = 1.2 * s; // רוחב anti-alias

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.hypot(dx, dy);
      let col = COLORS.bg;

      // טבעת חיצונית (אמרלד)
      const dOuter = Math.abs(dist - outer.r);
      if (dOuter < outer.w / 2 + aa)
        col = blend(col, COLORS.emerald, edge(outer.w / 2, dOuter, aa));
      // טבעת פנימית (אפור-כחול)
      const dInner = Math.abs(dist - inner.r);
      if (dInner < inner.w / 2 + aa) col = blend(col, COLORS.ring, edge(inner.w / 2, dInner, aa));
      // קווי צלב (אמרלד) — אנכי + אופקי, רק בטווח שמחוץ לטבעת הפנימית
      const inArm = dist >= crossInner - aa && dist <= crossOuter + aa;
      if (inArm) {
        if (Math.abs(dx) < crossW / 2 + aa)
          col = blend(col, COLORS.emerald, edge(crossW / 2, Math.abs(dx), aa));
        if (Math.abs(dy) < crossW / 2 + aa)
          col = blend(col, COLORS.emerald, edge(crossW / 2, Math.abs(dy), aa));
      }
      // נקודת מרכז (ענבר)
      if (dist < center + aa) col = blend(col, COLORS.amber, edge(center, dist, aa));

      const o = y * stride + 1 + x * 4;
      raw[o] = col[0];
      raw[o + 1] = col[1];
      raw[o + 2] = col[2];
      raw[o + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  // anti-alias coverage [0..1]: כמה הפיקסל בתוך הרוחב
  function edge(half, d, w) {
    return Math.max(0, Math.min(1, (half + w - d) / w));
  }
  function blend(base, over, t) {
    return lerp(base, over, Math.max(0, Math.min(1, t)));
  }
}

for (const size of [192, 512]) {
  const png = renderPng(size);
  writeFileSync(join(outDir, `pwa-${size}.png`), png);
  console.log(`wrote public/pwa-${size}.png (${png.length} bytes)`);
}
