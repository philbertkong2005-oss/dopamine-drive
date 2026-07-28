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
   trims, options, prices. It must not become car-specific, because v5 (man-cave: houses, PCs,
   furniture) and the sibling "Plan Mode" both reuse it.
4. **Prices stay CAD**, hand-curated approximations of real MSRPs. Don't scrape dealer sites.
5. **Original stylised forms only.** Published dimensions are factual and fine to use;
   manufacturers' 3D models and press renders are not.

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

## Commands

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1              # http://localhost:4174
powershell -ExecutionPolicy Bypass -File build-single-file.ps1  # -> dist/dopamine-drive.html
```

Open `fixtures.html` to inspect all 26 meshes at card and hero size plus a rotation sweep.
It is the acceptance harness — it caught four real defects that review did not.

- `build-single-file.ps1` **must** read sources with `-Encoding UTF8`. PowerShell 5.1 otherwise
  decodes them as ANSI and mangles every em dash, accent and emoji.
- Bundle budget is **120 KB**; currently ~105 KB. Exceeding it is a scope conversation.

## Deploying

Live link: <https://claude.ai/code/artifact/d5d3446b-10cd-42a0-945d-f9670cddf2b2>

Publish `dist/dopamine-drive.html` via the Artifact tool **passing that URL as `url`**.
Without it a new link is minted and the existing one goes stale.

## Status and what's next

**v2a shipped**: cars are low-poly 3D meshes built from real dimensions across six topology
families; the builder rotates live, every other surface uses cached projections; `art.js` retired.

**v2b, in order**: stabilise the daily pick → roster to ~24 cars (Claude proposes, Phil vetoes)
→ vertical feed → grid⇄feed toggle over one shared catalogue and filter state → daily featured
collections. Then v3 casino, v4 3D garage, v5 man cave, and Plan Mode as a sibling.

Accepted art limits: low sports coupes still resemble each other, cars read as correctly
proportioned rather than as *that* car, and nose-on views are featureless. Named fallback is
per-car profile overrides.

`PLAN.md` and `PLAN-REVIEW-LOG.md` hold the full grilled + Codex-reviewed rationale for v2 —
read them before changing v2 direction. `ROADMAP.md` tracks status.
