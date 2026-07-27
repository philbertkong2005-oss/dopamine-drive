# Roadmap

Status: **v1 shipped** — showroom, configurator, garage, compare, daily barn find.

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

## Decisions needed before v2

- [ ] **Art direction.** Every coupe shares one silhouette today — fine at 12 cars, weak in
      a 40-car feed. Either keep generic silhouettes and scale fast, or invest in
      per-car recognisable art plus the planned multi-angle views. *Decide before writing
      more car data.*
- [ ] **What an auction is** without a currency (chips arrive in v3). Leaning: a timed free
      claim with bidding drama, no economy.
- [ ] **v2 car roster** — which cars get added.

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

Known limits, deliberately accepted: the low sports coupes still look similar to each
other, cars read as "correct proportions" rather than as *that* car, and dead nose-on /
tail-on views are featureless (no grille or lights yet). The plan's fallback —
per-car profile overrides — remains available as a polish pass.

## v2b — discovery & rotation

Goal: make the catalogue feel endless and give people a reason to return daily.

- Swipeable/scrollable **discovery feed** surfacing one standout feature per car
- **Daily auction** closing at midnight, alongside the barn find
- Roster expansion to ~30–40 cars
- More car-art angles (front ¾, rear ¾) per the art-direction decision
- Shareable build cards — the "look at my build" growth loop

## v3 — the optional casino

Strictly bonus content. **Never gates anything in the core catalogue.**

- Chips earned by building, daily visits, barn finds, feed streaks
- Blackjack → earns extra slot spins
- Slot machine: free daily spin that **always pays something** (reward size varies, never zero)
- Unlocks: exclusive wraps, patterns, non-catalogue rims and spoilers, garage decor

## v4 — the 3D garage

- Low-poly PS2-style garage (Three.js) with good modern lighting
- Your builds parked in it; decorations from v3 placed in it
- Wall colour, posters, furniture, neon

## v5 — man cave / dream build

The generic item schema pays off here: houses, furniture, gaming setups, sports facilities
are just new item types running through the same configurator.

## Plan Mode (sibling product)

Same catalogue, opposite emotional register. Enter income and savings rate; every build
reports "years to afford" and the income that would make it realistic. Dream Mode is
escapism, Plan Mode turns the fantasy into a goal.

---

## Guardrails (do not break these)

1. Core catalogue is always free, instant, and ungated. No failure states.
2. Scarcity sits *on top of* abundance, never in front of it.
3. Keep the `data.js` schema generic ("configurable item"), never car-specific — v5 and
   Plan Mode both depend on it.
4. Prices stay CAD.
