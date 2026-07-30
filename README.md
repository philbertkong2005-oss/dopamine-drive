# ⚡ Dopamine Drive

A dopamine-shopping site for cars — every brand, every option, infinite budget, zero consequences.
Inspired by dopamineshopping.com's frictionless fantasy-buying, applied to build-and-price car configurators.

## Running it

It's plain static files — no build step, no dependencies.

- **Simplest:** double-click `index.html`.
- **Over http** (needed by some tooling): `powershell -ExecutionPolicy Bypass -File serve.ps1`,
  then open <http://localhost:4174/>. Works without Node or Python installed.

To produce a single self-contained HTML file (everything inlined, hostable anywhere):

    powershell -ExecutionPolicy Bypass -File build-single-file.ps1

Output lands in `dist/dopamine-drive.html`. `dist/` is gitignored — rebuild rather than commit it.

## Locked design principles

1. **Abundance with zero friction.** Every car, trim, and dealer option is instantly free.
   Nothing core is ever gated. No failure states anywhere.
2. **Scarcity on top of abundance, never instead of it.** Daily-rotating content
   (barn finds, later auctions) drives return visits. Casino/slot mechanics (later) only
   gate bonus cosmetics the dealer doesn't sell — and always pay *something*.
3. **The garage is the sunk investment.** Every visit grows the collection.
4. **Data-source agnostic (the "1c" architecture).** The app reads one canonical schema in
   `data.js` (item → trims → colors/wheels/packages, each with CAD prices). Today it's
   hand-curated from real dealer build-and-price pages; a scraper or licensed feed
   (JATO / Chrome Data) can replace it later without touching the app.
   Keep the schema generic ("configurable item"), not car-specific — the future
   man-cave expansion (houses, PCs, furniture) reuses it.

## What's in v1 (this folder)

- **Showroom** — 12 real cars, filter by body type + price range, standout-feature tags
- **Builder** — trim → paint → wheels → packages, animated live CAD price ticker,
  instant 2D art updates, confetti + sound on finish
- **My Garage** — saved builds (localStorage), collection value, reconfigure/remove
- **Compare** — any stock trim vs any stock trim vs your own garage builds; winner
  highlighting per row ($/hp included)
- **Barn Find of the Day** — one classic per day (deterministic by date), tarp-reveal,
  free claim, midnight countdown
- Low-poly 3D car meshes generated from real published dimensions (`mesh.js` → `render3d.js`),
  drag-to-rotate in the builder, cached 2D projections everywhere else (`projection.js`).
  Replaced the old `art.js` SVG engine in v2a

## Roadmap

See `ROADMAP.md` for status and `PLAN.md` for rationale.

- **v2a.5** ← next — art rebuild: the mesher never got its separate cabin volume or wheel arches,
  so cars read as correctly proportioned rather than as *that* car. Authoring tool first, then
  rebuild, then re-author all 26 cars, then blind acceptance
- **v2b** — stabilise the daily pick, roster to ~24 cars in two batches, vertical discovery feed,
  grid⇄feed toggle, daily featured collections
- **Next** — shareable build cards, the one growth loop on this roadmap
- **v4** — 3D low-poly PS2-style garage with customizable decorations. Runs *before* v3, because
  the casino's rewards need somewhere to be displayed
- **v3** — chips economy → blackjack → slot machine → exclusive wraps/parts/garage decor
  (all optional bonus, never gating core content; slot always pays something)
- **Separate products** sharing this catalogue — **Plan Mode** (enter income + savings rate, every
  build reports years-to-afford; ships as its own build output, with no in-app toggle) and the
  **man cave** (houses, furniture, gaming setups — own mesher, own build)

## Notes

- Prices are approximate Canadian MSRPs (CAD), hand-curated for demo purposes.
- localStorage keys: `dd_garage`, `dd_claims`, `dd_mute`.
