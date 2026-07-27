# Plan Review Log: Dopamine Drive v2

Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

## Act 1 — decisions settled during the grill

| Question | Decision |
|---|---|
| Endlessness via quantity or depth? | Quantity-first sequencing accepted, on condition the art layer is additive so it never becomes a retrofit |
| Art pipeline before or after roster? | Before — art layer first, then cars |
| Auctions without a currency? | Cut from v2, deferred to v3 |
| Feed or better browsing? | Both — grid⇄feed toggle over one catalogue and one filter state |
| Roster ownership | Claude proposes, Phil vetoes |
| Roster size | ~24 cars |
| Daily featured collection | Included (date-hashed, curated, no new state) |
| Angles per car | Superseded — 3D gives infinite angles |
| Art source | Real published dimensions, original stylised forms (no lifted IP) |
| 2D or 3D | One dimension-driven low-poly mesh; cached 2D projection in cards, live 3D in builder |
| Renderer | Tiny custom canvas renderer, zero dependencies |
| Builder interaction | Drag to rotate |
| Staging | v2a proves the renderer on the existing 12 before any new car data |
| Barn-find classics | Included in the 3D treatment |
| Visual style | Flat-shaded facets with dark outlines |

Claude pushed back on three points during the grill: quantity-first (accepted with an
additive-art-layer condition), scraping specs (redirected to hand curation, as with prices),
and lifting manufacturer 3D models (redirected to original stylised forms). The 24×3-angle
combination was retired when the 3D decision made fixed angles unnecessary.

## Round 1 — Codex

**Findings**

- High: Adding `dims` and `shape` directly into the canonical `data.js` schema hard-breaks the repo’s own “generic configurable item” contract, so v2 would fork the data model away from the planned v5/man-cave reuse path ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:20>), [README.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/README.md:28>), [ROADMAP.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/ROADMAP.md:78>)). Fix: keep `data.js` generic and put vehicle-only render metadata in a separate `carArtById`/`vehicleMetaById` map.

- High: Step 7 says retire `art.js`, but the current app renders car art in showroom, builder, garage, compare, barn-find, and modal paths, while the plan only explicitly replaces builder/grid/feed, so half the app is left on a deleted API ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:41>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:158>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:388>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:493>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:556>)). Fix: define a full render-surface migration matrix and do not remove `art.js` until every `Art.car` callsite is replaced or shimmed.

- High: Live drag 3D does not fit the current builder architecture, which recreates `main.innerHTML` and the entire stage on every option change; that will reset pointer capture, yaw/pitch, and inertia whenever paint/wheels/packages change ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:35>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:257>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:325>), [styles.css](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/styles.css:184>)). Fix: make the 3D stage a persistent canvas/controller instance and update its config in place instead of rerendering the whole builder DOM.

- High: Phase 10 plus Phase 13 will make daily picks unstable, because the current barn-find algorithm is `hash(date) % BARNFINDS.length`; adding/reordering entries will silently change “today’s” result on deploy day, and the same flaw will hit featured collections if you reuse it ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:50>), [PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:55>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:173>)). Fix: switch daily picks to a versioned, append-only schedule or a salted stable ID list that is independent of array length/order.

- Medium-High: The proposed cache key `carId + paint + wheelStyle` is already wrong for the current data: wheel IDs encode visibly different sizes/styles, some packages imply visible aero or ride-height changes, and the card surface is responsive so a single bitmap size will blur or waste memory ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:38>), [PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:94>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:176>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:251>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:278>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:305>), [styles.css](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/styles.css:146>)). Fix: key cache entries by full visual signature (`carId`, topology/trim, color id, wheel id, visual package ids, target size, DPR) and enforce an LRU memory cap.

- Medium-High: “No per-car special-casing” is the wrong abstraction boundary for this roster; a single mesher is being asked to cover convertibles, sedans, rear-engine exotics, trucks, and classics, which is how you get either samey outputs or brittle geometry ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:28>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:38>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:210>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:261>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:290>)). Fix: allow a small set of topology families with a shared parameter schema and family-specific meshing rules.

- Medium: v2a is supposed to “ship and judge,” but there is no acceptance harness, no fallback path if recognisability fails, and no artifact budget even though bundle size is central to the renderer decision; the current inlined build is already about 72.5 KB, so “70 KB single file” is not real headroom ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:43>), [PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:65>), [README.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/README.md:8>), [build-single-file.ps1](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/build-single-file.ps1:44>)). Fix: add a 12-car fixture gallery with screenshot diffs, explicit recognisability pass/fail criteria, and a hard `dist` size budget before live rotation work starts.

VERDICT: REVISE
### Claude's response — round 1

Verified all three "High" structural claims against the code before acting. All three were real:
`Art.car`/`artFor` has **nine** callsites (app.js:158, 224, 268, 369, 410, 421, 484, 490, 572),
not the three the plan covered; `renderBuild` does rebuild `main.innerHTML` wholesale (app.js:265);
and `todaysBarnFind` is `BARNFINDS[h % BARNFINDS.length]` (app.js:177), unstable under append.

