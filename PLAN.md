# Plan: Dopamine Drive v2 — dimension-driven low-poly cars, feed, and roster expansion
_Locked via grill — by Claude + Phil. Revised after Codex review rounds 1–4._

## Goal

v2 makes the catalogue worth exploring. Cars stop being one shared silhouette per body type
and become individually recognisable, generated from real published dimensions as low-poly 3D
meshes that the user can drag to rotate. The catalogue roughly doubles to ~24 cars, and gains a
scrollable discovery feed that shares one catalogue and one filter state with the existing grid.
The riskiest piece — whether dimension-driven meshes actually look good — is proven on the
existing 12 cars and 14 barn-find classics, against explicit pass/fail criteria, before any new
car data is written.

Non-goal: v2 adds no new daily mechanic beyond a curated featured collection. The barn find
remains the return hook; auctions move to v3 where a currency exists to make them meaningful.

## Approach

### Phase v2a — prove the art pipeline (no new cars, no feed)

1. **Add a `render` block to each of the 12 existing cars *and* the 14 barn-find classics**
   in `data.js` — 26 entries in total. The classics are included in v2a, not deferred, because
   step 8 deletes `art.js` and the barn-find surfaces cannot be left on a removed API. Holding
   `family` (the meshing topology — see step 2), `dims` (length, width, height, wheelbase,
   front overhang, rear overhang, track) and `shape` (roofline peak position and height,
   greenhouse taper, beltline, nose rake, tail rake, arch radius, ride height). Dimensions are
   hand-curated from published manufacturer specs; shape parameters are authored.
   **`render.family` is explicit and independent of `body`.** The existing `body` field is
   catalogue taxonomy — it drives filters and user-facing labels — and must not be reused as
   render topology. Across the current 12 cars the two happen to coincide exactly, and every
   car maps cleanly onto one of the six families in step 2; the fields are nonetheless kept
   separate because they answer different questions and divergence is predictable rather than
   hypothetical. Taxonomy follows marketing (a "four-door coupe" filters as `coupe` but must
   mesh as `sedan`; a shooting brake, a lifted crossover), and v5's non-vehicle items will have
   a `render.family` with no meaningful `body` at all. Coupling them now would be a latent bug
   that only surfaces once the roster stops being tidy.
   **Contract:** `render` is type-specific presentation metadata. The generic item schema is
   everything else (identity, trims, options, prices), and no generic consumer may read
   `render`. A v5 house carries its own `render` shape and the commerce layer never notices.
2. **Define topology families**, not one universal mesher: `coupe`, `hatch`, `sedan`,
   `convertible` (no roof), `exotic` (cab-forward, rear-engine proportions), `truck`
   (separate cab and bed). All families share one parameter schema; each has its own meshing
   rules. This mirrors how `BODIES` already works in 2D and is the main defence against every
   car looking alike.
3. **Write `mesh.js`** — a pure function from `{family, dims, shape}` to a low-poly mesh.
   Body lofted from ~8 cross-sections; cabin as a second volume; wheels as low-poly cylinders
   placed from wheelbase and track. Target 200–400 triangles per car. Deterministic and
   side-effect free, so it can be unit-tested and rendered headlessly.
4. **Write `render3d.js`** — dependency-free canvas renderer: perspective projection, backface
   culling, painter's-algorithm sort **per object, not per triangle** (body, cabin, each wheel
   sorted as units) to avoid interpenetration artefacts at the wheel arches; flat shading from
   one directional light plus ambient; dark outline pass. If per-object sorting proves
   insufficient, escalate to a per-pixel depth buffer — decided during v2a, not assumed now.
5. **Build the acceptance harness before the builder work.** A fixture page renders all 26
   meshes side by side at card size and hero size, plus a scripted rotation sweep per mesh —
   the sweep drives `render3d.js` directly and does not depend on the builder UI, so criterion
   (c) is testable at this step rather than only after step 7. Pass criteria, agreed with Phil
   before proceeding: (a) cars distinguishable from each other at card size without reading the
   label; (b) each recognisable against a reference photo by someone who knows the car;
   (c) no geometry artefacts anywhere in the rotation sweep. **Fallback if this fails:** families gain
   optional per-car profile overrides — a hand-authored cross-section set for the cars that
   need it — before the approach is abandoned.
