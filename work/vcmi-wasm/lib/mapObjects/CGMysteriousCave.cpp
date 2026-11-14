#include "StdInc.h"
#include "CGMysteriousCave.h"
#include "CGHeroInstance.h"
#include "CGTownInstance.h"
#include "TownBuildingInstance.h"
#include "MiscObjects.h"
#include "ObjectTemplate.h"
#include "army/CCommanderInstance.h"
#include "../GameLibrary.h"
#include "../CPlayerState.h"
#include "../IGameSettings.h"
#include "../CCreatureHandler.h"
#include "../spells/CSpellHandler.h"
#include "../callback/IGameEventCallback.h"
#include "../callback/IGameInfoCallback.h"
#include "../entities/hero/CHeroHandler.h"
#include "../entities/hero/CHero.h"
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"
#include "../networkPacks/PacksForClient.h"
#include "../era/EraMysteriousCaveRules.h"
#include "../era/EraMysteriousCaveDemolition.h"
#include "../entities/faction/CTown.h"
#include "../entities/faction/CFaction.h"
#include "../entities/building/CBuilding.h"
#include "../entities/artifact/ArtifactUtils.h"
#include "../json/JsonNode.h"
#include "../networkPacks/PacksForClientBattle.h"
#include "../networkPacks/StackLocation.h"
#include "../battle/BattleLayout.h"

VCMI_LIB_NAMESPACE_BEGIN

namespace
{
std::string heroKey(const CGHeroInstance * hero,const std::string & effect)
{
 return "eraCave:heroType:"+hero->getHeroType()->getJsonKey()+":"+effect;
}
std::string townKey(const CGTownInstance * town,const std::string & effect)
{
 return "eraCave:town:"+std::to_string(town->id.getNum())+":"+effect;
}
bool builderPresent(const CGHeroInstance * hero,const CGTownInstance * town)
{
 return hero&&town&&hero->getOwner()==town->getOwner()&&(town->getVisitingHero()==hero||town->getGarrisonHero()==hero);
}
int sourceTownFaction(const CGTownInstance * town)
{
 const int faction=town->getFactionID().getNum();
 if(faction>=0&&faction<9)return faction;
 return town->getFaction()->getJsonKey()=="goonk:goonk"?0:-1;
}
int demolitionOccupant(const CGTownInstance * town,int building)
{
 if(building>=30&&building<=43)return building-30;
 const int faction=sourceTownFaction(town);if(faction<0)return -1;
 static constexpr int hordes[4][9]={{3,2,2,1,1,1,1,1,1},{10,9,9,8,8,8,8,8,8},{0,5,0,3,0,0,0,0,0},{0,12,0,10,0,0,0,0,0}};
 const int row=building==18?0:building==19?1:building==24?2:building==25?3:-1;
 return row<0?-1:hordes[row][faction]-1;
}
int occupantCount(const CGTownInstance * town,int occupant)
{
 const int level=occupant%7;
 return occupant<0||level>=town->creatures.size()?0:town->creatures.at(level).first;
}
int occupantPrice(int occupant,int count)
{
 static constexpr int unit[]={40,60,80,150,300,550,800,50,75,100,200,400,650,1000};
 return occupant<0?0:era_bridge::caveSignedProduct(unit[occupant],count);
}
std::vector<const CGObjectInstance *> orderedObjects(const IGameInfoCallback & callback)
{
 std::vector<const CGObjectInstance *> objects;
 for(const auto & object:callback.gameState().getMap().objects)if(object)objects.push_back(object.get());
 std::sort(objects.begin(),objects.end(),[](const auto * a,const auto * b)
 {
  const auto x=a->visitablePos(),y=b->visitablePos();
  return std::tie(x.z,x.y,x.x,a->id)<std::tie(y.z,y.y,y.x,b->id);
 });
 return objects;
}
std::vector<const CGHeroInstance *> orderedHeroes(const IGameInfoCallback & callback)
{
 std::map<HeroTypeID,const CGHeroInstance *> unique;
 for(const auto * object:orderedObjects(callback))
  if(const auto * hero=dynamic_cast<const CGHeroInstance *>(object))unique[hero->getHeroTypeID()]=hero;
 const auto & map=callback.gameState().getMap();
 for(const auto type:map.getHeroesInPool())
  if(const auto * hero=map.tryGetFromHeroPool(type))unique[type]=hero;
 std::vector<const CGHeroInstance *> heroes;
 for(const auto & [type,hero]:unique)heroes.push_back(hero);
 return heroes;
}
std::string choiceText(int choice)
{
 static const std::map<int,std::string> descriptions={
  {20,"A primary skill bonus"},{21,"Experience"},{22,"Travel artifacts"},{23,"Expert Logistics"},
  {24,"An expert magic school"},{25,"A resource artifact"},{26,"A Legion component"},{27,"A spell tome for 300,000 gold"},
  {28,"All first-level spells"},{29,"All second-level spells"},{30,"All level 1–3 spells"},{31,"Resources"},{32,"Resources"},
  {33,"Shackles of War"},{34,"Ten Enchanters"},{35,"10,000 movement points"},{36,"An unvisited obelisk"},
  {37,"A full Mage Guild"},{38,"Army enchantments for seven human-player turns"},{39,"Army speed +3 for seven human-player turns"},
  {40,"Army health doubled for seven human-player turns"},{41,"One hero level"},{42,"An Endless Bag of Gold"},{43,"Mana"},
  {44,"A daily blessing"},{45,"A daily blessing"},{46,"Daily rare resources"},{47,"Daily experience"},
  {48,"Daily movement"},{49,"Scouting radius 12"},{50,"Expert Estates"},{51,"Gold from defeated neutrals"},
  {52,"Scourge protection"},{53,"A distant adventure-object visit"},{54,"Temporary Builder specialty"}};
 if(choice<20)return "The cave is empty this week";
 if(choice>=55&&choice<=61)return "A commander artifact";
 if(choice>=62&&choice<=64)return "A new commander skill";
 const auto i=descriptions.find(choice);return i==descriptions.end()?"Mysterious Cave":i->second;
}
}

