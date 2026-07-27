// ============================================================
// DOPAMINE DRIVE — mesh generator
// Pure: buildMesh({family, dims, shape, wing}) -> mesh
// No DOM, no globals, no randomness. Same input, same output,
// so it can be unit-tested and rendered headlessly.
//
// Axes (metres): X longitudinal, -L/2 = nose … +L/2 = tail.
//                Y up from ground.  Z lateral, ±W/2.
// ============================================================

const Mesh = (() => {

  const lerp = (a, b, t) => a + (b - a) * t;

  // Piecewise LINEAR interpolation through [t, value] control points.
  // Linear matters: smoothstepping here rounded the hood/windscreen/roof
  // junctions into one blob and every coupe came out identical. Straight
  // segments between stations give the creases that make a car readable.
  function curve(pts, t) {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (t <= pts[i][0]) {
        const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
        const span = t1 - t0;
        return lerp(v0, v1, span === 0 ? 0 : (t - t0) / span);
      }
    }
    return pts[pts.length - 1][1];
  }

  const FAMILIES = ['coupe', 'hatch', 'sedan', 'convertible', 'exotic', 'truck'];

  // Longitudinal stations. Control points are always included so the
  // silhouette hits its defining creases exactly.
  function stationsFor(s, family) {
    const base = [0, 0.06, 0.14, s.cowl, s.roofF, 0.62, s.roofR, s.deck, 0.94, 1];
    if (family === 'truck') base.push(s.bedStart, Math.min(0.99, s.bedStart + 0.04));
    const uniq = [...new Set(base.map(v => Math.max(0, Math.min(1, v))))];
    return uniq.sort((a, b) => a - b);
  }

  // Top profile line, as a fraction of overall height.
  function topLine(s, family) {
    if (family === 'convertible') {
      // No roof: the cabin region sits at beltline, with a windscreen edge.
      return [
        [0, s.nose], [s.cowl, s.hood], [s.roofF, s.belt * 1.06],
        [s.roofR, s.belt * 1.02], [s.deck, s.tail], [1, s.tail * 0.92],
      ];
    }
    if (family === 'truck') {
      return [
        [0, s.nose], [s.cowl, s.hood], [s.roofF, s.roof], [s.roofR, s.roof],
        [s.bedStart, s.bedWall], [1, s.bedWall * 0.98],
      ];
    }
    return [
      [0, s.nose], [s.cowl, s.hood], [s.roofF, s.roof], [s.roofR, s.roof],
      [s.deck, s.tail], [1, s.tail * 0.94],
    ];
  }

  const widthLine = s => [
    [0, s.wNose], [0.25, s.wFront], [0.5, s.wMid], [0.75, s.wRear], [1, s.wTail],
  ];

  // Underbody: flat rocker, lifted slightly at each end.
  const bottomLine = s => [
    [0, s.rocker * 1.22], [0.14, s.rocker], [0.86, s.rocker], [1, s.rocker * 1.22],
  ];

  // Plan-view rounding at the extreme nose and tail. Without it the end
  // cross-sections stay full width while collapsing in height, which
  // produced a wide flat blade sticking out ahead of the car.
  function endTaper(t) {
    const e = Math.min(t, 1 - t);
    return e >= 0.07 ? 1 : 0.55 + (e / 0.07) * 0.45;
  }

  /**
   * Build one lofted hull plus wheels.
   * opts: { family, dims, shape, wing, lift }
   */
  function build(opts) {
    const family = FAMILIES.includes(opts.family) ? opts.family : 'coupe';
    const d = opts.dims, s = opts.shape;
    const L = d.length / 1000, W = d.width / 1000, H = d.height / 1000;
    const lift = opts.lift || 0;

    const top = topLine(s, family);
    const wid = widthLine(s);
    const bot = bottomLine(s);
    const stations = stationsFor(s, family);

    // Cabin region gets a narrower top edge, which is what reads as a
    // greenhouse; outside it the top edge stays broad (hood, deck).
    const inCabin = t => t >= s.cowl - 0.02 && t <= (family === 'truck' ? s.roofR : s.deck) + 0.02;

    const verts = [];
    const rings = [];   // ring[i] = 8 indices: 4 right side, 4 mirrored left

    for (const t of stations) {
      const x = -L / 2 + t * L;
      const yTop = curve(top, t) * H + lift;
      const yBot = curve(bot, t) * H + lift;
      const hw = curve(wid, t) * (W / 2) * endTaper(t);
      const cab = inCabin(t);
      // Broad across hood and deck, tucked in over the greenhouse: the
      // step between the two is what reads as a shoulder.
      const topFactor = cab ? s.cabin : 0.90;

      // Beltline, clamped to stay below the local roof so the shoulder
      // collapses gracefully over the low nose and tail.
      const yBeltRaw = s.belt * H + lift;
      const yBelt = Math.min(yBeltRaw, yTop - (yTop - yBot) * 0.12);
      const yArch = yBot + (yBelt - yBot) * 0.45;

      const ring = [];
      // Widest at the shoulder, tucked in at the arch. This is both true of
      // real cars and load-bearing here: the track is always narrower than
      // the body, so without the tuck the wheels sit inside the bodywork
      // and simply never appear.
      const profile = [
        [yBot, hw * 0.62],          // underbody / sill
        [yArch, hw * 0.84],         // arch line, inboard of the tyres
        [yBelt, hw],                // shoulder — widest point
        [yTop, hw * topFactor],     // roof or deck edge
      ];
      for (const [y, z] of profile) { ring.push(verts.length); verts.push([x, y, z]); }
      for (let i = profile.length - 1; i >= 0; i--) {
        const [y, z] = profile[i];
        ring.push(verts.length); verts.push([x, y, -z]);
      }
      rings.push(ring);
    }

    const faces = [];
    const RING = 8;

    // Loft: quad bands between consecutive rings.
    for (let r = 0; r < rings.length - 1; r++) {
      const a = rings[r], b = rings[r + 1];
      const tMid = (stations[r] + stations[r + 1]) / 2;
      for (let i = 0; i < RING; i++) {
        const j = (i + 1) % RING;
        // Band index 2 (and its mirror 5) is the upper flank; when it sits
        // inside the cabin region it is glass, which is what makes a
        // windscreen and side windows appear without extra geometry.
        const upper = (i === 2 || i === 4);
        const isGlass = upper && inCabin(tMid) && family !== 'truck';
        faces.push({ i: [a[i], a[j], b[j], b[i]], kind: isGlass ? 'glass' : 'paint' });
      }
    }

    // Caps at nose and tail.
    const first = rings[0], last = rings[rings.length - 1];
    faces.push({ i: [...first].reverse(), kind: 'paint' });
    faces.push({ i: [...last], kind: 'paint' });

    const objects = [{ name: 'body', verts, faces }];

    // Open bed for trucks: a recessed floor between the side walls.
    if (family === 'truck') {
      const bedV = [], bedF = [];
      const x0 = -L / 2 + s.bedStart * L + 0.05, x1 = L / 2 - 0.06;
      const yF = s.bedFloor * H + lift;
      const hwB = curve(wid, 0.85) * W / 2 * 0.86;
      bedV.push([x0, yF, hwB], [x1, yF, hwB], [x1, yF, -hwB], [x0, yF, -hwB]);
      bedF.push({ i: [0, 1, 2, 3], kind: 'dark' });
      objects.push({ name: 'bed', verts: bedV, faces: bedF });
    }

    // Rear wing.
    const wing = opts.wing;
    if (wing === 'high' || wing === 'lip') {
      const wv = [], wf = [];
      const xw = L / 2 - (wing === 'high' ? 0.42 : 0.24);
      const yw = curve(top, wing === 'high' ? 0.90 : 0.94) * H + lift + (wing === 'high' ? 0.30 : 0.06);
      const hww = curve(wid, 0.88) * W / 2 * 0.92;
      const dep = wing === 'high' ? 0.22 : 0.16;
      const thk = wing === 'high' ? 0.045 : 0.035;
      const box = (x0, x1, y0, y1, z0, z1) => {
        const b = wv.length;
        wv.push([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
                [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
        wf.push({ i: [b, b + 1, b + 2, b + 3], kind: 'dark' },
                { i: [b + 5, b + 4, b + 7, b + 6], kind: 'dark' },
                { i: [b + 3, b + 2, b + 6, b + 7], kind: 'dark' },
                { i: [b + 4, b + 5, b + 1, b], kind: 'dark' },
                { i: [b + 1, b + 5, b + 6, b + 2], kind: 'dark' },
                { i: [b + 4, b, b + 3, b + 7], kind: 'dark' });
      };
      box(xw - dep / 2, xw + dep / 2, yw, yw + thk, -hww, hww);
      if (wing === 'high') {
        for (const zs of [-1, 1]) {
          const z = zs * hww * 0.78;
          box(xw - 0.03, xw + 0.03, yw - 0.26, yw, z - 0.02, z + 0.02);
        }
      }
      objects.push({ name: 'wing', verts: wv, faces: wf });
    }

    // Wheels: low-poly cylinders, axis along Z.
    const rad = s.wheel / 2000;
    const halfTrack = d.track / 2000;
    const tyreW = (s.tire * d.track) / 2000;   // full tyre width, metres
    const tw = tyreW / 2;
    const frontX = -L / 2 + d.frontOverhang / 1000;
    const rearX = frontX + d.wheelbase / 1000;
    const SIDES = 12;
    const RIM = 0.54;                          // rim disc as a fraction of radius

    for (const [ax, name] of [[frontX, 'F'], [rearX, 'R']]) {
      for (const zs of [1, -1]) {
        const wv = [], wf = [];
        const zc = zs * halfTrack;
        const zo = zc + zs * tw, zi = zc - zs * tw;

        // Tread ring.
        for (let i = 0; i < SIDES; i++) {
          const a = (i / SIDES) * Math.PI * 2;
          const y = rad + Math.sin(a) * rad + lift;
          const x = ax + Math.cos(a) * rad;
          wv.push([x, y, zo], [x, y, zi]);
        }
        for (let i = 0; i < SIDES; i++) {
          const j = (i + 1) % SIDES;
          wf.push({ i: [i * 2, j * 2, j * 2 + 1, i * 2 + 1], kind: 'tyre' });
        }
        // Sidewall ring on the outer face, then the rim disc inside it.
        // Previously the rim fan covered the whole radius, which is what
        // made every wheel render as a flat white dinner plate.
        const inner = wv.length;
        for (let i = 0; i < SIDES; i++) {
          const a = (i / SIDES) * Math.PI * 2;
          wv.push([ax + Math.cos(a) * rad * RIM, rad + Math.sin(a) * rad * RIM + lift, zo]);
        }
        for (let i = 0; i < SIDES; i++) {
          const j = (i + 1) % SIDES;
          wf.push({ i: [i * 2, j * 2, inner + j, inner + i], kind: 'tyre' });
        }
        const hub = wv.length;
        wv.push([ax, rad + lift, zo]);
        for (let i = 0; i < SIDES; i++) {
          const j = (i + 1) % SIDES;
          wf.push({ i: [hub, inner + j, inner + i], kind: 'rim' });
        }
        // Inner cap. Without it the cylinder is open, and the far-side
        // wheel — seen from the inside — renders as a broken crescent.
        const back = wv.length;
        wv.push([ax, rad + lift, zi]);
        for (let i = 0; i < SIDES; i++) {
          const j = (i + 1) % SIDES;
          wf.push({ i: [back, i * 2 + 1, j * 2 + 1], kind: 'tyre' });
        }
        objects.push({ name: 'wheel' + name + (zs > 0 ? 'L' : 'R'), verts: wv, faces: wf });
      }
    }

    return { objects, size: { L, W, H }, center: [0, H / 2 + lift, 0] };
  }

  return { build, FAMILIES };
})();

if (typeof module !== 'undefined') module.exports = Mesh;
