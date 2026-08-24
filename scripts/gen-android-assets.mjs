import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])) >>> 0);
  return Buffer.concat([len, name, data, crc]);
}

function png(width, height, paint) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = paint(x, y, width, height);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function inRect(x, y, l, t, r, b) {
  return x >= l && x < r && y >= t && y < b;
}

function launcher(size, transparent) {
  return png(size, size, (x, y, w) => {
    const s = w / 108;
    const card = inRect(x, y, 26 * s, 26 * s, 82 * s, 82 * s);
    const bar = inRect(x, y, 40 * s, 40 * s, 68 * s, 49 * s);
    const stem = inRect(x, y, 49 * s, 49 * s, 59 * s, 72 * s);
    if (bar || stem) return [0x1b, 0x14, 0x0e, 255];
    if (card) return [0xe2, 0xb1, 0x3c, 255];
    return transparent ? [0, 0, 0, 0] : [0x0b, 0x09, 0x07, 255];
  });
}

function splash(width, height) {
  return png(width, height, () => [0x0b, 0x09, 0x07, 255]);
}

const icons = [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192],
];
const sourceIcon = "public/app-icon.png";
const fg = [
  ["mdpi", 108],
  ["hdpi", 162],
  ["xhdpi", 216],
  ["xxhdpi", 324],
  ["xxxhdpi", 432],
];

for (const [bucket, size] of icons) {
  const dir = `android/app/src/main/res/mipmap-${bucket}`;
  if (existsSync(sourceIcon)) {
    copyFileSync(sourceIcon, `${dir}/ic_launcher.png`);
    copyFileSync(sourceIcon, `${dir}/ic_launcher_round.png`);
  } else {
    writeFileSync(`${dir}/ic_launcher.png`, launcher(size, false));
    writeFileSync(`${dir}/ic_launcher_round.png`, launcher(size, false));
  }
}
for (const [bucket, size] of fg) {
  const target = `android/app/src/main/res/mipmap-${bucket}/ic_launcher_foreground.png`;
  if (existsSync(sourceIcon)) copyFileSync(sourceIcon, target);
  else writeFileSync(target, launcher(size, true));
}

const splashes = [
  ["drawable", 108, 108],
  ["drawable-port-mdpi", 320, 480],
  ["drawable-port-hdpi", 480, 800],
  ["drawable-port-xhdpi", 720, 1280],
  ["drawable-port-xxhdpi", 1080, 1920],
  ["drawable-port-xxxhdpi", 1280, 1920],
  ["drawable-land-mdpi", 480, 320],
  ["drawable-land-hdpi", 800, 480],
  ["drawable-land-xhdpi", 1280, 720],
  ["drawable-land-xxhdpi", 1920, 1080],
  ["drawable-land-xxxhdpi", 1920, 1280],
];
for (const [dir, w, h] of splashes) {
  writeFileSync(`android/app/src/main/res/${dir}/splash.png`, splash(w, h));
}
