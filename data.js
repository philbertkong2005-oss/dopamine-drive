// ============================================================
// DOPAMINE DRIVE — catalog data
// Canonical schema (the "1c" layer): every item is a
// configurable product with trims/colors/wheels/packages.
// Today this is hand-curated; later it can be fed by a
// scraper or licensed data feed without touching the app.
// Prices: approximate Canadian MSRPs (CAD), demo data.
//
// `render` is TYPE-SPECIFIC presentation metadata, namespaced
// deliberately: no generic consumer may read it. A v5 house
// carries its own `render` and the commerce layer never notices.
//   render.family — meshing topology (see mesh.js FAMILIES).
//                   Independent of `body`, which is catalogue
//                   taxonomy driving filters and labels. They
//                   coincide today; they will not always.
//   render.dims   — real published dimensions, millimetres.
//   render.shape  — authored proportions, fractions (see mesh.js).
// ============================================================

// Shape parameter reference (all fractions unless noted):
//   cowl/roofF/roofR/deck — longitudinal stations, 0 = nose … 1 = tail
//   nose/hood/roof/tail/rocker/belt — vertical, 0 = ground … 1 = roof height
//   wNose/wFront/wMid/wRear/wTail — plan half-width vs max width
//   cabin — greenhouse width vs body width
//   wheel — wheel diameter in mm;  tire — tyre width vs track

