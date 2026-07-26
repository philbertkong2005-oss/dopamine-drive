// ============================================================
// DOPAMINE DRIVE — 2D car art engine
// Stylized flat side-profile SVGs, parameterized by body type.
// Paint / wheels / wing swap instantly by re-render.
// ViewBox: 0 0 440 190. Car faces right. Ground at y=156.
// ============================================================

const Art = (() => {
  let uid = 0;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
    const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // ---- Body silhouettes (drawn tail-left, nose-right) ----
  // Each returns { body, cabin, hasRoof } path strings.
  const BODIES = {
    coupe: {
      body: `M 34 148
             C 22 148 18 132 22 116 C 24 108 30 104 42 100
             C 60 94 80 72 118 62
             C 150 54 196 52 228 58
             C 258 63 278 74 300 84
             C 336 92 388 98 410 106
             C 422 110 426 122 424 134 C 423 142 418 148 408 148 Z`,
      cabin: `M 126 66 C 152 58 196 56 224 61 C 248 66 264 74 282 82
              L 262 88 L 140 88 C 128 84 122 74 126 66 Z`,
      divider: 'M 212 60 L 214 88',
    },
    hatch: {
      body: `M 42 148
             C 28 148 24 130 28 106 C 30 92 36 78 52 70
             C 70 61 108 56 150 56
             C 196 56 232 60 258 70
             C 282 79 300 90 322 96
             C 356 100 392 104 408 110
             C 420 114 424 124 422 134 C 421 142 416 148 406 148 Z`,
      cabin: `M 60 74 C 76 65 110 61 148 61 C 190 61 222 65 246 74
              C 258 79 268 86 278 92 L 254 96 L 72 96 C 60 92 54 82 60 74 Z`,
      divider: 'M 96 62 L 92 96 M 216 63 L 224 96',
    },
    sedan: {
      body: `M 32 148
             C 20 148 16 132 20 116 C 22 106 30 102 46 98
             C 60 94 74 78 106 68
             C 136 59 180 56 212 60
             C 240 63 258 72 276 82
             C 288 87 322 90 366 96
             C 398 100 420 106 424 118 C 427 128 424 140 412 148 Z`,
      cabin: `M 114 71 C 140 62 182 60 210 64 C 232 67 246 74 260 82
              L 240 88 L 128 88 C 116 84 110 78 114 71 Z`,
      divider: 'M 190 62 L 192 88',
    },
    convertible: {
      body: `M 36 148
             C 24 148 20 132 24 116 C 26 106 34 102 50 100
             C 74 96 110 92 150 92
             C 154 88 158 86 166 86 L 172 92
             C 210 92 250 92 282 96
             C 320 100 388 102 410 108
             C 422 112 426 122 424 134 C 423 142 418 148 408 148 Z`,
      // windshield only
      cabin: `M 246 68 L 262 92 L 248 94 L 234 72 Z`,
      divider: '',
      openTop: true,
    },
    exotic: {
      body: `M 30 150
             C 18 150 14 136 18 122 C 20 112 28 108 44 106
             C 58 102 74 88 108 80
             C 140 72 186 68 216 72
             C 244 76 262 86 284 94
             C 320 102 380 108 406 114
             C 420 118 426 128 424 138 C 423 146 418 150 408 150 Z`,
      cabin: `M 116 82 C 144 74 186 71 212 75 C 234 79 250 87 266 93
              L 244 98 L 132 98 C 118 94 112 88 116 82 Z`,
      divider: 'M 204 73 L 208 98',
      low: true,
    },
    truck: {
      body: `M 30 148
             C 20 148 16 134 20 118 C 22 108 28 104 40 102
             L 40 84 L 148 84 L 148 66
             C 148 58 154 52 166 50
             C 190 46 226 46 248 50
             C 262 53 272 60 282 70
             C 286 76 288 80 290 84
             C 330 86 388 92 408 100
             C 420 105 426 116 424 130 C 423 140 418 148 408 148 Z`,
      cabin: `M 168 55 C 190 51 224 51 244 55 C 256 58 264 64 272 72
              L 276 82 L 176 82 C 166 76 162 62 168 55 Z`,
      divider: 'M 236 52 L 240 82',
      tall: true,
    },
  };

  const WHEEL_POS = {
    coupe: [112, 336], hatch: [110, 330], sedan: [110, 336],
    convertible: [112, 336], exotic: [110, 338], truck: [104, 340],
  };

  function wheel(cx, cy, r, style, id) {
    const rim = r * 0.62;
    let spokes = '';
    const spokeColor = style === 'steel' ? '#3c4046' : '#c9cdd2';
    if (style === 'five' || style === 'sport') {
      const n = style === 'five' ? 5 : 10;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        spokes += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * rim * 0.88}" y2="${cy + Math.sin(a) * rim * 0.88}" stroke="${spokeColor}" stroke-width="${style === 'five' ? 4.5 : 2.6}" stroke-linecap="round"/>`;
      }
    } else if (style === 'mesh') {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        spokes += `<line x1="${cx + Math.cos(a) * rim * 0.3}" y1="${cy + Math.sin(a) * rim * 0.3}" x2="${cx + Math.cos(a + 0.5) * rim * 0.9}" y2="${cy + Math.sin(a + 0.5) * rim * 0.9}" stroke="${spokeColor}" stroke-width="2" stroke-linecap="round"/>`;
      }
    } else if (style === 'steel') {
      spokes = `<circle cx="${cx}" cy="${cy}" r="${rim * 0.55}" fill="#5a6068"/>`;
    }
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#15161a"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 1.5}" fill="#232529"/>
      <circle cx="${cx}" cy="${cy}" r="${rim}" fill="url(#rim${id})"/>
      ${spokes}
      <circle cx="${cx}" cy="${cy}" r="${rim * 0.22}" fill="#9aa0a6"/>
      <circle cx="${cx}" cy="${cy}" r="${rim}" fill="none" stroke="#0e0f11" stroke-width="1.5"/>`;
  }

  /**
   * Render a car as an SVG string.
   * opts: { body, paint, wheelStyle, wing, len, className }
   */
  function car(opts) {
    const id = ++uid;
    const spec = BODIES[opts.body] || BODIES.coupe;
    const paint = opts.paint || '#c8102e';
    const dark = shade(paint, -46);
    const light = shade(paint, 34);
    const wp = WHEEL_POS[opts.body] || WHEEL_POS.coupe;
    const wr = opts.body === 'truck' ? 32 : 27;
    const wy = opts.body === 'truck' ? 148 : 152;
    const wheelStyle = opts.wheelStyle || 'five';
    const s = opts.len || 1;

    const wing = opts.wing ? (
      opts.body === 'hatch'
        ? `<path d="M 34 56 L 82 48 L 84 55 L 40 63 Z" fill="${dark}"/><rect x="54" y="57" width="5" height="10" fill="${dark}"/>`
        : `<path d="M 20 90 L 84 82 L 86 89 L 24 97 Z" fill="${dark}"/><rect x="44" y="92" width="6" height="13" fill="${dark}"/>`
    ) : '';

    const noseY = spec.low ? 112 : (spec.tall ? 94 : 106);
    const tailY = spec.tall ? 98 : (opts.body === 'hatch' ? 82 : 102);

    return `