6. **Make the builder stage persistent.** `renderBuild` currently rebuilds `main.innerHTML`
   wholesale, which would destroy the canvas, its pointer capture and its rotation state on
   every option click. Split the builder into a persistent stage element owning a renderer
   instance, and a separately-rendered options panel. Option changes call
   `stage.update({paint, wheelStyle, ...})` in place; only the panel re-renders.
7. **Wire drag-to-rotate**: pointer events with eased inertia, clamped pitch, unclamped yaw,
   `touch-action` set so vertical page scroll is never hijacked, and inertia disabled under
   `prefers-reduced-motion`.
8. **Migrate every art surface.** There are nine `Art.car`/`artFor` callsites, not three:
   | Surface | Location | v2a treatment |
   |---|---|---|
   | Showroom grid card | `app.js:224` | cached 2D projection |
   | Builder stage | `app.js:268` | live 3D, persistent canvas |
   | Finish-build modal | `app.js:369` | cached 2D projection |
   | Barn-find modal art | `app.js:410` | cached 2D projection |
   | Garage build card | `app.js:421` | cached 2D projection |
   | Compare slot (garage build) | `app.js:484` | cached 2D projection |
   | Compare slot (stock trim) | `app.js:490` | cached 2D projection |
   | Barn-find stage | `app.js:572` | cached 2D projection |
   | `artFor` helper itself | `app.js:158` | re-pointed at the projection cache |
   `art.js` is deleted only once all nine are migrated and the dead `art.height` / `art.round`
   fields are stripped.
9. **Projection cache.** Entries keyed by full visual signature — `carId`, family, colour id,
   wheel id, any visually-significant package ids (aero kits, wings, ride-height packs),
   target size bucket and device pixel ratio. Bounded by an LRU cap (target ≤ 40 bitmaps) so a
   24-car catalogue cannot balloon memory.
   **Generation must never run synchronously inside scroll-driven UI.** Meshing plus projection
   on a cache miss is exactly the work that would stutter a scrolling feed, and the app already
   renders whole views synchronously. Therefore: an `IntersectionObserver` prewarms visible and
   next-N items, generation is scheduled off the critical path (idle callback, rAF-batched, one
   car per frame), and a miss renders a cheap placeholder — the car's paint colour as a blurred
   block — that swaps to the real bitmap when ready.
   **View transitions are never blocked on projection work.** `go()` currently commits a view
   synchronously and immediately, and that stays true: the view paints at once with placeholders
   for any uncached car, and above-the-fold projections are generated *after* first paint under
   the same per-frame budget, nearest-to-viewport first. Prewarming is an optimisation that runs
   behind the UI, never a gate in front of it.
10. **Hold a `dist` size budget of 120 KB.** Current bundle is ~71 KB; the renderer, mesher and
    render data must fit the remainder, offset by deleting `art.js`. Exceeding it forces a
    scope conversation, not a silent bloat.
11. **Ship v2a and judge against the criteria in step 5.** Phase v2b does not begin otherwise.

### Phase v2b — catalogue and discovery

12. **Stabilise daily picks before the roster grows.** `todaysBarnFind` is currently
    `BARNFINDS[hash(date) % BARNFINDS.length]`, so appending classics silently changes what
    "today" resolves to for everyone mid-day. Replace with: an append-only ordered id list, a
    fixed epoch date, selection by day-index rather than array length, and — decisively — the
    resolved pick pinned per user in storage as `dd_barn_pick_<date>`, so a deploy can never
    change a car someone is already looking at. Featured collections share the *scheduler* but
    deliberately not the pinning — see step 17.
    **Reconcile with existing claim state on first load for a date.** `claims[<date>]` already
    stores the claimed car's id (`app.js:594`), so a user who claimed under the old resolver
    would otherwise see a pinned pick that disagrees with what they claimed. Resolution order:
    if `dd_barn_pick_<date>` exists, use it; else if `claims[<date>]` exists, seed the pin from
    that claimed id; else resolve fresh and persist. The claim record is authoritative over the
    scheduler, so no user can be shown a car they did not claim on a day they already claimed.
13. **Expand the roster to ~24 cars.** Claude proposes a spread across price bands, body types
    and regions; Phil vetoes and swaps. Each new car arrives with `render` populated, so art is
    never a retrofit.
