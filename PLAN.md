# Plan: Dopamine Drive v2 — dimension-driven low-poly cars, feed, and roster expansion
_Locked via grill — by Claude + Phil. Revised after Codex review rounds 1–4.
Revised again 2026-07-29 after judging shipped v2a in the live artifact: phase v2a.5 added,
the roster staged, the dist budget raised to 160 KB, and the v2a closure record corrected._

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
   mesh as `sedan`; a shooting brake, a lifted crossover), and the man cave's non-vehicle items will have
   a `render.family` with no meaningful `body` at all. Coupling them now would be a latent bug
   that only surfaces once the roster stops being tidy.
   **Contract:** `render` is type-specific presentation metadata. The generic item schema is
   everything else (identity, trims, options, prices), and no generic consumer may read
   `render`. A man-cave house carries its own `render` shape and the commerce layer never notices.
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
    **Superseded 2026-07-29: the budget is now 160 KB.** That scope conversation happened. v2a
    shipped at ~105 KB, and v2b as scoped needs ~27–31 KB (12 cars at ~1,600 B each ≈ 19 KB, plus
    faces, feed, toggle and collections) against ~15 KB of headroom. Raising the ceiling was
    chosen over cutting content; `build-single-file.ps1` performs no minification at all, so
    stripping comments, leading indentation and CSS whitespace remains available as a ~12–18 KB
    recovery when 160 KB is reached. Note that Three.js still does not fit at 160 KB, so v4's
    garage is unaffected by this change.
11. **Ship v2a and judge against the criteria in step 5.** Phase v2b does not begin otherwise.

### Phase v2a.5 — art rebuild (added 2026-07-29, after judging v2a in the live artifact)

**Why this phase exists.** v2a was closed as shipped with criterion (b) — "each recognisable
against a reference photo by someone who knows the car" — recorded as an accepted limitation
rather than as a failure. ROADMAP's own wording, "cars read as *correct proportions* rather than
as *that* car", is criterion (b) failing stated in plain language. The documented fallback
(per-car profile overrides) was therefore never invoked. Phil's verdict on the live artifact —
the cars do not look good and are not recognisable — is the same finding reached a second time.

The cause was not the wording of the criteria. `fixtures.html` contains no reference images, so
(b) was judged from memory, which is enormously forgiving: a red wedge labelled F40 is completed
by the viewer's own knowledge of the car. Criterion (a) forbade reading the label; (b) did not,
and (b) is the one that tests likeness.

**What the mesher is actually missing**, read off the source rather than inferred:

| # | Defect | Site |
|---|---|---|
| 1 | No wheel arches — the arch-height tuck (`hw * 0.84`) runs the **entire length**, so the body reads as a tapered tube with wheels underneath rather than as a body with fenders over wheels | `mesh.js:126` |
| 2 | No greenhouse volume — glass is a `kind: 'glass'` flag on band 2 of the same hull, so there is no A-pillar, no B-pillar and no windscreen rake independent of the body. Step 3 specified "cabin as a second volume"; it was never built | `mesh.js:149` |
| 3 | Cross-section has only 4 points (sill / arch / shoulder / roof-edge) — cannot express a fender flare, a door crease, glass tumblehome, a crowned roof, or a hood below the fenders | `mesh.js:123` |
| 4 | No surface features whatsoever; the nose cap is a single flat polygon | `mesh.js:157` |
| 5 | Plan-view width uses 5 fixed control points (0/.25/.5/.75/1) decoupled from the actual stations, so every car is roughly the same ellipse from above | `mesh.js:63` |
| 6 | Triangle budget inverted — body ≈156 tris, wheels ≈288. Two thirds of the polygons are spent on 12-sided cylinders while the body that identifies the car takes a third | — |
| 7 | Wheel style is not wired to the mesh at all. `geoKey` is `[id, wing, lift]`, so the $1,200 "18-inch Matte Black" upgrade changes the price and nothing visible. A live product defect, not an art one | `projection.js:28` |

**Steps, in order:**

