// Artwork was redrawn from the native portraits. Each atlas uses 3 columns
// and 4 rows. Keys are in the recruitment hall's order, including mod upgrades.
const sheets = [
  ['conflux-early', [
    'core:pixie', 'core:sprite', 'third-upgrades:tumfairy',
    'core:airelemental', 'core:stormelemental', 'third-upgrades:tumhurricaneelemental',
    'core:waterelemental', 'core:iceelemental', 'third-upgrades:tumlifeelemental',
    'core:fireelemental', 'core:energyelemental', 'third-upgrades:tumplasmaelemental'
  ]],
  ['conflux-late', [
    'core:earthelemental', 'core:magmaelemental', 'third-upgrades:tummineralelemental',
    'core:psychicelemental', 'core:magicelemental', 'third-upgrades:tumvoidelemental',
    'core:firebird', 'core:phoenix', 'wake-of-gods.level8units:sacredphoenix',
    'tum-era:divinephoenix'
  ]],
  ['dungeon-early', [
    'core:troglodyte', 'core:infernaltroglodyte', 'third-upgrades:tumphosphorescenttroglodyte',
    'core:harpy', 'core:harpyhag', 'third-upgrades:tumharpysanguinary',
    'core:beholder', 'core:evileye', 'third-upgrades:tummonstrouseye',
    'core:medusa', 'core:medusaqueen', 'third-upgrades:tummedusaempress'
  ]],
  ['dungeon-late', [
    'core:minotaur', 'core:minotaurking', 'third-upgrades:tumblackminotaur',
    'core:manticore', 'core:scorpicore', 'third-upgrades:tumchimera',
    'core:reddragon', 'core:blackdragon', 'wake-of-gods.level8units:darknessdragon',
    'tum-era:chasmdragon'
  ]],
  ['fortress-early', [
    'core:gnoll', 'core:gnollmarauder', 'third-upgrades:tumgnollshaman',
    'core:lizardman', 'core:lizardwarrior', 'third-upgrades:tumelitelizard',
    'core:serpentfly', 'core:firedragonfly', 'third-upgrades:tumchaoticdragonfly',
    'core:basilisk', 'core:greaterbasilisk', 'third-upgrades:tumlavabasilisk'
  ]],
  ['fortress-late', [
    'core:gorgon', 'core:mightygorgon', 'third-upgrades:tumcatopleba',
    'core:wyvern', 'core:wyvernmonarch', 'third-upgrades:tumacidwyvern',
    'core:hydra', 'core:chaoshydra', 'wake-of-gods.level8units:hellhydra',
    'tum-era:nightmarehydra'
  ]],
  ['inferno-early', [
    'core:imp', 'core:familiar', 'third-upgrades:tumvermin',
    'core:gog', 'core:magog', 'third-upgrades:tumwingedmagog',
    'core:hellhound', 'core:cerberus', 'third-upgrades:tumastralcerberus',
    'core:demon', 'core:horneddemon', 'third-upgrades:tumsharphorneddemon'
  ]],
  ['inferno-late', [
    'core:pitfiend', 'core:pitlord', 'third-upgrades:tumpitmaster',
    'core:efreet', 'core:efreetsultan', 'third-upgrades:tumefreetrajah',
    'core:devil', 'core:archdevil', 'wake-of-gods.level8units:hellbaron',
    'tum-era:antichrist'
  ]],
  ['necropolis-early', [
    'core:skeleton', 'core:skeletonwarrior', 'third-upgrades:tumskeletonknight',
    'core:walkingdead', 'core:zombielord', 'third-upgrades:tumghoul',
    'core:wight', 'core:wraith', 'third-upgrades:tumspecter',
    'core:vampire', 'core:vampirelord', 'third-upgrades:tumnosferatu'
  ]],
  ['necropolis-late', [
    'core:lich', 'core:powerlich', 'third-upgrades:tumlichking',
    'core:blackknight', 'core:dreadknight', 'third-upgrades:tumdeathknight',
    'core:bonedragon', 'core:ghostdragon', 'wake-of-gods.level8units:blooddragon',
    'tum-era:redbonesdragon'
  ]],
  ['rampart-early', [
    'core:centaur', 'core:centaurcaptain', 'third-upgrades:tumcentaurgeneral',
    'core:dwarf', 'core:battledwarf', 'third-upgrades:tumberserkerdwarf',
    'core:woodelf', 'core:grandelf', 'third-upgrades:tumsharpshooterelf',
    'core:pegasus', 'core:silverpegasus', 'third-upgrades:tumgoldenpegasus'
  ]],
  ['rampart-late', [
    'core:dendroidguard', 'core:dendroidsoldier', 'third-upgrades:tumelderdendroid',
    'core:unicorn', 'core:warunicorn', 'third-upgrades:tumlegendaryunicorn',
    'core:greendragon', 'core:golddragon', 'wake-of-gods.level8units:diamonddragon',
    'tum-era:gemdragon'
  ]],
  ['stronghold-early', [
    'core:goblin', 'core:hobgoblin', 'third-upgrades:tumhobgoblinoverlord',
    'core:goblinwolfrider', 'core:hobgoblinwolfrider', 'third-upgrades:tumwolfriderkiller',
    'core:orc', 'core:orcchieftain', 'third-upgrades:tumorcleader',
    'core:ogre', 'core:ogremage', 'third-upgrades:tumelderogre'
  ]],
  ['stronghold-late', [
    'core:roc', 'core:thunderbird', 'third-upgrades:tumlightningbird',
    'core:cyclop', 'core:cyclopking', 'third-upgrades:tumcyclopsemperor',
    'core:behemoth', 'core:ancientbehemoth', 'wake-of-gods.level8units:ghostbehemoth',
    'tum-era:ancestralbehemoth'
  ]],
  ['tower-early', [
    'core:gremlin', 'core:mastergremlin', 'third-upgrades:tumgrandmastergremlin',
    'core:stonegargoyle', 'core:obsidiangargoyle', 'third-upgrades:tummarblegargoyle',
    'core:irongolem', 'core:stonegolem', 'third-upgrades:tumsteelgolem',
    'core:mage', 'core:archmage', 'third-upgrades:tumsupremearchmage'
  ]],
  ['tower-late', [
    'core:genie', 'core:mastergenie', 'third-upgrades:tumarcanegenie',
    'core:naga', 'core:nagaqueen', 'third-upgrades:tumnagaempress',
    'core:giant', 'core:titan', 'wake-of-gods.level8units:lordofthunder',
    'tum-era:guardianofzeus'
  ]]
];

const cell = 362;
export default Object.fromEntries(sheets.flatMap(([sheet, keys]) =>
  keys.map((key, index) => [key, {
    file: 'h3-theme/faction-creatures/' + sheet + '-v1.webp',
    x: index % 3 * cell + 2,
    y: Math.floor(index / 3) * cell + 2,
    w: cell - 4,
    h: cell - 4
  }])
));