const CARS = [
  {
    id: 'gr86', brand: 'Toyota', model: 'GR86', year: 2026, body: 'coupe',
    tags: ['RWD', 'Manual available', 'Track-ready'],
    blurb: 'The purest affordable sports car on sale. Light, balanced, happy sideways.',
    render: {
      family: 'coupe',
      dims: { length: 4265, width: 1775, height: 1310, wheelbase: 2575, frontOverhang: 840, track: 1520 },
      shape: {
        cowl: 0.40, roofF: 0.50, roofR: 0.72, deck: 0.86,
        nose: 0.34, hood: 0.46, roof: 1.00, tail: 0.52, rocker: 0.19, belt: 0.60,
        wNose: 0.74, wFront: 0.97, wMid: 1.00, wRear: 0.96, wTail: 0.78,
        cabin: 0.84, wheel: 630, tire: 0.30,
      },
    },
    trims: [
      { id: 'gt', name: 'GT', price: 35690, hp: 228, tq: 184, zero: 6.3, dt: 'RWD', seats: 4 },
      { id: 'prem', name: 'GT Premium', price: 38990, hp: 228, tq: 184, zero: 6.3, dt: 'RWD', seats: 4 },
    ],
    colors: [
      { name: 'Track bRED', hex: '#c8102e', price: 0 },
      { name: 'Halo White', hex: '#e8e8e6', price: 0 },
      { name: 'Trueno Blue', hex: '#1f4f9e', price: 0 },
      { name: 'Pavement Grey', hex: '#8a8d90', price: 0 },
      { name: 'Raven Black', hex: '#17181a', price: 0 },
      { name: 'Neptune Teal', hex: '#0e7c7b', price: 255 },
    ],
    wheels: [
      { name: '17" Alloy', style: 'five', price: 0 },
      { name: '18" Matte Black', style: 'mesh', price: 1200 },
    ],
    packages: [
      { name: 'Performance Pack', price: 2400, desc: 'Brembo brakes + SACHS dampers' },
      { name: 'Aero Kit', price: 1650, desc: 'Front lip, side skirts, ducktail', visual: { wing: 'lip' } },
    ],
  },
  {
    id: 'mx5', brand: 'Mazda', model: 'MX-5', year: 2026, body: 'convertible',
    tags: ['RWD', 'Convertible', 'Featherweight'],
    blurb: 'The answer is always Miata. The happiest car money can buy.',
    render: {
      family: 'convertible',
      dims: { length: 3915, width: 1735, height: 1230, wheelbase: 2310, frontOverhang: 785, track: 1495 },
      shape: {
        cowl: 0.44, roofF: 0.54, roofR: 0.74, deck: 0.84,
        nose: 0.32, hood: 0.44, roof: 0.86, tail: 0.52, rocker: 0.20, belt: 0.60,
        wNose: 0.72, wFront: 0.96, wMid: 1.00, wRear: 0.95, wTail: 0.76,
        cabin: 0.82, wheel: 620, tire: 0.28,
      },
    },
    trims: [
      { id: 'gs', name: 'GS', price: 37800, hp: 181, tq: 151, zero: 6.5, dt: 'RWD', seats: 2 },
      { id: 'gsp', name: 'GS-P', price: 41500, hp: 181, tq: 151, zero: 6.5, dt: 'RWD', seats: 2 },
      { id: 'gt', name: 'GT', price: 45300, hp: 181, tq: 151, zero: 6.5, dt: 'RWD', seats: 2 },
    ],
    colors: [
      { name: 'Soul Red Crystal', hex: '#a01e26', price: 450 },
      { name: 'Zircon Sand', hex: '#b6a98c', price: 0 },
      { name: 'Aero Grey', hex: '#9aa0a6', price: 0 },
      { name: 'Deep Crystal Blue', hex: '#1b3a63', price: 0 },
      { name: 'Jet Black', hex: '#111214', price: 0 },
    ],
    wheels: [
      { name: '16" Silver', style: 'five', price: 0 },
      { name: '17" BBS Forged', style: 'mesh', price: 2100 },
    ],
    packages: [
      { name: 'Sport Pack', price: 1900, desc: 'Bilstein dampers + strut brace + LSD' },
    ],
  },
  {
    id: 'typer', brand: 'Honda', model: 'Civic Type R', year: 2026, body: 'hatch',
    tags: ['FWD legend', 'Manual only', '315 hp'],
    blurb: 'The fastest front-wheel-drive car around almost everything.',
    render: {
      family: 'hatch',
      dims: { length: 4595, width: 1890, height: 1407, wheelbase: 2735, frontOverhang: 900, track: 1625 },
      shape: {
        cowl: 0.34, roofF: 0.44, roofR: 0.78, deck: 0.92,
        nose: 0.32, hood: 0.44, roof: 1.00, tail: 0.66, rocker: 0.18, belt: 0.58,
        wNose: 0.78, wFront: 0.98, wMid: 1.00, wRear: 0.97, wTail: 0.86,
        cabin: 0.88, wheel: 660, tire: 0.30,
      },
      wing: 'high',
    },
    trims: [
      { id: 'base', name: 'Type R', price: 53850, hp: 315, tq: 310, zero: 5.4, dt: 'FWD', seats: 4 },
    ],
    colors: [
      { name: 'Championship White', hex: '#f2f1ec', price: 0 },
      { name: 'Rallye Red', hex: '#c8102e', price: 0 },
      { name: 'Boost Blue', hex: '#2079d4', price: 300 },
      { name: 'Sonic Grey', hex: '#7d848a', price: 300 },
      { name: 'Crystal Black', hex: '#141518', price: 300 },
    ],
    wheels: [
      { name: '19" Matte Black', style: 'sport', price: 0 },
      { name: '19" Forged Gold', style: 'mesh', price: 2800 },
    ],
    packages: [
      { name: 'Carbon Pack', price: 4200, desc: 'Carbon wing, mirror caps, interior trim' },
    ],
  },
  {
    id: 'grcorolla', brand: 'Toyota', model: 'GR Corolla', year: 2026, body: 'hatch',
    tags: ['AWD', 'Rally-bred', '3 cylinders of fury'],
    blurb: 'A 300-hp rally homologation fantasy you can buy at a Toyota dealer.',
    render: {
      family: 'hatch',
      dims: { length: 4410, width: 1850, height: 1480, wheelbase: 2640, frontOverhang: 890, track: 1580 },
      shape: {
        cowl: 0.36, roofF: 0.46, roofR: 0.76, deck: 0.90,
        nose: 0.36, hood: 0.48, roof: 1.00, tail: 0.70, rocker: 0.19, belt: 0.60,
        wNose: 0.80, wFront: 1.00, wMid: 1.00, wRear: 0.98, wTail: 0.88,
        cabin: 0.90, wheel: 650, tire: 0.30,
      },
    },
    trims: [
      { id: 'core', name: 'Core', price: 50065, hp: 300, tq: 295, zero: 5.3, dt: 'AWD', seats: 5 },
      { id: 'circuit', name: 'Circuit Edition', price: 59990, hp: 300, tq: 295, zero: 5.2, dt: 'AWD', seats: 5 },
    ],
    colors: [
      { name: 'Supersonic Red', hex: '#b0121f', price: 255 },
      { name: 'Ice Cap White', hex: '#eceff1', price: 0 },
      { name: 'Blue Flame', hex: '#1668c1', price: 0 },
      { name: 'Cavalry Blue', hex: '#7d95a8', price: 255 },
      { name: 'Black', hex: '#131417', price: 0 },
    ],
    wheels: [
      { name: '18" Gloss Black', style: 'sport', price: 0 },
      { name: '18" Forged Bronze', style: 'mesh', price: 2400 },
    ],
    packages: [
      { name: 'Performance Pack', price: 1800, desc: 'Front + rear Torsen LSDs' },
      { name: 'Cold Weather Pack', price: 900, desc: 'Heated seats + wheel' },
    ],
  },
  {
    id: 'golfr', brand: 'Volkswagen', model: 'Golf R', year: 2026, body: 'hatch',
    tags: ['AWD', 'Drift mode', 'Daily weapon'],
    blurb: 'The stealth-wealth hot hatch. Groceries at 250 km/h.',
    render: {
      family: 'hatch',
      dims: { length: 4289, width: 1789, height: 1458, wheelbase: 2631, frontOverhang: 875, track: 1540 },
      shape: {
        cowl: 0.37, roofF: 0.47, roofR: 0.75, deck: 0.91,
        nose: 0.37, hood: 0.49, roof: 1.00, tail: 0.71, rocker: 0.19, belt: 0.61,
        wNose: 0.82, wFront: 0.99, wMid: 1.00, wRear: 0.98, wTail: 0.89,
        cabin: 0.90, wheel: 645, tire: 0.29,
      },
    },
    trims: [
      { id: 'base', name: 'Golf R', price: 49595, hp: 315, tq: 310, zero: 4.9, dt: 'AWD', seats: 5 },
    ],
    colors: [
      { name: 'Lapiz Blue', hex: '#1e5bb8', price: 0 },
      { name: 'Pure White', hex: '#f0f0ee', price: 0 },
      { name: 'Moonstone Grey', hex: '#8f9499', price: 0 },
      { name: 'Deep Black Pearl', hex: '#101114', price: 450 },
    ],
    wheels: [
      { name: '19" Estoril', style: 'sport', price: 0 },
      { name: '19" Warmenau Forged', style: 'mesh', price: 2600 },
    ],
    packages: [
      { name: 'Black Style Pack', price: 1500, desc: 'Black badges, mirrors, exhaust tips' },
      { name: 'Akrapovič Exhaust', price: 4900, desc: 'Titanium exhaust, more pops' },
    ],
  },
  {
    id: 'z', brand: 'Nissan', model: 'Z', year: 2026, body: 'coupe',
    tags: ['RWD', 'Twin-turbo V6', 'Retro-modern'],
    blurb: '400 horsepower of heritage. The 240Z’s grandkid went to the gym.',
    render: {
      family: 'coupe',
      dims: { length: 4380, width: 1845, height: 1315, wheelbase: 2550, frontOverhang: 900, track: 1545 },
      shape: {
        cowl: 0.44, roofF: 0.54, roofR: 0.74, deck: 0.88,
        nose: 0.33, hood: 0.45, roof: 1.00, tail: 0.54, rocker: 0.19, belt: 0.61,
        wNose: 0.76, wFront: 0.98, wMid: 1.00, wRear: 0.96, wTail: 0.80,
        cabin: 0.84, wheel: 655, tire: 0.31,
      },
    },
    trims: [
      { id: 'sport', name: 'Sport', price: 48198, hp: 400, tq: 350, zero: 4.5, dt: 'RWD', seats: 2 },
      { id: 'perf', name: 'Performance', price: 58498, hp: 400, tq: 350, zero: 4.5, dt: 'RWD', seats: 2 },
      { id: 'nismo', name: 'NISMO', price: 70998, hp: 420, tq: 384, zero: 4.2, dt: 'RWD', seats: 2 },
    ],
    colors: [
      { name: 'Ikazuchi Yellow', hex: '#d9a80c', price: 745 },
      { name: 'Seiran Blue', hex: '#1a56c4', price: 745 },
      { name: 'Passion Red', hex: '#b01326', price: 745 },
      { name: 'Everest White', hex: '#edeeea', price: 445 },
      { name: 'Black Diamond', hex: '#121316', price: 0 },
    ],
    wheels: [
      { name: '18" Alloy', style: 'five', price: 0 },
      { name: '19" RAYS Forged', style: 'mesh', price: 0 },
    ],
    packages: [
      { name: 'Heritage Pack', price: 1200, desc: 'Retro badging + interior accents' },
    ],
  },
  {
    id: 'mustang', brand: 'Ford', model: 'Mustang GT', year: 2026, body: 'coupe',
    tags: ['V8', 'RWD', 'America'],
    blurb: 'A 5.0-litre V8 with a warranty. The soundtrack is standard equipment.',
    render: {
      family: 'coupe',
      dims: { length: 4811, width: 1916, height: 1400, wheelbase: 2720, frontOverhang: 940, track: 1580 },
      shape: {
        cowl: 0.45, roofF: 0.55, roofR: 0.73, deck: 0.90,
        nose: 0.38, hood: 0.50, roof: 1.00, tail: 0.62, rocker: 0.20, belt: 0.63,
        wNose: 0.80, wFront: 0.99, wMid: 1.00, wRear: 0.97, wTail: 0.84,
        cabin: 0.85, wheel: 680, tire: 0.33,
      },
    },
    trims: [
      { id: 'gt', name: 'GT Fastback', price: 52480, hp: 480, tq: 415, zero: 4.4, dt: 'RWD', seats: 4 },
      { id: 'gtprem', name: 'GT Premium', price: 57880, hp: 480, tq: 415, zero: 4.4, dt: 'RWD', seats: 4 },
      { id: 'dark', name: 'Dark Horse', price: 79130, hp: 500, tq: 418, zero: 4.1, dt: 'RWD', seats: 4 },
    ],
    colors: [
      { name: 'Race Red', hex: '#c8102e', price: 0 },
      { name: 'Grabber Blue', hex: '#1673d8', price: 550 },
      { name: 'Oxford White', hex: '#eff0ec', price: 0 },
      { name: 'Carbonized Grey', hex: '#6d7278', price: 0 },
      { name: 'Shadow Black', hex: '#121316', price: 0 },
      { name: 'Yellow Splash', hex: '#e6c419', price: 550 },
    ],
    wheels: [
      { name: '18" Alloy', style: 'five', price: 0 },
      { name: '19" Performance', style: 'sport', price: 1800 },
    ],
    packages: [
      { name: 'Performance Pack', price: 5500, desc: 'Brembos, Torsen diff, chassis bracing' },
      { name: 'Active Exhaust', price: 1300, desc: 'Quiet mode for neighbours. Loud mode for you.' },
    ],
  },
  {
    id: 'supra', brand: 'Toyota', model: 'GR Supra', year: 2026, body: 'coupe',
    tags: ['RWD', 'Straight-six turbo', 'Legend name'],
    blurb: 'The legend returned wearing a BMW heart. It works.',
    render: {
      family: 'coupe',
      dims: { length: 4380, width: 1865, height: 1290, wheelbase: 2470, frontOverhang: 930, track: 1590 },
      shape: {
        cowl: 0.43, roofF: 0.52, roofR: 0.70, deck: 0.82,
        nose: 0.34, hood: 0.47, roof: 1.00, tail: 0.58, rocker: 0.19, belt: 0.62,
        wNose: 0.74, wFront: 0.98, wMid: 1.00, wRear: 0.97, wTail: 0.78,
        cabin: 0.80, wheel: 660, tire: 0.32,
      },
    },
    trims: [
      { id: 'base', name: '3.0', price: 61990, hp: 382, tq: 368, zero: 4.3, dt: 'RWD', seats: 2 },
      { id: 'prem', name: '3.0 Premium', price: 67390, hp: 382, tq: 368, zero: 4.3, dt: 'RWD', seats: 2 },
    ],
    colors: [
      { name: 'Renaissance Red', hex: '#b01220', price: 0 },
      { name: 'Absolute Zero White', hex: '#eef0ee', price: 0 },
      { name: 'Stratosphere Blue', hex: '#3a6ea8', price: 255 },
      { name: 'Nitro Yellow', hex: '#dcc318', price: 500 },
      { name: 'Nocturnal Black', hex: '#121316', price: 0 },
    ],
    wheels: [
      { name: '18" Cast', style: 'five', price: 0 },
      { name: '19" Forged Two-tone', style: 'sport', price: 0 },
    ],
    packages: [
      { name: 'Driver Assist Pack', price: 1500, desc: 'Adaptive cruise + blind spot' },
    ],
  },
  {
    id: 'm340i', brand: 'BMW', model: 'M340i xDrive', year: 2026, body: 'sedan',
    tags: ['AWD', 'Straight-six', 'Sleeper sedan'],
    blurb: 'The daily driver that embarrasses sports cars at every on-ramp.',
    render: {
      family: 'sedan',
      dims: { length: 4713, width: 1827, height: 1435, wheelbase: 2851, frontOverhang: 870, track: 1580 },
      shape: {
        cowl: 0.40, roofF: 0.50, roofR: 0.76, deck: 0.86,
        nose: 0.38, hood: 0.50, roof: 1.00, tail: 0.62, rocker: 0.20, belt: 0.62,
        wNose: 0.80, wFront: 0.98, wMid: 1.00, wRear: 0.97, wTail: 0.84,
        cabin: 0.88, wheel: 660, tire: 0.29,
      },
    },
    trims: [
      { id: 'base', name: 'M340i xDrive', price: 73600, hp: 386, tq: 398, zero: 4.4, dt: 'AWD', seats: 5 },
    ],
    colors: [
      { name: 'Portimao Blue', hex: '#1a6bc2', price: 895 },
      { name: 'Alpine White', hex: '#eff0ee', price: 0 },
      { name: 'Brooklyn Grey', hex: '#8b9095', price: 895 },
      { name: 'Melbourne Red', hex: '#94131f', price: 895 },
      { name: 'Black Sapphire', hex: '#111219', price: 895 },
    ],
    wheels: [
      { name: '18" Double-spoke', style: 'sport', price: 0 },
      { name: '19" M Performance', style: 'mesh', price: 2000 },
    ],
    packages: [
      { name: 'M Sport Pro', price: 3500, desc: 'M brakes, black trim, adaptive M suspension' },
      { name: 'Premium Pack', price: 4900, desc: 'HUD, Harman Kardon, vented seats' },
    ],
  },
  {
    id: 'corvette', brand: 'Chevrolet', model: 'Corvette Stingray', year: 2026, body: 'exotic',
    tags: ['Mid-engine', 'V8', 'Supercar value'],
    blurb: 'Mid-engine supercar performance at a sedan price. The great equalizer.',
    render: {
      family: 'exotic',
      dims: { length: 4630, width: 1934, height: 1234, wheelbase: 2722, frontOverhang: 830, track: 1650 },
      shape: {
        cowl: 0.28, roofF: 0.38, roofR: 0.60, deck: 0.72,
        nose: 0.28, hood: 0.38, roof: 1.00, tail: 0.66, rocker: 0.18, belt: 0.60,
        wNose: 0.76, wFront: 0.96, wMid: 1.00, wRear: 1.00, wTail: 0.86,
        cabin: 0.78, wheel: 690, tire: 0.34,
      },
    },
    trims: [
      { id: '1lt', name: '1LT', price: 92898, hp: 495, tq: 470, zero: 3.0, dt: 'RWD', seats: 2 },
      { id: '2lt', name: '2LT', price: 102898, hp: 495, tq: 470, zero: 3.0, dt: 'RWD', seats: 2 },
      { id: '3lt', name: '3LT', price: 110898, hp: 495, tq: 470, zero: 3.0, dt: 'RWD', seats: 2 },
    ],
    colors: [
      { name: 'Torch Red', hex: '#c8102e', price: 0 },
      { name: 'Rapid Blue', hex: '#1a72d8', price: 0 },
      { name: 'Amplify Orange', hex: '#e0641a', price: 995 },
      { name: 'Arctic White', hex: '#eef0ee', price: 0 },
      { name: 'Hypersonic Grey', hex: '#767c82', price: 995 },
      { name: 'Black', hex: '#121316', price: 0 },
    ],
    wheels: [
      { name: '19"/20" Silver', style: 'five', price: 0 },
      { name: '19"/20" Carbon Flash', style: 'sport', price: 2500 },
    ],
    packages: [
      { name: 'Z51 Performance', price: 8000, desc: 'E-LSD, perf exhaust, bigger brakes, spoiler', visual: { wing: 'lip' } },
      { name: 'Front Lift', price: 2600, desc: 'Nose lift with GPS memory' },
    ],
  },
  {
    id: '911', brand: 'Porsche', model: '911 Carrera', year: 2026, body: 'exotic',
    tags: ['Rear-engine', 'The benchmark', 'Icon'],
    blurb: 'Sixty years of the same silhouette because it was right the first time.',
    render: {
      family: 'coupe',
      dims: { length: 4519, width: 1852, height: 1300, wheelbase: 2450, frontOverhang: 1010, track: 1586 },
      shape: {
        cowl: 0.34, roofF: 0.44, roofR: 0.62, deck: 0.78,
        nose: 0.30, hood: 0.40, roof: 1.00, tail: 0.72, rocker: 0.19, belt: 0.62,
        wNose: 0.72, wFront: 0.94, wMid: 0.98, wRear: 1.00, wTail: 0.88,
        cabin: 0.80, wheel: 665, tire: 0.34,
      },
    },
    trims: [
      { id: 'base', name: 'Carrera', price: 142300, hp: 388, tq: 331, zero: 4.1, dt: 'RWD', seats: 4 },
      { id: 's', name: 'Carrera S', price: 165800, hp: 473, tq: 390, zero: 3.5, dt: 'RWD', seats: 4 },
      { id: 'gts', name: 'Carrera GTS', price: 191700, hp: 532, tq: 449, zero: 3.0, dt: 'RWD', seats: 4 },
    ],
    colors: [
      { name: 'Guards Red', hex: '#c8102e', price: 0 },
      { name: 'Gentian Blue', hex: '#1d3e7e', price: 1720 },
      { name: 'GT Silver', hex: '#b9bcc0', price: 1720 },
      { name: 'Python Green', hex: '#4c9a2a', price: 3590 },
      { name: 'Carrara White', hex: '#eef0ee', price: 0 },
      { name: 'Jet Black', hex: '#111214', price: 0 },
    ],
    wheels: [
      { name: '19"/20" Carrera', style: 'five', price: 0 },
      { name: '20"/21" Carrera S', style: 'sport', price: 3160 },
      { name: '20"/21" RS Spyder', style: 'mesh', price: 5230 },
    ],
    packages: [
      { name: 'Sport Chrono', price: 3560, desc: 'Launch control + the little clock' },
      { name: 'Sport Exhaust', price: 3980, desc: 'Flat-six symphony, louder' },
      { name: 'PASM Sport Suspension', price: 2170, desc: '-10mm, tauter everything', visual: { drop: 0.03 } },
    ],
  },
  {
    id: 'raptor', brand: 'Ford', model: 'F-150 Raptor', year: 2026, body: 'truck',
    tags: ['4WD', 'Desert runner', '37" tires available'],
    blurb: 'A trophy truck with cupholders and a warranty. Jumps included.',
    render: {
      family: 'truck',
      dims: { length: 5910, width: 2192, height: 2020, wheelbase: 3680, frontOverhang: 900, track: 1750 },
      shape: {
        cowl: 0.30, roofF: 0.38, roofR: 0.58, deck: 0.62,
        nose: 0.52, hood: 0.62, roof: 1.00, tail: 0.62, rocker: 0.26, belt: 0.72,
        wNose: 0.92, wFront: 1.00, wMid: 1.00, wRear: 1.00, wTail: 0.96,
        cabin: 0.92, wheel: 880, tire: 0.34,
        bedStart: 0.62, bedFloor: 0.60, bedWall: 0.80,
      },
    },
    trims: [
      { id: 'base', name: 'Raptor', price: 87500, hp: 450, tq: 510, zero: 5.2, dt: '4WD', seats: 5 },
      { id: 'r', name: 'Raptor R', price: 142000, hp: 720, tq: 640, zero: 3.9, dt: '4WD', seats: 5 },
    ],
    colors: [
      { name: 'Code Orange', hex: '#d95a1e', price: 0 },
      { name: 'Antimatter Blue', hex: '#1a2f5e', price: 0 },
      { name: 'Oxford White', hex: '#eef0ec', price: 0 },
      { name: 'Avalanche Grey', hex: '#9aa0a4', price: 0 },
      { name: 'Agate Black', hex: '#121316', price: 0 },
    ],
    wheels: [
      { name: '17" Alloy 35s', style: 'five', price: 0 },
      { name: '17" Beadlock 37s', style: 'steel', price: 4200 },
    ],
    packages: [
      { name: '37 Performance Pack', price: 9500, desc: '37" tires, unique suspension tune', visual: { lift: 0.04 } },
      { name: 'Bed Utility Pack', price: 1800, desc: 'Power outlets, bed lighting, tie-downs' },
    ],
  },
];