int CGMysteriousCave::read(const std::string & key,int fallback) const
{
 const auto found=configuration.variables.values.find(key);
 return found==configuration.variables.values.end()?fallback:found->second;
}
void CGMysteriousCave::write(IGameEventCallback & events,const std::map<std::string,int> & changes) const
{
 auto next=configuration;
 for(const auto & [key,value]:changes)next.variables.values[key]=value;
 events.setRewardableObjectConfiguration(id,next);
}
const CGMysteriousCave * CGMysteriousCave::controller(const IGameInfoCallback & callback)
{
 const CGMysteriousCave * first=nullptr;
 for(const auto & object:callback.gameState().getMap().objects)
  if(const auto * cave=dynamic_cast<const CGMysteriousCave *>(object.get());cave&&(!first||cave->id<first->id))first=cave;
 return first;
}
void CGMysteriousCave::migrateHeroState(IGameEventCallback & events,const IGameInfoCallback & callback)
{
 const auto * global=controller(callback);if(!global||global->read("eraCave:heroStateVersion")>=2)return;
 std::map<std::string,int> changes;
 for(const auto * hero:orderedHeroes(callback))
 {
  const std::string oldPrefix="eraCave:hero:"+std::to_string(hero->id.getNum())+":";
  for(const auto & [key,value]:global->configuration.variables.values)
   if(key.compare(0,oldPrefix.size(),oldPrefix)==0)
   {
    const auto canonical=heroKey(hero,key.substr(oldPrefix.size()));
    if(!global->configuration.variables.values.count(canonical))changes.emplace(canonical,value);
   }
 }
 // Preserve the protection actually supplied by older native saves before
 // moving to source HO's persistent per-colour interaction mask.
 const int oldTarget=global->read("eraCave:scourge",-1);
 for(const auto * hero:orderedHeroes(callback))if(hero->id.getNum()==oldTarget&&hero->getOwner().isValidPlayer()&&heroDays(callback,hero,"scourge")>0)
 {
  const auto key=heroKey(hero,"scourgeBlockedPlayers");
  if(!global->configuration.variables.values.count(key))changes[key]=255^(1<<hero->getOwner().getNum());
 }
 changes["eraCave:heroStateVersion"]=2;
 global->write(events,changes);
}
void CGMysteriousCave::onHeroActivated(IGameEventCallback & events,const CGHeroInstance * hero)
{
 if(!hero)return;migrateHeroState(events,*hero->cb);
 const auto * global=controller(*hero->cb);if(!global)return;
 if(global->read(heroKey(hero,"builderSpecialtyMuted"))>0&&heroDays(*hero->cb,hero,"builder")<=0)
  expireBuilder(events,hero);
}
int CGMysteriousCave::heroDays(const IGameInfoCallback & callback,const CGHeroInstance * hero,const std::string & effect)
{
 if(!hero)return 0;
 const auto * global=controller(callback);
 if(!global)return 0;
 const auto found=global->configuration.variables.values.find(heroKey(hero,effect));
 return found!=global->configuration.variables.values.end()?found->second:global->read("eraCave:hero:"+std::to_string(hero->id.getNum())+":"+effect);
}
void CGMysteriousCave::initObj(IGameRandomizer & randomizer)
{
 CRewardableObject::initObj(randomizer);
 configuration.variables.values.emplace("eraCave:visited",configuration.getVariable("number","caveInitiallyVisited").value_or(0));
 configuration.variables.values.emplace("eraCave:subtypeVisited",read("eraCave:visited")>0?1:0);
 configuration.variables.values.emplace("eraCave:choice",0);
 configuration.variables.values.emplace("eraCave:allOpen",configuration.getVariable("number","caveAllOpen").value_or(0));
 configuration.variables.values.emplace("eraCave:watcher",configuration.getVariable("number","caveWatcher").value_or(0));
 if(read("eraCave:allOpen")<0||read("eraCave:allOpen")>1||read("eraCave:watcher")<0)
  throw std::runtime_error("Mysterious Cave options are outside the source domain");
 refreshAppearance();appearanceChangedForView=false;
}
bool CGMysteriousCave::refreshAppearance()
{
 if(!appearance)return false;
 const AnimationPath desired=AnimationPath::builtin(read("eraCave:subtypeVisited",read("eraCave:visited")>0)>0?"tum-era/objects/zyzop1.def":"tum-era/objects/zyzop2.def");
 if(appearance->animationFile==desired)return false;
 auto replacement=std::make_shared<ObjectTemplate>(*appearance);replacement->animationFile=desired;
 appearance=replacement;appearanceChangedForView=true;return true;
}
void CGMysteriousCave::message(IGameEventCallback & events,const CGHeroInstance * hero,const std::string & text) const
{
 InfoWindow window;window.player=hero->getOwner();window.text.appendRawString(text);events.showInfoDialog(&window);
}
void CGMysteriousCave::finishVisit(IGameEventCallback & events,const CGHeroInstance *,bool convertSubtype) const
{
 write(events,{{"eraCave:visited",15},{"eraCave:subtypeVisited",convertSubtype?1:read("eraCave:subtypeVisited")},{"eraCave:pendingHero",-1},{"eraCave:pendingChoice",0}});
}
void CGMysteriousCave::grantArtifact(IGameEventCallback & events,const CGHeroInstance * hero,int sourceId) const
{
 static const std::array<const char *,10> commander={"axeOfSmashing","mithrilMail","swordOfSharpness","helmOfImmortality","pendantOfSorcery","bootsOfHaste","bowOfSeeking","dragonEyeRing","hardenedShield","slavasRingOfPower"};
 const ArtifactID artifact=sourceId>=146&&sourceId<=155?
  ArtifactID(ArtifactID::decode("wake-of-gods.commanders:"+std::string(commander[sourceId-146]))):ArtifactID(sourceId);
 if(artifact.getNum()<0)throw std::runtime_error("Source Cave artifact identity unresolved");
 events.giveHeroNewArtifact(hero,artifact,ArtifactPosition::FIRST_AVAILABLE);
}
void CGMysteriousCave::onHeroVisit(IGameEventCallback & events,const CGHeroInstance * hero) const
{
 if(wasVisited(hero)){message(events,hero,"This cave is forsaken for now. Come back next week.");return;}
 const bool human=cb->getPlayerState(hero->getOwner())->isHuman();
 auto rng=[&](int low,int high){return events.getRandomGenerator().nextInt(low,high);};
 if(!human)
 {
  const int skill=rng(0,3);
  if(hero->getPrimSkillLevel(PrimarySkill(skill))<110)events.changePrimSkill(hero,PrimarySkill(skill),2,ChangeValueMode::RELATIVE);
  finishVisit(events,hero,false);return;
 }
 int choice=era_bridge::caveEffectiveChoice(read("eraCave:choice"),hero->getSecSkillLevel(SecondarySkill::LOGISTICS)==3);
 if(choice<20){finishVisit(events,hero,false);message(events,hero,"This cave is forsaken. Try again next week.");return;}
 if(choice==44||choice==45)choice=rng(46,48);
 if(choice==27||choice==54)
 {
  const auto * global=controller(*cb);
  if(choice==27&&cb->getResource(hero->getOwner(),EGameResID::GOLD)<300000){message(events,hero,"The merchant asks 300,000 gold. You cannot afford the tome.");return;}
  if(choice==54&&global&&global->read("eraCave:builder",-1)>=0){message(events,hero,"A hero already holds the Builder specialty.");return;}
  write(events,{{"eraCave:pendingHero",hero->id.getNum()},{"eraCave:pendingChoice",choice}});
  BlockingDialog dialog(true,false);dialog.player=hero->getOwner();
  dialog.text.appendRawString(choice==27?"Buy this spell tome for 300,000 gold?":"Become a Builder temporarily?");
  events.showBlockingDialog(this,&dialog);return;
 }
 grantChoice(events,hero,choice,true);
}
void CGMysteriousCave::blockingDialogAnswered(IGameEventCallback & events,const CGHeroInstance * hero,int32_t answer) const
{
 if(read("eraCave:pendingHero",-1)!=hero->id.getNum())return;
 const int choice=read("eraCave:pendingChoice");
 write(events,{{"eraCave:pendingHero",-1},{"eraCave:pendingChoice",0}});
 if(answer>0)grantChoice(events,hero,choice,true);
}

