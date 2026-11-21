/**
 * Daily broadsheet generator.
 * Edit ../news.json and run: node render/build.mjs
 * Motif keys select drawings: kyiv, cyclone, markets, ukeu, cop, poland,
 * iraq, strike, cpi, gavel, oil, ballot, cricket (unknown keys use "generic").
 */
import { readFileSync, writeFileSync, unlinkSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const news = JSON.parse(readFileSync(join(root, 'news.json'), 'utf8'));

const PAPER = '#f4efe4';
const INK = '#1a1612';
const CRIMSON = '#9d1c2b';

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function allStories() {
  return [...news.leads, ...news.features, ...news.briefs];
}

function validate() {
  const stories = allStories();
  const n = stories.length;
  if (news.masthead.storyCount !== n) {
    throw new Error(`storyCount ${news.masthead.storyCount} != ${n} stories`);
  }
  if (news.masthead.countLine !== `${n} STORIES · 7 REGIONS · EVERY ONE FROM THIS FRIDAY`) {
    throw new Error('countLine does not match the story list');
  }
  if (news.date.display !== 'Friday 20 November 2026') {
    throw new Error('date.display must be Friday 20 November 2026');
  }
  if (news.leads.length !== 3) throw new Error('need 3 leads');
  if (news.features.length !== 10) throw new Error('need 10 features');
  if (news.briefs.length < 18) throw new Error('need at least 18 briefs');
  if (!news.footer.includes('Friday 20 November 2026')) throw new Error('footer must name the day');
  if (!news.dateCheck?.items || news.dateCheck.items.length < 4) throw new Error('date check needs 4 items');
  const ids = new Set(news.regions.map((r) => r.id));
  if (ids.size !== 7) throw new Error('need 7 regions');
  const nums = stories.map((s) => s.n);
  if (new Set(nums).size !== nums.length) throw new Error('duplicate story numbers');
  stories.forEach((s, i) => {
    if (s.n !== i + 1) throw new Error(`story number ${s.n} out of order at ${i + 1}`);
    if (!ids.has(s.region)) throw new Error(`unknown region on story ${s.n}`);
    if (!s.source) throw new Error(`story ${s.n} missing source`);
    const text = s.detail || s.line || '';
    if (!text.trim()) throw new Error(`story ${s.n} missing text`);
  });
  for (const s of [...news.leads, ...news.features]) {
    if (!s.headline || !s.kicker || !s.motif) throw new Error(`story ${s.n} missing headline, kicker, or motif`);
  }
  if (!['a', 'b', 'c'].includes(news.entryVariant)) throw new Error('entryVariant must be a, b, or c');
  if (news.entryVariant === 'b' && (!news.kpis || news.kpis.length < 5)) {
    throw new Error('variant b needs 5–6 kpis');
  }
}

function region(id) {
  return news.regions.find((r) => r.id === id);
}

function svg(vb, body) {
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

function motif(name, mode) {
  const fn = MOTIFS[name] || MOTIFS.generic;
  return fn(mode);
}

const MOTIFS = {
  generic(mode) {
    const lead = mode === 'lead';
    const w = lead ? 360 : 200;
    const h = lead ? 180 : 72;
    return svg(`${0} 0 ${w} ${h}`, `
      <rect width="${w}" height="${h}" fill="#e7dcc8"/>
      <circle cx="${w * 0.72}" cy="${h * 0.42}" r="${h * 0.22}" fill="#1a1612"/>
      <rect x="${w * 0.12}" y="${h * 0.62}" width="${w * 0.46}" height="${h * 0.08}" fill="#9d1c2b"/>
      <rect x="${w * 0.12}" y="${h * 0.76}" width="${w * 0.32}" height="${h * 0.06}" fill="#1d4e89"/>
    `);
  },
  kyiv(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#162033"/>
        <rect y="46" width="200" height="14" fill="#2a6278"/>
        <rect y="60" width="200" height="12" fill="#1c2838"/>
        <path d="M18 46 v10 h36 v-10" fill="none" stroke="#f0e2c4" stroke-width="3"/>
        <path d="M26 46 q10 -10 20 0" fill="none" stroke="#f7f1e4" stroke-width="2"/>
        <path d="M78 46 v10 h40 v-10" fill="none" stroke="#f0e2c4" stroke-width="3"/>
        <path d="M88 46 q10 -12 22 0" fill="none" stroke="#f7f1e4" stroke-width="2"/>
        <path d="M142 46 v10 h40 v-10" fill="none" stroke="#f0e2c4" stroke-width="3"/>
        <path d="M152 46 q10 -10 20 0" fill="none" stroke="#f7f1e4" stroke-width="2"/>
        <circle cx="98" cy="40" r="7" fill="#e4572e"/>
        <circle cx="98" cy="40" r="3" fill="#f2c14b"/>
        <rect x="16" y="22" width="10" height="24" fill="#2c3a52"/>
        <rect x="30" y="14" width="14" height="32" fill="#243044"/>
        <rect x="168" y="18" width="12" height="28" fill="#2c3a52"/>
        <circle cx="170" cy="12" r="5" fill="#f3e6c4"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#162033"/>
      <circle cx="28" cy="22" r="1.2" fill="#f4efe6"/>
      <circle cx="70" cy="14" r="1.1" fill="#f4efe6"/>
      <circle cx="120" cy="28" r="1.2" fill="#f4efe6"/>
      <circle cx="210" cy="16" r="1.1" fill="#f4efe6"/>
      <circle cx="250" cy="34" r="1.2" fill="#f4efe6"/>
      <circle cx="318" cy="26" r="11" fill="#f3e6c4"/>
      <circle cx="324" cy="22" r="9" fill="#162033"/>
      <rect x="14" y="78" width="16" height="36" fill="#243044"/>
      <rect x="34" y="62" width="22" height="52" fill="#2c3a52"/>
      <rect x="60" y="86" width="14" height="28" fill="#243044"/>
      <rect x="292" y="70" width="18" height="44" fill="#2c3a52"/>
      <rect x="314" y="86" width="14" height="28" fill="#243044"/>
      <rect x="332" y="76" width="16" height="38" fill="#2c3a52"/>
      <rect x="40" y="70" width="3" height="6" fill="#e8c56b"/>
      <rect x="48" y="70" width="3" height="6" fill="#e8c56b"/>
      <rect x="40" y="82" width="3" height="6" fill="#e8c56b"/>
      <rect x="300" y="78" width="3" height="6" fill="#e8c56b"/>
      <rect x="308" y="78" width="3" height="6" fill="#e8c56b"/>
      <rect y="114" width="360" height="28" fill="#2a6278"/>
      <rect y="122" width="360" height="5" fill="#3d7d96"/>
      <rect y="142" width="360" height="38" fill="#1c2838"/>
      <path d="M28 114 v16 h78 v-16" fill="none" stroke="#e6d7b8" stroke-width="5"/>
      <path d="M46 114 q21 -18 42 0" fill="none" stroke="#f7f1e4" stroke-width="3"/>
      <path d="M140 114 v16 h80 v-16" fill="none" stroke="#e6d7b8" stroke-width="5"/>
      <path d="M158 114 q22 -20 44 0" fill="none" stroke="#f7f1e4" stroke-width="3"/>
      <path d="M252 114 v16 h78 v-16" fill="none" stroke="#e6d7b8" stroke-width="5"/>
      <path d="M270 114 q21 -18 42 0" fill="none" stroke="#f7f1e4" stroke-width="3"/>
      <circle cx="176" cy="104" r="11" fill="#e4572e"/>
      <circle cx="176" cy="104" r="5" fill="#f2c14b"/>
      <circle cx="286" cy="108" r="8" fill="#e4572e"/>
      <circle cx="286" cy="108" r="3.5" fill="#f2c14b"/>
      <line x1="300" y1="18" x2="236" y2="78" stroke="#f7f1e4" stroke-width="2"/>
      <polygon points="232,82 246,72 238,70" fill="#e4572e"/>
      <line x1="92" y1="8" x2="48" y2="58" stroke="#f7f1e4" stroke-width="2"/>
      <polygon points="44,62 58,54 50,50" fill="#e4572e"/>
    `);
  },
  cyclone(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#d5e6f0"/>
        <rect y="46" width="200" height="26" fill="#8eb4c9"/>
        <path d="M118 72 L132 28 L168 22 L200 30 L200 72 Z" fill="#e6d3a4"/>
        <circle cx="148" cy="34" r="5" fill="#f7f3ea"/>
        <circle cx="148" cy="34" r="2.5" fill="#9d1c2b"/>
        <path d="M148 34 m -14 0 a 14 14 0 1 1 20 10" fill="none" stroke="#1d4e89" stroke-width="2.5"/>
        <path d="M148 34 m -24 2 a 24 24 0 1 1 32 14" fill="none" stroke="#1d4e89" stroke-width="2.5"/>
        <path d="M22 52 h10 l5 -8 5 8 h10 v10 h-30 z" fill="#f7f3ea"/>
        <path d="M58 54 h8 l4 -7 4 7 h8 v8 h-24 z" fill="#f4efe4"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#d7e8f2"/>
      <rect y="108" width="360" height="72" fill="#8eb4c9"/>
      <path d="M210 180 L250 78 L310 58 L360 70 L360 180 Z" fill="#e6d3a4"/>
      <path d="M250 78 L268 96 L290 70 L310 58 L286 100 L250 90 Z" fill="#efe2c4"/>
      <circle cx="268" cy="86" r="8" fill="#f7f3ea"/>
      <circle cx="268" cy="86" r="4" fill="#9d1c2b"/>
      <path d="M268 86 m -22 0 a 22 22 0 1 1 30 16" fill="none" stroke="#1d4e89" stroke-width="3"/>
      <path d="M268 86 m -38 2 a 38 38 0 1 1 50 22" fill="none" stroke="#1d4e89" stroke-width="3"/>
      <path d="M268 86 m -54 4 a 54 54 0 1 1 70 24" fill="none" stroke="#4e86a8" stroke-width="3"/>
      <path d="M40 128 h22 l8 -14 8 14 h22 v18 h-60 z" fill="#f7f3ea"/>
      <path d="M112 134 h16 l6 -10 6 10 h16 v14 h-44 z" fill="#f4efe4"/>
      <path d="M168 136 h14 l5 -9 5 9 h14 v12 h-38 z" fill="#f7f3ea"/>
      <line x1="24" y1="36" x2="18" y2="58" stroke="#1d4e89" stroke-width="2"/>
      <line x1="44" y1="28" x2="36" y2="52" stroke="#1d4e89" stroke-width="2"/>
      <line x1="64" y1="40" x2="58" y2="62" stroke="#1d4e89" stroke-width="2"/>
      <line x1="150" y1="24" x2="142" y2="48" stroke="#4e86a8" stroke-width="2"/>
      <line x1="180" y1="18" x2="172" y2="44" stroke="#4e86a8" stroke-width="2"/>
    `);
  },
  markets(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f7f3ea"/>
        <rect x="16" y="18" width="16" height="40" fill="#9d1c2b"/>
        <rect x="42" y="28" width="16" height="30" fill="#c45a4a"/>
        <rect x="68" y="34" width="16" height="24" fill="#c45a4a"/>
        <rect x="94" y="40" width="16" height="18" fill="#c45a4a"/>
        <polyline points="22,16 50,26 76,32 102,42 150,58" fill="none" stroke="#1a1612" stroke-width="2.5"/>
        <polygon points="156,62 146,50 166,50" fill="#9d1c2b"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f6f1e6"/>
      <rect x="0" y="150" width="360" height="30" fill="#efe6d6"/>
      <rect x="36" y="48" width="28" height="102" fill="#9d1c2b"/>
      <rect x="84" y="70" width="28" height="80" fill="#c45a4a"/>
      <rect x="132" y="86" width="28" height="64" fill="#c45a4a"/>
      <rect x="180" y="100" width="28" height="50" fill="#c45a4a"/>
      <polyline points="50,36 98,58 146,74 194,96 250,78 310,120" fill="none" stroke="#1a1612" stroke-width="3"/>
      <polygon points="318,128 304,112 332,112" fill="#9d1c2b"/>
      <rect x="250" y="28" width="78" height="36" fill="#1a1612"/>
      <path d="M268 40 h44" stroke="#f4efe4" stroke-width="3"/>
      <path d="M290 28 v36" stroke="#9d1c2b" stroke-width="3"/>
    `);
  },
  ukeu(mode) {
    const lead = mode === 'lead';
    if (!lead) {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f7f3ea"/>
        <rect x="14" y="14" width="70" height="46" fill="#fbf8f2" stroke="#1d4e89" stroke-width="2"/>
        <rect x="116" y="14" width="70" height="46" fill="#fbf8f2" stroke="#8e2344" stroke-width="2"/>
        <circle cx="32" cy="32" r="6" fill="#e0b15a"/>
        <rect x="28" y="38" width="8" height="14" fill="#c24e12"/>
        <circle cx="48" cy="34" r="5" fill="#e0b15a"/>
        <rect x="45" y="39" width="7" height="12" fill="#c24e12"/>
        <circle cx="140" cy="30" r="6" fill="#1d4e89"/>
        <rect x="134" y="36" width="12" height="14" fill="#1d4e89"/>
        <circle cx="162" cy="32" r="6" fill="#8e2344"/>
        <rect x="156" y="38" width="12" height="12" fill="#8e2344"/>
        <path d="M84 36 h32" stroke="#1a1612" stroke-width="2"/>
        <polygon points="116,36 108,32 108,40" fill="#1a1612"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f6f1e6"/>
      <rect x="24" y="28" width="140" height="124" fill="#fbf8f2" stroke="#1d4e89" stroke-width="3"/>
      <rect x="196" y="28" width="140" height="124" fill="#fbf8f2" stroke="#8e2344" stroke-width="3"/>
      <circle cx="58" cy="70" r="14" fill="#e0b15a"/>
      <rect x="50" y="86" width="16" height="36" fill="#c24e12"/>
      <circle cx="96" cy="78" r="12" fill="#e0b15a"/>
      <rect x="89" y="92" width="14" height="30" fill="#c24e12"/>
      <circle cx="128" cy="74" r="11" fill="#e6c98a"/>
      <rect x="122" y="86" width="12" height="28" fill="#d7a44a"/>
      <circle cx="236" cy="72" r="14" fill="#1d4e89"/>
      <rect x="226" y="88" width="20" height="34" fill="#1d4e89"/>
      <circle cx="278" cy="78" r="12" fill="#8e2344"/>
      <rect x="270" y="92" width="16" height="30" fill="#8e2344"/>
      <circle cx="312" cy="74" r="11" fill="#5b3d8c"/>
      <rect x="305" y="86" width="14" height="28" fill="#5b3d8c"/>
      <rect x="164" y="78" width="32" height="8" fill="#1a1612"/>
      <polygon points="196,82 184,74 184,90" fill="#1a1612"/>
    `);
  },
  cop(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#e7f0ea"/>
        <circle cx="46" cy="36" r="22" fill="#1d6a45"/>
        <ellipse cx="46" cy="36" rx="10" ry="22" fill="none" stroke="#d7efe2" stroke-width="2"/>
        <path d="M24 36 h44" stroke="#d7efe2" stroke-width="2"/>
        <rect x="92" y="16" width="14" height="42" rx="6" fill="#f7f3ea" stroke="#1a1612" stroke-width="2"/>
        <rect x="95" y="30" width="8" height="24" fill="#9d1c2b"/>
        <circle cx="99" cy="18" r="5" fill="#9d1c2b"/>
        <rect x="120" y="20" width="64" height="36" fill="#fbf8f2" stroke="#1a1612" stroke-width="2"/>
        <path d="M130 32 h44" stroke="#1a1612" stroke-width="2"/>
        <path d="M130 40 h36" stroke="#9d1c2b" stroke-width="2"/>
        <path d="M128 28 l48 16" stroke="#9d1c2b" stroke-width="2"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#e7f2ea"/>
      <circle cx="92" cy="90" r="58" fill="#1d6a45"/>
      <ellipse cx="92" cy="90" rx="24" ry="58" fill="none" stroke="#d7efe2" stroke-width="3"/>
      <path d="M34 90 h116" stroke="#d7efe2" stroke-width="3"/>
      <path d="M50 62 h84" stroke="#d7efe2" stroke-width="2"/>
      <path d="M50 118 h84" stroke="#d7efe2" stroke-width="2"/>
      <rect x="180" y="36" width="26" height="108" rx="10" fill="#f7f3ea" stroke="#1a1612" stroke-width="3"/>
      <rect x="185" y="78" width="16" height="58" fill="#9d1c2b"/>
      <circle cx="193" cy="40" r="10" fill="#9d1c2b"/>
      <rect x="230" y="48" width="108" height="84" fill="#fbf8f2" stroke="#1a1612" stroke-width="3"/>
      <path d="M246 74 h76" stroke="#1a1612" stroke-width="3"/>
      <path d="M246 92 h64" stroke="#1a1612" stroke-width="3"/>
      <path d="M246 110 h52" stroke="#9d1c2b" stroke-width="3"/>
      <path d="M242 64 l84 52" stroke="#9d1c2b" stroke-width="3"/>
    `);
  },
  poland(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#e7eef6"/>
        <path d="M0 40 h200" stroke="#1d4e89" stroke-width="2" stroke-dasharray="6 4"/>
        <rect x="118" y="28" width="46" height="8" rx="2" fill="#5c6570"/>
        <polygon points="164,32 178,26 178,38" fill="#9d1c2b"/>
        <path d="M118 36 l-28 8" stroke="#9d1c2b" stroke-width="2"/>
        <rect x="122" y="24" width="8" height="6" fill="#3a342c"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#e6eef6"/>
      <rect y="108" width="360" height="72" fill="#d5e0c8"/>
      <path d="M0 78 h360" stroke="#1d4e89" stroke-width="3" stroke-dasharray="10 6"/>
      <rect x="196" y="64" width="92" height="16" rx="3" fill="#5c6570"/>
      <polygon points="288,72 316,58 316,86" fill="#9d1c2b"/>
      <rect x="206" y="56" width="16" height="10" fill="#3a342c"/>
      <path d="M40 40 q30 20 20 48" fill="none" stroke="#1d4e89" stroke-width="2"/>
      <path d="M40 40 q48 18 40 52" fill="none" stroke="#1d4e89" stroke-width="2"/>
      <circle cx="40" cy="40" r="4" fill="#9d1c2b"/>
    `);
  },
  iraq(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f0e0c0"/>
        <rect x="78" y="16" width="108" height="46" fill="none" stroke="#8e2344" stroke-width="3"/>
        <rect x="118" y="46" width="18" height="16" fill="#f0e0c0" stroke="#8e2344" stroke-width="2"/>
        <rect x="14" y="40" width="22" height="12" fill="#3a342c"/>
        <rect x="40" y="36" width="26" height="14" fill="#1a1612"/>
        <circle cx="20" cy="52" r="4" fill="#1a1612"/>
        <circle cx="32" cy="52" r="4" fill="#1a1612"/>
        <circle cx="48" cy="50" r="4" fill="#1a1612"/>
        <circle cx="62" cy="50" r="4" fill="#1a1612"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f0e0c0"/>
      <rect y="140" width="360" height="40" fill="#e2cc9e"/>
      <rect x="150" y="28" width="180" height="112" fill="none" stroke="#8e2344" stroke-width="4"/>
      <rect x="214" y="108" width="40" height="32" fill="#f0e0c0" stroke="#8e2344" stroke-width="3"/>
      <rect x="168" y="48" width="28" height="22" fill="#e7c9a2" stroke="#8e2344" stroke-width="2"/>
      <rect x="214" y="48" width="28" height="22" fill="#e7c9a2" stroke="#8e2344" stroke-width="2"/>
      <rect x="260" y="48" width="28" height="22" fill="#e7c9a2" stroke="#8e2344" stroke-width="2"/>
      <rect x="24" y="108" width="48" height="22" fill="#3a342c"/>
      <rect x="84" y="100" width="52" height="26" fill="#1a1612"/>
      <circle cx="36" cy="130" r="8" fill="#1a1612"/>
      <circle cx="60" cy="130" r="8" fill="#1a1612"/>
      <circle cx="98" cy="126" r="8" fill="#1a1612"/>
      <circle cx="124" cy="126" r="8" fill="#1a1612"/>
    `);
  },
  strike(mode) {
    const people = (x, y, s, fill) => `
      <circle cx="${x}" cy="${y}" r="${4 * s}" fill="${fill}"/>
      <rect x="${x - 5 * s}" y="${y + 4 * s}" width="${10 * s}" height="${14 * s}" fill="${fill}"/>
    `;
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f7f3ea"/>
        <rect x="0" y="58" width="200" height="14" fill="#e7dcc8"/>
        ${people(28, 30, 1.3, '#1d4e89')}
        ${people(52, 34, 1.15, '#8e2344')}
        ${people(76, 28, 1.4, '#1a1612')}
        ${people(102, 34, 1.1, '#c24e12')}
        ${people(124, 30, 1.25, '#1d6a45')}
        <rect x="138" y="22" width="46" height="16" fill="#9d1c2b"/>
        <rect x="150" y="38" width="4" height="20" fill="#5c4030"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f6f1e6"/>
      <rect x="0" y="142" width="360" height="38" fill="#e7dcc8"/>
      <rect x="20" y="36" width="70" height="106" fill="#d9cbb8"/>
      <rect x="100" y="20" width="54" height="122" fill="#cfc1ac"/>
      <rect x="36" y="50" width="12" height="16" fill="#f7f3ea"/>
      <rect x="56" y="50" width="12" height="16" fill="#f7f3ea"/>
      <rect x="114" y="36" width="12" height="16" fill="#f7f3ea"/>
      <rect x="132" y="36" width="12" height="16" fill="#f7f3ea"/>
      ${people(180, 96, 2.1, '#1d4e89')}
      ${people(214, 104, 1.8, '#8e2344')}
      ${people(246, 92, 2.2, '#1a1612')}
      ${people(280, 106, 1.7, '#c24e12')}
      ${people(310, 98, 1.9, '#1d6a45')}
      ${people(338, 108, 1.5, '#5b3d8c')}
      <rect x="196" y="48" width="78" height="22" fill="#9d1c2b"/>
      <rect x="228" y="70" width="5" height="36" fill="#5c4030"/>
    `);
  },
  cpi(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f7f3ea"/>
        <path d="M20 56 h150" stroke="#d5cbbd" stroke-width="2"/>
        <rect x="36" y="36" width="22" height="20" fill="#cfc1ac"/>
        <rect x="70" y="28" width="22" height="28" fill="#c24e12"/>
        <rect x="104" y="16" width="22" height="40" fill="#9d1c2b"/>
        <path d="M140 40 l16 -16 l16 16" fill="none" stroke="#1d6a45" stroke-width="3"/>
        <path d="M156 24 v28" stroke="#1d6a45" stroke-width="3"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f6f1e6"/>
      <path d="M40 150 h200" stroke="#cfc1ac" stroke-width="3"/>
      <rect x="60" y="96" width="40" height="54" fill="#cfc1ac"/>
      <rect x="120" y="72" width="40" height="78" fill="#c24e12"/>
      <rect x="180" y="40" width="40" height="110" fill="#9d1c2b"/>
      <path d="M250 110 l36 -40 l36 40" fill="none" stroke="#1d6a45" stroke-width="6"/>
      <path d="M286 70 v62" stroke="#1d6a45" stroke-width="6"/>
    `);
  },
  gavel(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f7f3ea"/>
        <rect x="18" y="16" width="70" height="44" fill="#fbf8f2" stroke="#1a1612" stroke-width="2"/>
        <path d="M30 30 h46 M30 40 h36" stroke="#1a1612" stroke-width="2"/>
        <circle cx="62" cy="48" r="8" fill="none" stroke="#9d1c2b" stroke-width="2"/>
        <rect x="112" y="22" width="36" height="14" rx="2" transform="rotate(-35 130 29)" fill="#8a5a32"/>
        <rect x="124" y="36" width="8" height="26" transform="rotate(-35 128 40)" fill="#5c4030"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f6f1e6"/>
      <rect x="28" y="28" width="150" height="124" fill="#fbf8f2" stroke="#1a1612" stroke-width="3"/>
      <path d="M48 58 h110 M48 78 h96 M48 98 h80" stroke="#1a1612" stroke-width="3"/>
      <circle cx="132" cy="120" r="18" fill="none" stroke="#9d1c2b" stroke-width="4"/>
      <path d="M120 120 h24 M132 108 v24" stroke="#9d1c2b" stroke-width="3"/>
      <g transform="translate(210,40) rotate(-32)">
        <rect x="0" y="0" width="92" height="28" rx="4" fill="#8a5a32"/>
        <rect x="40" y="28" width="14" height="70" fill="#5c4030"/>
      </g>
    `);
  },
  oil(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f3ead6"/>
        <rect y="56" width="200" height="16" fill="#e2cc9e"/>
        <path d="M78 56 L92 16 L106 56" fill="none" stroke="#1a1612" stroke-width="3"/>
        <path d="M84 40 h16 M86 32 h12 M88 24 h8" stroke="#1a1612" stroke-width="2"/>
        <circle cx="128" cy="22" r="8" fill="#e0b15a"/>
        <path d="M40 56 v-16 h18 v16" fill="none" stroke="#1d6a45" stroke-width="3"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f3ead6"/>
      <rect y="132" width="360" height="48" fill="#e2cc9e"/>
      <circle cx="300" cy="42" r="18" fill="#e0b15a"/>
      <path d="M150 132 L178 28 L206 132" fill="none" stroke="#1a1612" stroke-width="4"/>
      <path d="M162 100 h28 M166 78 h20 M170 56 h12" stroke="#1a1612" stroke-width="3"/>
      <rect x="168" y="24" width="20" height="10" fill="#9d1c2b"/>
      <path d="M60 132 v-36 h40 v36" fill="none" stroke="#1d6a45" stroke-width="4"/>
      <path d="M70 108 h20" stroke="#1d6a45" stroke-width="3"/>
      <circle cx="250" cy="150" r="10" fill="#1a1612"/>
    `);
  },
  ballot(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#f7f3ea"/>
        <rect x="18" y="20" width="46" height="40" fill="#1d4e89"/>
        <rect x="30" y="14" width="22" height="8" fill="#1a1612"/>
        <rect x="86" y="40" width="28" height="12" fill="#cfc1ac"/>
        <rect x="86" y="26" width="28" height="12" fill="#cfc1ac"/>
        <rect x="86" y="12" width="28" height="12" fill="#9d1c2b"/>
        <rect x="130" y="18" width="52" height="40" fill="#fbf8f2" stroke="#1a1612" stroke-width="2"/>
        <path d="M142 38 l8 8 l16 -16" fill="none" stroke="#1d6a45" stroke-width="3"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#f6f1e6"/>
      <rect x="28" y="40" width="100" height="100" fill="#1d4e89"/>
      <rect x="52" y="26" width="52" height="16" fill="#1a1612"/>
      <rect x="160" y="108" width="56" height="28" fill="#cfc1ac"/>
      <rect x="160" y="74" width="56" height="28" fill="#cfc1ac"/>
      <rect x="160" y="40" width="56" height="28" fill="#9d1c2b"/>
      <rect x="240" y="40" width="92" height="100" fill="#fbf8f2" stroke="#1a1612" stroke-width="3"/>
      <path d="M262 92 l16 16 l32 -34" fill="none" stroke="#1d6a45" stroke-width="6"/>
    `);
  },
  cricket(mode) {
    if (mode !== 'lead') {
      return svg('0 0 200 72', `
        <rect width="200" height="72" fill="#e7f0ea"/>
        <rect y="48" width="200" height="24" fill="#1d6a45"/>
        <rect x="36" y="22" width="4" height="30" fill="#f4efe4"/>
        <rect x="46" y="22" width="4" height="30" fill="#f4efe4"/>
        <rect x="56" y="22" width="4" height="30" fill="#f4efe4"/>
        <rect x="34" y="20" width="28" height="4" fill="#e0b15a"/>
        <rect x="108" y="16" width="8" height="40" transform="rotate(-28 112 36)" fill="#c24e12"/>
        <circle cx="150" cy="28" r="7" fill="#9d1c2b"/>
      `);
    }
    return svg('0 0 360 180', `
      <rect width="360" height="180" fill="#e7f2ea"/>
      <rect y="118" width="360" height="62" fill="#1d6a45"/>
      <rect x="70" y="48" width="8" height="74" fill="#f4efe4"/>
      <rect x="88" y="48" width="8" height="74" fill="#f4efe4"/>
      <rect x="106" y="48" width="8" height="74" fill="#f4efe4"/>
      <rect x="66" y="44" width="52" height="8" fill="#e0b15a"/>
      <rect x="190" y="36" width="16" height="96" transform="rotate(-24 198 84)" fill="#c24e12"/>
      <circle cx="280" cy="64" r="16" fill="#9d1c2b"/>
      <path d="M300 80 q30 20 10 40" fill="none" stroke="#f4efe4" stroke-width="2"/>
    `);
  },
};

