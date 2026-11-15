// Real Heroes spell mechanics evaluated in an isolated battle. Adventure armies,
// mana and the suspended classic fight are untouched until the RTS result commits.
#pragma once
#include "../lib/battle/BattleLayout.h"
#include "../lib/battle/CObstacleInstance.h"
#include "../lib/gameState/GameStatePackVisitor.h"
#include "../lib/networkPacks/PacksForClient.h"
#include "../lib/networkPacks/PacksForClientBattle.h"
#include "../lib/networkPacks/SetStackEffect.h"
#include "../lib/CRandomGenerator.h"
#include "../lib/spells/Problem.h"
#include "../lib/spells/AbilityCaster.h"
#include "../lib/spells/ObstacleCasterProxy.h"
#include "../lib/battle/BattleAttackInfo.h"
namespace {
Point crossoverHexPoint(BattleHex hex){if(!hex.isValid())return Point(400,250);if(CPlayerInterface::battleInt){const auto point=CPlayerInterface::battleInt->fieldController->hexPositionLocal(hex).center();return Point(std::clamp(point.x,0,799),std::clamp(point.y*500/600,0,499));}return Point(std::clamp((hex.getX()-1)*800/15+26,0,799),std::clamp(hex.getY()*500/11+22,0,499));}
struct CrossoverSpellBattle final : BattleInfo {
 int magicRound=0;
 int32_t getRound()const override{return magicRound;}
 void nextRound()override{BattleInfo::nextRound();++magicRound;}
 explicit CrossoverSpellBattle(const BattleInfo & source,bool copyEffects=true):BattleInfo(source.cb,source.getLayout()) {
  magicRound=std::max(0,source.getRound());battleID=source.battleID;tile=source.tile;terrainType=source.terrainType;battlefieldType=source.battlefieldType;si=source.si;townID=source.townID;tacticDistance=0;
  for(auto side:{BattleSide::ATTACKER,BattleSide::DEFENDER})getSide(side)=source.getSide(side);
  for(const auto & s:source.stacks){
   std::unique_ptr<CStack> copy;
   if(s->base)copy=std::make_unique<CStack>(s->base,s->unitOwner(),s->unitId(),s->unitSide(),s->unitSlot());
   else {CStackBasicDescriptor descriptor(s->creatureId(),s->unitBaseAmount());copy=std::make_unique<CStack>(&descriptor,s->unitOwner(),s->unitId(),s->unitSide(),s->unitSlot());}
   copy->initialPosition=s->initialPosition;copy->localInit(this);for(const auto & bonus:s->getExportedBonusList())if(copyEffects&&bonus->source==BonusSource::SPELL_EFFECT)copy->addNewBonus(std::make_shared<Bonus>(*bonus));JsonNode state;s->save(state);copy->load(state);stacks.push_back(std::move(copy));
  }
  for(const auto & o:source.obstacles){if(auto spell=dynamic_cast<const SpellCreatedObstacle*>(o.get())){ObstacleChanges info;const_cast<SpellCreatedObstacle*>(spell)->toInfo(info);auto copy=std::make_shared<SpellCreatedObstacle>();copy->fromInfo(info);obstacles.push_back(copy);}else obstacles.push_back(o);}
 }
 ~CrossoverSpellBattle(){for(auto side:{BattleSide::ATTACKER,BattleSide::DEFENDER})getSide(side).armyObjectID=ObjectInstanceID::NONE;}
};
std::unique_ptr<CrossoverSpellBattle> crossoverMagicBattle;
int crossoverMagicMana=0,crossoverMagicInitialMana=0,crossoverMagicFrame=0,crossoverMagicRound=0;
std::map<int,int> crossoverMagicReady,crossoverMagicAutoReady;
JsonNode crossoverMagicEvents,crossoverMagicCachedCatalogue;bool crossoverMagicCatalogueDirty=true;
struct CrossoverMagicServer : ServerCallback {
 CrossoverSpellBattle & battle;CRandomGenerator rng;std::string error;std::map<uint32_t,int64_t> damageBeforeBarriers;
 void beforeSpellDamage(uint32_t id,int64_t amount)override{if(amount>0)damageBeforeBarriers[id]+=amount;}
 explicit CrossoverMagicServer(CrossoverSpellBattle & b):battle(b){}
 void complain(const std::string & text)override{error=text;}
 bool describeChanges()const override{return false;}
 vstd::RNG * getRNG()override{return &rng;}
 template<class T>void visit(T & pack){BattleStatePackVisitor visitor(battle);pack.visit(visitor);}
 void apply(CPackForClient & pack)override{
  if(auto * mana=dynamic_cast<SetMana*>(&pack)){if(const auto hero=battle.battleGetFightingHero(BattleSide::ATTACKER);hero&&hero->id==mana->hid)crossoverMagicMana=mana->mode==ChangeValueMode::ABSOLUTE?mana->val:crossoverMagicMana+mana->val;return;}
  if(auto * cast=dynamic_cast<BattleSpellCast*>(&pack)){publishCrossoverSpellEffects(cast->spellID,battle.battleID.getNum());if(cast->activeCast&&cast->castByHero){++battle.getSide(cast->side).castSpellsCount;battle.getSide(cast->side).usedSpellsHistory.push_back(cast->spellID);}JsonNode e;e["id"].Integer()=cast->spellID.getNum();e["caster"].Integer()=cast->casterStack;e["hex"].Integer()=cast->tile.toInt();const auto point=crossoverHexPoint(cast->tile);e["x"].Integer()=point.x;e["y"].Integer()=point.y;for(auto id:cast->affectedCres)e["targets"].Vector().push_back(JsonNode(double(id)));crossoverMagicEvents.Vector().push_back(e);return;}
  visit(pack);
 }
 void apply(BattleLogMessage & p)override{visit(p);}void apply(BattleStackMoved & p)override{visit(p);}void apply(BattleUnitsChanged & p)override{visit(p);}void apply(SetStackEffect & p)override{visit(p);}void apply(StacksInjured & p)override{visit(p);}void apply(BattleObstaclesChanged & p)override{visit(p);}void apply(CatapultAttack & p)override{visit(p);}
};
void resetCrossoverMagic(){crossoverMagicBattle.reset();crossoverMagicReady.clear();crossoverMagicAutoReady.clear();crossoverMagicCatalogueDirty=true;crossoverMagicFrame=crossoverMagicRound=0;}
CrossoverSpellBattle & prepareCrossoverMagic(const BattleInfo & source){
 if(!crossoverMagicBattle||crossoverMagicBattle->battleID!=source.battleID){resetCrossoverMagic();crossoverMagicBattle=std::make_unique<CrossoverSpellBattle>(source);const auto hero=source.battleGetFightingHero(BattleSide::ATTACKER);crossoverMagicMana=crossoverMagicInitialMana=hero?hero->mana:0;if(source.getSide(BattleSide::ATTACKER).castSpellsCount>0)crossoverMagicReady[-1]=96;}
 return *crossoverMagicBattle;
}
int crossoverSpellLevel(const CStack * stack,const CSpell * spell){
 int level=stack->getEffectLevel(spell);for(const auto & b:*stack->getBonusesOfType(BonusType::SPELL_AFTER_ATTACK))if(b->subtype.as<SpellID>()==spell->id&&b->parameters)level=std::max(level,b->parameters->toVector().at(0));return level;
}
JsonNode crossoverSpellDescriptor(const CSpell * spell,const spells::Caster * caster,int stack,int casts,bool passive,const CBattleInfoCallback & battle){
 JsonNode item;item["id"].Integer()=spell->id.getNum();item["key"].String()=spell->getJsonKey();item["name"].String()=spell->getNameTranslated();item["caster"].Integer()=stack;item["casts"].Integer()=casts;item["passive"].Bool()=passive;
 const int level=stack<0?caster->getSpellSchoolLevel(spell):crossoverSpellLevel(static_cast<const CStack*>(caster),spell);
 item["description"].String()=spell->isCreatureAbility()?spell->getNameTranslated():spell->getDescriptionTranslated(level);item["level"].Integer()=spell->getLevel();for(auto school:spell->schools)item["schools"].Vector().push_back(JsonNode(double(school.getNum())));item["cost"].Integer()=stack<0?battle.battleGetSpellCost(spell,static_cast<const CGHeroInstance*>(caster)):0;
 const CSpell::TargetInfo target(spell,level,stack<0?spells::Mode::HERO:passive?spells::Mode::PASSIVE:spells::Mode::CREATURE_ACTIVE);
 item["target"].String()=passive?"enemy":target.massive||target.type==spells::AimType::NO_TARGET?"none":target.type==spells::AimType::CREATURE?spell->isPositive()?"ally":spell->isNegative()?"enemy":"creature":"ground";
 if(spell->id==SpellID::TELEPORT)item["target"].String()="teleport";if(spell->id==SpellID::SACRIFICE)item["target"].String()="sacrifice";
 spells::detail::ProblemImpl problem;item["enabled"].Bool()=spell->canBeCast(problem,&battle,stack<0?spells::Mode::HERO:passive?spells::Mode::PASSIVE:spells::Mode::CREATURE_ACTIVE,caster);std::vector<std::string> reasons;problem.getAll(reasons);if(!reasons.empty())item["reason"].String()=reasons.front();
 if(spell->id==SpellID::RESURRECTION||spell->id==SpellID::ANIMATE_DEAD){
  spells::BattleCast cast(&battle,caster,stack<0?spells::Mode::HERO:spells::Mode::CREATURE_ACTIVE,spell);const auto mechanics=spell->battleMechanics(&cast);item["targets"].Vector();
  for(const auto * unit:battle.battleGetAllStacks()){spells::detail::ProblemImpl targetProblem;if(mechanics->canBeCastAt({battle::Destination(unit)},targetProblem))item["targets"].Vector().emplace_back(double(unit->unitId()));}
 }
 item["ready"].Integer()=crossoverMagicReady[stack];
 return item;
}
JsonNode crossoverMagicCatalogue(const BattleInfo & source){
 auto & battle=prepareCrossoverMagic(source);if(!crossoverMagicCatalogueDirty)return crossoverMagicCachedCatalogue;JsonNode result;result["mana"].Integer()=crossoverMagicMana;result["spent"].Integer()=std::max(0,crossoverMagicInitialMana-crossoverMagicMana);result["frame"].Integer()=crossoverMagicFrame;
 if(const auto hero=battle.battleGetFightingHero(BattleSide::ATTACKER);hero&&hero->hasSpellbook())for(const auto & entry:LIBRARY->spellh->objects){const auto spell=entry.get();if(spell->isCombat()&&!spell->isCreatureAbility()&&hero->canCastThisSpell(spell))result["spells"].Vector().push_back(crossoverSpellDescriptor(spell,hero,-1,-1,false,battle));}
 for(const auto & stack:battle.stacks)if(stack->unitSide()==BattleSide::ATTACKER&&stack->alive()){std::set<SpellID> seen;for(const auto type:{BonusType::SPELLCASTER,BonusType::SPELL_AFTER_ATTACK})for(const auto & bonus:*stack->getBonusesOfType(type)){const auto id=bonus->subtype.as<SpellID>();if(seen.insert(id).second)result["spells"].Vector().push_back(crossoverSpellDescriptor(id.toSpell(),stack.get(),stack->unitId(),type==BonusType::SPELLCASTER?stack->casts.available():-1,type==BonusType::SPELL_AFTER_ATTACK,battle));}}
 result["spells"].Vector();crossoverMagicCatalogueDirty=false;crossoverMagicCachedCatalogue=result;return result;
}
// Compare the native Heroes speed bonuses with and without temporary spell
// effects. This also handles entering RTS with Haste/Slow already active.
int crossoverMovementScale(const CStack & stack){
 const auto speed=Selector::type()(BonusType::STACKS_SPEED);
 const int ordinary=std::max(1,stack.valOfBonuses(speed.And(Selector::sourceTypeSel(BonusSource::SPELL_EFFECT).Not())));
 const int affected=std::max(1,stack.valOfBonuses(speed));
 return std::clamp(int(int64_t(affected)*1000/ordinary),100,10000);
}
BattleHex crossoverHex(int x,int y){int best=18,distance=0x7fffffff;for(int row=0;row<11;row++)for(int col=1;col<16;col++){const BattleHex hex(row*17+col);const auto point=crossoverHexPoint(hex);const int score=(point.x-x)*(point.x-x)+(point.y-y)*(point.y-y);if(score<distance){distance=score;best=hex.toInt();}}return BattleHex(best);}

JsonNode runCrossoverMagic(const JsonNode & request,const BattleInfo & original){
 auto & b=prepareCrossoverMagic(original);JsonNode response;response["sequence"]=request["sequence"];response["battleId"].Integer()=original.battleID.getNum();response["ok"].Bool()=false;
 const int frame=request["frame"].Integer();if(frame<crossoverMagicFrame||frame-crossoverMagicFrame>10000)throw std::runtime_error("Horloge du combat périmée.");crossoverMagicFrame=frame;crossoverMagicCatalogueDirty=true;
 std::set<int> occupied;for(const auto & obstacle:b.obstacles)for(auto hex:obstacle->getBlockedTiles())occupied.insert(hex.toInt());std::map<int,BattleHex> positions;std::map<int,std::tuple<int,int,int>> before;std::set<int> shielded;
 for(const auto & row:request["groups"].Vector()){
  const int id=row["id"].Integer();if(row["maxShields"].Integer()>0)shielded.insert(id);auto * s=b.getStack(id,false);if(!s)continue;const int hp=row["hp"].Integer(),maximum=s->getMaxHealth(),count=hp?(hp+maximum-1)/maximum:0;
  if(count<0||count>128||count>row["count"].Integer()||hp<0||hp>count*std::max(1,maximum))throw std::runtime_error("État de troupe invalide.");
  if(hp<s->getAvailableHealth())s->removeBonusesRecursive(Bonus::UntilBeingAttacked);
  JsonNode state;s->save(state);state["state"]["health"]["fullUnits"].Integer()=count?count-1:0;state["state"]["health"]["firstHPleft"].Integer()=count?hp-(count-1)*maximum:0;state["state"]["health"]["resurrected"].Integer()=std::max(0,s->health.getResurrected()-std::max(0,s->getCount()-count));state["state"]["ghost"].Bool()=count==0&&(s->summoned||s->cloned);state["state"]["ghostPending"].Bool()=false;s->load(state);
  auto hex=crossoverHex(row["x"].Integer(),row["y"].Integer());if(count){int nearest=100000,best=-1;for(int r=0;r<11;r++)for(int c=1;c<16;c++){const int candidate=r*17+c;const BattleHex spot(candidate),rear=spot.cloneInDirection(s->unitSide()==BattleSide::ATTACKER?BattleHex::EDir::LEFT:BattleHex::EDir::RIGHT);if(occupied.count(candidate)||(s->doubleWide()&&(!rear.isAvailable()||occupied.count(rear.toInt()))))continue;const int distance=(r-hex.getY())*(r-hex.getY())+(c-hex.getX())*(c-hex.getX());if(distance<nearest){nearest=distance;best=candidate;}}if(best<0)throw std::runtime_error("Le terrain Heroes est trop chargé pour cette formation.");hex=BattleHex(best);occupied.insert(best);if(s->doubleWide())occupied.insert(hex.cloneInDirection(s->unitSide()==BattleSide::ATTACKER?BattleHex::EDir::LEFT:BattleHex::EDir::RIGHT).toInt());}s->position=hex;positions[id]=hex;
 }
 for(const auto & s:b.stacks)before[s->unitId()]={s->getAvailableHealth(),s->getCount(),s->getMaxHealth()};
 while(crossoverMagicRound<frame/96){b.nextRound();++crossoverMagicRound;}
 crossoverMagicEvents=JsonNode();crossoverMagicEvents.Vector();CrossoverMagicServer server(b);
 // Exact after-attack abilities use actual native weapon contacts, not a timer.
 for(const auto & hit:request["hits"].Vector()){
  if(hit["fireShield"].Bool()){const auto source=b.getStack(hit["source"].Integer(),false),target=b.getStack(hit["target"].Integer(),false);if(source&&target){publishCrossoverSpellEffects(SpellID(29),b.battleID.getNum());JsonNode event;event["id"].Integer()=29;event["caster"].Integer()=source->unitId();const auto point=crossoverHexPoint(target->getPosition());event["x"].Integer()=point.x;event["y"].Integer()=point.y;event["targets"].Vector().emplace_back(double(target->unitId()));crossoverMagicEvents.Vector().push_back(event);}continue;}
  auto * source=b.getStack(hit["source"].Integer());auto * target=b.getStack(hit["target"].Integer());if(!source||!target||crossoverMagicAutoReady[source->unitId()]>frame)continue;crossoverMagicAutoReady[source->unitId()]=frame+24;
  for(const auto & bonus:*source->getBonusesOfType(BonusType::SPELL_AFTER_ATTACK)){if(server.getRNG()->nextInt(99)>=bonus->val)continue;const auto spell=bonus->subtype.as<SpellID>().toSpell();const int level=bonus->parameters?bonus->parameters->toVector().at(0):0;spells::AbilityCaster caster(source,level);spells::BattleCast cast(&b,&caster,spells::Mode::PASSIVE,spell);cast.cast(&server,{battle::Destination(target)});}
 }
 // Spell-created traps and hazards retain their native trigger mechanics.
 for(const auto & hit:request["hits"].Vector())if(!hit["obstacle"].isNull()){const int id=hit["obstacle"].Integer();for(const auto & o:b.obstacles)if(o->uniqueID==id)if(auto* target=b.getStack(hit["target"].Integer())){if(!o->getAffectedTiles().empty()){target->position=o->getAffectedTiles().front();positions[target->unitId()]=target->position;}}}
 const auto triggerObstacles=b.obstacles;for(const auto & obstacle:triggerObstacles)if(const auto o=dynamic_cast<const SpellCreatedObstacle*>(obstacle.get());o&&o->getTrigger().hasValue())for(const auto & unit:b.stacks)if(unit->alive()&&o->getAffectedTiles().contains(unit->getPosition())&&std::any_of(request["hits"].Vector().begin(),request["hits"].Vector().end(),[&](const JsonNode & hit){return !hit["obstacle"].isNull()&&hit["obstacle"].Integer()==o->uniqueID&&hit["target"].Integer()==unit->unitId();})){
  spells::ObstacleCasterProxy caster(b.getSidePlayer(o->casterSide),b.battleGetFightingHero(o->casterSide),*o);spells::BattleCast cast(&b,&caster,spells::Mode::PASSIVE,o->getTrigger().toSpell());cast.cast(&server,{battle::Destination(unit.get())});if(o->removeOnTrigger)b.removeObstacle(o->uniqueID);
 }

 const int casterId=request["caster"].Integer(),spellId=request["spell"].Integer();const bool sync=request["sync"].Bool();
 if(!sync){
  const auto catalog=crossoverMagicCatalogue(original);const JsonNode * admitted=nullptr;for(const auto & entry:catalog["spells"].Vector())if(entry["caster"].Integer()==casterId&&entry["id"].Integer()==spellId)admitted=&entry;
  if(!admitted)throw std::runtime_error("Sort absent du livre ou des capacités de cette créature.");
  const bool passive=(*admitted)["passive"].Bool();const auto spell=SpellID(spellId).toSpell();const auto hero=b.battleGetFightingHero(BattleSide::ATTACKER);auto * stack=casterId<0?nullptr:b.getStack(casterId);
  if(crossoverMagicReady[casterId]>frame||(!passive&&casterId>=0&&(!stack||stack->casts.available()<1))||(*admitted)["cost"].Integer()>crossoverMagicMana)throw std::runtime_error("Sort en recharge ou ressources insuffisantes.");
  const spells::Caster * caster=casterId<0?static_cast<const spells::Caster*>(hero):static_cast<const spells::Caster*>(stack);if(!caster)throw std::runtime_error("Lanceur indisponible.");
  spells::AbilityCaster ability(stack,stack?crossoverSpellLevel(stack,spell):0);if(passive)caster=&ability;
  spells::BattleCast cast(&b,caster,casterId<0?spells::Mode::HERO:passive?spells::Mode::PASSIVE:spells::Mode::CREATURE_ACTIVE,spell);if(stack)cast.setSpellLevel(crossoverSpellLevel(stack,spell));
  battle::Target targets;const int targetId=request["target"].Integer();if(targetId>=0){const auto target=b.getStack(targetId,false);if(!target)throw std::runtime_error("Cible disparue.");targets.emplace_back(target);}else if((*admitted)["target"].String()=="none")targets.emplace_back();else targets.emplace_back(crossoverHex(request["x"].Integer(),request["y"].Integer()));
  if(spell->id==SpellID::TELEPORT)targets.emplace_back(crossoverHex(request["x"].Integer(),request["y"].Integer()));if(spell->id==SpellID::SACRIFICE){const auto second=b.getStack(request["secondTarget"].Integer());if(!second)throw std::runtime_error("Choisis une seconde troupe vivante à sacrifier.");targets.emplace_back(second);}
  const auto mechanics=spell->battleMechanics(&cast);spells::detail::ProblemImpl problem;if(!mechanics->canBeCastAt(targets,problem)){std::vector<std::string> reasons;problem.getAll(reasons);throw std::runtime_error(reasons.empty()?"Choisis une cible valide pour ce sort.":reasons.front());}
  cast.cast(&server,targets);if(!server.error.empty())throw std::runtime_error(server.error);crossoverMagicReady[casterId]=casterId<0?(frame/96+1)*96:frame+24;
 }
 response["ok"].Bool()=true;crossoverMagicCatalogueDirty=true;response["catalogue"]=crossoverMagicCatalogue(original);response["events"]=crossoverMagicEvents;
 int totals[2]={0,0};for(const auto & s:b.stacks)if(s->alive())totals[s->unitSide()==BattleSide::ATTACKER?0:1]+=s->getCount();if(totals[0]>128||totals[1]>128||b.stacks.size()>128)throw std::runtime_error("Ce terrain accepte au maximum 128 créatures par camp.");
 for(const auto & s:b.stacks){JsonNode row;row["id"].Integer()=s->unitId();row["side"].Integer()=s->unitSide()==BattleSide::ATTACKER?0:1;row["owner"].Integer()=b.battleGetOwner(s.get())==b.getSidePlayer(BattleSide::ATTACKER)?0:1;row["count"].Integer()=s->isGhost()?0:s->getCount();row["hp"].Integer()=s->isGhost()?0:s->getAvailableHealth();row["persistentCount"].Integer()=s->isGhost()?0:std::max(0,s->getCount()-s->health.getResurrected());row["maxHp"].Integer()=s->getMaxHealth();if(before.count(s->unitId())){const auto [health,count,maximum]=before.at(s->unitId());row["healthDelta"].Integer()=s->getAvailableHealth()-int64_t(health)*s->getMaxHealth()/std::max(1,maximum);row["revived"].Integer()=std::max(0,s->getCount()-count);}else {row["healthDelta"].Integer()=0;row["revived"].Integer()=0;}row["removed"].Bool()=s->isGhost()||!s->alive();row["attack"].Integer()=s->getAttack(s->canShoot());row["defense"].Integer()=s->getDefense(false);row["damageMin"].Integer()=s->getMinDamage(s->canShoot());row["damageMax"].Integer()=s->getMaxDamage(s->canShoot());row["speed"].Integer()=s->getMovementRange();row["movementScale"].Integer()=crossoverMovementScale(*s);row["shooter"].Bool()=s->canShoot();row["disabled"].Bool()=!s->canMove();row["berserk"].Bool()=s->hasBonusOfType(BonusType::ATTACKS_NEAREST_CREATURE);row["cloned"].Bool()=s->cloned;row["luck"].Integer()=s->luckVal();row["morale"].Integer()=s->moraleVal();row["retaliations"].Integer()=s->hasBonusOfType(BonusType::ADDITIONAL_RETALIATION)?s->valOfBonuses(BonusType::ADDITIONAL_RETALIATION):0;row["creature"].String()=s->unitType()->getJsonKey();row["name"].String()=s->getName();row["summoned"].Bool()=s->summoned||s->cloned;
  const auto hex=s->getPosition();const auto point=crossoverHexPoint(hex);row["x"].Integer()=point.x;row["y"].Integer()=point.y;row["moved"].Bool()=!positions.count(s->unitId())||positions[s->unitId()]!=hex;
  row["meleeReduction"].Integer()=s->valOfBonuses(BonusType::GENERAL_DAMAGE_REDUCTION,BonusCustomSubtype::damageTypeMelee);row["rangedReduction"].Integer()=s->valOfBonuses(BonusType::GENERAL_DAMAGE_REDUCTION,BonusCustomSubtype::damageTypeRanged);row["fireShield"].Integer()=s->valOfBonuses(BonusType::FIRE_SHIELD);for(auto id:s->activeSpells())row["effects"].Vector().push_back(JsonNode(double(id.getNum())));response["groups"].Vector().push_back(row);
 }
 CrossoverSpellBattle baselineBattle(b,false);
 for(const auto & a:b.stacks)if(a->alive())for(const auto & d:b.stacks)if(d->alive()&&a->unitId()!=d->unitId()){
  const auto oldA=baselineBattle.battleGetUnitByID(a->unitId()),oldD=baselineBattle.battleGetUnitByID(d->unitId());if(!oldA||!oldD)continue;JsonNode row;row["source"].Integer()=a->unitId();row["target"].Integer()=d->unitId();
  for(bool ranged:{false,true}){BattleAttackInfo attack(a.get(),d.get(),0,ranged),baseline(oldA,oldD,0,oldA->canShoot());baseline.attackerPos=attack.attackerPos;baseline.defenderPos=attack.defenderPos;const auto now=b.battleEstimateDamage(attack).damage,was=baselineBattle.battleEstimateDamage(baseline).damage;const double current=double(now.min+now.max)/std::max(1,a->getCount()),previous=double(was.min+was.max)/std::max(1,oldA->getCount());row[ranged?"ranged":"melee"].Integer()=std::clamp(int(1000*current/std::max(1.,previous)),0,100000);}
  response["damageRules"].Vector().push_back(row);
 }
 for(const auto & obstacle:b.obstacles){JsonNode row;row["id"].Integer()=obstacle->uniqueID;row["blocks"].Bool()=obstacle->blocksTiles();row["stops"].Bool()=obstacle->stopsMovement();row["triggers"].Bool()=obstacle->getTrigger().hasValue();for(auto hex:obstacle->getAffectedTiles()){JsonNode point;const auto at=crossoverHexPoint(hex);point["x"].Integer()=at.x;point["y"].Integer()=at.y;row["tiles"].Vector().push_back(point);}response["obstacles"].Vector().push_back(row);}
 publishCrossoverArt(b);return response;
}

std::shared_ptr<SetStackEffect> crossoverResumeEffects(){
 if(!crossoverMagicBattle)return nullptr;auto result=std::make_shared<SetStackEffect>();result->battleID=crossoverMagicBattle->battleID;
 for(const auto & stack:crossoverMagicBattle->stacks){std::vector<Bonus> bonuses;for(const auto & bonus:stack->getExportedBonusList())if(bonus->source==BonusSource::SPELL_EFFECT)bonuses.push_back(*bonus);result->toAdd.emplace_back(stack->unitId(),bonuses);}return result;
}
std::string crossoverResumeSnapshot(){
 if(!crossoverMagicBattle)return {};JsonNode result;result["mana"].Integer()=crossoverMagicMana;result["heroCasts"].Integer()=crossoverMagicBattle->getSide(BattleSide::ATTACKER).castSpellsCount;
 for(const auto & stack:crossoverMagicBattle->stacks){JsonNode row;row["id"].Integer()=stack->unitId();row["type"].Integer()=stack->creatureId().getNum();row["side"].Integer()=stack->unitSide()==BattleSide::ATTACKER?0:1;row["count"].Integer()=stack->getCount();row["hp"].Integer()=stack->getAvailableHealth();row["maxHp"].Integer()=stack->getMaxHealth();row["temporary"].Bool()=stack->summoned||stack->cloned;stack->save(row["unitState"]);
  battle::UnitInfo info;info.id=stack->unitId();info.type=stack->creatureId();info.count=stack->unitBaseAmount();info.side=stack->unitSide();info.position=stack->getPosition();info.summoned=stack->summoned;info.save(row["info"]);
  result["stacks"].Vector().push_back(row);
 }
 for(const auto & obstacle:crossoverMagicBattle->obstacles)if(auto * spell=dynamic_cast<SpellCreatedObstacle*>(obstacle.get())){ObstacleChanges info;spell->toInfo(info);JsonNode row;row["id"].Integer()=info.id;row["data"]=info.data;result["obstacles"].Vector().push_back(row);}
 return result.toCompactString();
}

}
extern "C" void EMSCRIPTEN_KEEPALIVE vcmiCrossoverMagic(const char * input,int length){
 if(!input||length<2||length>1024*1024)return;std::string copied(input,length);
 ENGINE->dispatchMainThread([copied](){JsonNode request(copied.data(),copied.size(),"crossover magic"),response;response["sequence"]=request["sequence"];std::unique_ptr<CrossoverSpellBattle> previous;const auto ready=crossoverMagicReady;const int mana=crossoverMagicMana,frame=crossoverMagicFrame,round=crossoverMagicRound;try{const auto active=CPlayerInterface::battleInt?dynamic_cast<const BattleInfo*>(CPlayerInterface::battleInt->getBattle()->getBattle()):nullptr;if(!active||!active->crossover||active->battleID.getNum()!=request["battleId"].Integer())throw std::runtime_error("Combat crossover indisponible.");prepareCrossoverMagic(*active);previous=std::move(crossoverMagicBattle);crossoverMagicBattle=std::make_unique<CrossoverSpellBattle>(static_cast<const BattleInfo&>(*previous));response=runCrossoverMagic(request,*active);}catch(const std::exception & e){if(previous)crossoverMagicBattle=std::move(previous);crossoverMagicReady=ready;crossoverMagicMana=mana;crossoverMagicFrame=frame;crossoverMagicRound=round;crossoverMagicCatalogueDirty=true;response["ok"].Bool()=false;response["error"].String()=e.what();}auto text=strdup(response.toCompactString().c_str());MAIN_THREAD_ASYNC_EM_ASM({try{window.dispatchEvent(new CustomEvent('goonk-crossover-magic',{detail:JSON.parse(UTF8ToString($0))}));}finally{_free($0);}},text);});
}
