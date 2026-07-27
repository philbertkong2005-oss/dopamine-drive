# Roadmap

Status: **v1 shipped** — showroom, configurator, garage, compare, daily barn find.

---

## v1.1 — housekeeping before new features

Small, unglamorous, and much cheaper to do now than later.

- [ ] **Stable option IDs.** Saved builds currently store paint/wheels/packages as *array
      indices* (`color: 3`). Adding or reordering a colour in `data.js` silently repaints
      every existing garage build. Move to string IDs (`color: 'python-green'`) like trims
      already use. **Blocking: do this before the v2 data expansion.**
- [ ] **Schema version + migration.** Add `dd_version` to localStorage so future shape
      changes can migrate old garages instead of corrupting them.
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

## v2 — discovery & rotation

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