function worldMap() {
  return `<svg viewBox="0 0 1000 520" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <rect width="1000" height="520" fill="#d5e4ef"/>
    <g stroke="#c3d5e4" stroke-width="1" fill="none">
      <path d="M0 130 H1000 M0 260 H1000 M0 390 H1000 M250 0 V520 M500 0 V520 M750 0 V520"/>
    </g>
    <g fill="#e4d0a6" stroke="#b89a6a" stroke-width="1.4" stroke-linejoin="round">
      <path d="M70 118 L120 78 L180 62 L250 70 L300 100 L310 140 L280 168 L250 190 L270 214 L255 236 L230 214 L210 188 L180 196 L150 176 L110 168 L78 150 Z"/>
      <path d="M300 48 L360 36 L400 58 L385 100 L340 108 L305 82 Z"/>
      <path d="M255 236 L310 228 L345 260 L350 340 L320 420 L280 455 L250 430 L235 360 L248 280 Z"/>
      <path d="M455 108 L490 86 L540 82 L600 100 L620 128 L570 156 L520 160 L480 142 L450 124 Z"/>
      <path d="M468 96 L484 86 L494 108 L476 118 Z"/>
      <path d="M455 168 L520 156 L590 168 L630 200 L640 260 L610 330 L560 390 L510 400 L470 360 L450 280 L448 210 Z"/>
      <path d="M575 88 L680 70 L800 78 L900 110 L930 150 L900 186 L800 198 L700 188 L620 160 L590 120 Z"/>
      <path d="M690 180 L748 174 L772 230 L734 270 L688 232 L700 196 Z"/>
      <path d="M760 196 L820 200 L842 242 L800 252 L758 220 Z"/>
      <path d="M828 186 L846 180 L854 208 L832 214 Z"/>
      <path d="M848 164 L866 158 L872 186 L852 190 Z"/>
      <path d="M860 150 L892 138 L908 182 L878 198 L856 170 Z"/>
      <path d="M790 300 L900 288 L948 332 L930 392 L850 406 L788 360 Z"/>
      <path d="M948 352 L976 344 L990 392 L966 416 L944 378 Z"/>
      <path d="M548 148 L648 154 L660 184 L600 196 L546 172 Z"/>
    </g>
  </svg>`;
}

