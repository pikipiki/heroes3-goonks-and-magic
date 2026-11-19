// Public model shapes, no saves and no native engine mutations.
const unit={id:0,name:'Pikeman',count:15,attack:4,defense:5,damageMin:1,damageMax:3,health:10,speed:4,cost:[0,0,0,0,0,0,60,0],description:'A creature with a full description. '.repeat(12),abilities:['Immune to fear.','Protects nearby allies.']};
const resources=[9999,9999,9999,9999,9999,9999,9999999,9999],base={turn:true,day:8,resources,heroId:1,heroName:'Sylvia',heroMana:10,heroManaLimit:20,heroHasSpellbook:true,heroes:[{index:0,id:1,name:'Sylvia',movement:1500,mana:10,manaLimit:20}],towns:[{index:0,id:1,name:'Castle'}],armies:[{id:1,name:'Sylvia',needsLastStack:true,slots:[unit,...Array(6).fill(null)]}]};
const heroWindow={id:1,name:'Sylvia',owned:true,level:1,className:'Knight',mana:10,manaLimit:20,primarySkills:[2,2,1,1],commanderIcon:0,slots:Array.from({length:19},(_,slot)=>({slot}))};
const families=Array.from({length:7},(_,level)=>({level,count:20,variants:Array.from({length:3},(_,rank)=>({...unit,id:level*3+rank,level,rank,built:rank<2,name:['Pikeman','Royal Pikeman','Ancestral Diamond Pikeman'][rank]}))}));
const spells=[{id:15,name:'Magic Arrow',cost:5,level:1,enabled:true,target:'enemy',description:unit.description},{id:16,name:'Fire Shield',cost:12,level:4,enabled:true,target:'ally',description:unit.description}];
const commanderState={mode:'dialog',dialogKind:'commander',dialogPresentation:{title:'Commander',unit:{...unit,name:'Hierophant'},choices:['Attack','Defense','Health','Damage','Speed','Magic'].map(label=>({label,inspectable:true,description:label+' — '+unit.description})),commanderTree:{masterRank:4,maxRank:5,skills:Array.from({length:6},(_,id)=>({id,rank:1})),abilities:[{id:6,requires:[0,1],name:'Flying',description:unit.description}]}}};
export const screenCases=[
 ['home',{mode:'menu'}],['connecting',{mode:'connecting'}],
 ['setup',{mode:'lobby',lobbyReady:true,lobbyHumanCount:1,selectedMap:'The King and Queen',difficulty:1,selectedFaction:0,factions:[{id:0,key:'core:castle',name:'Castle'}],maps:[{index:0,name:'The King and Queen',width:144,height:144,players:2,castleChoice:true}],players:[],wogOptionsEditable:true,wogOptions:Array(17).fill(-1)}],
 ['load',{mode:'load',lobbyReady:true,selectedMap:'Saved adventure',maps:[{index:0,name:'Saved adventure',width:144,height:144,players:2}]}],
 ['campaigns',{mode:'campaign',campaigns:Array.from({length:8},(_,index)=>({index,name:'A campaign with a complete title '+index}))}],
 ['campaign',{mode:'campaign-scenario',campaignScenario:{name:'Long Live the Queen',selected:0,bonus:0,difficulty:1,chooseDifficulty:true,canStart:true,scenarioName:'Homecoming',scenarioDescription:unit.description,scenarios:[{id:0,name:'Homecoming',available:true}],bonuses:[{id:0,description:'14 Pikemen'}]}}],
 ['login',{mode:'online-login',onlineHasAccount:false}],
 ['map',{mode:'map',hasPath:true,movement:1500}],
 ...['browser','create','preview','match','invite','scenario'].map(onlinePage=>['online-'+onlinePage,{mode:'online-lobby',onlinePage,onlineHost:true,onlineRoomLimit:8,onlinePlayerCount:8,onlinePlayers:['Sylvia','Orrin','Aislinn','Solmyr','Crag Hack','Kyrre','Tazar','Adela'],onlinePreview:{name:'A long room name',host:'Sylvia',size:7,limit:8},onlineAccount:'Sylvia',selectedMap:'The King and Queen',onlineScenarioFits:true,onlineScenarios:[],onlineCheatsAllowed:false}]),
 ['mithril',{mode:'map',mithrilEnabled:true,mithril:{amount:999,revision:1,offers:Array.from({length:9},(_,kind)=>({kind,id:kind,name:'Site '+kind,cost:100,available:true,x:12,y:34}))}},'button[data-mithril-open]'],
 ['builder',{mode:'town',caveBuilder:{available:true,hero:1,town:2,remaining:10,canAct:true,buildings:Array.from({length:24},(_,i)=>({building:i,name:'Bâtiment '+i,gold:500,enabled:true,salvage:[1,0,2,0,0,0]}))}},'[data-builder-open]'],

 ...['army','worn','backpack','skills'].map(tab=>['hero-'+tab,{mode:'hero',heroWindow},`[data-hero-tab=${tab}]`]),
 ['hero-army-selected',{mode:'hero',troopEquipment:true,heroWindow},'[data-hero-tab=army]','[data-army-slot="0"]'],
 ['hero-army-split',{mode:'hero',troopEquipment:true,heroWindow},'[data-hero-tab=army]','[data-army-slot="0"]','#hero-army-split'],
 ['creature',{mode:'creature',creatureUnit:unit}],
 ['creature-upgrades',{mode:'creature',creatureUnit:unit,creatureUpgrades:[{...unit,id:1,name:'Halberdier',affordable:true}]}],
 ['hall',{mode:'fort',fortRows:[],fortFamilies:families,previewUnits:[]}],
 ['recruit',{mode:'recruit',recruitUnit:unit,previewUnits:[{...unit,upgradeRank:1},{...unit,id:1,name:'Royal Pikeman',upgradeRank:2},{...unit,id:2,name:'Ancestral Diamond Pikeman',upgradeRank:3}],recruitAmount:1,recruitMaximum:15}],
 ['spellbook-combat',{mode:'spellbook',spellbook:{mana:30,page:0,pages:1,school:-1,inCombat:true,spells}}],
 ['spellbook-adventure',{mode:'spellbook',spellbook:{mana:30,page:0,pages:2,school:-1,inCombat:false,spells}}],
 ['spellbook-readonly',{mode:'spellbook',spellbook:{mana:30,page:0,pages:2,school:-1,inCombat:false,readOnly:true,spells}}],
 ['mage-guild',{mode:'mage-guild',mageGuild:{town:1,levels:5,built:3,spells}}],
 ['tavern',{mode:'dialog',dialogKind:'tavern',tavern:{cost:2500,canRecruit:true,thievesGuild:true,invite:true,rumor:'A rumor from the barkeep.'},tavernHeroes:{0:{id:31,name:'Melodia',className:'Druid',level:1},1:{id:32,name:'Ryland',className:'Ranger',level:1}}}],
 ['blacksmith',{mode:'dialog',dialogKind:'blacksmith',blacksmith:{unit:{name:'Ammo Cart'},cost:1000,canBuy:true}}],
 ['commander',commanderState],
 ['commander-tree',commanderState,'[data-commander-tree]'],
 ['message',{mode:'dialog',dialogKind:'message',dialogPresentation:{title:'Game message',lines:[unit.description],choices:[],cancel:true}}],
 ['reward',{mode:'dialog',dialogKind:'source-campaign',campaignPending:true,dialogPresentation:{queryId:70,title:'Choose your reward',lines:[unit.description],choices:[],cancel:true}}],
 ['battle-result',{mode:'dialog',dialogKind:'battle-result',battleResult:{won:true,description:'A glorious victory!',sides:[{name:'Sylvia',winner:true,losses:[{...unit,count:1}]},{name:'Enemy',winner:false,losses:[]}]}}],
 ['exchange',{mode:'hero-exchange',heroExchange:{troopsOnly:true,garrison:false,heroes:[{id:1,name:'Sylvia',owned:true,slots:[],army:{needsLastStack:true,slots:[unit]}},{id:2,name:'Orrin',owned:true,slots:[],army:{needsLastStack:true,slots:[{...unit,count:10}]}}]}}],
 ['battle',{mode:'battle',activeStack:1,heroCanCast:true,canWait:true,canRetreat:true,battleUnits:[{...unit,stackId:1,id:1,x:100,y:200,enemy:false},{...unit,stackId:2,id:2,x:500,y:200,enemy:true}],activeUnit:{...unit,stackId:1,id:1,x:100,y:200},battleCells:[],battleReady:true}],
 ['settings',{mode:'map',mapSettings:{moveTime:150,enemyMoveTime:150}},'#game-menu-toggle','[data-menu=settings]'],
 ['cheats',{mode:'map',cheatsAllowed:true},'#game-menu-toggle','[data-menu=cheats]'],
 ['storage',{mode:'map'},'#game-menu-toggle','[data-menu=storage]'],
];
export const stateFor=entry=>({...base,...entry[1]});
