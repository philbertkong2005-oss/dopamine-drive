# Dopamine Drive — project instructions

A dopamine-shopping site for car build-and-price: every car, every option, infinite budget,
zero consequences. Inspired by dopamineshopping.com's frictionless fantasy-buying, applied to
manufacturer configurators like Porsche's.

Plain static files. **No build step, no dependencies, no framework, no package.json.**
No Node or Python on this machine — don't propose tooling that needs them.

## Design guardrails — do not re-litigate these

These were settled with Phil deliberately. Treat them as constraints, not preferences.

1. **The core catalogue is free, instant and ungated.** Every car, trim, colour and option is
   available immediately. There are **no failure states anywhere** — nothing is lost, nothing
   is spent, nothing is refused.
2. **Scarcity layers on top of abundance, never in front of it.** Daily rotating content (barn
   find, later auctions) drives return visits. The v3 casino gates *only* bonus cosmetics the
   dealer doesn't sell, and the slot always pays something. Phil raised the concern that gating
   rewards behind casino wins contradicts the whole no-effort dopamine premise; this is the
   agreed resolution.
3. **The item schema stays generic.** `data.js` describes a *configurable item* — identity,
   trims, options, prices. It must not become car-specific, because two separate products —
   **Plan Mode** and the **man cave** — inherit the whole catalogue from it. Know the limit of
   what this buys: the commerce layer transfers, the art layer does not, because every `mesh.js`
   family is a vehicle topology.
4. **Prices stay CAD**, hand-curated approximations of real MSRPs. Don't scrape dealer sites.
5. **Original stylised forms only, and parametric.** Published dimensions are factual and fine to
   use; manufacturers' 3D models, press renders, and third-party models from Sketchfab or similar
   are not. Beyond licensing, parametric geometry is a **requirement of the configurator**, not a
   size optimisation: paint, wheels, wings and ride height are mesh parameters, and a downloaded
   model is a static asset with baked materials and welded wheels. See `PLAN.md` for the full
   rejection note before proposing this again.
6. **A failed acceptance criterion may trigger its documented fallback. It may never be rewritten
   as an accepted limitation.** This one is specific, not a platitude: it is exactly how v2a closed
   with unrecognisable cars and cost a whole extra phase. If a criterion fails, run the fallback or
   renegotiate the criterion with Phil out loud.

## Architecture

```
data.js        catalogue + barn finds. Generic commerce schema, plus a namespaced
               `render{family,dims,shape}` block that ONLY the renderer may read.
mesh.js        pure: {family,dims,shape} -> low-poly mesh. Deterministic, no DOM.
render3d.js    dependency-free canvas 3D. Per-OBJECT painter sort (not per triangle),
               flat shading, silhouette outline pass.
projection.js  cached 2D projections for every non-builder surface. LRU-capped,
               IntersectionObserver prewarm, rAF-batched one car per frame.
app.js         state, views, storage, sound, confetti, and the builder Stage3D.
```

### Invariants that will bite you

- **Options are referenced by stable id, never array position.** Adding or reordering a colour
  in `data.js` must never repaint someone's saved build. `dd_version` + `migrateGarage()` handle
  older saves.
- **The builder stage canvas must never be re-created on an option change.** `renderOptions()`
  re-renders only the panel; the stage is updated in place via `stage.update()`. Rebuilding
  `main.innerHTML` there would destroy rotation state and pointer capture.
- **Anything that changes how a car looks must be in the projection cache key.** Packages
  declare their visual effect in data (`visual: {wing, lift, drop}`) rather than being
  special-cased, so the signature can't silently miss one and show a stale car.
- **Projection generation never blocks a view transition and never runs in scroll handling.**
  Views paint immediately with placeholders.
- **`todaysBarnFind` is still `BARNFINDS[hash % length]`** — appending classics changes which
  car past dates resolve to. Stabilise this *before* growing the roster (v2b step 1).