function css() {
  return `
@font-face {
  font-family: "NewsPlayfair";
  src: url("file:///usr/share/fonts/truetype/sand-box/google/Playfair%20Display/PlayfairDisplay-VariableFont_wght.ttf") format("truetype");
  font-weight: 400 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "NewsSans";
  src: url("file:///usr/share/fonts/truetype/sand-box/google/Source%20Sans%203/SourceSans3-VariableFont_wght.ttf") format("truetype");
  font-weight: 400 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "NewsSerif";
  src: url("file:///usr/share/fonts/truetype/sand-box/custom/Source%20Serif%20Pro/SourceSerifPro-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "NewsSerif";
  src: url("file:///usr/share/fonts/truetype/sand-box/custom/Source%20Serif%20Pro/SourceSerifPro-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "NewsSerif";
  src: url("file:///usr/share/fonts/truetype/sand-box/custom/Source%20Serif%20Pro/SourceSerifPro-Semibold.ttf") format("truetype");
  font-weight: 600;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "NewsSerif";
  src: url("file:///usr/share/fonts/truetype/sand-box/custom/Source%20Serif%20Pro/SourceSerifPro-It.ttf") format("truetype");
  font-weight: 400;
  font-style: italic;
  font-display: block;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 1024px;
  height: 1024px;
  overflow: hidden;
  background: ${PAPER};
  color: ${INK};
  font-family: "NewsSans", "Source Sans 3", "Liberation Sans", sans-serif;
  font-variant-ligatures: none;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}
.page {
  width: 1024px;
  height: 1024px;
  background: ${PAPER};
  box-shadow: inset 0 0 0 1px ${INK};
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bar { height: 6px; background: ${CRIMSON}; flex: none; }
.wrap {
  flex: 1;
  min-height: 0;
  display: grid;
  gap: 4px;
  padding: 5px 8px 4px;
}
.variant-a .wrap { grid-template-rows: auto 236px 292px minmax(0, 1fr) auto; }
.variant-b .wrap { grid-template-rows: auto 56px 204px 268px minmax(0, 1fr) auto; }
.variant-c .wrap { grid-template-rows: auto 268px 250px minmax(0, 1fr) auto; }
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px solid ${INK};
  padding-bottom: 1px;
}
.kicker-top, .countline {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
}
.countline { letter-spacing: 0.04em; text-align: right; }
h1 {
  font-family: "NewsPlayfair", "Playfair Display", "Source Serif Pro", serif;
  font-weight: 800;
  font-size: 54px;
  line-height: 0.98;
  letter-spacing: -0.02em;
  text-align: center;
  color: #120e0c;
  white-space: nowrap;
  padding-top: 1px;
}
.deck {
  text-align: center;
  font-family: "NewsSerif", "Source Serif Pro", serif;
  font-style: italic;
  font-size: 13px;
  line-height: 1.25;
  color: #3a221c;
  border-bottom: 3px solid ${INK};
  padding: 1px 8px 3px;
}
.rule-thin { height: 1px; background: ${INK}; margin-top: 2px; }
.regions {
  display: flex;
  gap: 4px;
  align-items: center;
  padding-top: 3px;
}
.pill {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  line-height: 1.35;
  padding: 1px 6px 2px;
  white-space: nowrap;
}
.tz {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; min-height: 0; }
.kpi {
  background: #fbf8f2;
  border: 1px solid #d9cfc0;
  border-top: 3px solid var(--accent);
  padding: 2px 6px 3px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.kpi b {
  font-family: "NewsPlayfair", "Playfair Display", serif;
  font-weight: 700;
  font-size: 22px;
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.kpi span { font-size: 11px; line-height: 1.15; color: #3a342c; margin-top: 2px; }
.leads, .features { min-height: 0; display: grid; gap: 4px; }
.leads { grid-template-columns: repeat(3, 1fr); }
.features { grid-template-columns: repeat(5, 1fr); grid-template-rows: 1fr 1fr; }
.card {
  position: relative;
  background: #fbf8f2;
  border: 1px solid #d5cbbd;
  border-top: 3px solid var(--rc);
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.art { position: relative; flex: 1 1 auto; min-height: 58px; overflow: hidden; background: #efe6d6; }
.art svg { width: 100%; height: 100%; display: block; }
.variant-c .lead .art { min-height: 120px; }
.variant-b .lead .art { min-height: 52px; }
.variant-b .feature .art { min-height: 32px; }
.badge {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  background: ${CRIMSON};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 16px;
  display: grid;
  place-items: center;
  padding: 0 3px;
  line-height: 1;
}
.art-chip {
  position: absolute;
  z-index: 2;
  left: 5px;
  bottom: 5px;
  background: ${INK};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.2;
  padding: 2px 5px 1px;
}
.copy { flex: 0 0 auto; padding: 4px 6px 5px; display: flex; flex-direction: column; gap: 1px; }
.lead .copy { padding: 4px 7px 5px; }
.eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--rc);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
}
.lead h2 {
  font-family: "NewsSerif", "Source Serif Pro", serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 1.12;
  letter-spacing: -0.015em;
  color: #140f0c;
}
.feature h3 {
  font-family: "NewsSerif", "Source Serif Pro", serif;
  font-weight: 700;
  font-size: 13px;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: #140f0c;
}
.lead p, .feature p { font-size: 11.5px; line-height: 1.28; color: #241e18; }
.feature p { font-size: 11px; line-height: 1.25; }
.src { font-size: 11px; line-height: 1.2; color: #5c4038; font-style: italic; margin-top: 1px; }
.bottom { min-height: 0; display: grid; gap: 6px; }
.variant-a .bottom, .variant-b .bottom { grid-template-columns: 252px minmax(0, 1fr) 228px; }
.variant-c .bottom { grid-template-columns: 220px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; }
.panel {
  min-height: 0;
  min-width: 0;
  border: 1px solid #d5cbbd;
  background: #fbf8f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel h3, .briefs-h {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 3px 6px 2px;
  border-bottom: 1px solid ${INK};
  line-height: 1.25;
  flex: none;
}
.briefs-h span { font-weight: 600; letter-spacing: 0.03em; color: #3a342c; }
.map-canvas { position: relative; width: 100%; aspect-ratio: 1000 / 520; background: #d5e4ef; flex: none; }
.map-canvas svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pin {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 15px;
  height: 15px;
  padding: 0 2px;
  border-radius: 8px;
  background: var(--rc);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
  box-shadow: 0 0 0 1px #fbf8f2;
}
.legend { padding: 4px 6px 5px; margin-top: auto; }
.legend-row { display: flex; flex-wrap: wrap; gap: 3px 6px; }
.legend-row span { font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; line-height: 1.2; }
.swatch { width: 8px; height: 8px; display: inline-block; }
.legend p { font-size: 11px; line-height: 1.25; color: #3a342c; margin-top: 2px; }
.briefs ol {
  list-style: none;
  display: grid;
  grid-auto-flow: column;
  gap: 2px 8px;
  padding: 3px 6px 4px;
  min-height: 0;
}
.variant-a .briefs ol, .variant-b .briefs ol {
  grid-template-rows: repeat(10, auto);
  grid-template-columns: 1fr 1fr;
}
.variant-c .briefs ol {
  grid-template-rows: repeat(7, auto);
  grid-template-columns: 1fr 1fr 1fr;
}
.briefs li { font-size: 11px; line-height: 1.22; color: #1a1612; min-width: 0; }
.briefs .num { color: ${CRIMSON}; font-weight: 700; }
.briefs .place { font-weight: 700; }
.briefs .srcb { color: #5c4038; font-style: italic; }
.datecheck {
  border: 2px solid ${CRIMSON};
  background: #fbf8f2;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.variant-c .datecheck { grid-column: 1 / -1; }
.dc-h {
  background: ${CRIMSON};
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 3px 7px;
  line-height: 1.2;
  flex: none;
}
.dc-body { padding: 4px 7px 5px; min-height: 0; }
.dc-kicker { color: ${CRIMSON}; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; line-height: 1.2; }
.dc-when {
  font-family: "NewsSerif", "Source Serif Pro", serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
  margin: 1px 0 3px;
}
.datecheck ul { list-style: none; }
.datecheck li { font-size: 11px; line-height: 1.25; padding-left: 10px; position: relative; margin-top: 3px; }
.datecheck li::before { content: ""; position: absolute; left: 0; top: 4px; width: 6px; height: 6px; background: ${CRIMSON}; }
.variant-c .datecheck ul { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 10px; }
.variant-c .datecheck li { margin-top: 0; }
.dc-note { font-size: 11px; line-height: 1.25; margin-top: 4px; color: #3a342c; }
footer {
  font-size: 10px;
  line-height: 1.2;
  color: #2a241e;
  border-top: 1px solid ${INK};
  padding-top: 2px;
  white-space: nowrap;
}
`;
}

