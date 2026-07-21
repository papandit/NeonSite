// Fills each Neon scene with a name-matched backdrop image (stylized SVG data
// URIs — dark, so the neon pops). Only scenes without an imageUrl are set, so an
// admin's own uploads are preserved. Broadcasts so open Neon pages refresh.
//
//   Run:  node src/scripts/seedNeonScenes.js   (from server/)

import { connectDB, disconnectDB } from '../db/connect.js';
import { getNeonConfig } from '../models/NeonConfig.js';
import { broadcast } from '../services/events/bus.js';

const W = 640, H = 440;
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const wrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${inner}</svg>`;
const rand = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };

const SCENES = {
  wall: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#w)"/>` +
    Array.from({ length: 9 }, (_, i) => `<rect x="${(i / 9) * W}" y="0" width="2" height="${H}" fill="#000" opacity="0.06"/>`).join(''),
    `<defs><radialGradient id="w" cx="0.5" cy="0.25" r="0.85"><stop offset="0" stop-color="#1c1c24"/><stop offset="1" stop-color="#0a0a0f"/></radialGradient></defs>`),

  brick: () => wrap(
    `<rect width="${W}" height="${H}" fill="#160f10"/>` +
    Array.from({ length: 17 }, (_, r) => Array.from({ length: 12 }, (_, c) => {
      const y = r * 26, x = c * 56 + (r % 2 ? 28 : 0);
      return `<rect x="${x}" y="${y}" width="52" height="22" rx="2" fill="#3a2320" opacity="${0.55 + rand(r * 12 + c) * 0.25}"/>`;
    }).join('')).join('') +
    `<rect width="${W}" height="${H}" fill="url(#v)"/>`,
    `<defs><radialGradient id="v" cx="0.5" cy="0.3" r="0.9"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient></defs>`),

  room: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#r)"/>` +
    `<rect x="0" y="330" width="${W}" height="110" fill="#100e16"/>` +
    // floor lamp bottom-left
    `<ellipse cx="80" cy="240" rx="120" ry="170" fill="#ffcf8a" opacity="0.06"/>` +
    `<path d="M64 430 L96 430 L88 300 L72 300 Z" fill="#2a2630"/>` +
    `<path d="M60 300 Q80 268 100 300 Z" fill="#e8cfa0" opacity="0.85"/>` +
    `<rect x="77" y="300" width="6" height="130" fill="#3a3540"/>`,
    `<defs><radialGradient id="r" cx="0.5" cy="0.15" r="0.95"><stop offset="0" stop-color="#22202c"/><stop offset="0.5" stop-color="#14121b"/><stop offset="1" stop-color="#0a0910"/></radialGradient></defs>`),

  cafe: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#c)"/>` +
    Array.from({ length: 5 }, (_, i) => `<rect x="0" y="${340 + i * 20}" width="${W}" height="18" fill="${i % 2 ? '#241611' : '#2c1c14'}"/>`).join('') +
    `<ellipse cx="${W * 0.7}" cy="120" rx="150" ry="90" fill="#ffb877" opacity="0.08"/>`,
    `<defs><radialGradient id="c" cx="0.5" cy="0.2" r="0.9"><stop offset="0" stop-color="#2a1e17"/><stop offset="0.55" stop-color="#160f0b"/><stop offset="1" stop-color="#0a0705"/></radialGradient></defs>`),

  studio: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#s)"/>` +
    Array.from({ length: 8 }, (_, i) => `<rect x="${(i / 8) * W}" y="0" width="1" height="${H}" fill="#fff" opacity="0.03"/>`).join('') +
    Array.from({ length: 5 }, (_, i) => `<rect x="0" y="${(i / 5) * H}" width="${W}" height="1" fill="#fff" opacity="0.03"/>`).join(''),
    `<defs><radialGradient id="s" cx="0.5" cy="0.2" r="0.9"><stop offset="0" stop-color="#23252b"/><stop offset="0.55" stop-color="#15171b"/><stop offset="1" stop-color="#0a0b0d"/></radialGradient></defs>`),

  bar: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#b)"/>` +
    `<rect x="0" y="150" width="${W}" height="6" fill="#0d2b30"/>` +
    Array.from({ length: 8 }, (_, i) => `<rect x="${60 + i * 70}" y="96" width="16" height="54" rx="6" fill="#0e343a" opacity="0.8"/>`).join('') +
    `<rect x="0" y="360" width="${W}" height="80" fill="#08181b"/>`,
    `<defs><radialGradient id="b" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#10262a"/><stop offset="0.45" stop-color="#0a1518"/><stop offset="1" stop-color="#050a0b"/></radialGradient></defs>`),

  garden: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#g)"/>` +
    Array.from({ length: 26 }, (_, i) => {
      const edge = i % 2 === 0;
      const x = edge ? rand(i) * 120 : W - rand(i) * 120;
      const y = rand(i + 7) * H;
      return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="9" ry="20" fill="#1f3a24" transform="rotate(${(rand(i + 3) * 120 - 60).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})" opacity="0.8"/>`;
    }).join(''),
    `<defs><radialGradient id="g" cx="0.5" cy="0.1" r="1"><stop offset="0" stop-color="#16281b"/><stop offset="0.5" stop-color="#0d1a10"/><stop offset="1" stop-color="#060d08"/></radialGradient></defs>`),

  sky: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#k)"/>` +
    `<circle cx="${W - 110}" cy="90" r="46" fill="#e9edf7" opacity="0.9"/>` +
    `<circle cx="${W - 96}" cy="80" r="46" fill="url(#k)"/>` +
    Array.from({ length: 70 }, (_, i) => `<circle cx="${(rand(i) * W).toFixed(0)}" cy="${(rand(i + 9) * H * 0.8).toFixed(0)}" r="${(rand(i + 3) * 1.4 + 0.4).toFixed(1)}" fill="#fff" opacity="${(0.3 + rand(i + 5) * 0.6).toFixed(2)}"/>`).join(''),
    `<defs><radialGradient id="k" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#1a1f3a"/><stop offset="0.45" stop-color="#121428"/><stop offset="1" stop-color="#080910"/></radialGradient></defs>`),

  gallery: () => wrap(
    `<rect width="${W}" height="${H}" fill="url(#a)"/>` +
    `<ellipse cx="${W / 2}" cy="130" rx="260" ry="150" fill="#fff" opacity="0.05"/>` +
    `<rect x="0" y="360" width="${W}" height="80" fill="#0d0b09"/>` +
    `<rect x="${W / 2 - 70}" y="70" width="140" height="150" rx="4" fill="none" stroke="#3a3128" stroke-width="4" opacity="0.6"/>`,
    `<defs><radialGradient id="a" cx="0.5" cy="0.3" r="0.9"><stop offset="0" stop-color="#201a16"/><stop offset="0.55" stop-color="#14100d"/><stop offset="1" stop-color="#080605"/></radialGradient></defs>`),
};

async function run() {
  await connectDB();
  const cfg = await getNeonConfig();
  let filled = 0;
  cfg.scenes = (cfg.scenes || []).map((s) => {
    if (s.imageUrl || !SCENES[s.key]) return s;
    filled += 1;
    return { ...(s.toObject ? s.toObject() : s), imageUrl: dataUri(SCENES[s.key]()) };
  });
  cfg.markModified('scenes');
  await cfg.save();
  broadcast('neon:changed', { at: cfg.updatedAt });
  console.log(`Neon scene backdrops set for ${filled} scene(s).`);
  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