void CGMysteriousCave::grantChoice(IGameEventCallback & events,const CGHeroInstance * hero,int choice,bool accepted) const
{
 if(!accepted)return;
 const auto * global=controller(*cb);if(!global)return;
 const auto daily=[&](const std::string & key){return global->read("eraCave:daily:"+key);};
 const auto timer=[&](const std::string & name){global->write(events,{{heroKey(hero,name),7}});};
 switch(choice)
 {
 case 20:events.changePrimSkill(hero,PrimarySkill(daily("primary")-31),daily("stat"),ChangeValueMode::RELATIVE);break;
 case 21:events.giveExperience(hero,daily("experience"));break;
 case 22:grantArtifact(events,hero,98);grantArtifact(events,hero,70);break;
 case 23:events.changeSecSkill(hero,SecondarySkill::LOGISTICS,3,ChangeValueMode::ABSOLUTE);break;
 case 24:events.changeSecSkill(hero,SecondarySkill(daily("school")),3,ChangeValueMode::ABSOLUTE);break;
 case 25:grantArtifact(events,hero,daily("resourceArtifact"));break;
 case 26:grantArtifact(events,hero,daily("legionArtifact"));break;
 case 27:
  if(cb->getResource(hero->getOwner(),EGameResID::GOLD)<300000)return;
  grantArtifact(events,hero,daily("tome"));events.giveResource(hero->getOwner(),EGameResID::GOLD,-300000);break;
 case 28:case 29:case 30:
 {
  if(!hero->hasSpellbook())events.giveHeroNewArtifact(hero,ArtifactID::SPELLBOOK,ArtifactPosition::SPELLBOOK);
  static const std::array<int,15> first={41,43,37,42,35,53,15,31,32,27,54,46,0,5,3};
  static const std::array<int,15> second={62,24,4,47,13,51,16,17,44,30,10,64,1,2,45};
  std::set<SpellID> spells;
  if(choice==28)for(int spell:first)spells.emplace(spell);
  else if(choice==29)for(int spell:second)spells.emplace(spell);
  else for(int spell=0;spell<70;++spell)if(SpellID(spell).toSpell()->getLevel()<4)spells.emplace(spell);
  events.changeSpells(hero,true,spells);break;
 }
 case 31:case 32:events.giveResource(hero->getOwner(),GameResID(daily("resource")),era_bridge::caveSignedProduct(daily("resourceAmount"),daily("resource")==6?1000:1));break;
 case 33:grantArtifact(events,hero,125);break;
 case 34:
 {
  CCreatureSet creatures;creatures.setCreature(SlotID(0),CreatureID(136),10);events.giveCreatures(hero,creatures);break;
 }
 case 35:events.setMovePoints(hero->id,hero->movementPointsRemaining()+10000);break;
 case 36:revealObelisk(events,hero);finishVisit(events,hero);return;
 case 37:buildGuild(events,hero);finishVisit(events,hero);return;
 case 38:timer("enchanted");break;
 case 39:timer("speed");break;
 case 40:timer("health");break;
 case 41:
 {
  const auto wanted=LIBRARY->heroh->reqExp(hero->level+1);
  if(wanted>hero->exp)events.giveExperience(hero,wanted-hero->exp);break;
 }
 case 42:grantArtifact(events,hero,116);break;
 case 43:events.setManaPoints(hero->id,hero->mana+daily("mana"));break;
 case 46:case 47:case 48:
 {
  const std::string effect=choice==46?"dailyResources":choice==47?"dailyExperience":"dailyMovement";
  global->write(events,{{heroKey(hero,effect),choice==46?daily("blessing"):choice==47?daily("experience"):daily("movement")},
   {heroKey(hero,effect+":start"),cb->getDate(Date::DAY)},{heroKey(hero,effect+":end"),cb->getDate(Date::DAY)+7}});break;
 }
 case 49:timer("sight");break;
 case 50:events.changeSecSkill(hero,SecondarySkill::ESTATES,3,ChangeValueMode::ABSOLUTE);break;
 case 51:timer("goldLoot");break;
 case 52:
  if(global->read("eraCave:scourge",-1)>=0){message(events,hero,"The kingdom is already in quarantine. Wait until the affected hero recovers.");return;}
  timer("scourge");break;
 case 53:if(daily("remoteObject")<1)return;if(remoteVisit(events,hero,daily("remoteObject")))finishVisit(events,hero);return;
 case 54:
 {
  if(global->read("eraCave:builder",-1)>=0)return;
  std::size_t count=0;
  const BonusSourceID specialtyId(hero->getHeroTypeID());
  for(const auto & bonus:hero->getExportedBonusList())if(bonus->source==BonusSource::HERO_SPECIAL&&bonus->sid==specialtyId)++count;
  for(std::size_t i=0;i<count;++i)
  {
   RemoveBonus removal;removal.whoID=hero->id;removal.source=BonusSource::HERO_SPECIAL;removal.id=specialtyId;
   events.sendAndApply(removal);
  }
  Bonus marker;marker.type=BonusType::NONE;marker.source=BonusSource::OTHER;marker.sid=BonusSourceID(global->id);
  marker.stacking="eraCave:builder:v1";marker.hidden=true;
  GiveBonus addition(GiveBonus::ETarget::OBJECT,hero->id,marker);events.sendAndApply(addition);
  timer("builder");global->write(events,{{"eraCave:builder",hero->id.getNum()},{heroKey(hero,"builderSpecialtyMuted"),1}});break;
 }
 default:
  if(choice>=55&&choice<=61)grantArtifact(events,hero,daily("commanderArtifact"));
  else if(choice>=62&&choice<=64&&hero->getCommander())
  {
   // Source CO:S order puts Magic Power before Speed; VCMI stores the last two in the opposite order.
   for(int skill:{ECommander::ATTACK,ECommander::DEFENSE,ECommander::HEALTH,ECommander::DAMAGE,ECommander::SPELL_POWER,ECommander::SPEED})
    if(hero->getCommander()->secondarySkills.at(skill)==0)
   {
    SetCommanderProperty packet;packet.heroid=hero->id;packet.which=SetCommanderProperty::BONUS;
    packet.accumulatedBonus.duration=BonusDuration::PERMANENT;
    packet.accumulatedBonus.source=BonusSource::COMMANDER;
    packet.accumulatedBonus.valType=BonusValueType::BASE_NUMBER;
    auto grant=[&](BonusType type,BonusSubtypeID subtype,int value,BonusValueType valueType=BonusValueType::BASE_NUMBER)
    {
     packet.accumulatedBonus.type=type;packet.accumulatedBonus.subtype=subtype;
     packet.accumulatedBonus.val=value;packet.accumulatedBonus.valType=valueType;events.sendAndApply(packet);
    };
    const int value=LIBRARY->creh->skillLevels.at(skill).at(0);
    if(skill==ECommander::ATTACK)grant(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::ATTACK),value);
    else if(skill==ECommander::DEFENSE)grant(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE),value);
    else if(skill==ECommander::HEALTH)grant(BonusType::STACK_HEALTH,BonusSubtypeID(),value,BonusValueType::PERCENT_TO_ALL);
    else if(skill==ECommander::DAMAGE)grant(BonusType::CREATURE_DAMAGE,BonusCustomSubtype::creatureDamageBoth,value,BonusValueType::PERCENT_TO_ALL);
    else if(skill==ECommander::SPEED)grant(BonusType::STACKS_SPEED,BonusSubtypeID(),value);
    else
    {
     grant(BonusType::SPELL_DAMAGE_REDUCTION,BonusSubtypeID(SpellSchool::ANY),LIBRARY->creh->skillLevels.at(ECommander::RESISTANCE).at(0));
     grant(BonusType::CREATURE_SPELL_POWER,BonusSubtypeID(),value*100);
     grant(BonusType::CASTS,BonusSubtypeID(),LIBRARY->creh->skillLevels.at(ECommander::CASTS).at(0));
     grant(BonusType::CREATURE_ENCHANT_POWER,BonusSubtypeID(),value);
    }
    packet.which=SetCommanderProperty::SECONDARY_SKILL;packet.additionalInfo=skill;packet.amount=1;
    events.sendAndApply(packet);break;
   }
  }
  else throw std::runtime_error("Unsupported Mysterious Cave reward choice");
 }
 finishVisit(events,hero);message(events,hero,choiceText(choice));
}