function leadCard(s) {
  const rc = region(s.region).color;
  const chip = s.chip ? `<span class="art-chip">${esc(s.chip)}</span>` : '';
  return `<article class="card lead" style="--rc:${rc}">
    <div class="art">${motif(s.motif, 'lead')}${chip}<span class="badge">${s.n}</span></div>
    <div class="copy">
      <div class="eyebrow">${esc(s.kicker)}</div>
      <h2>${esc(s.headline)}</h2>
      <p>${esc(s.detail)}</p>
      <div class="src">${esc(s.source)}</div>
    </div>
  </article>`;
}

function featureCard(s) {
  const rc = region(s.region).color;
  return `<article class="card feature" style="--rc:${rc}">
    <div class="art">${motif(s.motif, 'feature')}<span class="badge">${s.n}</span></div>
    <div class="copy">
      <div class="eyebrow">${esc(s.kicker)}</div>
      <h3>${esc(s.headline)}</h3>
      <p>${esc(s.detail)}</p>
      <div class="src">${esc(s.source)}</div>
    </div>
  </article>`;
}

function pinsHtml() {
  const pinned = [...news.leads, ...news.features].filter((s) => Array.isArray(s.pin));
  return pinned.map((s) => {
    const rc = region(s.region).color;
    const [x, y] = s.pin;
    return `<span class="pin" style="left:${x}%;top:${y}%;--rc:${rc}">${s.n}</span>`;
  }).join('');
}