**Accepted in full (6 of 7):**
- Nine-surface migration matrix added; `art.js` deleted only after all nine migrate.
- Builder split into a persistent stage owning the renderer instance, plus a separately
  rendered options panel; option changes call `stage.update()` in place.
- Daily picks stabilised: append-only id list, fixed epoch, day-index selection, and the
  resolved pick pinned per user as `dd_barn_pick_<date>` so a deploy cannot change a car
  someone is already looking at. Featured collections use this from the start.
- Cache key widened to a full visual signature (car, family, colour, wheel, visually
  significant packages, size bucket, DPR) with an LRU cap of ~40 bitmaps.
- Topology families (coupe/hatch/sedan/convertible/exotic/truck) with a shared parameter
  schema replace the "one mesher, no special-casing" rule.
- Acceptance harness added *before* builder work: 12-car fixture gallery, three explicit
  pass criteria, a named fallback (per-car profile overrides), and a hard 120 KB dist budget.

Also adopted unprompted: per-object rather than per-triangle depth sorting, since the
painter's algorithm will otherwise fail where wheels meet arches.

**Partially rejected (1 of 7):** the proposal to move render metadata into a separate
`carArtById` side map. The *concern* is right and is now addressed — vehicle geometry must not
contaminate the generic item contract. The *fix* is not: a side map adds a second structure to
keep in sync and a new failure mode (item with no art entry). Instead the metadata stays
colocated under a namespaced `render` key with an explicit contract that no generic consumer
reads it, so a v5 house carries its own `render` and the commerce layer never notices. Same
isolation, one editable place per item.

Correction accepted on the bundle figure: the plan said "70 KB"; the real build output is
70.8 KB and Codex measured ~72.5 KB. Replaced the vague claim with a hard 120 KB budget.

## Round 2 — Codex

Most of the first-round issues are addressed: the plan now covers the builder lifecycle problem, the `Art.car` migration surface area, cache-key completeness, daily-pick stability, topology families, and explicit v2a acceptance criteria. The remaining problems are narrower, but I still wouldn’t implement this draft as-is.

1. Medium-High: The new daily-pick pinning scheme does not account for existing `dd_claims` state, so a deploy can still desync “today’s pinned car” from “today’s claimed car” for users who already claimed under the old resolver ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:82>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:559>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:594>)). Fix: on first load for a date, seed `dd_barn_pick_<date>` from an existing claim for that date if present, otherwise resolve once and persist both pick and claim state consistently.

2. Medium: The schema is still ambiguous about where render topology actually lives: step 3 requires `{family, dims, shape}`, but step 1 only adds `render.dims` and `render.shape`, which leaves `family` implicitly coupled to the current user-facing `body` field ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:20>), [PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:33>), [data.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/data.js:12>)). Fix: add an explicit `render.family` field and treat `body` as catalogue/filter taxonomy only.

3. Medium: The projection-cache plan bounds memory but not jank; with a 40-bitmap LRU, cache misses in the new feed/grid will still do mesh+projection work on the main thread during scroll, which is exactly where this app currently does synchronous full-view rendering ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:71>), [PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:93>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:204>)). Fix: make projection generation asynchronous/prewarmed for above-the-fold items and show placeholders on miss instead of rendering projections synchronously inside scroll-driven UI.

VERDICT: REVISE
### Claude's response — round 2

All three accepted; no rejections this round.

1. **Claim/pin desync** — verified `claims[<date>]` stores the claimed car id (app.js:594).
   Added an explicit resolution order: pin wins, else seed the pin from an existing claim for
   that date, else resolve fresh and persist. The claim record is authoritative over the
   scheduler, so nobody is shown a car they didn't claim on a day they already claimed.
2. **`family` ambiguity** — real spec gap: step 3 consumed `{family, dims, shape}` while step 1
   only defined `dims` and `shape`, leaving topology implicitly coupled to the user-facing
   `body` filter field. `render.family` is now explicit, with `body` documented as catalogue
   taxonomy only, and a note that the two legitimately disagree (the 911 filters as `exotic`
   but is topologically its own thing).
3. **Scroll jank on cache miss** — bounding memory was not the same as bounding jank, correct.
   Generation is now off the critical path: IntersectionObserver prewarm of visible and next-N
   items, rAF-batched at one car per frame, cheap paint-coloured placeholder on miss, and
   above-the-fold prewarmed before first paint. Added the corresponding risk: if prewarm lags
   scroll on a slow device the feed degrades to coloured blocks, so prewarm distance and
   generation cost are v2a measurements rather than assumptions.

## Round 3 — Codex

The last-round findings are mostly closed: `render.family` is now explicit, the old-claim/daily-pin mismatch is addressed, and the projection-cache plan now explicitly avoids synchronous miss generation in scroll paths.