- `BARNFINDS` order is **append-only**.
- **Wheel style is not wired to the mesh.** `Mesh.build` takes `{family, dims, shape, wing, lift}`
  and `geoKey` is `[id, wing, lift]` ([projection.js:28](projection.js:28)), so the builder's
  $1,200 wheel upgrade changes the price and nothing visible. Fixed as part of the v2a.5 rebuild;
  once wheel style is a mesh input it must also enter `geoKey`, per the cache-key invariant above.

## Commands

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1              # http://localhost:4174
powershell -ExecutionPolicy Bypass -File build-single-file.ps1  # -> dist/dopamine-drive.html
```

Open `fixtures.html` to inspect all 26 meshes at card and hero size plus a rotation sweep.
It is the acceptance harness — it caught four real defects that review did not. It is **not**
bundled (`build-single-file.ps1` inlines only `index.html`, `styles.css` and the five JS files), so
anything added to it costs zero bundle bytes. v2a.5 turns it into the authoring tool.

- `build-single-file.ps1` **must** read sources with `-Encoding UTF8`. PowerShell 5.1 otherwise
  decodes them as ANSI and mangles every em dash, accent and emoji.
- Bundle budget is **160 KB** (raised from 120 on 2026-07-29); currently ~105 KB. Exceeding it is a
  scope conversation. The build does **no minification at all** — stripping comments, leading
  indentation and CSS whitespace is the ~12–18 KB recovery held in reserve for when 160 KB is
  reached. Three.js does not fit even at 160 KB.
- A catalogue car costs ~1,600 B in `data.js`; a barn-find classic ~680 B (no trims, colours or
  packages). Use these when estimating roster growth.

## Deploying

Live link: <https://claude.ai/code/artifact/d5d3446b-10cd-42a0-945d-f9670cddf2b2>

Publish `dist/dopamine-drive.html` via the Artifact tool **passing that URL as `url`**.
Without it a new link is minted and the existing one goes stale.

## Status and what's next

**v2a shipped, then reopened.** Cars are low-poly meshes from real dimensions across six topology
families; the builder rotates live, every other surface uses cached projections; `art.js` retired.
But judging it in the live artifact on 2026-07-29, Phil found the cars neither good-looking nor
recognisable — which is acceptance criterion (b) failing. The v2a closure had recorded that failure
as an "accepted limitation" instead of invoking the documented fallback. See guardrail 6.

**v2a.5 — art rebuild ← next.** The mesher was never built to its own spec: PLAN step 3 called for
"cabin as a second volume" and glass is instead a material flag on the same hull, there are no wheel
arches (the tuck runs the whole length), the cross-section has only 4 points, and the nose is one
flat polygon. Order: **authoring tool into `fixtures.html` first** (26 cars × ~30 params = 780
hand-authored numbers) → rebuild `mesh.js` → depth buffer if measurement demands it → rewrite
`shape` for all 26 → **blind acceptance** (labels hidden, Phil names each car; any miss is a
mandatory override, under 20/26 means the rebuild failed).

**v2b, in order**: stabilise the daily pick → *[v2a.5 lands here]* → roster batch 1 of 4 cars chosen
to prove new topology (Defender 110 `suv`, RS6 Avant `wagon`, ID. Buzz `van`, 296 GTB `exotic`
extreme) → batch 2 of 8 → vertical feed → grid⇄feed toggle → daily collections. Three ship gates,
on the art rebuild and the feed only.

**Then**: shareable build cards (the only mechanism that brings new people in) → v4 3D garage →
v3 casino. The casino follows the garage because its rewards need somewhere to be displayed.

**Separate products, not versions of this one**: Plan Mode (same source tree, a second build output
`plan.html`, **no in-app toggle**) and the man cave (own mesher, own build). Both share `data.js`.

`PLAN.md` and `PLAN-REVIEW-LOG.md` hold the full grilled + Codex-reviewed rationale for v2, plus the
v2a.5 defect table and the 2026-07-29 direction decisions — read them before changing v2 direction.
`ROADMAP.md` tracks status.
