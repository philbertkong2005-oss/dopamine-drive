# Roadmap

Status: **v2a shipped, and reopened.** v1 delivered showroom, configurator, garage, compare and the
daily barn find; v2a replaced the flat SVG art with dimension-driven low-poly meshes. Judging v2a in
the live artifact on 2026-07-29 found the cars neither good-looking nor recognisable, which is
acceptance criterion (b) failing — see v2a.5 below. Direction decisions from that session are
recorded in `PLAN.md`.

---

## v1.1 — housekeeping before new features

Small, unglamorous, and much cheaper to do now than later.

- [x] ~~**Stable option IDs.**~~ Done. Builds reference options by id (`color: 'python-green'`),
      never by array position. Ids are declared per entry or derived from the name, so
      `data.js` needed no churn and new entries can pin an explicit `id`. Verified by
      inserting two colours and reversing all three option lists: saved builds keep their
      paint and price.
- [x] ~~**Schema version + migration.**~~ Done. `dd_version` in localStorage; index-based
      garages from v1 migrate to ids automatically on first load.
- [x] ~~Verify the midnight barn-find rollover~~ — confirmed 2026-07-26: the pick changed
      across midnight mid-session (Countach → McLaren F1) and became claimable again.
- [ ] **Price/trim audit.** Current CAD MSRPs are hand-curated approximations; spot-check
      against real dealer build-and-price pages.
- [ ] Mobile pass on the builder (it stacks to one column; confirm it feels right).

## Decisions needed before v2 — all resolved

- [x] **Art direction.** Resolved twice. v2a chose dimension-driven 3D meshes over per-car art;
      after that shipped and failed on recognisability, v2a.5 chose to rebuild the mesher properly
      rather than fall back to per-car overrides or abandon parametric geometry.
- [x] **What an auction is** without a currency — cut from v2 entirely and deferred to v3, where
      chips make it meaningful. The barn find already carries daily scarcity.
- [x] **v2 car roster** — ~24 cars in two batches; batch 1 named in `PLAN.md` step 13 and chosen
      for topology proof rather than price-band coverage.

---

## v2a — art pipeline ✅ shipped

Cars are generated as low-poly 3D meshes from real published dimensions, rendered by a
dependency-free canvas renderer. The builder shows a live rotatable stage; every other
surface draws a cached 2D projection of the same mesh.

- [x] `render{family,dims,shape}` on all 26 vehicles; `art` field and `art.js` retired
- [x] Six topology families (coupe/hatch/sedan/convertible/exotic/truck)
- [x] `mesh.js` — pure, deterministic, unit-testable mesh generator
- [x] `render3d.js` — per-object painter sort, flat shading, silhouette outline
- [x] Acceptance harness (`fixtures.html`) — caught four defects before integration
- [x] Persistent builder stage: option changes update it in place, rotation survives
- [x] Drag-to-rotate with inertia, `touch-action` guard, reduced-motion respected
- [x] All nine art surfaces migrated to the projection cache
- [x] Lazy cache with LRU cap, IntersectionObserver prewarm, rAF-batched generation
- [x] Bundle 103 KB against the 120 KB budget

~~Known limits, deliberately accepted: the low sports coupes still look similar to each
other, cars read as "correct proportions" rather than as *that* car, and dead nose-on /
tail-on views are featureless (no grille or lights yet). The plan's fallback —
per-car profile overrides — remains available as a polish pass.~~

**Corrected 2026-07-29.** The struck paragraph is the defect in this document. "Cars read as
*correct proportions* rather than as *that* car" is acceptance criterion (b) — recognisable against
a reference photo — **failing**, written down as an accepted limitation. The plan's fallback was
therefore never invoked, and the phase was closed. It was judged from memory because
`fixtures.html` has no reference images, and criterion (b), unlike (a), did not forbid reading the
label. v2a is reopened as v2a.5.

## v2a.5 — art rebuild ← **next**

Goal: cars that are recognisable, not merely correctly proportioned. Full defect table, steps and
acceptance rules are in `PLAN.md`.

- [ ] **Authoring tool first** — `fixtures.html` gains sliders, live re-mesh, a local
      reference-image slot and a copy-the-`shape`-block button. Not bundled, so it costs 0 KB
- [ ] **Rebuild `mesh.js`** — separate cabin volume with real A/B pillars, local wheel arches,
      8–10 point cross-sections, front/rear faces, and **wheel style wired to the mesh** (today
      `geoKey` is `[id, wing, lift]`, so the $1,200 wheel upgrade changes nothing visible)
- [ ] **Depth buffer in `render3d.js`** if measurement demands it — a cabin volume interpenetrating
      the body hull is exactly what per-object painter sorting cannot resolve
- [ ] **Rewrite `shape` for all 26 cars** — ~30 parameters each, no backward compatibility
- [ ] **Blind acceptance**: labels and marque colours hidden, Phil names each car against a
      reference image. Any car he cannot name gets a mandatory override; under 20 of 26 means the
      rebuild failed and the approach is reconsidered

