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
- 2D layered SVG car art engine (`art.js`) — side profile, per-body-type silhouettes,
  swappable paint/wheels/wing

## Roadmap

- **v2** — discovery feed, more categories, daily auctions; more cars, more angles of car art
- **v3** — chips economy → blackjack → slot machine → exclusive wraps/parts/garage decor
  (all optional bonus, never gating core content; slot always pays something)
- **v4** — 3D low-poly PS2-style garage (Three.js) with customizable decorations
- **v5** — man-cave / dream-build expansion: houses, furniture, gaming setups, sports gear
- **Plan Mode** (sibling idea) — same catalog, realistic mode: enter income + savings rate,
  every build shows "years to afford it" / income needed. Escapism ↔ goal-setting toggle.

## Notes

- Prices are approximate Canadian MSRPs (CAD), hand-curated for demo purposes.
- localStorage keys: `dd_garage`, `dd_claims`, `dd_mute`.
