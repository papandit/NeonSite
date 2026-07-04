// Production render service (INVARIANT 3). Regenerates the MANUFACTURING image
// deterministically from the designDocument at the physical size implied by the
// selected Size (mm -> px at a fixed DPI). This is NOT the browser preview.
//
//   renderProduction(designDocument, { dpi }) -> { buffer, widthPx, heightPx, mime }
//
// Not called live during editing — used for order fulfillment.

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import canvasPkg from 'canvas';
import { ensureLayout } from './layout.js';

const { createCanvas, loadImage, registerFont } = canvasPkg;

const DEFAULT_DPI = 300;
const MM_PER_INCH = 25.4;
const DEFAULT_SIZE_MM = { widthMm: 457, heightMm: 305 }; // ~18x12in fallback

const mmToPx = (mm, dpi) => Math.max(1, Math.round((mm / MM_PER_INCH) * dpi));

// --- font handling: download a remote font once and register it -------------
const registeredFonts = new Set();

async function ensureFont(family, fileUrl) {
  if (!family || !fileUrl || !/^https?:\/\//.test(fileUrl)) return false;
  if (registeredFonts.has(family)) return true;
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = path.extname(new URL(fileUrl).pathname) || '.ttf';
    const tmp = path.join(os.tmpdir(), `nc-font-${crypto.createHash('md5').update(fileUrl).digest('hex')}${ext}`);
    await fs.writeFile(tmp, buf);
    registerFont(tmp, { family });
    registeredFonts.add(family);
    return true;
  } catch {
    return false;
  }
}

function sizeMm(designDocument) {
  const meta = designDocument?.selections?.size?.snapshot?.meta;
  if (meta && Number(meta.widthMm) > 0 && Number(meta.heightMm) > 0) {
    return { widthMm: Number(meta.widthMm), heightMm: Number(meta.heightMm) };
  }
  return DEFAULT_SIZE_MM;
}

/**
 * @param {object} designDocument
 * @param {object} [opts]
 * @param {number} [opts.dpi=300]
 * @returns {Promise<{ buffer: Buffer, widthPx: number, heightPx: number, mime: string }>}
 */
export async function renderProduction(designDocument, { dpi = DEFAULT_DPI } = {}) {
  const { widthMm, heightMm } = sizeMm(designDocument);
  const W = mmToPx(widthMm, dpi);
  const H = mmToPx(heightMm, dpi);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background (plate surface).
  const bg = designDocument?.selections?.background?.snapshot?.meta;
  ctx.fillStyle = bg?.type === 'color' && bg?.value ? bg.value : '#f5efe6';
  ctx.fillRect(0, 0, W, H);

  // Border.
  const border = designDocument?.selections?.border?.snapshot;
  if (border && border.name && border.name.toLowerCase() !== 'none') {
    const inset = Math.round(Math.min(W, H) * 0.04);
    ctx.strokeStyle = /luxury|gold/i.test(border.name) ? '#C8A04D' : '#3a2f27';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.015));
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  }

  const layout = ensureLayout(designDocument);
  const textColor = designDocument?.selections?.color?.snapshot?.meta?.hex || '#1a1a1a';
  const fontSnap = designDocument?.selections?.font?.snapshot?.meta;
  const family = fontSnap?.family || 'DejaVu Sans';
  await ensureFont(family, fontSnap?.fileUrl);

  const textByField = Object.fromEntries((designDocument?.text || []).map((t) => [t.field, t.value]));

  for (const el of layout.elements) {
    const x = el.x * W;
    const y = el.y * H;

    if (el.type === 'text') {
      const value = textByField[el.ref];
      if (!value) continue;
      const fontPx = Math.round(H * 0.14 * (el.scale || 1));
      ctx.font = `${fontPx}px "${family}"`;
      ctx.fillStyle = textColor;
      ctx.textAlign = el.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, x, y);
    } else if (el.type === 'icon') {
      const icon = (designDocument?.icons || [])[el.ref];
      const size = Math.round(H * 0.18 * (el.scale || 1));
      const svgUrl = icon?.snapshot?.meta?.svgUrl;
      let drawn = false;
      if (svgUrl && /^https?:\/\//.test(svgUrl)) {
        try {
          const img = await loadImage(svgUrl);
          ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
          drawn = true;
        } catch {
          drawn = false;
        }
      }
      if (!drawn) {
        // Placeholder: a circle with the icon's initial.
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = textColor;
        ctx.lineWidth = Math.max(2, size * 0.04);
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = `${Math.round(size * 0.5)}px "${family}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((icon?.snapshot?.name || '?').charAt(0), x, y);
      }
    }
  }

  const buffer = canvas.toBuffer('image/png');
  return { buffer, widthPx: W, heightPx: H, mime: 'image/png' };
}

export default renderProduction;