1. **Build the authoring tool first.** `fixtures.html` gains a car picker, sliders for every shape
   parameter, live re-mesh and re-render, a local reference-image slot (file input — no images
   enter the repo), and a button emitting the `shape` block ready to paste into `data.js`. Bundle
   cost is zero: `build-single-file.ps1` inlines only `index.html`, `styles.css` and the five JS
   files, so the harness is never shipped. 26 cars × ~30 parameters is 780 hand-authored numbers,
   and edit-save-reload is not a viable loop at that scale.
2. **Rebuild `mesh.js`** against defects 1–7: 8–10 point cross-sections, a separate cabin volume
   with real A/B pillars and independent windscreen and backlight rake, local wheel arches, front
   and rear faces (grille aperture, lamps), and wheel style as a mesh input.
3. **Escalate `render3d.js` to a depth buffer if measurement demands it.** A cabin volume that
   interpenetrates the body hull is precisely the case per-object painter sorting cannot resolve —
   the same escalation this plan already anticipated for the wheel-arch case.
4. **Rewrite `shape` for all 26 cars.** New parameter set (~30 vs 17), no backward compatibility
   and no derived defaults. A compatible extension was considered and rejected: same-family,
   similar-dimension cars (GR86 / Z / Supra) can only be pulled apart by parameters that actually
   differ per car. Cost accepted: ~4–6 hours of tuning, and every future car costs 30 authored
   numbers instead of 17 — which is why step 1 comes first.
5. **Measure the triangle count.** Expect ~444 → ~1,200. The builder renders live during drag and
   projection prewarm is budgeted at one car per frame; both are measurements, not assumptions.

**Acceptance — blind, and binding:**

- Labels and marque colours hidden. Phil names each car with the reference image beside it.
- **Per car:** any car he cannot name goes on the override list, mandatorily. A failed criterion
  may trigger the documented fallback; it may **never** be reclassified as an accepted limitation.
  That reclassification is what closed v2a prematurely, and it is now forbidden by name.
- **In aggregate:** fewer than 20 of 26 named correctly means the rebuild itself failed — stop and
  reconsider the approach rather than hand-authoring 20 overrides.
- The two surviving v2a criteria still apply: cars distinguishable from each other without reading
  the label, and no geometry artefacts anywhere in the rotation sweep.
- Batch 1's four new cars join the same test once added (30 cars, threshold scaled).

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
13. **Expand the roster to ~24 cars, in two batches.** Staged for the same reason v2a was staged:
    the rebuilt mesher has never meshed an upright SUV, a long-roof estate or a one-box van, and
    finding that out on 4 cars is cheaper than on 12. Batch 1's selection criterion is therefore
    **topology proof, not price-band coverage** — every entry must prove a family the mesher has
    not built:

    | Car | Proves | Region | ~CAD |
    |---|---|---|---|
    | Land Rover Defender 110 | `suv` — boxy, tall, vertical tail | UK | 85,000 |
    | Audi RS6 Avant | `wagon` — long roof, D-pillar carried to the tail | DE | 145,000 |
    | Volkswagen ID. Buzz | `van` — one-box, no bonnet, front axle ahead of the driver | DE | 75,000 |
    | Ferrari 296 GTB | `exotic` at its limit — very low nose, cab-forward, heavy intakes. Also lifts the price ceiling from $135k, where the catalogue currently stops | IT | 450,000 |

    Batch 2 (8 cars, after batch 1 passes acceptance) carries the stress tests and the coverage
    gaps deliberately deferred: same-family extremes (Rolls-Royce Ghost against the M340i, Hyundai
    Ioniq 5 N), and the sub-$35k end the catalogue completely lacks — which matters more to Plan
    Mode than to Dream Mode, since nothing in the catalogue today is a car an ordinary person
    actually buys. Prices are hand-curated approximations, checked against published MSRPs at
    authoring time; dealer sites are not scraped. Each new car arrives with `render` populated, so
    art is never a retrofit.
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

Added 2026-07-29:

