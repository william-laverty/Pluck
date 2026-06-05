#!/usr/bin/env node
/**
 * Generates Pluck's PNG icons (16/32/48/128) with zero dependencies.
 * Draws a rounded indigo tile with a white "viewfinder" mark (four corner
 * brackets + a center dot) — the inspect/select motif. Supersampled for AA.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var ACCENT_A = [99, 102, 241]; // #6366f1
var ACCENT_B = [79, 70, 229]; // #4f46e5
var GLYPH = [246, 247, 251];
var SS = 4; // supersample factor

function lerp(a, b, t) { return a + (b - a) * t; }

function inRoundRect(x, y, size, r) {
  var minx = r, maxx = size - r, miny = r, maxy = size - r;
  var qx = x < minx ? minx : (x > maxx ? maxx : x);
  var qy = y < miny ? miny : (y > maxy ? maxy : y);
  var dx = x - qx, dy = y - qy;
  return dx * dx + dy * dy <= r * r;
}

function inGlyph(x, y, size) {
  var inset = size * 0.26;
  var arm = size * 0.17;
  var th = size * 0.075;
  var cx = size / 2, cy = size / 2;
  var dotR = size * 0.078;

  // center dot
  if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= dotR * dotR) return true;

  var corners = [
    [inset, inset, 1, 1],                 // top-left  (dir x+, y+)
    [size - inset, inset, -1, 1],          // top-right
    [inset, size - inset, 1, -1],          // bottom-left
    [size - inset, size - inset, -1, -1],  // bottom-right
  ];
  for (var i = 0; i < corners.length; i++) {
    var ox = corners[i][0], oy = corners[i][1], sx = corners[i][2], sy = corners[i][3];
    // horizontal arm
    var hx0 = Math.min(ox, ox + sx * arm), hx1 = Math.max(ox, ox + sx * arm);
    var hy0 = Math.min(oy, oy + sy * th), hy1 = Math.max(oy, oy + sy * th);
    if (x >= hx0 && x <= hx1 && y >= hy0 && y <= hy1) return true;
    // vertical arm
    var vx0 = Math.min(ox, ox + sx * th), vx1 = Math.max(ox, ox + sx * th);
    var vy0 = Math.min(oy, oy + sy * arm), vy1 = Math.max(oy, oy + sy * arm);
    if (x >= vx0 && x <= vx1 && y >= vy0 && y <= vy1) return true;
  }
  return false;
}

function sample(sx, sy, size) {
  var r = size * 0.22;
  if (!inRoundRect(sx, sy, size, r)) return [0, 0, 0, 0];
  if (inGlyph(sx, sy, size)) return [GLYPH[0], GLYPH[1], GLYPH[2], 255];
  var t = (sx + sy) / (2 * size);
  return [
    Math.round(lerp(ACCENT_A[0], ACCENT_B[0], t)),
    Math.round(lerp(ACCENT_A[1], ACCENT_B[1], t)),
    Math.round(lerp(ACCENT_A[2], ACCENT_B[2], t)),
    255,
  ];
}

function render(size) {
  var data = Buffer.alloc(size * size * 4);
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var r = 0, g = 0, b = 0, a = 0;
      for (var sy = 0; sy < SS; sy++) {
        for (var sx = 0; sx < SS; sx++) {
          var px = x + (sx + 0.5) / SS;
          var py = y + (sy + 0.5) / SS;
          var c = sample(px, py, size);
          r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3];
        }
      }
      var n = SS * SS;
      var i = (y * size + x) * 4;
      // premultiplied average → straight alpha
      data[i] = a ? Math.round(r / a) : 0;
      data[i + 1] = a ? Math.round(g / a) : 0;
      data[i + 2] = a ? Math.round(b / a) : 0;
      data[i + 3] = Math.round(a / n);
    }
  }
  return data;
}

// ---- minimal PNG encoder ----
var CRC_TABLE = (function () {
  var t = [];
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  var c = 0xffffffff;
  for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  var typeBuf = Buffer.from(type, 'ascii');
  var len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  var crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  var sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  var stride = size * 4;
  var raw = Buffer.alloc((stride + 1) * size);
  for (var y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  var idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

var outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
[16, 32, 48, 128].forEach(function (size) {
  var png = encodePNG(size, render(size));
  fs.writeFileSync(path.join(outDir, 'icon' + size + '.png'), png);
  console.log('wrote icons/icon' + size + '.png (' + png.length + ' bytes)');
});