bool CGMysteriousCave::revealObelisk(IGameEventCallback & events,const CGHeroInstance * hero) const
{
 for(const auto * object:orderedObjects(*cb))if(const auto * obelisk=dynamic_cast<const CGObelisk *>(object))
 {
  const auto * team=cb->getPlayerTeam(hero->getOwner());
  if(!team||obelisk->wasVisited(hero->getOwner()))continue;
  events.setObjPropertyID(obelisk->id,ObjProperty::OBELISK_VISITED,team->id);
  for(const auto & color:team->players)events.setObjPropertyID(obelisk->id,ObjProperty::VISITED,color);
  events.changeFogOfWar(obelisk->visitablePos(),3,hero->getOwner(),ETileVisibility::REVEALED);
  message(events,hero,"An enchanted map reveals an unknown obelisk.");
  events.showObjectWindow(obelisk,EOpenWindowMode::PUZZLE_MAP,hero,false);
  return true;
 }
 message(events,hero,"There is no unvisited obelisk left to reveal.");return false;
}
bool CGMysteriousCave::buildGuild(IGameEventCallback & events,const CGHeroInstance * hero) const
{
 for(const auto * object:orderedObjects(*cb))if(const auto * town=dynamic_cast<const CGTownInstance *>(object);town&&town->getOwner()==hero->getOwner())
 {
  int maximum=era_bridge::caveMageGuildMaximum(sourceTownFaction(town));
  while(maximum>0&&!town->getTown()->buildings.count(BuildingID(maximum-1)))--maximum;
  if(town->mageGuildLevel()>=maximum)continue;
  NewStructures packet;packet.tid=town->id;packet.built=town->built;
  for(int i=0;i<maximum;++i)packet.bid.insert(BuildingID(i));
  events.sendAndApply(packet);
  for(const auto * resident:{town->getVisitingHero(),town->getGarrisonHero()})if(resident&&resident->hasSpellbook())
  {
   std::set<SpellID> spells;
   if(town->hasBuilt(BuildingSubID::AURORA_BOREALIS)&&town->hasBuilt(BuildingID::MAGES_GUILD_1))
   {
    for(int level=1;level<=resident->maxSpellLevel();++level)
    {
     std::vector<SpellID> allowed;cb->gameState().getAllowedSpells(allowed,level);
     spells.insert(allowed.begin(),allowed.end());
    }
   }
   else for(int level=0;level<std::min(town->mageGuildLevel(),resident->maxSpellLevel());++level)
    for(int index=0;index<town->spellsAtLevel(level+1,true)&&index<town->spells.at(level).size();++index)
     spells.insert(town->spells.at(level).at(index));
   if(!spells.empty())events.changeSpells(resident,true,spells);
  }
  message(events,hero,"A full Mage Guild has been built in "+town->getObjectName()+".");return true;
 }
 message(events,hero,"All of your towns already have a full Mage Guild.");return false;
}
bool CGMysteriousCave::remoteVisit(IGameEventCallback & events,const CGHeroInstance * hero,int selection) const
{
 static const std::array<int,7> sourceTypes={23,32,51,61,41,4,47};
 const MapObjectID type(sourceTypes.at(selection-1));
 int matching=0;
 for(const auto * object:orderedObjects(*cb))
 {
  if(object->ID!=type)continue;
  ++matching;
  if(hero->visitedObjects.count(object->id))continue;
  // The original explicitly awards the seven stat effects, bypassing the
  // physical object's costs/level restrictions and preserving its visited flag.
  ChangeObjectVisitors visited(ChangeObjectVisitors::VISITOR_ADD_HERO,object->id,hero->id);
  events.sendAndApply(visited);
  const auto bonus=era_bridge::caveRemotePrimaryBonus(selection);
  for(int skill=0;skill<4;++skill)if(bonus[skill])events.changePrimSkill(hero,PrimarySkill(skill),bonus[skill],ChangeValueMode::RELATIVE);
  events.changeFogOfWar(object->visitablePos(),1,hero->getOwner(),ETileVisibility::REVEALED);
  message(events,hero,"Through the power of winds, you visited one location in a distant land.");
  return true;
 }
 message(events,hero,"There is no unvisited location of this type on the map.");
 return matching>0;
}