function legendHtml() {
  const rows = news.regions.map((r) => `<span><i class="swatch" style="background:${r.color}"></i>${esc(r.label)}</span>`).join('');
  return `<div class="legend"><div class="legend-row">${rows}</div><p>${esc(news.labels.pinsNote)}</p></div>`;
}

function briefsHtml() {
  const items = news.briefs.map((s) => {
    return `<li><span class="num">${s.n}</span> <span class="place">${esc(s.place)}</span> — ${esc(s.line)} <span class="srcb">${esc(s.source)}</span></li>`;
  }).join('');
  const more = `${news.briefs.length} MORE STORIES`;
  return `<section class="panel briefs">
    <div class="briefs-h">${esc(news.labels.also)} · <span>${more}</span></div>
    <ol>${items}</ol>
  </section>`;
}

function dateCheckHtml() {
  const dc = news.dateCheck;
  const items = dc.items.map((item) => `<li>${esc(item)}</li>`).join('');
  return `<aside class="datecheck">
    <div class="dc-h">${esc(dc.title)}</div>
    <div class="dc-body">
      <div class="dc-kicker">${esc(dc.label)}</div>
      <div class="dc-when">${esc(dc.when)}</div>
      <ul>${items}</ul>
      <p class="dc-note">${esc(dc.note)}</p>
    </div>
  </aside>`;
}