14. **Build the feed** — vertical scrolling full-bleed cards, each surfacing one standout
    feature and a direct "Build it" action. Cards use cached projections, never live 3D.
15. **Add a grid⇄feed view toggle** over one shared catalogue and one shared filter state,
    persisted alongside the existing localStorage keys.
16. **Add daily featured collections** — 3–5 themed cars, chosen by the same append-only,
    day-index *scheduler* as the barn find, but **deliberately without per-user pinning**.
    Nothing in a collection is claimable, so if a deploy shifts today's theme the only
    consequence is that a heading changes — cosmetic, not a correctness bug. Pinning would cost
    a second storage key holding an ordered id list and buy no integrity. The barn find is
    pinned precisely because it *is* claimable and its claim record can desync; collections have
    no such record. Net new persisted state for this step: none. Nothing claimable, no failure
    state.

## Key decisions & tradeoffs

- **One mesh, two presentations.** A single mesh per car is the source of truth: the builder
  renders it live and rotatable, every other surface draws a cached 2D projection of the same
  mesh. Rejected: live 3D in the feed (mobile cost), and separate 2D/3D art (they drift).
- **Custom renderer over Three.js.** The project is zero-dependency and ships as a single file
  inside a strict no-external-scripts sandbox; inlining Three.js would push it toward 1 MB.
  Accepted cost: likely revisited when v4's garage wants real lighting, possibly as a migration.
- **Topology families over one universal mesher.** A single lofted-body function cannot express
  a pickup bed or a roofless convertible without either brittle geometry or samey output.
- **Render metadata colocated but namespaced.** Codex proposed a separate `carArtById` side
  map to protect the generic-item contract. Accepted the concern, rejected that fix: a side map
  introduces a second structure to keep in sync and a new failure mode (item with no art entry).
  A namespaced `render` key with an explicit "generic consumers must not read this" contract
  achieves the same isolation while keeping one editable place per car.
- **Art pipeline before roster.** Inverts "quantity first" deliberately: adding 24 cars on the
  old schema would turn art into a 42-entry retrofit with a migration — the exact problem the
  stable-ID work just eliminated. Cost: catalogue stays at 12 longer.
- **Auctions cut from v2.** Without a currency an auction is theatre or a soft failure state,
  and the barn find already delivers daily scarcity. Accepted: v2 adds no new return mechanic.
- **Dimensions curated, not scraped.** Published specs are factual and freely usable;
  manufacturers' 3D models and press renders are not. Forms are original and stylised.
- **Flat shading with outlines.** The outline is load-bearing: it keeps cars legible at card
  size and forgives rough geometry. Slight tension with a strictly PS2-authentic v4 garage.

## Risks / open questions

- **The core bet: will the parameter set produce recognisably different cars?** Mitigated by
  topology families, by the step-5 harness answering it before 24 cars depend on it, and by a
  named fallback (per-car profile overrides). Still the single largest risk.
- **Per-object depth sorting may be insufficient** where wheels meet arches; escalation to a
  depth buffer is planned but unproven.
- **Cache invalidation** must cover every visually significant input; a missed one silently
  shows a stale car. Mitigated by deriving the key from an explicit visual-signature function
  with a unit test.
- **Placeholder churn.** If prewarming lags scrolling on a slow device, the feed degrades into
  coloured blocks. Needs a measured prewarm distance, and generation cheap enough that a
  mid-range phone keeps up — a v2a measurement, not an assumption.
- **Hand-entered dimensions have no automated check** — a wrong number yields a subtly wrong
  car. The fixture gallery is the only detection mechanism.
- **Touch drag versus page scroll** must be resolved carefully with a scrolling feed on the
  same site.
- **Persistent-stage refactor touches the busiest render path** in the app; the existing
  price-ticker and swap animations must survive it.
- Saved garages should be unaffected (builds persist ids, never art), but this must be
  verified, including a legacy pre-id garage, not assumed.

## Out of scope

- Chips, blackjack, slot machine, unlockable wraps and parts (v3).
- Auctions in any form (v3).
- The 3D garage environment, decorations, furniture (v4).
- Man-cave expansion: houses, PCs, gaming setups (v5).
- Plan Mode income modelling (sibling product).
- Accounts, backend, sharing infrastructure. Storage remains localStorage.
- Scraping dealer sites for prices or specs; licensed data feeds.