- **Art before roster, again.** The generic art work moved ahead of the roster for the same reason
  the art pipeline preceded it in v2a: it is shared machinery, so 12 cars added afterwards inherit
  it for free and `fixtures.html` is audited once rather than twice. Then the art step grew from a
  face pass into the whole of v2a.5, which only strengthened the ordering.
- **Three ship gates, placed on taste risk only.** Ship 1: stabilise + v2a.5 (Phil approves the
  visual direction before 4 more cars inherit it). Ship 2: batch 1 (nothing to gate — the roster's
  risk is spent in the veto conversation, not at build time). Ship 3: feed + toggle + collections
  (scroll-tested on Phil's own phone; a feed with no way to reach it is not a coherent release).
  Stabilising the daily pick is deliberately not gated: it is a correctness fix proved by a
  date-sweep harness, and there is nothing to look at.
- **Downloaded 3D models rejected.** Sketchfab and equivalents were considered. Licensing is the
  weaker objection (an uploader cannot grant rights they lack, a CC0-tagged 911 still carries
  Porsche trade dress, and many free car models are ripped from games). The decisive objection is
  architectural: 24 cars decimated to 2,000 triangles with no textures is ~360 KB against a 160 KB
  budget, the artifact CSP blocks every external host so nothing can be CDN-loaded, and — fatally —
  a downloaded model is a *static asset* with baked materials and welded wheels, while this is a
  configurator whose paint, wheels, wings and ride height are mesh *parameters*. Parametric
  geometry is not merely a size optimisation; it is what makes the builder work at all. Revisit
  only at v4, where the answer will likely still be original modelling.
- **Plan Mode: one source, two build outputs, no in-app toggle.** `build-single-file.ps1` gains a
  flag and emits `dream.html` and `plan.html` as separate artifacts. `data.js`, `mesh.js` and
  `render3d.js` are shared verbatim, so nothing duplicates and nothing drifts. An in-app toggle was
  rejected on guardrail 1: once the product contains a switch that can tell you what you cannot
  afford, the fantasy has a shadow even while the switch is off. Note that `data.js` already needs
  no changes for Plan Mode — income and years-to-afford are app-layer concerns, and prices and
  trims are already in the schema. Guardrail 3 has paid for itself here.
- **Man cave split off as a third product.** ROADMAP's claim that houses and PCs are "just new item
  types running through the same configurator" was written when art was cheap flat SVG. Art is now
  the expensive half and it is vehicle-specific: every one of the mesher's families is a vehicle
  topology (cowl, beltline, greenhouse, wheel arches, track), and a house uses none of them. The
  schema reuse is real in the commerce layer and false in the art layer, which is where the work
  now lives. v4's garage decor — wall colour, posters, neon, a little furniture — stays in this
  product: it serves the car fantasy, and it is simple boxes needing no new mesher.
- **Share cards before the garage, garage before the casino.** Shareable build cards were in
  ROADMAP's v2b and were cut from this plan; they are reinstated as the first post-v2b step. They
  are the only mechanism on the entire roadmap that brings new people in — barn find, collections,
  casino and garage are all retention. They are also cheap (the projection cache already produces
  the required bitmap) and only worth doing *after* v2a.5, since sharing an ugly car is worse than
  not sharing. The garage then precedes the casino because the casino's rewards — wraps, rims,
  spoilers, decor — need somewhere to be displayed, and because v2a.5's depth buffer, if it lands,
  makes a simple garage space renderable without Three.js.

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
- Shareable build cards (first step after v2b, not part of it).
- The 3D garage environment and its decor (v4 — decor stays in this product).
- Man-cave expansion: houses, PCs, gaming setups. **Now a separate product**, sharing the commerce
  schema but with its own mesher and its own build output — no longer this product's v5.
- Plan Mode income modelling. **Now a separate build output** from this same source tree, not a
  mode inside the app.
- Accounts, backend, sharing infrastructure. Storage remains localStorage.
- Scraping dealer sites for prices or specs; licensed data feeds.
- Downloaded or licensed 3D car models from any source, Sketchfab included. See the decision note
  above; parametric geometry is a requirement of the configurator, not a size optimisation.