function headerHtml() {
  const counts = Object.fromEntries(news.regions.map((r) => [r.id, 0]));
  for (const s of allStories()) counts[s.region] += 1;
  const pills = news.regions.map((r) => `<span class="pill" style="background:${r.color}">${esc(r.label)} ${counts[r.id]}</span>`).join('');
  return `<header>
    <div class="topbar">
      <div class="kicker-top">${esc(news.masthead.kicker)}</div>
      <div class="countline">${esc(news.masthead.countLine)}</div>
    </div>
    <h1>${esc(news.date.display)}</h1>
    <p class="deck">${esc(news.masthead.deck)}</p>
    <div class="rule-thin"></div>
    <div class="regions">${pills}<span class="tz">${esc(news.labels.tz)}</span></div>
  </header>`;
}

function kpisHtml() {
  const cells = news.kpis.map((k) => `<div class="kpi" style="--accent:${k.accent}"><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`).join('');
  return `<section class="kpis">${cells}</section>`;
}

function page(variant) {
  const bottom = `<section class="bottom">
    <div class="panel map-panel">
      <h3>${esc(news.labels.where)}</h3>
      <div class="map-canvas">${worldMap()}${pinsHtml()}</div>
      ${legendHtml()}
    </div>
    ${briefsHtml()}
    ${dateCheckHtml()}
  </section>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(news.date.display)} — ${variant.toUpperCase()}</title>
<style>${css()}</style>
</head>
<body class="variant-${variant}">
  <div class="page">
    <div class="bar"></div>
    <div class="wrap">
      ${headerHtml()}
      ${variant === 'b' ? kpisHtml() : ''}
      <section class="leads">${news.leads.map(leadCard).join('')}</section>
      <section class="features">${news.features.map(featureCard).join('')}</section>
      ${bottom}
      <footer>${esc(news.footer)}</footer>
    </div>
  </div>
</body>
</html>`;
}