// ------------------------------------------------------------
// Barn finds — one appears per day, claimable free.
// Order is APPEND-ONLY: the daily scheduler selects by index
// from a fixed epoch, so inserting or reordering entries would
// change which car a given date resolves to. Add to the end.
// ------------------------------------------------------------
const BARNFINDS = [
  {
    id: 'supra4', name: '1997 Toyota Supra Twin Turbo', value: 145000, paint: '#d8d8d4',
    story: 'Found under a tarp in Ontario. 62,000 km, six-speed, completely stock. The tarp did its job.',
    render: {
      family: 'coupe',
      dims: { length: 4514, width: 1810, height: 1275, wheelbase: 2550, frontOverhang: 960, track: 1520 },
      shape: {
        cowl: 0.40, roofF: 0.50, roofR: 0.70, deck: 0.84,
        nose: 0.30, hood: 0.42, roof: 1.00, tail: 0.56, rocker: 0.19, belt: 0.60,
        wNose: 0.74, wFront: 0.97, wMid: 1.00, wRear: 0.96, wTail: 0.78,
        cabin: 0.82, wheel: 640, tire: 0.31,
      },
      wing: 'high',
    },
  },
  {
    id: 'nsx', name: '1995 Acura NSX', value: 130000, paint: '#c8102e',
    story: 'One owner, serviced on schedule since Clinton was president. Aluminum never rusts, and neither did this.',
    render: {
      family: 'exotic',
      dims: { length: 4405, width: 1810, height: 1170, wheelbase: 2530, frontOverhang: 900, track: 1510 },
      shape: {
        cowl: 0.30, roofF: 0.40, roofR: 0.62, deck: 0.76,
        nose: 0.26, hood: 0.36, roof: 1.00, tail: 0.62, rocker: 0.18, belt: 0.58,
        wNose: 0.74, wFront: 0.96, wMid: 1.00, wRear: 0.99, wTail: 0.84,
        cabin: 0.78, wheel: 630, tire: 0.31,
      },
    },
  },
  {
    id: 'r34', name: '2000 Nissan Skyline GT-R R34', value: 220000, paint: '#2a55b8',
    story: 'Freshly legal to import. Bayside Blue. You already know everything else you need to know.',
    render: {
      family: 'coupe',
      dims: { length: 4600, width: 1785, height: 1360, wheelbase: 2665, frontOverhang: 900, track: 1490 },
      shape: {
        cowl: 0.40, roofF: 0.49, roofR: 0.74, deck: 0.88,
        nose: 0.38, hood: 0.50, roof: 1.00, tail: 0.60, rocker: 0.20, belt: 0.64,
        wNose: 0.82, wFront: 0.99, wMid: 1.00, wRear: 0.98, wTail: 0.86,
        cabin: 0.88, wheel: 650, tire: 0.30,
      },
      wing: 'high',
    },
  },
  {
    id: 'e30', name: '1990 BMW M3 (E30)', value: 110000, paint: '#e8e6e0',
    story: 'A homologation special that spent 20 years in a heated garage next to a lawnmower that never ran.',
    render: {
      family: 'sedan',
      dims: { length: 4360, width: 1680, height: 1370, wheelbase: 2562, frontOverhang: 790, track: 1412 },
      shape: {
        cowl: 0.38, roofF: 0.47, roofR: 0.75, deck: 0.86,
        nose: 0.42, hood: 0.52, roof: 1.00, tail: 0.64, rocker: 0.21, belt: 0.64,
        wNose: 0.84, wFront: 0.99, wMid: 1.00, wRear: 0.98, wTail: 0.86,
        cabin: 0.90, wheel: 600, tire: 0.27,
      },
      wing: 'high',
    },
  },
  {
    id: 'rx7', name: '1993 Mazda RX-7 (FD)', value: 85000, paint: '#c9b70e',
    story: 'Competition Yellow Mica. The rotary hums like nothing else. Apex seals allegedly fine.',
    render: {
      family: 'coupe',
      dims: { length: 4295, width: 1760, height: 1230, wheelbase: 2425, frontOverhang: 930, track: 1480 },
      shape: {
        cowl: 0.40, roofF: 0.49, roofR: 0.68, deck: 0.82,
        nose: 0.26, hood: 0.38, roof: 1.00, tail: 0.54, rocker: 0.18, belt: 0.58,
        wNose: 0.72, wFront: 0.96, wMid: 1.00, wRear: 0.97, wTail: 0.78,
        cabin: 0.80, wheel: 630, tire: 0.30,
      },
    },
  },
  {
    id: 'ae86', name: '1986 Toyota Corolla GT-S (AE86)', value: 45000, paint: '#eeeeea',
    story: 'Panda paint. Someone’s dad bought it new and never once drifted it. Its destiny is unfulfilled.',
    render: {
      family: 'hatch',
      dims: { length: 4180, width: 1625, height: 1335, wheelbase: 2400, frontOverhang: 830, track: 1355 },
      shape: {
        cowl: 0.38, roofF: 0.47, roofR: 0.72, deck: 0.88,
        nose: 0.38, hood: 0.48, roof: 1.00, tail: 0.62, rocker: 0.21, belt: 0.62,
        wNose: 0.84, wFront: 0.99, wMid: 1.00, wRear: 0.97, wTail: 0.86,
        cabin: 0.88, wheel: 580, tire: 0.26,
      },
    },
  },
  {
    id: 'delorean', name: '1982 DMC DeLorean', value: 65000, paint: '#b9bcc0',
    story: 'Stainless steel, gullwing doors, 130 km/h if you’re patient. Flux capacitor sold separately.',
    render: {
      family: 'exotic',
      dims: { length: 4267, width: 1857, height: 1140, wheelbase: 2413, frontOverhang: 880, track: 1590 },
      shape: {
        cowl: 0.36, roofF: 0.44, roofR: 0.66, deck: 0.80,
        nose: 0.24, hood: 0.34, roof: 1.00, tail: 0.62, rocker: 0.18, belt: 0.58,
        wNose: 0.78, wFront: 0.97, wMid: 1.00, wRear: 0.98, wTail: 0.86,
        cabin: 0.82, wheel: 620, tire: 0.30,
      },
    },
  },
  {
    id: 'charger', name: '1969 Dodge Charger R/T', value: 120000, paint: '#8a1218',
    story: 'A 440 Magnum sleeping in a Saskatchewan barn for 35 years. The mice moved out; the V8 never did.',
    render: {
      family: 'coupe',
      dims: { length: 5280, width: 1950, height: 1350, wheelbase: 2972, frontOverhang: 1080, track: 1520 },
      shape: {
        cowl: 0.42, roofF: 0.52, roofR: 0.74, deck: 0.88,
        nose: 0.42, hood: 0.52, roof: 1.00, tail: 0.62, rocker: 0.22, belt: 0.66,
        wNose: 0.84, wFront: 1.00, wMid: 1.00, wRear: 0.98, wTail: 0.86,
        cabin: 0.86, wheel: 690, tire: 0.30,
      },
    },
  },
  {
    id: 'integrale', name: '1992 Lancia Delta Integrale Evo', value: 140000, paint: '#b01220',
    story: 'Six-time WRC champion bloodline. Box flares wider than your monitor.',
    render: {
      family: 'hatch',
      dims: { length: 3900, width: 1770, height: 1365, wheelbase: 2480, frontOverhang: 720, track: 1500 },
      shape: {
        cowl: 0.36, roofF: 0.45, roofR: 0.74, deck: 0.92,
        nose: 0.40, hood: 0.50, roof: 1.00, tail: 0.70, rocker: 0.21, belt: 0.62,
        wNose: 0.86, wFront: 1.00, wMid: 1.00, wRear: 1.00, wTail: 0.90,
        cabin: 0.84, wheel: 600, tire: 0.30,
      },
      wing: 'high',
    },
  },
  {
    id: 'gt40', name: '1966 Ford GT40 (recreation)', value: 250000, paint: '#1a56c4',
    story: 'A faithful recreation, 40 inches tall, Gulf livery. Le Mans not included but strongly implied.',
    render: {
      family: 'exotic',
      dims: { length: 4064, width: 1778, height: 1029, wheelbase: 2413, frontOverhang: 800, track: 1400 },
      shape: {
        cowl: 0.32, roofF: 0.40, roofR: 0.60, deck: 0.74,
        nose: 0.22, hood: 0.32, roof: 1.00, tail: 0.60, rocker: 0.16, belt: 0.56,
        wNose: 0.76, wFront: 0.98, wMid: 1.00, wRear: 0.98, wTail: 0.82,
        cabin: 0.76, wheel: 600, tire: 0.32,
      },
    },
  },
  {
    id: 'countach', name: '1988 Lamborghini Countach', value: 700000, paint: '#e8e6e0',
    story: 'The poster. The actual poster. Rear visibility measured in faith.',
    render: {
      family: 'exotic',
      dims: { length: 4140, width: 2000, height: 1070, wheelbase: 2500, frontOverhang: 760, track: 1600 },
      shape: {
        cowl: 0.30, roofF: 0.40, roofR: 0.58, deck: 0.70,
        nose: 0.20, hood: 0.30, roof: 1.00, tail: 0.64, rocker: 0.16, belt: 0.56,
        wNose: 0.66, wFront: 0.92, wMid: 1.00, wRear: 1.00, wTail: 0.88,
        cabin: 0.74, wheel: 620, tire: 0.36,
      },
      wing: 'high',
    },
  },
  {
    id: 'f40', name: '1990 Ferrari F40', value: 3200000, paint: '#c8102e',
    story: 'The last Ferrari Enzo signed off. If you claim only one barn find this year, it’s this one.',
    render: {
      family: 'exotic',
      dims: { length: 4358, width: 1970, height: 1124, wheelbase: 2450, frontOverhang: 900, track: 1594 },
      shape: {
        cowl: 0.30, roofF: 0.40, roofR: 0.58, deck: 0.70,
        nose: 0.20, hood: 0.30, roof: 1.00, tail: 0.62, rocker: 0.16, belt: 0.56,
        wNose: 0.70, wFront: 0.94, wMid: 1.00, wRear: 1.00, wTail: 0.88,
        cabin: 0.74, wheel: 630, tire: 0.35,
      },
      wing: 'high',
    },
  },
  {
    id: '959', name: '1987 Porsche 959', value: 2200000, paint: '#b9bcc0',
    story: 'The most advanced car of the 1980s, hiding in plain sight. Gates couldn’t import one; you just claimed one.',
    render: {
      family: 'coupe',
      dims: { length: 4260, width: 1840, height: 1280, wheelbase: 2272, frontOverhang: 980, track: 1504 },
      shape: {
        cowl: 0.34, roofF: 0.44, roofR: 0.62, deck: 0.78,
        nose: 0.28, hood: 0.38, roof: 1.00, tail: 0.72, rocker: 0.18, belt: 0.60,
        wNose: 0.72, wFront: 0.94, wMid: 0.98, wRear: 1.00, wTail: 0.90,
        cabin: 0.78, wheel: 620, tire: 0.33,
      },
    },
  },
  {
    id: 'mclarenf1', name: '1995 McLaren F1', value: 25000000, paint: '#5a5f66',
    story: 'Centre seat. Gold-lined engine bay. The greatest car ever made, found behind a stack of hay bales.',
    render: {
      family: 'exotic',
      dims: { length: 4288, width: 1820, height: 1140, wheelbase: 2718, frontOverhang: 780, track: 1560 },
      shape: {
        cowl: 0.30, roofF: 0.38, roofR: 0.58, deck: 0.72,
        nose: 0.22, hood: 0.32, roof: 1.00, tail: 0.58, rocker: 0.17, belt: 0.56,
        wNose: 0.70, wFront: 0.94, wMid: 1.00, wRear: 0.98, wTail: 0.80,
        cabin: 0.74, wheel: 620, tire: 0.32,
      },
    },
  },
];

// Fixed epoch for daily scheduling. Day-index from here selects the
// barn find, so appending entries never changes an earlier date's pick.
const DAILY_EPOCH = '2026-01-01';

// Price-range buckets for the showroom filter
const PRICE_BUCKETS = [
  { id: 'all', label: 'Any price' },
  { id: 'lo', label: 'Under $50k', min: 0, max: 50000 },
  { id: 'mid', label: '$50k–$90k', min: 50000, max: 90000 },
  { id: 'hi', label: '$90k+', min: 90000, max: Infinity },
];

const BODY_FILTERS = [
  { id: 'all', label: 'All types' },
  { id: 'coupe', label: 'Coupe' },
  { id: 'hatch', label: 'Hot hatch' },
  { id: 'sedan', label: 'Sedan' },
  { id: 'convertible', label: 'Convertible' },
  { id: 'exotic', label: 'Exotic' },
  { id: 'truck', label: 'Truck' },
];