void CGMysteriousCave::onPlayerTurnStart(IGameEventCallback & events,IGameInfoCallback & callback,PlayerColor player)
{
 const auto * global=controller(callback);if(!global)return;
 migrateHeroState(events,callback);
 const auto * playerState=callback.getPlayerState(player);if(!playerState)return;
 const int day=callback.getDate(Date::DAY),receipt=day*8+player.getNum();
 if(global->read("eraCave:receipt",-1)==receipt)return;
 global->write(events,{{"eraCave:receipt",receipt}});
 // HE:Y blessings are player-owning-day effects; their clocks are independent
 // of the original script's globally decremented w121..w127 counters.
 for(const auto * object:orderedObjects(callback))if(const auto * hero=dynamic_cast<const CGHeroInstance *>(object);hero&&hero->getOwner()==player)
 {
  for(const std::string effect:{"dailyResources","dailyExperience","dailyMovement"})
  {
   const int amount=global->read(heroKey(hero,effect));
   if(!amount||day<=global->read(heroKey(hero,effect+":start"))||day>global->read(heroKey(hero,effect+":end")))continue;
   if(effect=="dailyResources")for(int resource:{1,3,4,5})events.giveResource(player,GameResID(resource),amount);
   else if(effect=="dailyExperience")events.giveExperience(hero,amount);
   else events.setMovePoints(hero->id,hero->movementPointsRemaining()+amount);
  }
 }
 if(!playerState->isHuman())
 {
  const int human=global->read("eraCave:lastHuman",-1);
  std::vector<const CGHeroInstance *> heroes;
  for(const auto * object:orderedObjects(callback))if(const auto * hero=dynamic_cast<const CGHeroInstance *>(object);hero&&hero->getOwner().getNum()==human)heroes.push_back(hero);
  std::sort(heroes.begin(),heroes.end(),[](const auto * a,const auto * b){return a->getHeroTypeID()<b->getHeroTypeID();});
  for(const auto * hero:heroes)if(global->read(heroKey(hero,"scourge"))>1)global->write(events,{{"eraCave:scourge",hero->id.getNum()}});
  if(human>=0&&human<8)
   for(const auto * hero:orderedHeroes(callback))if(hero->id.getNum()==global->read("eraCave:scourge",-1))
   {
    const auto key=heroKey(hero,"scourgeBlockedPlayers");
    global->write(events,{{key,global->read(key)|(255^(1<<human))}});
   }
  return;
 }
 for(const auto * object:orderedObjects(callback))
  if(const auto * town=dynamic_cast<const CGTownInstance *>(object);town&&townRebuildReadyDay(town)>0)
   setTownRebuildReadyDay(events,town,day);
 global->write(events,{{"eraCave:lastHuman",player.getNum()}});
 auto rng=[&](int low,int high){return events.getRandomGenerator().nextInt(low,high);};
 if(global->read("eraCave:firstDayComplete")==0)
 {
  // Caves.ini is absent from the supplied distribution: verified ReadStrFromIni
  // and VR:V semantics make all nine replacement percentages zero. Source still
  // consumes a draw for every source-type object, even at percentage zero.
  const auto sourceObjects=orderedObjects(callback);
  for(int sourceType:{97,100,16,85,47,17,95,57,62})
   for(const auto * object:sourceObjects)if(object->ID.getNum()==sourceType)(void)rng(1,10);
  global->write(events,{{"eraCave:firstDayComplete",1}});
 }
 const auto daily=era_bridge::rollCaveDaily(day,rng);
 global->write(events,{{"eraCave:daily:primary",daily.primary},{"eraCave:daily:stat",daily.stat},
  {"eraCave:daily:experience",daily.experience},{"eraCave:daily:school",daily.school},
  {"eraCave:daily:resourceArtifact",daily.resourceArtifact},{"eraCave:daily:legionArtifact",daily.legionArtifact},
  {"eraCave:daily:tome",daily.tome},{"eraCave:daily:resource",daily.resource},{"eraCave:daily:resourceAmount",daily.resourceAmount},
  {"eraCave:daily:mana",daily.mana},{"eraCave:daily:commanderArtifact",daily.commanderArtifact},
  {"eraCave:daily:blessing",daily.blessing},{"eraCave:daily:movement",daily.movement},{"eraCave:daily:remoteObject",daily.remoteObject}});
 for(const auto * hero:orderedHeroes(callback))
 {
  std::map<std::string,int> changes;
  for(const std::string effect:{"enchanted","speed","health","sight","goldLoot"})
  {
   const int value=global->read(heroKey(hero,effect));if(value>0)changes[heroKey(hero,effect)]=value-1;
  }
  for(const std::string effect:{"builder","scourge"})
  {
   const int value=global->read(heroKey(hero,effect));
   if(value>1)changes[heroKey(hero,effect)]=value-1;
   if(value==1||value==2)
   {
    if(effect=="builder")expireBuilder(events,hero);
    changes[heroKey(hero,effect)]=0;
    if(effect=="scourge")changes[heroKey(hero,"scourgeBlockedPlayers")]=0;
    changes["eraCave:"+effect]=-1;
   }
  }
  if(!changes.empty())global->write(events,changes);
 }
 if(callback.getDate(Date::DAY_OF_WEEK)==1)
 {
  // A source cave becomes63/55 after visiting, so the two original passes put
  // still-unvisited caves before visited caves. Preserve this order explicitly.
  const auto objects=orderedObjects(callback);
  for(bool visited:{false,true})for(const auto * object:objects)
   if(const auto * cave=dynamic_cast<const CGMysteriousCave *>(object);cave&&(cave->read("eraCave:subtypeVisited",cave->read("eraCave:visited")>0)>0)==visited)
   {
    const bool commanders=callback.getSettings().getBoolean(EGameSettings::MODULE_COMMANDERS);
    const int choice=era_bridge::rollCaveWeekly(commanders,cave->read("eraCave:allOpen")!=0,
     global->read("eraCave:watcher")>0,global->read("eraCave:allObelisksRemoved")!=0,rng);
    bool occupied=false;
    for(const auto * candidate:objects)if(const auto * hero=dynamic_cast<const CGHeroInstance *>(candidate);hero&&hero->visitablePos()==cave->visitablePos())occupied=true;
    cave->write(events,{{"eraCave:choice",choice},{"eraCave:visited",0},{"eraCave:subtypeVisited",occupied&&visited?1:0}});
   }
 }
}