## v2b — catalogue & discovery

Goal: make the catalogue feel endless and give people a reason to return daily. Three ship gates,
placed only where taste risk lives — see `PLAN.md`.

- [ ] **Stabilise the daily pick** *before* the roster grows — append-only id list, fixed epoch,
      day-index selection, per-user pin, existing claims authoritative. Not gated for review: it is
      a correctness fix with nothing to look at
- [ ] ← *v2a.5 lands here; ship 1 = stabilise + art rebuild*
- [ ] **Roster batch 1 — 4 cars**, chosen to prove topology the mesher has never built: Land Rover
      Defender 110 (`suv`), Audi RS6 Avant (`wagon`), Volkswagen ID. Buzz (`van`), Ferrari 296 GTB
      (`exotic` at its limit, and the first car above $135k)
- [ ] **Roster batch 2 — 8 cars** after batch 1 passes: same-family stress tests (Rolls-Royce Ghost
      against the M340i, Hyundai Ioniq 5 N) and the sub-$35k end the catalogue entirely lacks
- [ ] **Discovery feed** — vertical full-bleed cards, one standout feature each, cached projections
      only. Done when it scrolls steadily on Phil's own phone with a cold cache
- [ ] **Grid⇄feed toggle** over one catalogue and one filter state
- [ ] **Daily featured collections** — same scheduler as the barn find, deliberately unpinned,
      no new storage key

Cut from v2b: the daily auction (needs a currency — v3), extra fixed art angles (superseded by 3D),
and shareable build cards (promoted to its own step below).

## Next — shareable build cards

The only mechanism on this roadmap that brings new people *in*; everything else is retention. Cheap,
because the projection cache already produces the required bitmap. Deliberately sequenced after
v2a.5: sharing an ugly car is worse than not sharing.

## v3 — the optional casino

**Now sequenced after v4**, despite the number: the casino's rewards — wraps, patterns, rims,
spoilers, decor — need somewhere to be displayed, and until the garage exists they can only pile up
in a list. Numbering kept so existing references don't rot.

Strictly bonus content. **Never gates anything in the core catalogue.**

- Chips earned by building, daily visits, barn finds, feed streaks
- Blackjack → earns extra slot spins
- Slot machine: free daily spin that **always pays something** (reward size varies, never zero)
- Unlocks: exclusive wraps, patterns, non-catalogue rims and spoilers, garage decor

## v4 — the 3D garage

**Runs before v3.** Cost estimate revised down: if v2a.5 lands a depth buffer in `render3d.js`, a
simple garage space is renderable with the existing renderer. Three.js still does not fit even at
the raised 160 KB budget, so that would be a migration, not an import.

- Low-poly PS2-style garage with good modern lighting
- Your builds parked in it; decorations from v3 placed in it
- Wall colour, posters, furniture, neon — **decor stays in this product**; it serves the car
  fantasy and it is simple boxes needing no new mesher

## Separate products (no longer versions of this one)

Both share `data.js` verbatim and are emitted as their own build outputs. This is what guardrail 3
bought — and note the limit of what it bought: the commerce schema transfers, the art layer does
not, because every mesher family is a vehicle topology.

- **Plan Mode.** Same catalogue, opposite emotional register: enter income and savings rate, every
  build reports years-to-afford and the income that would make it realistic.
  `build-single-file.ps1` gains a flag and emits `dream.html` and `plan.html`. **No in-app toggle** —
  once the product contains a switch that can tell you what you cannot afford, the fantasy has a
  shadow even while the switch is off. `data.js` needs no changes; income modelling is app-layer.
- **Man cave.** Houses, furniture, gaming setups, sports facilities. Split out because the claim
  that these are "just new item types running through the same configurator" was written when art
  was cheap flat SVG. Art is now the expensive half and it is vehicle-specific: a house shares none
  of `mesh.js`'s families and needs its own mesher and its own authoring tool.

---

## Guardrails (do not break these)

1. Core catalogue is always free, instant, and ungated. No failure states.
2. Scarcity sits *on top of* abundance, never in front of it.
3. Keep the `data.js` schema generic ("configurable item"), never car-specific — Plan Mode and the
   man cave are separate products that inherit the whole catalogue from it.
4. Prices stay CAD.
5. **A failed acceptance criterion may trigger its documented fallback. It may never be rewritten
   as an accepted limitation.** This is not a general principle; it is the specific thing that
   closed v2a with unrecognisable cars and cost a whole extra phase. If a criterion fails, either
   the fallback runs or the criterion is explicitly renegotiated with Phil — silently reclassifying
   it is how a plan lies to the next person reading it.
6. **Original stylised forms only.** Published dimensions are factual and fine; manufacturers' 3D
   models, press renders, and third-party models from Sketchfab or similar are not — and parametric
   geometry is a *requirement* of the configurator, not a size optimisation, since paint, wheels,
   wings and ride height are mesh parameters.