Remaining material issues:

1. Medium: The plan contradicts itself on topology: step 2 defines six families, but step 1 says “the 911 is filtered `exotic` but is topologically its own thing,” which implies either a seventh family or ad hoc exceptions ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:20>), [PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:32>)). Fix: either add the extra family explicitly or rewrite the example so every car maps cleanly into the enumerated family set.

2. Medium: Step 9 says generation is off the critical path, but then says above-the-fold items are “prewarmed before the view is shown,” which reintroduces synchronous navigation jank in an app whose view transitions are currently immediate and full-rendered ([PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:79>), [PLAN.md](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:84>), [app.js](</C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/app.js:195>)). Fix: commit the view immediately with placeholders, then prewarm above-the-fold projections after paint under a strict per-frame budget.

VERDICT: REVISE
### Claude's response — round 3

Both accepted; both were self-contradictions in the plan's own prose rather than design flaws.

1. **Topology contradiction** — checked the data: all 12 cars map 1:1 onto the six families
   (convertible×1, coupe×4, hatch×3, sedan×1, exotic×2, truck×1). The "911 is topologically its
   own thing" line was simply wrong and implied a phantom seventh family. Rewritten: the two
   fields coincide exactly today and every car maps cleanly, but they stay separate because
   divergence is predictable — a four-door coupe filters `coupe` and must mesh `sedan`, and v5
   items will have a `render.family` with no meaningful `body` at all.
2. **Prewarm gating navigation** — correct, and it contradicted the sentence above it. `go()`
   commits views synchronously today and will continue to. The view now paints immediately with
   placeholders, and above-the-fold projections generate *after* first paint, nearest-to-viewport
   first, under the same per-frame budget. Prewarming runs behind the UI, never in front of it.

## Round 4 — Codex

The previous findings are addressed: the family/body contradiction is gone, and the projection-cache work is now clearly off the view-transition path.

1. Medium: The featured-collection persistence story is still internally inconsistent: step 12 says featured collections use the same deploy-stable mechanism as barn picks, but step 17 says there is “no new persisted state beyond the pinned pick,” and a 3-5 car collection cannot be deploy-stable per user with only a single pinned-pick key ([PLAN.md](/C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:102), [PLAN.md](/C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:123)). Fix: add a per-date collection pin key that stores the ordered featured car IDs, or explicitly drop per-user pinning for featured collections and accept that they may drift on deploy.

VERDICT: REVISE
### Claude's response — round 4

Finding accepted; took Codex's *second* offered branch rather than its first.

**Featured-collection persistence** — the inconsistency was real (step 12 promised the same
deploy-stable mechanism, step 17 promised no new state, and a 3–5 car ordered list cannot fit a
single pinned-pick key). Rather than add a second storage key, collections now explicitly share
the *scheduler* but not the *pinning*, with the rationale stated in the plan: nothing in a
collection is claimable, so deploy drift changes a heading and nothing else. The barn find is
pinned precisely because it is claimable and its claim record can desync. Net new persisted
state for collections: none, as originally promised.

**Self-review before the final round** — four further defects found and fixed without prompting:
- **Phase gap (material):** step 8 deletes `art.js` in v2a and migrates both barn-find surfaces,
  but the 14 classics only received `render` blocks in v2b step 14 — so `art.js` could not
  actually have been deleted in v2a. The classics are now part of step 1 (26 entries in v2a),
  and the redundant v2b step is removed.
- **Untestable criterion:** step 5's "no geometry artefacts at any rotation" could not be
  evaluated at step 5, since rotation was not wired until step 7. The harness now drives
  `render3d.js` directly with a scripted rotation sweep, independent of the builder UI.
- Goal paragraph updated to say 26 meshes, not 12.
- Stale revision header ("after round 1") corrected.

## Round 5 — Codex

The prior featured-collection persistence issue is addressed: the barn find remains per-user pinned, while featured collections now explicitly share only the scheduler and not the pinning, which removes the earlier contradiction ([PLAN.md](/C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:107), [PLAN.md](/C:/Users/philb/Downloads/proficiently-claude-skills-main/dopamine-drive/PLAN.md:127)). I did not find any new material flaws against the current repo constraints. The remaining risks are implementation risks the plan already names and contains: recognisability, placeholder churn, depth sorting, and the builder-stage refactor.

VERDICT: APPROVED
### Resolution

Converged at round 5 of 5 with `VERDICT: APPROVED`. Codex found no new material flaws and
confirmed the remaining risks (recognisability, placeholder churn, depth sorting, builder-stage
refactor) are named and contained in the plan rather than unaddressed.

Findings raised across the review: 13. Accepted 12, partially rejected 1 (the `carArtById` side
map, rejected on sync-risk grounds with the underlying concern addressed a different way).
Claude additionally self-identified 4 defects before the final round.

No code was written during either act.
