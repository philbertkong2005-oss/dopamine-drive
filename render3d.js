// ============================================================
// DOPAMINE DRIVE — low-poly renderer
// Dependency-free 2D-canvas 3D: perspective projection, outward
// normal culling, painter's algorithm sorted PER OBJECT (body,
// wing, each wheel) rather than per triangle, which is what keeps
// wheels from tearing through the arches.
// Flat shading + a dark silhouette pass, per the agreed style.
// ============================================================

const Render3D = (() => {

  const LIGHT = (() => {
    const v = [-0.45, 0.82, 0.36];
    const m = Math.hypot(...v);
    return v.map(c => c / m);
  })();
  const AMBIENT = 0.42;

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 0xff)},${f(n & 0xff)})`;
  }

  function darken(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
    return `#${((f(n >> 16) << 16) | (f((n >> 8) & 0xff) << 8) | f(n & 0xff)).toString(16).padStart(6, '0')}`;
  }

  // Newell's method — stable for quads that aren't perfectly planar.
  function normalOf(pts) {
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
      nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const m = Math.hypot(nx, ny, nz) || 1;
    return [nx / m, ny / m, nz / m];
  }

  function rotate(p, cy, sy, cp, sp, center) {
    const x = p[0] - center[0], y = p[1] - center[1], z = p[2] - center[2];
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    return [x1, y2, z2];
  }

  /**
   * Draw a mesh into a 2D context.
   * opts: { yaw, pitch, paint, rim, w, h, shadow }
   */
  function draw(ctx, mesh, opts) {
    const w = opts.w, h = opts.h;
    const yaw = opts.yaw ?? -0.62, pitch = opts.pitch ?? 0.20;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const center = mesh.center;
    const paint = opts.paint || '#c8102e';
    const rimCol = opts.rim || '#c9ced4';
    const outline = darken(paint, 0.30);

    // Rotate every vertex once, per object.
    const rotated = mesh.objects.map(o => o.verts.map(v => rotate(v, cy, sy, cp, sp, center)));

    // Fit from the car's own dimensions, NOT from the projected bounds at
    // this particular yaw. A per-angle fit re-zooms whenever the car turns
    // end-on, which made rotation sweeps pump wildly and would make the car
    // breathe while being dragged. Sizing off the horizontal diagonal means
    // the car always fits at every yaw at one constant scale.
    const camDist = Math.max(mesh.size.L, mesh.size.W) * 2.6 + 2.2;
    const diag = Math.hypot(mesh.size.L, mesh.size.W);
    const focal = Math.min(
      w * 0.90 / (diag / camDist),
      h * 0.82 / ((mesh.size.H * 1.9) / camDist)
    );
    const cx = w / 2;
    const ccy = h / 2 + h * 0.06;

    const project = p => {
      const s = focal / (p[2] + camDist);
      return [cx + p[0] * s, ccy - p[1] * s];
    };

    // Ground shadow, drawn first.
    if (opts.shadow !== false) {
      const groundY = -center[1];
      const corners = [
        [-mesh.size.L / 2, groundY, -mesh.size.W / 2], [mesh.size.L / 2, groundY, -mesh.size.W / 2],
        [mesh.size.L / 2, groundY, mesh.size.W / 2], [-mesh.size.L / 2, groundY, mesh.size.W / 2],
      ].map(p => project(rotate([p[0] + center[0], p[1] + center[1], p[2] + center[2]], cy, sy, cp, sp, center)));
      let sx = 0, sy2 = 0;
      for (const c of corners) { sx += c[0]; sy2 += c[1]; }
      sx /= 4; sy2 /= 4;
      let rx = 0, ry = 0;
      for (const c of corners) { rx = Math.max(rx, Math.abs(c[0] - sx)); ry = Math.max(ry, Math.abs(c[1] - sy2)); }
      // Squash the canvas rather than painting a circular gradient into an
      // ellipse: doing the latter compresses the falloff vertically and
      // leaves a visible hard crescent at the ellipse edge.
      const R = Math.max(rx, 1);
      ctx.save();
      ctx.translate(sx, sy2);
      ctx.scale(1, Math.max(ry, 2) / R);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, 'rgba(0,0,0,0.40)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.16)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Per-object visible-face collection, shaded and depth sorted.
    const drawables = [];
    mesh.objects.forEach((obj, oi) => {
      const verts = rotated[oi];
      const objCentre = [0, 0, 0];
      for (const p of verts) { objCentre[0] += p[0]; objCentre[1] += p[1]; objCentre[2] += p[2]; }
      objCentre[0] /= verts.length; objCentre[1] /= verts.length; objCentre[2] /= verts.length;

      const faces = [];
      for (const f of obj.faces) {
        const pts = f.i.map(i => verts[i]);
        let n = normalOf(pts);
        const c = [0, 0, 0];
        for (const p of pts) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }
        c[0] /= pts.length; c[1] /= pts.length; c[2] /= pts.length;

        // Force normals outward relative to the object centre, so the
        // mesher never has to guarantee consistent winding.
        const out = [c[0] - objCentre[0], c[1] - objCentre[1], c[2] - objCentre[2]];
        if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = [-n[0], -n[1], -n[2]];

        // Cull faces pointing away from the camera.
        const view = [c[0], c[1], c[2] + camDist];
        if (n[0] * view[0] + n[1] * view[1] + n[2] * view[2] > 0) continue;

        const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const k = AMBIENT + (1 - AMBIENT) * lam;

        let col;
        if (f.kind === 'glass') col = shade('#20323f', 0.75 + k * 0.7);
        else if (f.kind === 'tyre') col = shade('#15161a', 0.55 + k * 0.9);
        else if (f.kind === 'rim') col = shade(rimCol, 0.55 + k * 0.55);
        else if (f.kind === 'dark') col = shade(darken(paint, 0.45), 0.6 + k * 0.8);
        else col = shade(paint, k);

        faces.push({ pts: pts.map(project), depth: c[2], col });
      }
      if (!faces.length) return;
      faces.sort((a, b) => b.depth - a.depth);
      drawables.push({ depth: objCentre[2], faces });
    });

    drawables.sort((a, b) => b.depth - a.depth);

    const ow = Math.max(1.5, Math.min(w, h) * 0.014);
    for (const obj of drawables) {
      // Outline pass: fattened dark strokes, overdrawn by the fills below,
      // so only the object's silhouette survives.
      ctx.strokeStyle = outline;
      ctx.lineWidth = ow;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const f of obj.faces) {
        ctx.beginPath();
        ctx.moveTo(f.pts[0][0], f.pts[0][1]);
        for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i][0], f.pts[i][1]);
        ctx.closePath();
        ctx.stroke();
      }
      // Fill pass. The hairline stroke in the same colour closes
      // antialiasing seams between adjacent facets.
      for (const f of obj.faces) {
        ctx.beginPath();
        ctx.moveTo(f.pts[0][0], f.pts[0][1]);
        for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i][0], f.pts[i][1]);
        ctx.closePath();
        ctx.fillStyle = f.col;
        ctx.fill();
        ctx.strokeStyle = f.col;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
  }

  const RIMS = { five: '#9aa1a9', sport: '#868d96', mesh: '#b09a6a', steel: '#474c52' };
  const rimFor = style => RIMS[style] || RIMS.five;

  /** Render to a detached canvas and return a data URL. */
  function toDataURL(mesh, opts) {
    const dpr = opts.dpr || 1;
    const cv = document.createElement('canvas');
    cv.width = Math.round(opts.w * dpr);
    cv.height = Math.round(opts.h * dpr);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    draw(ctx, mesh, { ...opts });
    return cv.toDataURL('image/png');
  }

  return { draw, toDataURL, rimFor, darken };
})();
