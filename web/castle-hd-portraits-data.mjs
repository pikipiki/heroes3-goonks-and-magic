// One cell per evolution, in the order shown in the Castle recruitment hall.
const sheets = [
  ['soldiers', 512, 3, [
    'core:pikeman', 'core:halberdier', 'third-upgrades:tumroyalhalberdier',
    'core:archer', 'core:marksman', 'third-upgrades:tumcrossbowman'
  ]],
  ['griffins-and-swords', 512, 3, [
    'core:griffin', 'core:royalgriffin', 'third-upgrades:tumceasargriffin',
    'core:swordsman', 'core:crusader', 'third-upgrades:tuminquisitor'
  ]],
  ['monks-and-cavalry', 512, 3, [
    'core:monk', 'core:zealot', 'third-upgrades:tumhighpriest',
    'core:cavalier', 'core:champion', 'third-upgrades:tumholychampion'
  ]],
  ['angels', 627, 2, [
    'core:angel', 'core:archangel', 'wake-of-gods.level8units:supremearchangel', 'tum-era:cherub'
  ]]
];

export default Object.fromEntries(sheets.flatMap(([sheet, cell, columns, keys]) =>
  keys.map((key, index) => [key, {
    file: `h3-theme/castle-creatures/${sheet}-v1.webp`,
    x: index % columns * cell + 2,
    y: Math.floor(index / columns) * cell + 2,
    w: cell - 4,
    h: cell - 4
  }])
));