function shoot(htmlPath, pngPath) {
  const r = spawnSync('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1024,1024',
    `--screenshot=${pngPath}`,
    `file://${htmlPath}`,
  ], { stdio: 'inherit', timeout: 60000 });
  if (r.status !== 0) throw new Error(`chrome failed for ${htmlPath}`);
}

function optimise(src, dest) {
  const py = `
from PIL import Image
im = Image.open(${JSON.stringify(src)}).convert("RGB")
w, h = im.size
if (w, h) != (1024, 1024):
    raise SystemExit(f"unexpected screenshot size {w}x{h}")
q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
q.save(${JSON.stringify(dest)}, format="PNG", optimize=True, compress_level=9)
`;
  const r = spawnSync('python3', ['-c', py], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`optimise failed for ${dest}`);
}

function main() {
  validate();
  mkdirSync(here, { recursive: true });
  for (const variant of ['a', 'b', 'c']) {
    const htmlPath = join(here, `poster-${variant}.html`);
    const shot = join('/tmp', `news-shot-${variant}.png`);
    const dest = join(root, `entry-${variant}.png`);
    writeFileSync(htmlPath, page(variant));
    shoot(htmlPath, shot);
    optimise(shot, dest);
    unlinkSync(shot);
    console.log(`wrote ${dest}`);
  }
  const chosen = news.entryVariant;
  copyFileSync(join(root, `entry-${chosen}.png`), join(root, 'entry.png'));
  console.log(`entry.png <= entry-${chosen}.png`);
  const check = spawnSync(process.execPath, [join(here, 'check.mjs')], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status ?? 1);
}

main();