void CGMysteriousCave::onHeroMoved(IGameEventCallback & events,const CGHeroInstance * hero)
{
 if(hero&&heroDays(*hero->cb,hero,"sight")>0)events.changeFogOfWar(hero->visitablePos(),12,hero->getOwner(),ETileVisibility::REVEALED);
}
bool CGMysteriousCave::preventsHostileApproach(const CGHeroInstance * hero,PlayerColor attacker)
{
 if(!hero||!attacker.isValidPlayer())return false;
 const auto * global=controller(*hero->cb);if(!global)return false;
 const auto found=global->configuration.variables.values.find(heroKey(hero,"scourgeBlockedPlayers"));
 if(found!=global->configuration.variables.values.end())return (found->second&(1<<attacker.getNum()))!=0;
 return hero->getOwner()!=attacker&&global->read("eraCave:scourge",-1)==hero->id.getNum()&&heroDays(*hero->cb,hero,"scourge")>0;
}
void CGMysteriousCave::recordNeutralHealth(IGameEventCallback & events,const CGHeroInstance * hero,std::int64_t health)
{
 if(!hero||heroDays(*hero->cb,hero,"goldLoot")<=0)return;
 const auto * global=controller(*hero->cb);
 // Original arithmetic is signed32; preserve that wrapped value.
 global->write(events,{{heroKey(hero,"neutralHealth"),era_bridge::caveSignedValue(static_cast<std::uint32_t>(health))}});
}
void CGMysteriousCave::grantNeutralLoot(IGameEventCallback & events,const CGHeroInstance * hero)
{
 if(!hero||heroDays(*hero->cb,hero,"goldLoot")<=0)return;
 const auto * global=controller(*hero->cb);const int health=global->read(heroKey(hero,"neutralHealth"));
 global->write(events,{{heroKey(hero,"neutralHealth"),0}});
 if(health>0)events.giveResource(hero->getOwner(),EGameResID::GOLD,health/2);
}
std::string CGMysteriousCave::describeHeroEffects(const CGHeroInstance * hero)
{
 if(!hero)return {};
 std::string text;
 for(const auto & [effect,label]:std::array<std::pair<const char *,const char *>,7>{{
  {"enchanted","Prayer, Haste and Shield"},{"speed","Army speed +3"},{"health","Army health +100%"},
  {"sight","Scouting radius 12"},{"goldLoot","Neutral gold loot"},{"scourge","Scourge protection"},{"builder","Builder"}}})
 {
  const int days=heroDays(*hero->cb,hero,effect);
  if(days>0)text+=std::string(label)+": "+std::to_string(days) +" human-player turns remaining\n";
 }
 const auto * global=controller(*hero->cb);
 if(global)for(const auto & [effect,label]:std::array<std::pair<const char *,const char *>,3>{{
  {"dailyResources","Daily rare resources"},{"dailyExperience","Daily experience"},{"dailyMovement","Daily movement (cannot dig)"}}})
 {
  const int end=global->read(heroKey(hero,std::string(effect)+":end"));
  if(global->read(heroKey(hero,effect))>0&&hero->cb->getDate(Date::DAY)<=end)
   text+=std::string(label)+": "+std::to_string(global->read(heroKey(hero,effect)))+" until day "+std::to_string(end)+"\n";
 }
 return text;
}
bool CGMysteriousCave::hasDailyMovementBlessing(const CGHeroInstance * hero)
{
 if(!hero)return false;const auto * global=controller(*hero->cb);if(!global)return false;
 const int day=hero->cb->getDate(Date::DAY);
 return global->read(heroKey(hero,"dailyMovement"))>0&&day>=global->read(heroKey(hero,"dailyMovement:start"))&&day<=global->read(heroKey(hero,"dailyMovement:end"));
}
bool CGMysteriousCave::isBuilder(const CGHeroInstance * hero)
{
 return hero&&heroDays(*hero->cb,hero,"builder")>0;
}
int CGMysteriousCave::builderDemolitionsRemaining(const CGHeroInstance * hero,const CGTownInstance * town)
{
 if(!isBuilder(hero)||!builderPresent(hero,town))return 0;
 const auto * global=controller(*hero->cb);
 const int day=hero->cb->getDate(Date::DAY);
 const int used=global->read(townKey(town,"builderDemolitionDay"))==day?global->read(townKey(town,"builderDemolitionCount")):0;
 return std::max(0,10-used);
}
bool CGMysteriousCave::consumeBuilderDemolition(IGameEventCallback & events,const CGHeroInstance * hero,const CGTownInstance * town)
{
 const int remaining=builderDemolitionsRemaining(hero,town);if(remaining<=0)return false;
 const auto * global=controller(*hero->cb);
 global->write(events,{{townKey(town,"builderDemolitionDay"),hero->cb->getDate(Date::DAY)},
  {townKey(town,"builderDemolitionCount"),11-remaining}});
 return true;
}
JsonNode CGMysteriousCave::builderSnapshot(const CGHeroInstance * hero,const CGTownInstance * town)
{
 JsonNode result;result["buildings"].Vector();
 const bool allowed=isBuilder(hero)&&builderPresent(hero,town);
 result["available"].Bool()=allowed;
 if(!town)return result;
 const int faction=sourceTownFaction(town);
 result["town"].Integer()=town->id.getNum();
 result["faction"].Integer()=town->getFactionID().getNum();
 result["sourceFaction"].Integer()=faction;
 result["goonkFaction"].Integer()=FactionID::decode("goonk:goonk");
 result["remaining"].Integer()=builderDemolitionsRemaining(hero,town);
 const int ready=townRebuildReadyDay(town);
 result["ruined"].Bool()=ready>0;
 result["rebuildReady"].Bool()=allowed&&ready>0&&town->cb->getDate(Date::DAY)>=ready;
 result["rebuildReadyDay"].Integer()=ready;
 result["rebuildGold"].Integer()=faction>=0&&faction<9?era::caveDemolitionRules.at(faction).at(16).gold+(builderDemolitionsRemaining(hero,town)>0?era::caveDemolitionSurcharges.at(10-builderDemolitionsRemaining(hero,town)):0):0;
 if(faction<0||faction>=9)return result;
 const int remaining=builderDemolitionsRemaining(hero,town);
 const int surcharge=remaining>0?era::caveDemolitionSurcharges.at(10-remaining):0;
 for(const auto building:town->getBuildings())
 {
  const int id=building.getNum();if(id<0||id>=44)continue;
  const auto & rule=era::caveDemolitionRules.at(faction).at(id);
  JsonNode item;item["building"].Integer()=id;
  const auto name=town->getTown()->buildings.find(building);
  item["name"].String()=name==town->getTown()->buildings.end()?std::to_string(id):name->second->getNameTranslated();
  // Native upgrades outside the source 44-building tariff have no source
  // salvage. Losing the final hall destroys them explicitly with the ruin.
  bool finalHall=id>=10&&id<=13;
  for(int hall=10;hall<=13;++hall)if(hall!=id&&town->hasBuilt(BuildingID(hall)))finalHall=false;
  if(finalHall)
  {
   for(const auto extension:town->getBuildings())if(extension.getNum()>=44)
   {
    JsonNode lost;lost["building"].Integer()=extension.getNum();
    const auto definition=town->getTown()->buildings.find(extension);
    lost["name"].String()=definition==town->getTown()->buildings.end()?std::to_string(extension.getNum()):definition->second->getNameTranslated();
    item["ruinExtensionLosses"].Vector().push_back(lost);
   }
   for(int level=0;level<town->creatures.size();++level)
   {
    bool extended=false;
    if(level<8)for(int upgrade=(level>=7?0:2);upgrade<6;++upgrade)
     if(town->hasBuilt(BuildingID::getDwellingFromLevel(level,upgrade)))extended=true;
    if(extended&&town->creatures[level].first>0)
    {
     JsonNode lost;lost["tier"].Integer()=level+1;lost["count"].Integer()=town->creatures[level].first;
     item["ruinStockLosses"].Vector().push_back(lost);
    }
   }
  }
  const int occupant=demolitionOccupant(town,id),count=occupantCount(town,occupant);
  item["occupants"].Integer()=count;item["evacuationGold"].Integer()=occupantPrice(occupant,count);
  item["gold"].Integer()=rule.gold+surcharge;
  if(id==26){item["recoverGrailGold"].Integer()=10000+surcharge;item["recoverGrailAvailable"].Bool()=allowed&&ArtifactUtils::isBackpackFreeSlots(hero)&&hero->cb->getResource(hero->getOwner(),EGameResID::GOLD)>=10000+surcharge;}
  bool dependent=false;
  for(const auto other:town->getBuildings())
   if(other.getNum()>=0&&other.getNum()<44&&(rule.dependencies&(UINT64_C(1)<<other.getNum())))dependent=true;
  std::string reason;
  if(!allowed)reason="The Builder must be present in an owned town.";
  else if(ready>0)reason="Rebuild this ruined town first.";
  else if(remaining<=0)reason="Ten demolitions have already been performed in this town today.";
  else if(dependent)reason="Demolish the dependent buildings first.";
  else if(hero->Slots().empty())reason="The Builder needs an army.";
  else if(hero->cb->getResource(hero->getOwner(),EGameResID::GOLD)<rule.gold+surcharge)reason="Not enough gold.";
  if(id==26)item["recoverGrailAvailable"].Bool()=item["recoverGrailAvailable"].Bool()&&reason.empty();
  item["fightEnabled"].Bool()=count>0&&allowed&&ready==0&&remaining>0&&!dependent&&!hero->Slots().empty();
  item["enabled"].Bool()=reason.empty();item["reason"].String()=reason;
  for(const int value:rule.salvage){JsonNode resource;resource.Integer()=value;item["salvage"].Vector().push_back(resource);}
  result["buildings"].Vector().push_back(item);
 }
 return result;
}
bool CGMysteriousCave::builderDemolish(IGameEventCallback & events,const CGHeroInstance * hero,const CGTownInstance * town,int building,bool recoverGrail,bool payOccupants)
{
 const JsonNode snapshot=builderSnapshot(hero,town);
 const JsonNode * selected=nullptr;
 for(const auto & item:snapshot["buildings"].Vector())if(item["building"].Integer()==building)selected=&item;
 if(!selected||!(*selected)["enabled"].Bool())return false;
 const int faction=sourceTownFaction(town);
 const auto & rule=era::caveDemolitionRules.at(faction).at(building);
 const int occupant=demolitionOccupant(town,building),count=occupantCount(town,occupant),evacuation=occupantPrice(occupant,count);
 if(count>0&&!payOccupants)return false;
 const int fee=static_cast<int>((*selected)[recoverGrail?"recoverGrailGold":"gold"].Integer());
 if(evacuation<0||static_cast<std::int64_t>(fee)+evacuation>hero->cb->getResource(hero->getOwner(),EGameResID::GOLD))return false;
 if(recoverGrail&&(building!=26||!(*selected)["recoverGrailAvailable"].Bool()))return false;
 if(recoverGrail&&!events.giveHeroNewArtifact(hero,ArtifactID::GRAIL,ArtifactPosition::FIRST_AVAILABLE))return false;
 if(!consumeBuilderDemolition(events,hero,town))return false;
 ResourceSet resources;
 if(!recoverGrail)for(int i=0;i<6;++i)resources[GameResID(i)]=rule.salvage.at(i);
 resources[EGameResID::GOLD]=-fee-evacuation;
 if(count>0){SetAvailableCreatures stock;stock.tid=town->id;stock.creatures=town->creatures;stock.creatures.at(occupant%7).first=0;events.sendAndApply(stock);}
 events.giveResources(hero->getOwner(),resources);
 RazeStructures removal;removal.tid=town->id;removal.bid.insert(BuildingID(building));removal.destroyed=town->destroyed+1;
 events.sendAndApply(removal);
 bool hall=false;for(int id=10;id<=13;++id)if(town->hasBuilt(BuildingID(id)))hall=true;
 const auto * global=controller(*town->cb);
 if(hall)global->write(events,{{townKey(town,"damage"),std::min(3,townDemolitionDamage(town)+1)}});
 if(!hall)
 {
  // An extended native dwelling has no equivalent in the source bitmask.
  // Clear its associated stock before removing every building, so a ruined
  // Goonk town cannot produce/recruit from an orphaned T8 dwelling.
  SetAvailableCreatures stock;stock.tid=town->id;stock.creatures=town->creatures;
  bool changed=false;
  for(int level=0;level<stock.creatures.size();++level)
  {
   bool extended=false;
   if(level<8)for(int upgrade=(level>=7?0:2);upgrade<6;++upgrade)
    if(town->hasBuilt(BuildingID::getDwellingFromLevel(level,upgrade)))extended=true;
   if(extended){stock.creatures[level].first=0;stock.creatures[level].second.clear();changed=true;}
  }
  if(changed)events.sendAndApply(stock);
  RazeStructures clear;clear.tid=town->id;clear.destroyed=town->destroyed;
  clear.bid=town->getBuildings();
  if(!clear.bid.empty())events.sendAndApply(clear);
  setTownRebuildReadyDay(events,town,town->cb->getDate(Date::DAY)+6);
  global->write(events,{{townKey(town,"damage"),-1}});
 }
 events.setObjPropertyValue(town->id,ObjProperty::ERA_CAVE_TOWN_DAMAGE,townDemolitionDamage(town));
 return true;
}
bool CGMysteriousCave::builderRebuild(IGameEventCallback & events,IGameRandomizer & randomizer,const CGHeroInstance * hero,const CGTownInstance * town,int faction)
{
 if(!isBuilder(hero)||!builderPresent(hero,town)||faction<0)return false;
 if(faction>=9&&faction!=FactionID::decode("goonk:goonk"))return false;
 const int ready=townRebuildReadyDay(town);
 if(ready<=0||town->cb->getDate(Date::DAY)<ready)return false;
 const int oldFaction=sourceTownFaction(town);if(oldFaction<0||oldFaction>=9||hero->Slots().empty())return false;
 const auto & rule=era::caveDemolitionRules.at(oldFaction).at(16);
 const int remaining=builderDemolitionsRemaining(hero,town);if(remaining<=0)return false;
 const int fee=rule.gold+era::caveDemolitionSurcharges.at(10-remaining);
 if(hero->cb->getResource(hero->getOwner(),EGameResID::GOLD)<fee)return false;
 ResourceSet salvage;for(int i=0;i<6;++i)salvage[GameResID(i)]=rule.salvage.at(i);salvage[EGameResID::GOLD]=-fee;
 events.giveResources(hero->getOwner(),salvage);
 // Native extended buildings do not fit the original six-byte bitmask. Remove
 // them too before changing faction, so no old-faction building ID survives.
 RazeStructures oldBuildings;oldBuildings.tid=town->id;oldBuildings.bid=town->getBuildings();oldBuildings.destroyed=town->destroyed;
 if(!oldBuildings.bid.empty())events.sendAndApply(oldBuildings);
 events.setObjPropertyValue(town->id,ObjProperty::ERA_CAVE_TOWN_FACTION,faction);
 for(const auto & [id,building]:town->getTown()->buildings)
  if(!building->rewardableObjectInfo.getParameters().isNull())
  {
   TownRewardableBuildingInstance generated(const_cast<CGTownInstance *>(town),id,randomizer);
   events.setRewardableObjectConfiguration(town->id,id,generated.configuration);
  }
 NewStructures hall;hall.tid=town->id;hall.bid.insert(BuildingID(10));hall.built=town->built;
 events.sendAndApply(hall);
 clearTownRebuild(events,town);
 const auto * global=controller(*town->cb);global->write(events,{{townKey(town,"damage"),0}});
 events.setObjPropertyValue(town->id,ObjProperty::ERA_CAVE_TOWN_DAMAGE,0);
 return true;
}
bool CGMysteriousCave::builderFightOccupants(IGameEventCallback & events,const CGHeroInstance * hero,const CGTownInstance * town,int building)
{
 const auto snapshot=builderSnapshot(hero,town);
 bool enabled=false;for(const auto & item:snapshot["buildings"].Vector())if(item["building"].Integer()==building)enabled=item["fightEnabled"].Bool();
 if(!enabled)return false;
 const int occupant=demolitionOccupant(town,building),count=occupantCount(town,occupant);
 if(count<=0)return false;
 const auto * global=controller(*hero->cb);if(!global||global->read("eraCave:demolition:hero",-1)>=0)return false;
 const int tier=occupant%7,upgrade=occupant/7;
 const auto & creatures=town->getTown()->creatures;
 if(tier>=creatures.size()||upgrade>=creatures.at(tier).size())return false;
 const CreatureID creature=creatures.at(tier).at(upgrade);
 global->write(events,{{"eraCave:demolition:hero",hero->id.getNum()},{"eraCave:demolition:town",town->id.getNum()},
  {"eraCave:demolition:building",building},{"eraCave:demolition:count",count},{"eraCave:demolition:creature",creature.getNum()}});
 // The Cave controller supplies a serialized, network-visible temporary defender.
 // The game handler installs its MapObjectVisitQuery before invoking this method.
 if(!events.insertNewStack(StackLocation(global->id,SlotID(0)),creature.toCreature(),count))
 {
  global->write(events,{{"eraCave:demolition:hero",-1}});return false;
 }
 events.startBattle(hero,global,town->visitablePos(),hero,nullptr,BattleLayout::createDefaultLayout(*hero->cb,hero,global),nullptr);
 return true;
}
void CGMysteriousCave::battleFinished(IGameEventCallback & events,const CGHeroInstance * hero,const BattleResult & result) const
{
 const int pending=read("eraCave:demolition:hero",-1);
 if(pending<0||(hero&&pending!=hero->id.getNum()))return;
 const auto * town=cb->getTown(ObjectInstanceID(read("eraCave:demolition:town",-1)));
 const int building=read("eraCave:demolition:building",-1);
 // CD aborts demolition after a defeat; survivors remain in the dwelling.
 if(hero&&result.winner==BattleSide::ATTACKER&&town&&builderPresent(hero,town))
 {
  const int occupant=demolitionOccupant(town,building);
  if(occupant>=0){SetAvailableCreatures stock;stock.tid=town->id;stock.creatures=town->creatures;stock.creatures.at(occupant%7).first=0;events.sendAndApply(stock);}
  builderDemolish(events,hero,town,building);
 }
 // The defender is only a battle carrier. Defeat/retreat can leave survivors
 // here, and the visiting hero may already be in the pool (null from getHero).
 // Always release both carrier and pending lock before the next attempt.
 if(hasStackAtSlot(SlotID(0)))events.eraseStack(StackLocation(id,SlotID(0)),true);
 write(events,{{"eraCave:demolition:hero",-1}});
}
int CGMysteriousCave::townDemolitionDamage(const CGTownInstance * town)
{
 if(!town)return 0;const auto * global=controller(*town->cb);return global?global->read(townKey(town,"damage")):0;
}
std::string CGMysteriousCave::townDemolitionAnimation(const CGTownInstance * town)
{
 const int damage=townDemolitionDamage(town);if(damage==0)return {};
 const int faction=sourceTownFaction(town);if(faction<0)return {};
 static constexpr const char * names[]={"cast","ramp","towr","infr","necr","dung","strn","fort","conf"};
 return std::string("tum-era/objects/avc")+names[faction]+std::to_string(damage<0?4:damage)+".def";
}
int CGMysteriousCave::townRebuildReadyDay(const CGTownInstance * town)
{
 if(!town)return 0;const auto * global=controller(*town->cb);if(!global)return 0;
 return global->read(townKey(town,"rebuildReadyDay"));
}
void CGMysteriousCave::setTownRebuildReadyDay(IGameEventCallback & events,const CGTownInstance * town,int day)
{
 if(!town||day<1)return;const auto * global=controller(*town->cb);if(!global)return;
 global->write(events,{{townKey(town,"rebuildReadyDay"),day}});
}
void CGMysteriousCave::clearTownRebuild(IGameEventCallback & events,const CGTownInstance * town)
{
 if(!town)return;const auto * global=controller(*town->cb);if(!global)return;
 global->write(events,{{townKey(town,"rebuildReadyDay"),0}});
}
void CGMysteriousCave::expireBuilder(IGameEventCallback & events,const CGHeroInstance * hero)
{
 if(!hero)return;const auto * global=controller(*hero->cb);if(!global)return;
 const bool activeObject=hero->cb->getObjInstance(hero->id)==hero;
 if(activeObject&&global->read(heroKey(hero,"builderSpecialtyMuted"))>0)
 {
  for(const auto & bonus:hero->getHeroType()->specialty)
  {
   GiveBonus addition(GiveBonus::ETarget::OBJECT,hero->id,*bonus);events.sendAndApply(addition);
  }
  RemoveBonus removal;removal.whoID=hero->id;removal.source=BonusSource::OTHER;removal.id=BonusSourceID(global->id);
  events.sendAndApply(removal);
 }
 std::map<std::string,int> changes={{heroKey(hero,"builder"),0}};
 if(activeObject)changes[heroKey(hero,"builderSpecialtyMuted")]=0;
 if(global->read("eraCave:builder",-1)==hero->id.getNum())changes["eraCave:builder"]=-1;
 global->write(events,changes);
}
bool CGMysteriousCave::wasVisited(PlayerColor) const{return read("eraCave:visited")>0||read("eraCave:subtypeVisited")>0;}
bool CGMysteriousCave::wasVisited(const CGHeroInstance *) const{return read("eraCave:visited")>0||read("eraCave:subtypeVisited")>0;}
std::string CGMysteriousCave::getHoverText(PlayerColor) const
{
 return wasVisited(PlayerColor::NEUTRAL)?"Mysterious Cave (visited)":"Mysterious Cave (not visited)";
}
std::string CGMysteriousCave::getHoverText(const CGHeroInstance * hero) const{return getHoverText(hero?hero->getOwner():PlayerColor::NEUTRAL);}
std::string CGMysteriousCave::getPopupText(PlayerColor player) const
{
 const auto * global=controller(*cb);
 return getHoverText(player)+(global&&global->read("eraCave:watcher")>0&&!wasVisited(player)?"\n"+choiceText(read("eraCave:choice")):"");
}
std::string CGMysteriousCave::getPopupText(const CGHeroInstance * hero) const{return getPopupText(hero?hero->getOwner():PlayerColor::NEUTRAL);}

VCMI_LIB_NAMESPACE_END