<svg viewBox="0 0 440 190" xmlns="http://www.w3.org/2000/svg" class="${opts.className || 'car-art'}" aria-hidden="true">
  <defs>
    <linearGradient id="p${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="0.45" stop-color="${paint}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b8e6f7" stop-opacity="0.92"/>
      <stop offset="1" stop-color="#16333f"/>
    </linearGradient>
    <radialGradient id="rim${id}">
      <stop offset="0" stop-color="#eceef0"/>
      <stop offset="1" stop-color="#75797f"/>
    </radialGradient>
  </defs>
  <ellipse cx="220" cy="166" rx="${185 * s}" ry="9" fill="#000" opacity="0.32"/>
  <g transform="translate(${220 - 220 * s} ${(1 - s) * 12}) scale(${s})">
    ${wing}
    <path d="${spec.body}" fill="url(#p${id})" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${spec.cabin}" fill="url(#g${id})" stroke="${dark}" stroke-width="1.5"/>
    ${spec.divider ? `<path d="${spec.divider}" stroke="${dark}" stroke-width="1.5" fill="none" opacity="0.6"/>` : ''}
    <path d="M ${opts.body === 'truck' ? '176 86 C 174 106 174 124 176 144' : '196 92 C 194 110 194 128 196 144'}" stroke="${dark}" stroke-width="1.6" fill="none" opacity="0.5"/>
    <rect x="${opts.body === 'truck' ? 186 : 206}" y="${opts.body === 'truck' ? 94 : 102}" width="20" height="4" rx="2" fill="${dark}" opacity="0.85"/>
    <path d="M 404 ${noseY} q 16 3 14 12 l -17 -2 z" fill="#ffe9b0" stroke="#d9b95c" stroke-width="1"/>
    <path d="M 26 ${tailY} q -9 6 -5 14 l 13 -2 z" fill="#ff5a5a" stroke="#a02020" stroke-width="1"/>
    <circle cx="${wp[0]}" cy="${wy}" r="${wr + 6}" fill="#0c0d0f"/>
    <circle cx="${wp[1]}" cy="${wy}" r="${wr + 6}" fill="#0c0d0f"/>
    ${wheel(wp[0], wy, wr, wheelStyle, id)}
    ${wheel(wp[1], wy, wr, wheelStyle, id)}
  </g>
</svg>`;
  }

  return { car, shade };
})();
