// ============================================================
// DOPAMINE DRIVE — projection cache
// Cards never run live 3D. They show a cached 2D projection of
// the same mesh the builder rotates, so there is one source of
// truth and the two can't drift.
//
// Generation NEVER blocks a view transition and never runs
// inside scroll handling: views paint immediately with a cheap
// placeholder, an IntersectionObserver prewarms what's near the
// viewport, and work is rAF-batched one car per frame.
// ============================================================

const Projection = (() => {
  const MAX_BITMAPS = 40;

  const cache = new Map();      // sig -> dataURL. Insertion order == LRU order.
  const meshCache = new Map();  // geometry key -> mesh
  const specs = new Map();      // sig -> { spec, w, h }
  const queue = [];
  let scheduled = false;
  let observer = null;

  const SIZES = { card: [300, 172], hero: [520, 296] };
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);

  // Geometry depends only on shape-affecting inputs, so a colour change
  // reuses the mesh and only re-renders.
  const geoKey = spec => [spec.id, spec.render.wing || '', spec.render.lift || 0].join('|');

  function meshFor(spec) {
    const k = geoKey(spec);
    let m = meshCache.get(k);
    if (!m) { m = Mesh.build(spec.render); meshCache.set(k, m); }
    return m;
  }

  function placeholder(paint) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 34">` +
      `<ellipse cx="30" cy="19" rx="25" ry="8" fill="${paint}" opacity="0.30"/>` +
      `<ellipse cx="30" cy="27" rx="20" ry="3" fill="#000" opacity="0.22"/></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function trim() {
    while (cache.size > MAX_BITMAPS) cache.delete(cache.keys().next().value);
  }

  /** HTML for one vehicle image. Returns instantly, always. */
  function tag(spec, size = 'card', cls = '') {
    const [w, h] = SIZES[size] || SIZES.card;
    const sig = `${spec.sig}|${size}|${dpr()}`;
    const hit = cache.get(sig);
    if (hit) {                       // refresh LRU position
      cache.delete(sig); cache.set(sig, hit);
      return `<img class="car-art ${cls}" alt="" src="${hit}" data-ready="1">`;
    }
    specs.set(sig, { spec, w, h });
    return `<img class="car-art car-art-ph ${cls}" alt="" src="${placeholder(spec.paint)}" data-sig="${sig}">`;
  }

  function generate(img) {
    const sig = img.dataset.sig;
    const entry = specs.get(sig);
    if (!entry) return;
    let url = cache.get(sig);
    if (!url) {
      url = Render3D.toDataURL(meshFor(entry.spec), {
        w: entry.w, h: entry.h, dpr: dpr(),
        paint: entry.spec.paint, rim: entry.spec.rim,
        yaw: -0.62, pitch: 0.20,
      });
      cache.set(sig, url);
      trim();
    }
    img.src = url;
    img.dataset.ready = '1';
    img.classList.remove('car-art-ph');
  }

  function step() {
    scheduled = false;
    const img = queue.shift();
    // Skip anything detached by a view change while it was queued.
    if (img && img.isConnected && !img.dataset.ready) generate(img);
    if (queue.length) schedule();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(step);
  }

  function enqueue(img) {
    if (img.dataset.ready || queue.includes(img)) return;
    queue.push(img);
    schedule();
  }

  /**
   * Called after a view paints. Observes every placeholder and prewarms
   * the ones near the viewport. Nothing here renders synchronously.
   */
  function hydrate(root = document) {
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          observer.unobserve(e.target);
          enqueue(e.target);
        }
      }, { rootMargin: '320px' });   // prewarm distance
    }
    root.querySelectorAll('img[data-sig]:not([data-ready])').forEach(img => observer.observe(img));
  }

  /**
   * Render everything still pending, right now, on the main thread.
   * Only for cases with no frame loop to wait for — capturing the page,
   * or a tab that was loaded hidden. Never call this from scroll or from
   * a view transition; that is exactly what the queue exists to avoid.
   */
  function flush(root = document) {
    root.querySelectorAll('img[data-sig]:not([data-ready])').forEach(generate);
  }

  // A tab loaded in the background gets no rAF and no intersection
  // callbacks, so nothing is ever queued. Re-hydrate when it surfaces.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) hydrate(document);
  });

  return { tag, hydrate, flush, meshFor, SIZES };
})();
