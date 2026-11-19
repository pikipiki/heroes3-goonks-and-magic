/* Original campaign event host; GPL-2.0-or-later. */
#include "StdInc.h"
#include "SourceCampaignProcessor.h"
#include "EraCampaignWogOptions.h"
#include "EraMithrilSiteTiles.h"
#include "EraSourceFogRuntime.h"
#include "EraSourceArtifactGrantRuntime.h"
#include "../CGameHandler.h"
#include "../processors/NewTurnProcessor.h"
#include "../processors/TurnOrderProcessor.h"
#include "../queries/CQuery.h"
#include "../queries/BattleQueries.h"
#include "../queries/MapQueries.h"
#include "../queries/QueriesProcessor.h"
#include "../queries/VisitQueries.h"
#include "../../lib/era/EraCampaignExecutor.h"
#include "../../lib/era/EraCampaignJson.h"
#include "../../lib/era/EraCampaignDialogs.h"
#include "../../lib/era/EraCampaignPictures.h"
#include "../../lib/era/EraCampaignObjectAccess.h"
#include "../../lib/era/EraCampaignSlotCurseRule.h"
#include "../../lib/era/EraCampaignEventTemplate.h"
#include "../../lib/era/EraCampaignHints.h"
#include "../../lib/era/EraTileProperties.h"
#include "../../lib/era/EraDirectArtifactCount.h"
#include "../../lib/era/EraCampaignDeployment.h"
#include "../../lib/era/EraCampaignArtifactRule.h"
#include "../../lib/era/EraCampaignChestRule.h"
#include "../../lib/era/EraCampaignTownRule.h"
#include "../../lib/era/EraCampaignTerrainRule.h"
#include "../../lib/era/EraCampaignDemolition.h"
#include "../../lib/era/EraCampaignFire.h"
#include "../../lib/era/EraCampaignHeroExperienceRule.h"
#include "../../lib/era/EraCampaignDrawingDepth.h"
#include "../../lib/era/EraCampaignRemovalBatch.h"
#include "../../lib/era/EraCampaignWanderingRule.h"
#include "../../lib/era/EraCampaignCreatureAttributes.h"
#include "../../lib/era/EraCreaturePrices.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/era/EraCampaignMedia.h"
#include "../../lib/era/EraCampaignTimers.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
#include "../../lib/GameLibrary.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/CSkillHandler.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/StartInfo.h"
#include "../../lib/campaign/CampaignState.h"
#include "../../lib/era/EraCampaignCarryover.h"
#include "../../lib/era/EraCampaignCalendarJson.h"
#include "../../lib/era/EraCampaignTownClockJson.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/mapping/CCastleEvent.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/mapObjects/CGPandoraBox.h"
#include "../../lib/mapObjects/CGCreature.h"
#include "../../lib/mapObjects/CGDwelling.h"
#include "../../lib/mapObjects/MiscObjects.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/mapObjects/CGMysteriousCave.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/networkPacks/SourceCampaignChange.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/PacksForServer.h"
#include "../../lib/networkPacks/ArtifactLocation.h"
#include "../../lib/networkPacks/StackLocation.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/modding/IdentifierStorage.h"
#include "../../lib/modding/ModScope.h"
#include "../../lib/bonuses/Bonus.h"
#include "../../lib/battle/BattleLayout.h"
#include "../../lib/battle/BattleInfo.h"
#include "../../lib/battle/BattleAction.h"
#include "../../lib/battle/CObstacleInstance.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/CStack.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/texts/CGeneralTextHandler.h"
#include "../../lib/entities/hero/CHero.h"
#include "../../lib/entities/faction/CTown.h"
#include "../../lib/entities/hero/CHeroHandler.h"
#include "../../lib/mapping/MapFormatSettings.h"
#include "../../lib/mapObjectConstructors/CObjectClassesHandler.h"
#include "../../lib/mapObjectConstructors/AObjectTypeHandler.h"
#include "../../lib/mapObjectConstructors/CommonConstructors.h"
#include "../../lib/mapObjects/CGResource.h"
#include "../../lib/mapObjects/ObjectTemplate.h"

using namespace era_campaign;
namespace
{
void require(bool test,const std::string & message){if(!test)throw std::runtime_error("Original campaign: "+message);}
void arity(const Operation & op,std::size_t n){require(op.args.size()==n,"invalid "+op.code+" arity");}
// Keeps the original map visit below a scripted battle. Its completion must
// resume the VM before the visited object's ordinary reward is processed.
class CampaignBattleQuery final:public CQuery
{
 std::function<void(bool)> continuation;
 bool won=false;
public:
 CampaignBattleQuery(CGameHandler & game,PlayerColor player,std::function<void(bool)> done):CQuery(&game),continuation(std::move(done)){addPlayer(player);}
 bool blocksPack(const CPackForServer *)const override{return true;}
 void onExposure(QueryPtr previous)override
 {
  const auto battle=std::dynamic_pointer_cast<CBattleQuery>(previous);
  require(battle&&battle->result.has_value(),"scripted battle ended without a result");
  won=battle->result->winner==BattleSide::ATTACKER;owner->popQuery(*this);
 }
 void onRemoval(PlayerColor)override{continuation(won);}
};
class CampaignArmyQuery final:public CQuery
{
 std::function<void()> continuation;
public:
 CampaignArmyQuery(CGameHandler & game,PlayerColor player,std::function<void()> done):CQuery(&game),continuation(std::move(done)){addPlayer(player);}
 bool blocksPack(const CPackForServer *)const override{return true;}
 void onExposure(QueryPtr previous)override
 {require(std::dynamic_pointer_cast<CGarrisonDialogQuery>(previous)!=nullptr,"army exchange ended without its query");owner->popQuery(*this);}
 void onRemoval(PlayerColor)override{continuation();}
};
class CampaignWanderingBattleQuery final:public CQuery
{
 std::function<void(const BattleResult &)> continuation;
 std::optional<BattleResult> result;
public:
 CampaignWanderingBattleQuery(CGameHandler & game,PlayerColor player,std::function<void(const BattleResult &)> done):CQuery(&game),continuation(std::move(done)){addPlayer(player);}
 bool blocksPack(const CPackForServer *)const override{return true;}
 void onExposure(QueryPtr previous)override
 {
  const auto battle=std::dynamic_pointer_cast<CBattleQuery>(previous);require(battle&&battle->result.has_value(),"wandering battle ended without a result");
  result=battle->result;owner->popQuery(*this);
 }
 void onRemoval(PlayerColor)override{require(result.has_value(),"wandering result missing");continuation(*result);}
};
class CampaignTurnQuery final:public CQuery
{
public:
 CampaignTurnQuery(CGameHandler & game,PlayerColor player):CQuery(&game){addPlayer(player);}
 bool blocksPack(const CPackForServer * packet)const override{return dynamic_cast<const AdvInterfaceReady *>(packet)==nullptr;}
 void onExposure(QueryPtr)override{}
};
class CampaignExperienceQuery final:public CQuery
{
 std::function<void()> continuation;
public:
 CampaignExperienceQuery(CGameHandler & game,PlayerColor player,std::function<void()> done):CQuery(&game),continuation(std::move(done)){addPlayer(player);}
 bool blocksPack(const CPackForServer *)const override{return true;}
 void onExposure(QueryPtr)override{owner->popQuery(*this);}
 void onRemoval(PlayerColor)override{continuation();}
};
}
struct SourceCampaignProcessor::Impl final:Host
{
 CGameHandler & gh;
 bool checked=false,active=false,executing=false;
 Program program;
 State vm;
 Context context;
 JsonNode state,pending;
 ObjectInstanceID heroId,objectId;
 PlayerColor player=PlayerColor::NEUTRAL;
 std::optional<QueryID> shown;
 std::optional<bool> comparison;
 struct BattleScope
 {
  std::vector<Frame> frames;
  std::vector<Continuation> continuations;
  JsonNode pending;
  ObjectInstanceID hero,object;
  PlayerColor player;
  std::optional<QueryID> shown;
  std::array<ObjectInstanceID,2> armies,heroes;
  std::function<void()> resume;
  BattleID battle=BattleID::NONE;
  std::array<int,3> action{{-1,-1,-1}};
 };
 std::optional<BattleScope> battleScope;
 bool wanderingBattle=false;
 bool pumping=false;
 bool demolitionResumeChecked=false;
 std::map<PlayerColor,QueryPtr> turnBarriers;
 explicit Impl(CGameHandler & game):gh(game){}
 int number(const Operand & o)const{return readNumber(o,vm,context);}
 int value(int old,const Operand & o)
 {
  if(unchangedOperand(o))return old;
  if(o.access==Access::Write){writeNumber(o,vm,context,old);return old;}
  if(o.access==Access::Compare){comparison=comparison.value_or(true)&&compare(old,o.comparison,number(o));writeFlag(1,vm,*comparison);return old;}
  return o.access==Access::Relative?add(old,number(o)):number(o);
 }
 bool query(const Operation & op)const
 {return std::any_of(op.args.begin(),op.args.end(),[](const Operand & o){return o.access==Access::Write||o.access==Access::Compare;});}
 const CGHeroInstance * hero(int source)const
 {
  if(source==-1)return gh.gameState().getHero(heroId);
  for(const auto & obj:gh.gameState().getMap().objects)
   if(const auto * h=dynamic_cast<const CGHeroInstance *>(obj.get());h&&h->getHeroTypeID().getNum()==source)return h;
  if(source>=0&&source<156)return gh.gameState().getMap().tryGetFromHeroPool(HeroTypeID(source));
  return nullptr;
 }
 const CGHeroInstance * ensureHero(int source)
 {
  if(const auto * existing=hero(source))return existing;
  if(source<0||source>=156)return nullptr;
  // WoG owns one record for every original hero, even when the map bans its
  // recruitment. Replicate the initialized record without adding tavern access.
  auto change=mutation("reserveHero",ObjectInstanceID(gh.gameState().getMap().objects.size()));
  change["hero"].Integer()=source;change["seed"].Integer()=gh.randomizer->getDefault().nextInt();persist(change);
  return hero(source);
 }
 CreatureID creature(int source)const
 {
  if(source<0)return CreatureID::NONE;
  for(const auto & binding:era_bridge::sourceCreatureLevelBindings)if(binding.sourceId==source)
  {
   const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature",std::string(binding.key),true);
   require(id.has_value(),"unresolved creature "+std::to_string(source));return CreatureID(*id);
  }
  throw std::runtime_error("Original campaign: unbound source creature "+std::to_string(source));
 }
 int sourceCreature(CreatureID id)const
 {
  if(id==CreatureID::NONE)return -1;
  const auto source=era_bridge::sourceCreatureIdForLevel(id.toCreature()->getJsonKey());
  require(source.has_value(),"foreign creature cannot be represented by original source ID: "+id.toCreature()->getJsonKey());return *source;
 }
 bool clearRockBatch()
 {
  if(vm.continuations.empty())return false;
  const auto & call=vm.continuations.back();
  if(call.operation!=1)return false;
  const auto * commands=&program.initializers;
  if(!call.initializer)
  {
   if(call.blockCursor>=call.blocks.size()||call.blocks[call.blockCursor]>=program.blocks.size())return false;
   commands=&program.blocks[call.blocks[call.blockCursor]].commands;
  }
  const auto & map=gh.gameState().getMap();std::vector<int3> positions;
  for(auto cursor=call.command;cursor<commands->size()&&positions.size()<64;++cursor)
  {
   const auto & command=(*commands)[cursor];
   if(command.receiver!="UN"||!command.selectors.empty()||!command.conditions.empty()||command.operations.size()!=1)break;
   const auto & operation=command.operations.front();
   if(operation.code!="O"||operation.args.size()!=3||!std::all_of(operation.args.begin(),operation.args.end(),[](const Operand & a){return a.kind==Kind::Number&&a.access==Access::Read&&!a.negate;}))break;
   const int3 pos(number(operation.args[0]),number(operation.args[1]),number(operation.args[2]));
   if(!map.isInTheMap(pos)||!std::as_const(state)["tileIdentities"][era_campaign_hints::positionKey(pos)].isNull())return false;
   positions.push_back(pos);
  }
  if(positions.size()<2)return false;
  std::vector<const CGObjectInstance *> rocks;std::vector<std::uint32_t> coverage;
  for(const auto & pos:positions)
  {
   std::uint32_t covered=0;
   for(const auto & obj:map.objects)if(obj&&obj->ID!=Obj::HERO&&obj->appearance)
   {
    // Only inert rocks are admitted. A visitable object, another blocker or
    // a hole fallback would make the removal effects order-dependent.
    if(obj->visitableAt(pos))return false;
    if(obj->blockingAt(pos))
    {
     if(identity(obj.get()).ID!=Obj::ROCK||objectMask(obj->id)!=255)return false;
     auto found=std::find(rocks.begin(),rocks.end(),obj.get());
     if(found==rocks.end()){if(rocks.size()>=16)return false;rocks.push_back(obj.get());found=rocks.end()-1;}
     covered|=std::uint32_t(1)<<std::distance(rocks.begin(),found);
    }
    else if(obj->coveringAt(pos)&&identity(obj.get()).ID==Obj::HOLE)return false;
   }
   coverage.push_back(covered);
  }
  if(rocks.empty()||!era_campaign_removal::guaranteedClear(coverage,rocks.size()))return false;
  // Every possible primary choice leaves exactly the same empty candidate
  // set before the next non-removal command. Perform that proven result;
  // the remaining consecutive UN:O commands then find empty tiles as usual.
  for(const auto * rock:rocks)
  {
   const auto removed=rock->id;require(gh.removeObject(rock,player),"rock batch removal failed");
   if(objectId==removed)objectId=ObjectInstanceID::NONE;
   for(const auto & field:{"objectAccess","objectIdentities","leftTroops"})if(!state[field].isNull())state[field].Struct().erase(std::to_string(removed.getNum()));
  }
  return true;
 }
 int3 position(const Command & c)const
 {
  const bool indirect=c.receiver=="OB"||c.receiver=="TR"||c.receiver=="MO"||c.receiver=="LE"||c.receiver=="CH"||c.receiver=="DW"||c.receiver=="GR"||c.receiver=="PO";
  // WoG 3.58f's MO parser (0x747f9e) retains only x/y/z when
  // accepting a fourth selector. Both /0 and /1 occur in original maps.
  const bool dynamicMonster=c.receiver=="MO"&&c.selectors.size()==4;
  require(c.selectors.size()==3||(indirect&&c.selectors.size()==1)||dynamicMonster,"object needs three coordinates or a coordinate variable");
  int3 pos;
  if(c.selectors.size()==1){const int index=number(c.selectors[0]);require(index>=1&&index<=9998,"invalid OB coordinate variable");pos=int3(lookup(vm.v,index),lookup(vm.v,index+1),lookup(vm.v,index+2));}
  else pos=int3(number(c.selectors[0]),number(c.selectors[1]),number(c.selectors[2]));
  return pos;
 }
 const CGObjectInstance * object(const Command & c,MapObjectID type=MapObjectID())const
 {
  const auto pos=position(c);const auto & map=gh.gameState().getMap();if(!map.isInTheMap(pos))return nullptr;
  const auto & tile=map.getTile(pos);auto candidates=tile.visitableObjects;candidates.insert(candidates.end(),tile.sourceHiddenVisitableObjects.begin(),tile.sourceHiddenVisitableObjects.end());
  for(const auto id:candidates)
  {
   const auto * obj=gh.gameState().getObj(id);
   if(obj&&(!type.hasValue()||obj->ID==type)&&obj->ID!=Obj::HERO)return obj;
  }
  return nullptr;
 }
 std::optional<ObjectTypeIdentifier> tileIdentity(const int3 & position)const
 {
  const auto & node=state["tileIdentities"][era_campaign_hints::positionKey(position)];if(node.isNull())return std::nullopt;
  const auto & pair=era_campaign_json::array(node);require(pair.size()==2,"invalid source tile identity");const int type=era_campaign_json::integer(pair[0]),sub=era_campaign_json::integer(pair[1]);
  require(type>=0&&type<=65535&&sub>=-1&&sub<=65535,"invalid source tile identity word");return ObjectTypeIdentifier{Obj(type),sub};
 }
 ObjectTypeIdentifier identity(const CGObjectInstance * object)const
 {
  if(const auto tile=tileIdentity(object->visitablePos()))return *tile;
  const auto & saved=state["objectIdentities"][std::to_string(object->id.getNum())];
  if(!saved.isNull()){const auto & pair=era_campaign_json::array(saved);require(pair.size()==2,"invalid source object identity");return {Obj(era_campaign_json::integer(pair[0])),era_campaign_json::integer(pair[1])};}
  if(object->ID==Obj::MONSTER)
   if(const auto source=era_bridge::sourceCreatureIdForLevel(CreatureID(object->subID.getNum()).toCreature()->getJsonKey()))return {Obj::MONSTER,*source};
  const ObjectTypeIdentifier native{Obj(object->ID.getNum()),object->subID.getNum()};
  const auto source=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).originalObject(native);return source.value_or(native);
 }
 std::uint8_t objectMask(ObjectInstanceID id)const
 {
  if(const auto * obj=gh.gameState().getObj(id))
  {
   const auto & byPosition=state["objectAccessPositions"][era_campaign_hints::positionKey(obj->visitablePos())];
   if(!byPosition.isNull()){const int mask=era_campaign_json::integer(byPosition);require(mask>=0&&mask<=255,"invalid saved coordinate object access mask");return mask;}
  }
  const auto & node=state["objectAccess"][std::to_string(id.getNum())];if(node.isNull())return 255;
  const int mask=era_campaign_json::integer(node);require(mask>=0&&mask<=255,"invalid saved object access mask");return mask;
 }
 bool allowsObject(const CGObjectInstance * obj,const CGHeroInstance * h)const
 {
  if(const auto * target=dynamic_cast<const CGHeroInstance *>(obj);target&&target->ID==Obj::HERO)
  {
   const auto & node=state["heroAccess"][std::to_string(target->getHeroTypeID().getNum())];
   if(!node.isNull()){const int mask=era_campaign_json::integer(node);require(mask>=0&&mask<=255,"invalid source hero access mask");return era_campaign_object_access::allows(mask,h->getOwner().getNum());}
  }
  return era_campaign_object_access::allows(objectMask(obj->id),h->getOwner().getNum());
 }
 bool consumeScriptChest(const CGObjectInstance * obj,const CGHeroInstance * h)
 {
  const auto & policy=std::as_const(state)["scriptChestOnly"];
  if(policy.isNull()||!policy.Bool())return false;
  const auto source=identity(obj);if(source.ID!=Obj::TREASURE_CHEST||source.subID!=1)return false;
  // Original EnableChest[1] silently collects a zero-XP/temporary-gold chest
  // after ERM, then restores gold. Preserve its net reward and removal directly.
  return gh.removeObject(obj,h->getOwner());
 }
 bool consumeLeftTroop(const CGObjectInstance * obj,const CGHeroInstance * h)
 {
  if(obj->ID!=Obj::MONSTER||!gh.gameInfo().getPlayerState(h->getOwner())->isHuman())return false;
  const auto style=era_campaign_deployment::ownerStyle(state,obj->id.getNum(),h->getOwner().getNum(),obj->visitablePos());
  if(!style||*style)return false;
  const auto id=obj->id;InfoWindow message;message.player=h->getOwner();message.text.appendRawString("The creatures you left here run away.");gh.showInfoDialog(&message);
  if(!gh.removeObject(obj,h->getOwner()))return false;
  state["leftTroops"].Struct().erase(std::to_string(id.getNum()));if(!state["objectIdentities"].isNull())state["objectIdentities"].Struct().erase(std::to_string(id.getNum()));persist();return true;
 }
 bool deployTroops(ObjectInstanceID requestedHero,SlotID slot,CreatureID requestedCreature,int count,const int3 & target,bool takeBack,PlayerColor who)
 {
  bind();if(gh.queries->topQuery(who))return false;
  if(active&&(!vm.initialized||executing||!pending.isNull()||!vm.continuations.empty()||!state["turnQueue"].Vector().empty()))return false;
  if(!active&&!gh.gameState().getMap().sourceCampaignState.isNull())return false;
  JsonNode deployment=active?state:gh.gameState().getMap().sourceCampaignWorld["troopDeployment"];
  const auto * h=gh.gameState().getHero(requestedHero);if(!h||h->getOwner()!=who||h->isGarrisoned()||h->inBoat()||!slot.validSlot()||slot.getNum()>6||!h->hasStackAtSlot(slot)||!gh.gameInfo().getPlayerState(who)->isHuman())return false;
  const auto & stack=h->getStack(slot);if(stack.getId()!=requestedCreature)return false;
  const auto origin=h->visitablePos();if(!era_campaign_deployment_rule::adjacent(origin.x,origin.y,origin.z,target.x,target.y,target.z)||!era_campaign_deployment::emptyLand(gh.gameState().getMap(),target,state))return false;
  std::int64_t army=0;for(const auto & entry:h->stacks)army+=entry.second->getCount();
  int source;try{source=sourceCreature(requestedCreature);}catch(const std::runtime_error &){if(active)return false;source=requestedCreature.getNum();}const bool machine=stack.getCreature()->warMachine!=ArtifactID::NONE;
  if(count<1||count>era_campaign_deployment_rule::maximum(stack.getCount(),army,source,machine))return false;
  auto & left=deployment["leftTroops"].Struct();for(auto it=left.begin();it!=left.end();){int id=-1;try{id=std::stoi(it->first);}catch(const std::exception &){}const auto & objects=gh.gameState().getMap().objects;if(id<0||id>=int(objects.size())||!objects[id])it=left.erase(it);else ++it;}
  if(left.size()>=10000)return false;
  const MapObjectSubID subtype(requestedCreature.getNum());if(!LIBRARY->objtypeh->knownSubObjects(Obj::MONSTER).count(subtype))return false;const auto handler=LIBRARY->objtypeh->getHandlerFor(Obj::MONSTER,subtype);
  auto templates=LIBRARY->objtypeh->getOriginalTemplates(Obj::MONSTER,subtype);const bool original=!templates.empty();if(!original)templates=handler->getTemplates();if(templates.empty())return false;
  auto created=std::dynamic_pointer_cast<CGCreature>(handler->create(&gh.gameInfo(),nullptr));if(!created)return false;
  handler->configureObject(created.get(),*gh.randomizer);gh.gs->getMap().generateUniqueInstanceName(created.get());created->appearance=original?templates.back():templates.front();created->setAnchorPos(target+created->getVisitableOffset());
  created->initialCharacter=CGCreature::Character::SAVAGE;created->neverFlees=false;created->notGrowingTeam=false;created->gainedArtifact=ArtifactID::NONE;created->resources=TResources{};created->message.clear();created->clearSlots();created->putStack(SlotID(0),std::make_unique<CStackInstance>(&gh.gameInfo(),requestedCreature,1));
  gh.newObject(created,who);gh.eraseStack({created->id,SlotID(0)});
  if(!gh.moveStack({h->id,slot},{created->id,SlotID(0)},count)){gh.removeObject(created.get(),who);return false;}
  gh.setObjPropertyValue(created->id,ObjProperty::MONSTER_POWER,count*1000);
  auto & record=deployment["leftTroops"][std::to_string(created->id.getNum())];record["owner"].Integer()=who.getNum();record["takeBack"].Bool()=takeBack;record["position"].Vector()={JsonNode(target.x),JsonNode(target.y),JsonNode(target.z)};
  if(active)deployment["objectIdentities"][std::to_string(created->id.getNum())].Vector()={JsonNode(54),JsonNode(source)};
  auto & result=deployment["lastTroopDeployment"];result["revision"].Integer()=result["revision"].Integer()+1;result["hero"].Integer()=h->id.getNum();result["object"].Integer()=created->id.getNum();if(active){state=std::move(deployment);player=who;persist();}
  else{SourceCampaignChange packet;packet.state=gh.gameState().getMap().sourceCampaignState;packet.worldState=gh.gameState().getMap().sourceCampaignWorld;packet.worldState["contract"].String()="troop-deployment-world-v1";packet.worldState["troopDeployment"]=std::move(deployment);gh.sendAndApply(packet);}
  return true;
 }
 bool consumeEmptyMonster(const CGObjectInstance * obj,const CGHeroInstance * h)
 {
  const auto * monster=dynamic_cast<const CGCreature *>(obj);if(!monster||monster->getStackCount(SlotID(0))!=0)return false;
  InfoWindow message;message.player=h->getOwner();message.text=monster->message;gh.showInfoDialog(&message);
  gh.giveResources(h->getOwner(),monster->resources);
  if(monster->gainedArtifact!=ArtifactID::NONE)gh.giveHeroNewArtifact(h,monster->gainedArtifact,ArtifactPosition::FIRST_AVAILABLE);
  gh.removeObject(monster,h->getOwner());return true;
 }
 JsonNode mutation(const std::string & kind,ObjectInstanceID id)const
 {JsonNode change;change["kind"].String()=kind;change["object"].Integer()=id.getNum();return change;}
 void persist(JsonNode change=JsonNode(),const CRewardableObject * event=nullptr,const Rewardable::Configuration * reward=nullptr,JsonNode world=JsonNode())
 {
  state["contract"].String()="source-campaign-state-v1";
  if(!state["creatureNameBindings"].isNull())
  {
   JsonNode names;names.Struct();for(const auto & [id,fields]:std::as_const(state)["creatureNameBindings"].Struct())for(const auto & [field,index]:fields.Struct())if(index.Integer()!=0)names[id][field].String()=lookup(vm.z,int(index.Integer()));state["creatureNames"]=std::move(names);
  }
  state["vm"]=era_campaign_json::writeState(vm);
  if(vm.initialized)state["plotTraversalVersion"].Integer()=1;
  state["running"].Bool()=!vm.continuations.empty()||!state["turnQueue"].Vector().empty();
  state["hero"].Integer()=heroId.getNum();state["object"].Integer()=objectId.getNum();state["player"].Integer()=player.getNum();state["pending"]=pending;
  // WoG's town-demolition tables exist even when a map has no CD commands.
  // Bind their defaults only after this admitted source program initialized;
  // explicit CD settings and saved quotas already attached to it are retained.
  if(world.isNull()&&vm.initialized&&!era_campaign_demolition::active(state,gh.gameState().getMap().sourceCampaignWorld))
   world=era_campaign_demolition::bind(state,gh.gameState().getMap().sourceCampaignWorld);
  SourceCampaignChange packet;packet.state=state;packet.worldState=std::move(world);packet.changes.Vector();
  if(change.isVector())packet.changes=std::move(change);
  else if(!change.isNull())packet.changes.Vector().push_back(std::move(change));
  const auto & previous=gh.gameState().getMap().sourceCampaignState;
  if(previous["objectAccess"]!=state["objectAccess"]||previous["objectAccessPositions"]!=state["objectAccessPositions"]||previous["guardAccessRevision"]!=state["guardAccessRevision"])
   packet.changes.Vector().push_back(mutation("guardAccessRefresh",ObjectInstanceID::NONE));
  if(event&&reward)packet.rewardConfigurations.emplace(event->id,*reward);
  gh.sendAndApply(packet);
 }
 JsonNode townClockMutation(PlayerColor who,int raw)const
 {
  auto change=mutation("playerTownDays",ObjectInstanceID::NONE);change["player"].Integer()=who.getNum();change["days"]=JsonNode();
  const auto * owner=gh.gameInfo().getPlayerState(who,false);

  if(owner&&owner->getTowns().empty())if(const auto shadow=era_campaign_town_clock::shadow(raw))change["days"].Integer()=*shadow;
  return change;
 }
 bool syncClock(PlayerColor who,bool advance)
 {
  if(!active||!who.isValidPlayer())return false;
  const auto * owner=gh.gameInfo().getPlayerState(who,false);if(!owner)return false;
  const auto raw=era_campaign_town_clock_json::read(state,who.getNum());if(!raw)return false;
  const auto key=std::to_string(who.getNum());
  const auto ownedTowns=owner->getTowns();
  const bool hasStandingTown=std::any_of(ownedTowns.begin(),ownedTowns.end(),[](const CGTownInstance * town){return !CGMysteriousCave::sourceTownRuin(town);});
  if(hasStandingTown)
  {
   // The original checker restores the byte255, rather than forgetting the
   // source clock. Its first subsequent positive countdown starts at the next
   // loss check after the town is relinquished.
   if(*raw!=255||owner->daysWithoutCastle.has_value()){state["townClocks"][key].Integer()=255;persist(townClockMutation(who,255));}
   return false;
  }
  int next=advance?era_campaign_town_clock::tick(*raw):*raw;
  // The original loss checker initializes its255 sentinel to the default7.
  if(next==255)next=7;
  // CasDem relinquishes ruins in its next daily scan without calling the
  // original loss checker. VCMI checks after moves and again at end turn,
  // before that scan: those extra checks must not overwrite the OW:D value
  // written by the post-demolition quest while the ruin is still owned.
  const auto shadow=ownedTowns.empty()?era_campaign_town_clock::shadow(next):std::nullopt;
  if(next!=*raw||owner->daysWithoutCastle!=shadow)
  {state["townClocks"][key].Integer()=next;persist(townClockMutation(who,next));}
  return true;
 }
 void fireTurn(int day)
 {
  auto world=gh.gameState().getMap().sourceCampaignWorld;
  if(!era_campaign_admission::worldMatches(state,world))
  {
   world=JsonNode();world["contract"].String()="source-campaign-world-v1";world["programId"]=state["programId"];world["programSha256"]=state["vm"]["programSha256"];
  }
  auto & fire=world["fire"];const bool initialize=fire["trees"].isNull();
  std::vector<era_campaign_fire::Tree> trees;JsonNode changes;changes.Vector();
  const auto & map=gh.gameState().getMap();
  if(initialize)
  {
   for(const auto & object:map.objects)if(object)
   {const auto source=identity(object.get());if(source.ID!=Obj(207)||source.subID!=1)continue;const auto pos=object->anchorPos();era_campaign_fire::Tree tree;tree.object=object->id.getNum();tree.x=pos.x;tree.y=pos.y;tree.z=pos.z;trees.push_back(tree);}
   require(trees.size()<=1000,"source animated object limit exceeded");
  }
  else for(const auto & node:fire["trees"].Vector())
  {
   era_campaign_fire::Tree tree;tree.object=era_campaign_json::integer(node["object"]);tree.x=era_campaign_json::integer(node["x"]);tree.y=era_campaign_json::integer(node["y"]);tree.z=era_campaign_json::integer(node["z"]);
   tree.mode=era_campaign_json::integer(node["mode"]);tree.phase=era_campaign_json::integer(node["phase"]);tree.time=era_campaign_json::integer(node["time"]);tree.next=era_campaign_json::integer(node["next"]);tree.delay=era_campaign_json::integer(node["delay"]);
   require(trees.size()<1000&&tree.mode>=0&&tree.mode<=2&&tree.phase>=0&&tree.phase<=5&&tree.next>=0&&tree.next<=5&&tree.time>=0&&tree.time<=255&&tree.delay>=0&&tree.delay<=9,"invalid source animated object state");trees.push_back(tree);
  }
  std::vector<int> changed;
  if(initialize){fire["day"].Integer()=day;for(const auto & tree:trees)changed.push_back(tree.object);}
  else if(era_campaign_json::integer(fire["day"])<day){changed=era_campaign_fire::advance(trees);fire["day"].Integer()=day;}
  // Original DaylyCastle follows GlbAnimation, including neutral ruined towns.
  for(const auto & object:map.objects)if(const auto * town=dynamic_cast<const CGTownInstance *>(object.get());town&&CGMysteriousCave::sourceTownRuin(town)&&day>CGMysteriousCave::townRebuildReadyDay(town)-6)
  {const auto pos=town->visitablePos();era_campaign_fire::provoke(trees,pos.x-2,pos.y-2,pos.z,5,3);}
  for(const auto id:changed)
  {
   const auto found=std::find_if(trees.begin(),trees.end(),[&](const auto & tree){return tree.object==id;});require(found!=trees.end(),"missing source animated object");
   if(!gh.gameState().getObj(ObjectInstanceID(id)))continue;
   auto change=mutation("firePhase",ObjectInstanceID(id));change["phase"].Integer()=found->phase;changes.Vector().push_back(std::move(change));
   change=mutation("terrainAccess",ObjectInstanceID::NONE);change["x"].Integer()=found->x;change["y"].Integer()=found->y;change["z"].Integer()=found->z;change["operation"].String()="P";change["enabled"].Bool()=found->phase==4;changes.Vector().push_back(std::move(change));
  }
  fire["trees"].Vector().clear();
  for(const auto & tree:trees)
  {
   JsonNode node;node["object"].Integer()=tree.object;node["x"].Integer()=tree.x;node["y"].Integer()=tree.y;node["z"].Integer()=tree.z;node["mode"].Integer()=tree.mode;node["phase"].Integer()=tree.phase;node["time"].Integer()=tree.time;node["next"].Integer()=tree.next;node["delay"].Integer()=tree.delay;fire["trees"].Vector().push_back(std::move(node));
  }
  if(world!=map.sourceCampaignWorld||!changes.Vector().empty())persist(std::move(changes),nullptr,nullptr,std::move(world));
 }
 void migrateEntrances()
 {
  if(!state["terrainEncoding"].isNull()){require(era_campaign_json::integer(state["terrainEncoding"])==2,"unknown terrain encoding");return;}
  std::set<int3> initialized;
  std::size_t prefix=vm.initialized?program.initializers.size():0,partialOperation=0;
  if(vm.initializing)for(const auto & continuation:vm.continuations)if(continuation.initializer){prefix=continuation.command;partialOperation=continuation.operation;break;}
  for(std::size_t index=0;index<program.initializers.size()&&index<=prefix;++index)
  {
   const auto & command=program.initializers[index];if(command.receiver!="TR")continue;
   for(std::size_t operation=0;operation<command.operations.size();++operation)
   {
    const auto & op=command.operations[operation];if(op.code!="E"||(index==prefix&&operation>=partialOperation))continue;
    if(op.args.size()==1&&(op.args[0].access==Access::Write||op.args[0].access==Access::Compare))continue;
    require(command.conditions.empty()&&command.selectors.size()==3&&op.args.size()==1&&op.args[0].kind==Kind::Number&&op.args[0].access==Access::Read,"cannot migrate conditional terrain initializer");
    for(const auto & selector:command.selectors)require(selector.kind==Kind::Number&&selector.access==Access::Read,"cannot migrate indirect terrain initializer");
    initialized.insert(int3(command.selectors[0].number,command.selectors[1].number,command.selectors[2].number));
   }
  }
  const auto & map=gh.gameState().getMap();JsonNode changes;changes.Vector();
  for(int z=0;z<int(map.levels());++z)for(int y=0;y<map.height;++y)for(int x=0;x<map.width;++x)
  {
   const int3 pos(x,y,z);const auto & tile=map.getTile(pos);
   if(!tile.sourceForceVisitable&&tile.sourceHiddenVisitableObjects.empty()&&!initialized.count(pos))continue;
   // The old force bit records E1; a hidden list or an executed initializer
   // with that bit clear records E0. Keep the source value, repair its mask.
   auto change=mutation("terrainAccess",ObjectInstanceID::NONE);change["x"].Integer()=x;change["y"].Integer()=y;change["z"].Integer()=z;change["operation"].String()="E";change["enabled"].Bool()=!tile.sourceForceVisitable;changes.Vector().push_back(std::move(change));
  }
  state["terrainEncoding"].Integer()=2;persist(std::move(changes));
 }
 void migrateCreatedEvents()
 {
  if(!state["eventTemplateRevision"].isNull()){require(era_campaign_json::integer(state["eventTemplateRevision"])==1,"unknown event template revision");return;}
  JsonNode changes;changes.Vector();
  if(state["objectIdentities"].isStruct())for(const auto & entry:state["objectIdentities"].Struct())
  {
   const auto & identity=era_campaign_json::array(entry.second);
   if(identity.size()!=2||era_campaign_json::integer(identity[0])!=26)continue;
   const auto * event=dynamic_cast<const CGEvent *>(gh.gameState().getObj(ObjectInstanceID(std::stoi(entry.first))));
   if(event&&event->appearance&&event->appearance->id==Obj::EVENT&&event->appearance->isBlockedAt(0,0))changes.Vector().push_back(mutation("eventPassability",event->id));
  }
  state["eventTemplateRevision"].Integer()=1;persist(std::move(changes));
 }
 void bind()
 {
  if(checked)return;checked=true;
  const auto path=JsonPath::builtin("config/era-campaigns/registry");
  if(!CResourceHandler::get()->existsResource(path))return;
  const JsonNode registry(path);const auto & map=gh.gameState().getMap();
  for(const auto & entry:registry["programs"].Vector())
  {
   if(!entry["enabled"].Bool())continue;
   // Every source program remains gated by its explicit registry admission.
   const JsonNode source(JsonPath::builtin(entry["resource"].String()));
   require(entry["programSha256"].String()==source["sha256"].String(),"source program registry identity changed");
   const auto & saved=map.sourceCampaignState;
   if(!saved.isNull())
   {
    if(saved["programId"].String()!=entry["id"].String())continue;
    require(saved["vm"]["programSha256"].String()==source["sha256"].String(),"saved source program changed");
   }
   else
   {
    std::multiset<std::string> expected,actual;
    for(const auto & message:source["originalMessages"].Vector())expected.insert(message.String());
    for(const auto & event:map.events){const auto message=event.message.toString();if(message.rfind("ZVSE",0)==0)actual.insert(message);}
    if(expected.empty()||actual!=expected)continue;
   }
   program=era_campaign_json::readProgram(source);state=saved;
   if(state.isNull())state["programId"].String()=entry["id"].String();
   vm=era_campaign_json::readState(state["vm"]);pending=state["pending"];
   if(saved.isNull())
    if(const auto & campaign=gh.gameState().getStartInfo()->campState;campaign&&!campaign->getSourceCampaignVariables().isNull())
     vm=era_campaign::persistentVariables(era_campaign_json::readState(campaign->getSourceCampaignVariables()));
   if(vm.programSha256.empty()){vm.programSha256=program.sha256;vm.era3StringLocals=program.era3StringLocals;}
   // The first native new-turn pass can create world state (including fire)
   // before the interface starts the ERM initializers. Bind that world to the
   // decoded VM identity now; persist() must not receive a null source digest.
   state["contract"].String()="source-campaign-state-v1";
   state["vm"]=era_campaign_json::writeState(vm);
   if(!state["turnQueue"].isNull())era_campaign_json::array(state["turnQueue"]);
   if(state["hero"].isNumber())heroId=ObjectInstanceID(state["hero"].Integer());
   if(state["object"].isNumber())objectId=ObjectInstanceID(state["object"].Integer());
   if(state["player"].isNumber())player=PlayerColor(state["player"].Integer());
   active=true;
   if(saved.isNull())state["terrainEncoding"].Integer()=2;else migrateEntrances();
   migrateCreatedEvents();
   if(state["guardAccessRevision"].isNull()){state["guardAccessRevision"].Integer()=1;persist();}
   else require(era_campaign_json::integer(state["guardAccessRevision"])==1,"unknown guard access revision");
   return;
  }
 }
 void updateContext()
 {
  context.day=gh.gameState().day;
  const auto * h=gh.gameState().getHero(heroId);context.currentHero=h?h->getHeroTypeID().getNum():-1;
  context.builtinFlag=[this](int flag){if(flag==1000)return gh.gameInfo().getPlayerState(player)->isHuman();if(flag==999)return false;return false;};
 }
 Step sourceCommandError(const Command & command,const std::string & message)
 {
  const auto pos=position(command);JsonNode warning;warning["receiver"].String()=command.receiver;warning["position"].String()=pos.toString();warning["message"].String()=message;state["sourceErrors"].Vector().push_back(warning);
  pending["kind"].String()="message";pending["text"].String()="Original script error: !!"+command.receiver+": "+message+" at "+pos.toString()+". This command is skipped; the following commands continue.";pending["flag"].Integer()=0;return Step::SuspendCommand;
 }
 int32_t random(int32_t maximum,bool)override{return gh.randomizer->getDefault().nextInt(maximum);}
 int32_t randomRange(int32_t minimum,int32_t maximum)override{return gh.randomizer->getDefault().nextInt(minimum,maximum);}
 Step execute(const Command &,const Operation &,State &,const Context &)override;
 bool wanderingFree(const int3 & pos)const
 {
  const auto & map=gh.gameState().getMap();if(!map.isInTheMap(pos))return false;
  const auto & tile=map.getTile(pos);
  if(tile.visitable()||tile.blocked()||tile.isWater()||!tile.getTerrain()->isPassable())return false;
  for(const auto & obj:map.objects)if(obj&&obj->ID==Obj::EVENT&&obj->visitablePos()==pos)return false;
  return true;
 }
 const CGCreature * wanderingMonster(const JsonNode & row)const
 {
  const auto & coordinates=era_campaign_json::array(row["position"]);require(coordinates.size()==3,"invalid wandering position");
  const int3 pos(coordinates[0].Integer(),coordinates[1].Integer(),coordinates[2].Integer());
  for(const auto & obj:gh.gameState().getMap().objects)
   if(const auto * monster=dynamic_cast<const CGCreature *>(obj.get());monster&&monster->visitablePos()==pos&&identity(monster).ID==Obj::MONSTER)return monster;
  return nullptr;
 }
 void prepareWanderingDay(int day)
 {
  if(state["wanderingDay"].isNumber()&&state["wanderingDay"].Integer()==day)return;
  state["wanderingDay"].Integer()=day;
  const auto & map=gh.gameState().getMap();auto & rows=state["wanderingMonsters"].Vector();
  for(auto & row:rows)
  {
   if(row.isNull())continue;
   const auto * monster=wanderingMonster(row);
   if(!monster){row=JsonNode();continue;}
   row["object"].Integer()=monster->id.getNum();
   const auto pos=monster->visitablePos();row["mode"].Integer()=1;
   const int radius=era_campaign_json::integer(row["radius"]);
   // The original scans hero records in source-number order, compares
   // Manhattan distance and keeps the first tie within the square radius.
   const CGHeroInstance * nearest=nullptr;int distance=std::numeric_limits<int>::max();
   for(const auto & obj:map.objects)if(const auto * h=dynamic_cast<const CGHeroInstance *>(obj.get());h&&h->getOwner().isValidPlayer()&&!h->isGarrisoned())
   {
    const auto destination=h->visitablePos();if(destination.z!=pos.z)continue;
    const int dx=std::abs(destination.x-pos.x),dy=std::abs(destination.y-pos.y);if(dx>radius||dy>radius)continue;
    if(dx+dy<distance||(dx+dy==distance&&nearest&&h->getHeroTypeID()<nearest->getHeroTypeID())){nearest=h;distance=dx+dy;}
   }
   const auto stepTo=[&](const int3 & target)
   {
    return era_campaign_wandering::findStep(map.width,map.height,{pos.x,pos.y,pos.z},{target.x,target.y,target.z},[&](const auto & p){return wanderingFree(int3(p.x,p.y,p.z));});
   };
   if(nearest)
   {
    const auto step=stepTo(nearest->visitablePos());
    if(step.code>=1&&step.code<=5)
    {
     row["mode"].Integer()=(step.code==2||step.code==3)?3:2;
     row["owner"].Integer()=nearest->getOwner().getNum();row["targetHero"].Integer()=nearest->id.getNum();
     row["next"].Vector()={JsonNode(step.next.x),JsonNode(step.next.y),JsonNode(step.next.z)};
    }
   }
   if(row["mode"].Integer()!=1)continue;
   const CGTownInstance * town=nullptr;distance=std::numeric_limits<int>::max();
   for(const auto townId:map.getAllTowns())
   {
    const auto * candidate=dynamic_cast<const CGTownInstance *>(gh.gameState().getObj(townId));if(!candidate)continue;
    const auto entrance=candidate->visitablePos();if(entrance.z!=pos.z)continue;
    const int dx=std::abs(entrance.x-pos.x),dy=std::abs(entrance.y-1-pos.y);if(dx>radius||dy>radius)continue;
    if(dx+dy<distance){town=candidate;distance=dx+dy;}
   }
   if(town)
   {
    const auto step=stepTo(town->visitablePos());
    if(step.code==1||step.code==2||step.code==4||step.code==5)
    {
     row["mode"].Integer()=2;row["owner"].Integer()=town->getOwner().getNum();
     row["next"].Vector()={JsonNode(step.next.x),JsonNode(step.next.y),JsonNode(step.next.z)};
    }
   }
  }
  persist();
 }
 bool completeWanderingTurn(JsonNode & pass)
 {
  auto & rows=state["wanderingMonsters"].Vector();int cursor=era_campaign_json::integer(pass["cursor"]);
  require(cursor>=0&&cursor<=int(rows.size()),"invalid wandering cursor");
  for(;cursor<int(rows.size());++cursor)
  {
   pass["cursor"].Integer()=cursor+1;auto & row=rows[cursor];
   if(row.isNull())continue;
   const auto * monster=wanderingMonster(row);
   if(!monster){row=JsonNode();persist();continue;}
   row["object"].Integer()=monster->id.getNum();
   if(row["owner"].Integer()!=player.getNum())continue;
   const int mode=era_campaign_json::integer(row["mode"]);if(mode!=2&&mode!=3)continue;
   const auto & values=era_campaign_json::array(row["next"]);require(values.size()==3,"invalid wandering step");
   const int3 next(values[0].Integer(),values[1].Integer(),values[2].Integer());row["mode"].Integer()=1;
   if(mode==2)
   {
    if(wanderingFree(next))
    {
     ChangeObjPos move;move.objid=monster->id;move.nPos=monster->anchorPos()+next-monster->visitablePos();move.initiator=player;gh.sendAndApply(move);
     row["position"].Vector()={JsonNode(next.x),JsonNode(next.y),JsonNode(next.z)};
     persist(mutation("guardAccessRefresh",ObjectInstanceID::NONE));
    }
    else persist();
    continue;
   }
   const auto * h=gh.gameState().getHero(ObjectInstanceID(row["targetHero"].Integer()));
   if(!h||h->getOwner()!=player||h->visitablePos()!=next){persist();continue;}
   const auto monsterId=monster->id,attackedHero=h->id;const auto who=player;
   wanderingBattle=true;persist();
   auto barrier=std::make_shared<CampaignWanderingBattleQuery>(gh,who,[this,monsterId,attackedHero,who](const BattleResult & result)
   {
    if(const auto * remaining=dynamic_cast<const CGCreature *>(gh.gameState().getObj(monsterId)))
    {
     // CompleteWoMo removes a defeated attacker without awarding its map
     // resources/artifact. Surviving groups retain their casualties.
     if(result.winner!=BattleSide::DEFENDER)
     {
      gh.removeObject(remaining,who);
      for(auto & entry:state["wanderingMonsters"].Vector())if(!entry.isNull()&&entry["object"].Integer()==monsterId.getNum())entry=JsonNode();
     }
     else remaining->battleFinished(gh,gh.gameState().getHero(attackedHero),result);
    }
    wanderingBattle=false;persist();pumpTurns();
   });
   gh.queries->addQuery(barrier);monster->onWanderingAttack(gh,h);if(wanderingBattle)return true;
  }
  return false;
 }
 era_campaign_timers::Settings timer(int id)const
 {
  const auto & values=state["timers"][std::to_string(id)];if(values.isNull())return {};
  const auto & array=era_campaign_json::array(values);require(array.size()==4,"invalid saved timer settings");
  era_campaign_timers::Settings result{};
  for(int i=0;i<4;++i){const int value=era_campaign_json::integer(array[i]);require(value>=0&&value<=65535,"invalid saved timer word");result[i]=value;}
  return result;
 }
 void setTimer(int id,const era_campaign_timers::Settings & settings)
 {
  auto & values=state["timers"][std::to_string(id)].Vector();values.clear();for(const auto word:settings)values.push_back(JsonNode(int(word)));persist();
 }
 void ensureTurnBarriers()
 {
  if(state["turnQueue"].isNull())return;
  const auto & queue=era_campaign_json::array(state["turnQueue"]);require(queue.size()<=40,"excessive turn queue");
  for(const auto & item:queue)if(item["kind"].String()=="finish")
  {
   const PlayerColor who(era_campaign_json::integer(item["player"]));require(who.isValidPlayer(),"invalid queued turn player");
   if(!turnBarriers.count(who)){auto barrier=std::make_shared<CampaignTurnQuery>(gh,who);turnBarriers.emplace(who,barrier);gh.queries->addQuery(barrier);}
  }
 }
 void completeTurnEvent()
 {
  if(state["activeTurnEvent"].isNull())return;
  const auto completed=state["activeTurnEvent"];state["activeTurnEvent"]=JsonNode();persist();
  if(completed["kind"].String()=="global")
  {
   const int index=era_campaign_json::integer(completed["index"]);const auto & events=gh.gameState().getMap().events;
   require(index>=0&&index<int(events.size()),"saved global event outside map");
   gh.newTurnProcessor->applyTimeEvent(events[index],PlayerColor(era_campaign_json::integer(completed["player"])));
  }
 }
 void pumpTurns()
 {
  if(pumping||wanderingBattle||!vm.initialized||!vm.continuations.empty())return;
  pumping=true;
  try
  {
   ensureTurnBarriers();auto & queue=state["turnQueue"].Vector();
   while(!queue.empty()&&vm.continuations.empty())
   {
    auto & pass=queue.front();const auto kind=pass["kind"].String();
    player=PlayerColor(era_campaign_json::integer(pass["player"]));require(player.isValidPlayer(),"invalid turn queue player");
    require(era_campaign_json::integer(pass["day"])==int(gh.gameState().day),"queued source turn changed day");
    heroId=ObjectInstanceID::NONE;objectId=ObjectInstanceID::NONE;updateContext();
    if(kind=="prepare")
    {
     const auto who=player;queue.erase(queue.begin());persist();gh.newTurnProcessor->preparePlayerTurnStarted(who);applyDailyCurses(who);
    }
    else if(kind=="wandering")
    {
     if(completeWanderingTurn(pass)){pumping=false;return;}
     queue.erase(queue.begin());persist();
    }
    else if(kind=="timers")
    {
     bool dispatched=false;int cursor=era_campaign_json::integer(pass["cursor"]);require(cursor>=1&&cursor<=101,"invalid timer cursor");
     for(;cursor<=100;++cursor)
     {
      pass["cursor"].Integer()=cursor+1;
      if(!era_campaign_timers::due(timer(cursor),context.day,player.getNum()))continue;
      state["activeTurnEvent"]["kind"].String()="timer";
      Executor executor(program,vm,context,*this);executor.dispatch("TM",{cursor});run();dispatched=true;break;
     }
     if(!dispatched){queue.erase(queue.begin());persist();}
    }
    else if(kind=="globals")
    {
     const auto & events=gh.gameState().getMap().events;int cursor=era_campaign_json::integer(pass["cursor"]);
     require(cursor>=0&&cursor<=int(events.size()),"invalid global event cursor");bool dispatched=false;
     for(;cursor<int(events.size());++cursor)
     {
      pass["cursor"].Integer()=cursor+1;const auto & event=events[cursor];
      if(!event.occursToday(gh.gameState().day)||!event.affectsDifficulty(gh.gameInfo().getStartInfo()->getDifficulty())||!event.affectsPlayer(player,gh.gameInfo().getPlayerState(player)->isHuman()))continue;
      const auto message=event.message.toString();if(message.rfind("ZVSE",0)==0)continue;
      int id=-1;try{id=std::stoi(message);}catch(const std::exception &){gh.newTurnProcessor->applyTimeEvent(event,player);continue;}
      auto & current=state["activeTurnEvent"];current["kind"].String()="global";current["index"].Integer()=cursor;current["player"].Integer()=player.getNum();
      Executor executor(program,vm,context,*this);executor.dispatch("GE",{id});run();dispatched=true;break;
     }
     if(!dispatched){queue.erase(queue.begin());persist();}
    }
    else if(kind=="finish")
    {
     const auto who=player;queue.erase(queue.begin());persist();const auto found=turnBarriers.find(who);
     require(found!=turnBarriers.end()&&gh.queries->topQuery(who)==found->second,"source turn barrier missing");
     const auto barrier=found->second;turnBarriers.erase(found);gh.queries->popQuery(barrier);gh.newTurnProcessor->finishPlayerTurnStarted(who);gh.turnOrder->resumePlayerTurnStarted(who);
    }
    else throw std::runtime_error("Original campaign: invalid queued turn stage");
   }
   pumping=false;
  }
  catch(...){pumping=false;throw;}
 }
 bool battleEvent(int stage,ObjectInstanceID attacker,ObjectInstanceID defender,ObjectInstanceID attackerHero,ObjectInstanceID defenderHero,std::function<void()> resume)
 {
  require(stage==0||stage==1,"unsupported battle event stage");
  bind();if(!active)return false;
  if(stage==0)state["battleSetup"]=JsonNode();
  return battleHook("BA",{stage},attacker,defender,attackerHero,defenderHero,std::move(resume));
 }
 bool battleField(BattleID battleId,std::function<void()> resume)
 {return liveBattleHook("BF",{},battleId,std::move(resume));}
 void battleAction(BattleID battleId,int stage,const BattleAction & action)
 {
  bind();if(!active)return;
  require(stage==0||stage==1,"invalid battle action event stage");
  liveBattleHook("BG",{stage},battleId,[]{},&action);
  require(!battleScope,"dialogue inside a battle action is not admitted");
 }
 bool liveBattleHook(const std::string & receiver,const std::vector<std::int32_t> & selectors,BattleID battleId,std::function<void()> resume,const BattleAction * action=nullptr)
 {
  bind();if(!active)return false;
  const auto * battle=gh.gameState().getBattle(battleId);require(battle!=nullptr,"event without a live battle");
  const auto army=[&](BattleSide side){const auto * a=battle->battleGetArmyObject(side);return a?a->id:ObjectInstanceID::NONE;};
  const auto hero=[&](BattleSide side){const auto * h=battle->battleGetFightingHero(side);return h?h->id:ObjectInstanceID::NONE;};
  return battleHook(receiver,selectors,army(BattleSide::ATTACKER),army(BattleSide::DEFENDER),hero(BattleSide::ATTACKER),hero(BattleSide::DEFENDER),std::move(resume),battleId,action);
 }
 bool battleRound(BattleID battleId,int sourceRound,std::function<void()> resume)
 {
  bind();if(!active)return false;
  // BACall2(2,round) publishes the original round number in v997.
  vm.v[997]=sourceRound;
  return liveBattleHook("BR",{},battleId,std::move(resume));
 }
 bool battleHook(const std::string & receiver,const std::vector<std::int32_t> & selectors,ObjectInstanceID attacker,ObjectInstanceID defender,ObjectInstanceID attackerHero,ObjectInstanceID defenderHero,std::function<void()> resume,BattleID battle=BattleID::NONE,const BattleAction * action=nullptr)
 {
  bind();if(!active)return false;
  updateContext();Executor probe(program,vm,context,*this);
  if(!probe.hasMatchingAny(receiver,{selectors}))return false;
  require(!executing&&!battleScope,"recursive battle event entry");
  BattleScope scope{std::move(vm.frames),std::move(vm.continuations),std::move(pending),heroId,objectId,player,shown,{attacker,defender},{attackerHero,defenderHero},std::move(resume)};
  if(action)
  {
   const auto * live=gh.gameState().getBattle(battle);const auto * actor=live->battleGetStackByID(action->stackNumber,false);
   const auto target=action->getTarget(live);
   int kind=0;
   switch(action->actionType)
   {
    case EActionType::HERO_SPELL:kind=1;break;case EActionType::WALK:kind=2;break;
    case EActionType::DEFEND:kind=3;break;case EActionType::RETREAT:kind=4;break;
    case EActionType::SURRENDER:kind=5;break;case EActionType::WALK_AND_ATTACK:kind=6;break;
    case EActionType::SHOOT:kind=7;break;case EActionType::WAIT:kind=8;break;
    case EActionType::CATAPULT:kind=9;break;case EActionType::MONSTER_SPELL:kind=10;break;
    case EActionType::STACK_HEAL:kind=11;break;default:break;
   }
   scope.action={{kind,actor?actor->sourceMassSlot()+21*static_cast<int>(actor->unitSide()):-1,
    target.empty()?-1:target.front().unitValue?target.front().unitValue->getPosition().toInt():target.front().hexValue.toInt()}};
  }
  scope.battle=battle;battleScope=std::move(scope);vm.frames={Frame{}};vm.continuations.clear();pending=JsonNode();shown.reset();
  heroId=attackerHero;objectId=ObjectInstanceID::NONE;
  if(const auto * attackerArmy=gh.gameState().getObj(attacker);attackerArmy&&attackerArmy->getOwner().isValidPlayer())player=attackerArmy->getOwner();
  for(const auto armyId:{attacker,defender})if(const auto * army=gh.gameState().getObj(armyId))
   if(const auto * owner=gh.gameInfo().getPlayerState(army->getOwner(),false);owner&&owner->isHuman()){player=army->getOwner();break;}
  state["battleHook"].Bool()=true;updateContext();Executor executor(program,vm,context,*this);executor.dispatch(receiver,selectors);run();return true;
 }
 void run()
 {
  require(!executing,"recursive event entry");executing=true;
  try
  {
   updateContext();Executor executor(program,vm,context,*this);const bool done=executor.run();if(!done||!battleScope)persist();executing=false;
   if(!done){show();return;}
   if(battleScope)
   {
    auto scope=std::move(*battleScope);battleScope.reset();
    vm.frames=std::move(scope.frames);vm.continuations=std::move(scope.continuations);pending=std::move(scope.pending);
    heroId=scope.hero;objectId=scope.object;player=scope.player;shown=scope.shown;state["battleHook"].Bool()=false;updateContext();persist();scope.resume();return;
   }
   const auto completedObject=objectId,completedHero=heroId;
   const auto entryKey=std::to_string(completedHero.getNum());
   const auto entry=std::as_const(state)["nativeTownEntries"][entryKey];
   if(entry.isStruct())state["nativeTownEntries"].Struct().erase(entryKey);
   heroId=ObjectInstanceID::NONE;objectId=ObjectInstanceID::NONE;pending=JsonNode();persist();
   completeTurnEvent();
   if(completedObject!=ObjectInstanceID::NONE)
   {
    const auto * obj=gh.gameState().getObj(completedObject);
    const auto * h=gh.gameState().getHero(completedHero);
    // The event still grants its reward after a scripted teleport. The
    // mountain passage, for example, grants morale before moving the hero.
    if(obj&&h&&allowsObject(obj,h)&&!consumeScriptChest(obj,h)&&!consumeEmptyMonster(obj,h)&&!consumeLeftTroop(obj,h))
    {
     // Saved source dialogs retain whether this was an entry or the native
     // daily building refresh. Older saves can infer an already visited town.
     const bool actualEntry=entry.isStruct()&&entry["object"].Integer()==completedObject.getNum()
      &&entry["actual"].isBool()?entry["actual"].Bool():h->getVisitedTown()!=obj;
     gh.nativeObjectVisit(obj,h,actualEntry);
    }
   }
   pumpTurns();
  }
  catch(const std::exception & error)
  {
   logGlobal->error("Original campaign %s (%s) stopped: %s",state["programId"].String(),program.sha256,error.what());executing=false;throw;
  }
  catch(...){executing=false;throw;}
 }
 void show()
 {
  require(pending.isStruct(),"suspension without a dialog");
  if(shown)return;
  if(pending["kind"].String()=="artifact-grant")
  {
   const auto * h=hero(pending["heroType"].Integer());require(h!=nullptr,"artifact grant hero missing");
   auto barrier=std::make_shared<CampaignExperienceQuery>(gh,h->getOwner(),[this](){shown.reset();pending=JsonNode();run();});
   shown=barrier->queryID;gh.queries->addQuery(barrier);
   era_compat::source_artifacts::give(gh,*h,pending["artifact"].Integer(),pending["spell"].Integer());
   if(gh.queries->topQuery(h->getOwner())==barrier)gh.queries->popQuery(barrier);
   return;
  }
  if(pending["kind"].String()=="hero-experience")
  {
   const auto * h=gh.gameState().getHero(ObjectInstanceID(pending["hero"].Integer()));require(h!=nullptr,"experience hero missing");
   auto barrier=std::make_shared<CampaignExperienceQuery>(gh,h->getOwner(),[this](){shown.reset();pending=JsonNode();run();});
   shown=barrier->queryID;gh.queries->addQuery(barrier);gh.expGiven(h);
   // One-choice level-ups can complete synchronously without a dialog query.
   if(gh.queries->topQuery(h->getOwner())==barrier)gh.queries->popQuery(barrier);
   return;
  }
  if(pending["kind"].String()=="army-exchange")
  {
   const auto * h=gh.gameState().getHero(ObjectInstanceID(pending["hero"].Integer()));require(h!=nullptr,"army exchange hero missing");
   const CGEvent * army=nullptr;
   if(pending["army"].isNumber())
   {
    army=dynamic_cast<const CGEvent *>(gh.gameState().getObj(ObjectInstanceID(pending["army"].Integer())));
    require(army!=nullptr,"saved army exchange carrier missing");
   }
   else
   {
    auto created=std::dynamic_pointer_cast<CGEvent>(gh.createNewObject(h->visitablePos(),Obj::EVENT,MapObjectSubID(0)));require(created!=nullptr,"army exchange carrier is not armed");
    gh.newObject(created,player);army=created.get();gh.setOwner(army,h->getOwner());
    const auto & values=pending["stacks"].Vector();require(values.size()==14,"invalid army exchange stacks");
    for(int slot=0;slot<7;++slot)if(values[slot*2].Integer()>=0&&values[slot*2+1].Integer()>0)
     gh.insertNewStack({army->id,SlotID(slot)},creature(values[slot*2].Integer()).toCreature(),values[slot*2+1].Integer());
    pending["army"].Integer()=army->id.getNum();persist();
   }
   auto barrier=std::make_shared<CampaignArmyQuery>(gh,h->getOwner(),[this]()
   {
    const auto * remaining=dynamic_cast<const CGEvent *>(gh.gameState().getObj(ObjectInstanceID(pending["army"].Integer())));require(remaining!=nullptr,"army exchange carrier disappeared");
    auto & values=state["armyExchange"].Vector();values.clear();
    for(int slot=0;slot<7;++slot)
    {const auto * stack=remaining->getStackPtr(SlotID(slot));values.push_back(JsonNode(stack?sourceCreature(stack->getId()):-1));values.push_back(JsonNode(stack?stack->getCount():0));}
    gh.removeObject(remaining,player);shown.reset();pending=JsonNode();run();
   });
   shown=barrier->queryID;gh.queries->addQuery(barrier);gh.showGarrisonDialog(army->id,h->id,true);return;
  }
  if(pending["kind"].String()=="battle")
  {
   const auto * h=gh.gameState().getHero(ObjectInstanceID(pending["hero"].Integer()));require(h!=nullptr,"scripted battle hero missing");
   const int3 position(pending["x"].Integer(),pending["y"].Integer(),pending["z"].Integer());
   // A separate invisible event carries the temporary defenders. The visited
   // object's guards, resources and reward configuration remain intact.
   auto created=gh.createNewObject(position,Obj::EVENT,MapObjectSubID(0));
   auto army=std::dynamic_pointer_cast<CGEvent>(created);require(army!=nullptr,"scripted battle carrier is not armed");
   gh.newObject(army,player);
   gh.insertNewStack({army->id,SlotID(0)},creature(pending["creature"].Integer()).toCreature(),pending["count"].Integer());
   pending["army"].Integer()=army->id.getNum();persist();
   auto barrier=std::make_shared<CampaignBattleQuery>(gh,h->getOwner(),[this](bool won)
   {
    const auto id=ObjectInstanceID(pending["army"].Integer());
    if(const auto * temporary=gh.gameState().getObj(id))gh.removeObject(temporary,player);
    shown.reset();writeFlag(1,vm,won);pending=JsonNode();run();
   });
   shown=barrier->queryID;gh.queries->addQuery(barrier);
   gh.startBattle(h,army.get(),position,h,nullptr,BattleLayout::createDefaultLayout(gh.gameInfo(),h,army.get()),nullptr);return;
  }
  auto dialog=std::make_shared<CGenericQuery>(&gh,player,[this](std::optional<int32_t> answer)
  {
   shown.reset();
   if(pending["contract"].String()=="source-campaign-dialog-v1")
   {era_campaign_dialogs::Dialogs dialogs(state["dialogs"],vm,context);dialogs.reply(pending,answer.value_or(-1),pending["replyText"].String());}
   else {const auto flag=pending["flag"].Integer();if(flag)writeFlag(flag,vm,answer.value_or(0)!=0);}
   pending=JsonNode();run();
  });
  shown=dialog->queryID;gh.queries->addQuery(dialog);
  BlockingDialog packet(pending["flag"].Integer()!=0,false);packet.queryID=dialog->queryID;packet.player=player;packet.text.appendRawString(pending["text"].String());
  const auto kind=pending["kind"].String();
  if(kind=="message"||kind=="question")for(const auto & picture:pending["pictures"].Vector())
  {
   const auto data=era_campaign_pictures::component(picture["type"].Integer(),picture["subtype"].Integer(),[this](int source){return creature(source);});
   if(data)packet.components.push_back(*data);
  }
  gh.sendAndApply(packet);
 }
 bool resumeDemolitionBattle()
 {
  const auto & map=gh.gameState().getMap();if(!era_campaign_demolition::active(map.sourceCampaignState,map.sourceCampaignWorld))return false;
  const auto & pending=map.sourceCampaignWorld["demolition"]["pending"];if(pending.isNull())return false;
  const auto attacker=ObjectInstanceID(pending["hero"].Integer()),defender=ObjectInstanceID(pending["army"].Integer());
  const auto * hero=gh.gameInfo().getHero(attacker);
  if(hero&&gh.gameState().getBattle(hero->getOwner()))return true;
  if(pending["finished"].Bool()){demolitionBattleEnded(attacker,defender,pending["won"].Bool());return false;}
  const auto * town=gh.gameInfo().getTown(ObjectInstanceID(pending["town"].Integer()));
  if(!town||!town->hasBuilt(BuildingID(pending["building"].Integer()))){demolitionBattleEnded(attacker,defender,false);return false;}
  const auto * army=dynamic_cast<const CGEvent *>(gh.gameState().getObj(defender));
  require(hero&&army,"saved demolition combat participants missing");
  gh.startBattle(hero,army,hero->visitablePos(),hero,nullptr,BattleLayout::createDefaultLayout(gh.gameInfo(),hero,army),nullptr);return true;
 }
 bool demolitionFight(ObjectInstanceID heroID,ObjectInstanceID townID,int building)
 {
  const auto & map=gh.gameState().getMap();if(!era_campaign_demolition::active(map.sourceCampaignState,map.sourceCampaignWorld)||!map.sourceCampaignWorld["demolition"]["pending"].isNull())return false;
  const auto * hero=gh.gameInfo().getHero(heroID);const auto * town=gh.gameInfo().getTown(townID);if(!hero||!town)return false;
  const auto snapshot=CGMysteriousCave::builderSnapshot(hero,town);const JsonNode * row=nullptr;
  for(const auto & item:snapshot["buildings"].Vector())if(item["building"].Integer()==building)row=&item;
  if(!row||!(*row)["fightEnabled"].Bool()||!(*row)["occupantCreature"].isNumber())return false;
  auto army=std::dynamic_pointer_cast<CGEvent>(gh.createNewObject(hero->visitablePos(),Obj::EVENT,MapObjectSubID(0)));require(army!=nullptr,"demolition carrier is not armed");gh.newObject(army,hero->getOwner());
  gh.insertNewStack({army->id,SlotID(0)},CreatureID((*row)["occupantCreature"].Integer()).toCreature(),(*row)["occupants"].Integer());
  const int movement=CGMysteriousCave::isBuilder(hero)?0:era_campaign_demolition::setting(map.sourceCampaignWorld,"M",era_campaign_demolition::movementLoss);
  gh.setMovePoints(hero->id,hero->movementPointsRemaining()-movement);
  SourceCampaignChange packet;packet.worldState=map.sourceCampaignWorld;packet.changes.Vector();auto & pending=packet.worldState["demolition"]["pending"];
  pending["hero"].Integer()=heroID.getNum();pending["town"].Integer()=townID.getNum();pending["building"].Integer()=building;pending["army"].Integer()=army->id.getNum();pending["tier"]=(*row)["occupantTier"];
  gh.sendAndApply(packet);return resumeDemolitionBattle();
 }
 void demolitionBattleEnding(ObjectInstanceID attacker,ObjectInstanceID defender,bool won)
 {
  const auto & map=gh.gameState().getMap();if(!era_campaign_demolition::active(map.sourceCampaignState,map.sourceCampaignWorld))return;
  const auto & pending=map.sourceCampaignWorld["demolition"]["pending"];
  if(pending.isNull()||pending["hero"].Integer()!=attacker.getNum()||pending["army"].Integer()!=defender.getNum())return;
  SourceCampaignChange packet;packet.worldState=map.sourceCampaignWorld;packet.changes.Vector();packet.worldState["demolition"]["pending"]["finished"].Bool()=true;packet.worldState["demolition"]["pending"]["won"].Bool()=won;gh.sendAndApply(packet);
 }
 void demolitionBattleEnded(ObjectInstanceID attacker,ObjectInstanceID defender,bool won)
 {
  const auto & map=gh.gameState().getMap();if(!era_campaign_demolition::active(map.sourceCampaignState,map.sourceCampaignWorld))return;
  const auto pending=map.sourceCampaignWorld["demolition"]["pending"];
  if(pending.isNull()||pending["hero"].Integer()!=attacker.getNum()||pending["army"].Integer()!=defender.getNum())return;
  if(const auto * carrier=gh.gameState().getObj(defender))gh.removeObject(carrier,PlayerColor::NEUTRAL);
  const auto * hero=gh.gameInfo().getHero(attacker);const auto * town=gh.gameInfo().getTown(ObjectInstanceID(pending["town"].Integer()));
  if(won&&hero&&town)
  {
   SourceCampaignChange approved;approved.worldState=map.sourceCampaignWorld;approved.worldState["demolition"]["pending"]["won"].Bool()=true;approved.changes.Vector();gh.sendAndApply(approved);
   const int tier=pending["tier"].Integer();require(tier>=0&&tier<town->creatures.size(),"demolition dwelling tier missing");
   SetAvailableCreatures stock;stock.tid=town->id;stock.creatures=town->creatures;stock.creatures.at(tier).first=0;gh.sendAndApply(stock);
   CGMysteriousCave::builderDemolish(gh,hero,town,pending["building"].Integer());
  }
  SourceCampaignChange cleared;cleared.worldState=map.sourceCampaignWorld;cleared.worldState["demolition"]["pending"]=JsonNode();cleared.changes.Vector();gh.sendAndApply(cleared);
 }
 bool onReady(PlayerColor who)
 {
  bind();if(!active)return false;
  // Existing906 saves may predate implicit CD defaults. Migrate the world
  // policy without replaying the initialized VM or its pending visit.
  if(vm.initialized&&(!era_campaign_demolition::active(state,gh.gameState().getMap().sourceCampaignWorld)
     ||state["plotTraversalVersion"].isNull()))persist();
  if(!demolitionResumeChecked){demolitionResumeChecked=true;if(resumeDemolitionBattle())return true;}
  ensureTurnBarriers();
  if(!vm.initialized&&!vm.initializing)
  {
   // Initial ERM dialogs belong to the human interface, even when an AI is
   // first in turn order. AI-only games may initialize on their first callback.
   for(const auto & [color,participant]:gh.gameState().players)
    if(color.isValidPlayer()&&participant.isHuman()){if(color!=who)return false;break;}
   player=who;updateContext();Executor executor(program,vm,context,*this);executor.initialize();run();
  }
  if(!pending.isNull()&&who==player&&!shown)
  {
   const auto * obj=gh.gameState().getObj(objectId);const auto * h=gh.gameState().getHero(heroId);
   if(obj&&h)gh.queries->addQuery(std::make_shared<MapObjectVisitQuery>(&gh,obj,h));
   show();
  }
  if(!shown)return false;
  const auto * h=pending["hero"].isNumber()?gh.gameState().getHero(ObjectInstanceID(pending["hero"].Integer())):nullptr;
  return who==player||(h&&h->getOwner()==who);
 }
 bool visitPosition(const int3 & position,const CGHeroInstance * h)
 {
  bind();if(!active||!vm.initialized)return false;const auto source=tileIdentity(position);if(!source)return false;
  // T91 followed by OB:S can mark an empty map cell without assigning U.
  // Its sentinel subtype still permits the original coordinate/type triggers;
  // access below must remain disabled so no native sign effect is invented.
  const auto key=era_campaign_hints::positionKey(position);
  require(!state["objectAccessPositions"][key].isNull()&&era_campaign_json::integer(state["objectAccessPositions"][key])==0,"native default effect of a retyped plot tile is not admitted");
  if(!vm.continuations.empty())
  {require(heroId==h->id&&lookup(vm.v,998)==position.x&&lookup(vm.v,999)==position.y&&lookup(vm.v,1000)==position.z,"another plot tile visited while a script is suspended");return true;}
  heroId=h->id;objectId=ObjectInstanceID::NONE;player=h->getOwner();updateContext();vm.v[998]=position.x;vm.v[999]=position.y;vm.v[1000]=position.z;
  Executor executor(program,vm,context,*this);
  if(executor.dispatchAny("OB",{{int(source->ID)},{int(source->ID),source->subID},{position.x,position.y,position.z}})){run();return true;}
  heroId=ObjectInstanceID::NONE;return false;
 }
 int curseKind(const JsonNode & row)const
 {return row["kind"].isNull()?2:era_campaign_json::integer(row["kind"]);}
 void restoreSlotCurse(const JsonNode & row)
 {
  if(curseKind(row)!=2)return;
  const int type=era_campaign_json::integer(row["hero"]),encoded=era_campaign_json::integer(row["value"]);
  const int source=era_campaign_slot_curse::slot(encoded),slot=era_campaign_slot_curse::nativeSlot(source);
  auto & count=state["artifactSlotLocks"][std::to_string(type)][std::to_string(slot)];
  count.Integer()=era_campaign_slot_curse::lockCount(count.isNull()?0:era_campaign_json::integer(count),-1);
  const auto * target=hero(type);const int old=era_campaign_slot_curse::artifact(encoded);
  if(target&&old>=0&&source!=8&&row["restore"].Bool())
  {
   const auto id=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(old));
   persist();gh.giveHeroNewArtifact(target,id,ArtifactPosition(slot));
  }
 }
 void expireSlotCurses(PlayerColor owner,int day)
 {
  if(state["slotCurses"].isNull())return;
  auto & rows=state["slotCurses"].Vector();bool changed=false;
  for(auto it=rows.begin();it!=rows.end();)
  {
   const auto * target=hero(era_campaign_json::integer((*it)["hero"]));
   if(target&&target->getOwner()==owner&&era_campaign_slot_curse::expired(era_campaign_json::integer((*it)["start"]),era_campaign_json::integer((*it)["length"]),day))
   {const auto row=*it;it=rows.erase(it);restoreSlotCurse(row);changed=true;}
   else ++it;
  }
  if(changed)persist();
 }
 void applyDailyCurses(PlayerColor owner)
 {
  if(state["slotCurses"].isNull())return;
  // 358f751e50 visits the common1000-row table in insertion order, after
  // native daily reset and before RunTimer. Expiry has already been applied.
  for(const auto & row:std::as_const(state)["slotCurses"].Vector())
  {
   const auto * target=hero(era_campaign_json::integer(row["hero"]));if(!target||target->getOwner()!=owner)continue;
   const int kind=curseKind(row),power=era_campaign_json::integer(row["value"]);
   if(kind==4)
   {
    const auto gold=gh.gameInfo().getPlayerState(owner)->resources[GameResID::GOLD];require(gold>=INT32_MIN&&gold<=INT32_MAX,"curse gold outside source word");
    auto change=mutation("playerResource",ObjectInstanceID::NONE);change["player"].Integer()=owner.getNum();change["resource"].Integer()=GameResID::GOLD;change["amount"].Integer()=std::max(0,era_campaign_slot_curse::subtract(int(gold),power));persist(change);
   }
   else if(kind==65)
   {
    auto change=mutation("heroMovementWord",target->id);change["amount"].Integer()=era_campaign_slot_curse::add(target->movementPointsRemaining(),power);persist(change);
   }
  }
 }
 // WoG 3.58f 0x7059e0 runs before ERM2Object: the same dwelling
 // changes its recruit type with the absolute day and restores guard slot 0.
 void correctMessengerDwelling(const CGObjectInstance * obj)
 {
  const auto source=identity(obj);if(source.ID!=Obj(17)||source.subID!=93)return;
  const auto * dwelling=dynamic_cast<const CGDwelling *>(obj);require(dwelling&&!dwelling->creatures.empty(),"messenger dwelling recruit slot missing");
  const auto selected=creature(164+gh.gameState().day%4);
  SetAvailableCreatures stock;stock.tid=dwelling->id;stock.creatures=dwelling->creatures;stock.creatures[0].second={selected};gh.sendAndApply(stock);
  const SlotID slot(0);const auto * guard=dwelling->getStackPtr(slot);
  if(!guard)gh.insertNewStack({dwelling->id,slot},selected.toCreature(),10);
  else {gh.changeStackType({dwelling->id,slot},selected.toCreature());gh.changeStackCount({dwelling->id,slot},10,ChangeValueMode::ABSOLUTE);}
 }
 void retypeService(const CGObjectInstance * object,const ObjectTypeIdentifier & target)
 {
  require(vm.initializing&&!vm.initialized,"active service retyping is only admitted during initialization");
  require(object&&object->appearance,"active service retyping needs an existing original object");
  require(!object->getOwner().isValidPlayer(),"player-owned service replacement is not admitted");
  const auto & mapping=LIBRARY->mapFormat->getMapping(EMapFormat::WOG);
  const auto original=mapping.originalObject({Obj(object->ID.getNum()),object->subID.getNum()});
  require(original&&original->ID==Obj(63)&&target.subID==0&&
   ((original->subID==24&&target.ID==Obj::ARENA)||(original->subID==25&&target.ID==Obj::LIBRARY_OF_ENLIGHTENMENT)||(original->subID==26&&target.ID==Obj::WAR_MACHINE_FACTORY)),"unvalidated active source service replacement");
  const auto * armed=dynamic_cast<const CArmedInstance *>(object);require(!armed||armed->stacksCount()==0,"armed service replacement is not admitted");
  const auto native=mapping.remapObject(target);const auto handler=LIBRARY->objtypeh->getHandlerFor(native.ID,native.subID);
  auto replacement=handler->create(&gh.gameInfo(),nullptr);
  replacement->id=object->id;replacement->instanceName=object->instanceName;replacement->tempOwner=object->getOwner();
  auto appearance=std::make_shared<ObjectTemplate>(*object->appearance);appearance->id=native.ID;appearance->subid=MapObjectSubID(native.subID);
  replacement->appearance=appearance;replacement->setAnchorPos(object->anchorPos());
  const auto id=object->id;const auto position=object->visitablePos();
  // Native removal detaches the old bonus node and renderer; NewObject can
  // reuse the vacated ID. Initialize/configure the new class exactly once.
  // Avoid an intermediate victory check while the stable map ID is vacant.
  RemoveObject removal;removal.objectID=id;removal.initiator=player;gh.sendAndApply(removal);
  gh.newObject(replacement,player);
  state["objectIdentities"][std::to_string(id.getNum())].Vector()={JsonNode(int(target.ID)),JsonNode(target.subID)};
  state["tileIdentities"].Struct().erase(era_campaign_hints::positionKey(position));persist();
 }
 bool visit(const CGObjectInstance * obj,const CGHeroInstance * h,bool actualEntry)
 {
  bind();if(!active)return false;
  // Town/hero placement can visit an object before the source initializer is
  // started by the first adventure-ready callback. Preserve that native visit.
  if(!vm.initialized&&!vm.initializing)return false;
  require(vm.initialized,"object visit before source initialization completes");
  if(!vm.continuations.empty())
  {
   // Guard contact and movement onto the guarded tile may both report the
   // same visit before the blocking dialog has been answered.
   require(heroId==h->id&&objectId==obj->id,"another object visited while a script is suspended");return true;
  }
  heroId=h->id;objectId=obj->id;player=h->getOwner();updateContext();
  auto rememberTownEntry=[&]
  {
   if(obj->ID!=Obj::TOWN)return;
   auto & entry=state["nativeTownEntries"][std::to_string(h->id.getNum())];
   entry["object"].Integer()=obj->id.getNum();entry["actual"].Bool()=actualEntry;
  };
  // Preserve source coordinates/type before the native effect can remove the
  // visited object. The native visit query also survives script dialogs.
  if(std::any_of(program.blocks.begin(),program.blocks.end(),[](const Trigger & block){return block.post&&block.receiver=="OB";}))
  {
   const auto source=identity(obj);const auto pos=obj->visitablePos();
   auto & post=state["postVisits"][std::to_string(h->id.getNum())];
   post["object"].Integer()=obj->id.getNum();post["type"].Integer()=int(source.ID);post["subtype"].Integer()=source.subID;
   post["x"].Integer()=pos.x;post["y"].Integer()=pos.y;post["z"].Integer()=pos.z;persist();
  }
  correctMessengerDwelling(obj);
  const auto pos=obj->visitablePos();vm.v[998]=pos.x;vm.v[999]=pos.y;vm.v[1000]=pos.z;
  if(obj->ID!=Obj::EVENT)
  {
   Executor executor(program,vm,context,*this);
   const auto * target=dynamic_cast<const CGHeroInstance *>(obj);
   if(target&&target->id!=h->id)
   {
    // HE identifies the encountered hero; HE-1 and source variables still
    // refer to the visiting hero saved above, including after a dialog reload.
    if(executor.dispatchAny("HE",{{target->getHeroTypeID().getNum()}})){rememberTownEntry();run();return true;}
   }
   else
   {
    const auto source=identity(obj);
    if(executor.dispatchAny("OB",{{int(source.ID)},{int(source.ID),source.subID},{pos.x,pos.y,pos.z}})){rememberTownEntry();run();return true;}
   }
   const bool handled=!allowsObject(obj,h)||consumeScriptChest(obj,h)||consumeEmptyMonster(obj,h)||consumeLeftTroop(obj,h);heroId=ObjectInstanceID::NONE;objectId=ObjectInstanceID::NONE;return handled;
  }
  const auto * local=dynamic_cast<const CGEvent *>(obj);
  const bool human=gh.gameInfo().getPlayerState(h->getOwner())->isHuman();
  if(!local||!local->availableFor.count(h->getOwner())||(human?!local->humanActivate:!local->computerActivate))return false;
  Executor executor(program,vm,context,*this);executor.dispatch("LE",{pos.x,pos.y,pos.z});run();return true;
 }
};
Step SourceCampaignProcessor::Impl::execute(const Command & c,const Operation & op,State &,const Context &)
{
 const auto & args=op.args;
 comparison.reset();
 if(c.receiver=="MW")
 {
  auto & rows=state["wanderingMonsters"].Vector();
  if(op.code=="M"||op.code=="C")
  {
   require(c.selectors.empty(),"wandering conversion takes no selector");arity(op,4);
   for(int i=0;i<3;++i)require(args[i].access==Access::Read,"wandering coordinates must be values");
   require(args[3].access==Access::Write||args[3].access==Access::Compare,"wandering identity output is required");
   const int3 pos(number(args[0]),number(args[1]),number(args[2]));require(gh.gameState().getMap().isInTheMap(pos),"wandering coordinates outside map");
   const CGCreature * monster=nullptr;
   for(const auto & obj:gh.gameState().getMap().objects)
    if(const auto * candidate=dynamic_cast<const CGCreature *>(obj.get());candidate&&candidate->visitablePos()==pos&&identity(candidate).ID==Obj::MONSTER){monster=candidate;break;}
   int index=-1;
   if(monster||op.code=="C")for(std::size_t i=0;i<rows.size();++i)if(!rows[i].isNull())
   {
    const auto & position=era_campaign_json::array(rows[i]["position"]);require(position.size()==3,"invalid wandering position");
    if(position[0].Integer()==pos.x&&position[1].Integer()==pos.y&&position[2].Integer()==pos.z){index=i;break;}
   }
   if(index<0&&monster&&op.code=="M")
   {
    std::size_t slot=0;while(slot<rows.size()&&!rows[slot].isNull())++slot;
    if(slot<1000)
    {
     if(slot==rows.size())rows.emplace_back();auto & row=rows[slot];row["object"].Integer()=monster->id.getNum();
     row["position"].Vector()={JsonNode(pos.x),JsonNode(pos.y),JsonNode(pos.z)};
     row["radius"].Integer()=20;row["mode"].Integer()=1;row["owner"].Integer()=-1;index=slot;persist();
    }
   }
   value(index+1,args[3]);return Step::Continue;
  }
  require(c.selectors.size()==1&&c.selectors[0].access==Access::Read,"wandering receiver needs an index");
  const int id=number(c.selectors[0]);require(id>=1&&id<=1000,"wandering index outside1..1000");
  const bool exists=id<=int(rows.size())&&!rows[id-1].isNull();
  if(op.code=="E"){arity(op,1);require(query(op),"wandering existence is read-only");value(exists?1:0,args[0]);return Step::Continue;}
  require(op.code=="A","unsupported wandering operation "+op.code);arity(op,2);
  require(exists&&args[0].access==Access::Read&&number(args[0])==4,"only validated wandering radius setting is admitted");
  auto & row=rows[id-1];const int radius=value(era_campaign_json::integer(row["radius"]),args[1]);
  if(!query(op)){row["radius"].Integer()=era_campaign_wandering::byte(radius);persist();}
  return Step::Continue;
 }
 if(c.receiver=="MA")
 {
  if(op.code=="U"||op.code=="X")
  {
   require(c.selectors.empty(),"source creature rule takes no selector");arity(op,2);require(args[0].access==Access::Read,"source creature rule requires a fixed identity");const auto selected=creature(number(args[0]));const auto key=std::to_string(selected.getNum());
   if(op.code=="U")
   {
    require(!query(op)&&args[1].access==Access::Read&&number(args[1])==-2,"only verified source upgrade disable is admitted");state["creatureUpgrades"][key].Integer()=-2;persist();
   }
   else
   {
    require(args[1].access==Access::Relative&&number(args[1])==-2&&selected.toCreature()->hasBonusOfType(BonusType::FLYING)&&state["creatureFlightDisabled"][key].isNull(),"only verified source flying-flag subtraction is admitted");state["creatureFlightDisabled"][key].Bool()=true;auto change=mutation("creatureFlightDisabled",ObjectInstanceID::NONE);change["creature"].Integer()=selected.getNum();persist(change);
   }
   return Step::Continue;
  }
  if(op.code=="C")
  {
   require(c.selectors.empty(),"source creature cost takes no selector");arity(op,3);
   require(args[0].access==Access::Read&&args[1].access==Access::Read,"source creature cost needs fixed indices");require(number(args[0])>=0,"negative source creature cost index");
   require(query(op),"source creature cost writes are not admitted");
   const auto selected=creature(number(args[0]));const int resource=number(args[1]);require(resource>=0&&resource<=7,"source creature cost resource outside0..7");
   // Original MA:C indexes seven resource words; index7 aliases the next
   // signed word (MA:F / FightValue), independently of native Mithril costs.
   value(resource==7?selected.toCreature()->getFightValue():era_compat::creature_prices::get(gh.gameInfo(),*selected.toCreature())[GameResID(resource)],args[2]);return Step::Continue;
  }
  if(op.code=="F")
  {
   require(c.selectors.empty(),"source creature fight value takes no selector");arity(op,2);
   require(args[0].access==Access::Read&&number(args[0])>=0,"source creature fight value needs a fixed identity");
   require(query(op),"source creature fight value writes are not admitted");
   value(creature(number(args[0])).toCreature()->getFightValue(),args[1]);return Step::Continue;
  }
  require(c.selectors.empty()&&op.code.size()==1,"source creature attribute takes no selector");arity(op,2);
  require(args[0].access==Access::Read&&number(args[0])>=0,"source creature attribute needs a nonnegative creature value");
  const auto selected=creature(number(args[0]));const char field=op.code.front();era_campaign_creature_attributes::fieldIndex(field);
  const auto key=std::to_string(selected.getNum());
  int changed=value(era_campaign_creature_attributes::current(gh.gameState(),selected,field),args[1]);
  if(!query(op))
  {
   require(!gh.gameState().getBattle(player),"source creature attributes during an active battle are not admitted");
   if(field=='S')changed=std::max(1,changed); // 358f MA:S clamps writes after Apply, not reads.
   if(field=='L')changed=era_bridge::creature_levels::writeLevel(changed);
   require(changed>=(field=='L'?-1:field=='P'?1:0),"nonpositive health or negative source creature attributes are not admitted");
   state["creatureAttributes"][key][op.code].Integer()=changed;
   auto change=mutation("creatureAttribute",ObjectInstanceID::NONE);change["creature"].Integer()=selected.getNum();change["field"].String()=op.code;change["amount"].Integer()=changed;persist(change);
   if(field=='L')
   {
    EraGameplayChange quote;quote.system="mithril";quote.state=era_compat::mithril::state(gh.gameInfo());
    quote.state["revision"].Integer()=static_cast<uint32_t>(era_compat::mithril::revision(gh.gameInfo())+1U);
    gh.sendAndApply(quote);
   }
  }
  return Step::Continue;
 }
 if(c.receiver=="GR")
 {
  const auto * garrison=dynamic_cast<const CGGarrison *>(object(c,Obj::GARRISON));if(!garrison)return sourceCommandError(c,"not a garrison");
  if(op.code=="F")
  {
   arity(op,1);auto world=era_campaign_admission::bindWorld(state,gh.gameState().getMap().sourceCampaignWorld);auto & settings=world["garrisons"][std::to_string(garrison->id.getNum())];
   const auto & saved=std::as_const(settings)["notRem"];const int previous=saved.isNull()?(garrison->removableUnits?0:1):era_campaign_terrain::byteQuery(era_campaign_json::integer(saved));
   const int changed=value(previous,args[0]);
   if(!query(op)){const int raw=era_campaign_terrain::byteWord(changed);settings["notRem"].Integer()=raw;auto change=mutation("garrisonRemoval",garrison->id);change["removable"].Bool()=raw==0;persist(change,nullptr,nullptr,world);}
  }
  else if(op.code=="O")
  {
   arity(op,1);const int changed=value(garrison->getOwner().isValidPlayer()?garrison->getOwner().getNum():-1,args[0]);
   if(!query(op)){require(changed>=-1&&changed<8,"source garrison owner outside-1..7");gh.setOwner(garrison,changed<0?PlayerColor::NEUTRAL:PlayerColor(changed));}
  }
  else if(op.code=="G")
  {
   arity(op,3);const int index=number(args[0]);require(index>=0&&index<7,"source garrison guard slot outside0..6");const SlotID slot(index);const auto * stack=garrison->getStackPtr(slot);
   auto world=era_campaign_admission::bindWorld(state,gh.gameState().getMap().sourceCampaignWorld);auto & empty=world["garrisons"][std::to_string(garrison->id.getNum())]["emptyGuards"];
   const auto & previous=std::as_const(empty)[std::to_string(index)];const int type=value(stack?sourceCreature(stack->getId()):-1,args[1]),count=value(stack?stack->getCount():previous.isNull()?0:era_campaign_json::integer(previous),args[2]);
   if(!query(op))
   {
    require(count>=0,"negative source garrison guard count is not admitted");
    if(type<0||count==0){if(stack)gh.eraseStack({garrison->id,slot},true);empty[std::to_string(index)].Integer()=count;}
    else {if(!stack)gh.insertNewStack({garrison->id,slot},creature(type).toCreature(),count);else{gh.changeStackType({garrison->id,slot},creature(type).toCreature());gh.changeStackCount({garrison->id,slot},count,ChangeValueMode::ABSOLUTE);}empty.Struct().erase(std::to_string(index));}
    persist(JsonNode(),nullptr,nullptr,world);
   }
  }
  else throw std::runtime_error("Original campaign: unsupported garrison operation "+op.code);
  return Step::Continue;
 }
 if(c.receiver=="CA")
 {
  const auto * town=dynamic_cast<const CGTownInstance *>(object(c,Obj::TOWN));if(!town)return sourceCommandError(c,"not a town");
  auto world=era_campaign_admission::bindWorld(state,gh.gameState().getMap().sourceCampaignWorld);
  auto & settings=world["towns"][std::to_string(town->id.getNum())];
  if(op.code=="O")
  {
   arity(op,1);const int changed=value(town->getOwner().isValidPlayer()?town->getOwner().getNum():-1,args[0]);
   if(!query(op)){require(changed>=-1&&changed<8,"source town owner outside-1..7");gh.setOwner(town,changed<0?PlayerColor::NEUTRAL:PlayerColor(changed));}
  }
  else if(op.code=="T")
  {arity(op,1);require(query(op),"source town faction writes are not admitted");value(identity(town).subID,args[0]);}
  else if(op.code=="N")
  {
   arity(op,1);if(args[0].access==Access::Write)writeText(args[0],vm,context,town->getNameTranslated());
   else {require(args[0].access==Access::Read&&textOperand(args[0],vm),"source town name needs text");auto change=mutation("townName",town->id);change["text"].String()=readText(args[0],vm,context);persist(change);}
  }
  else if(op.code=="G")
  {
   arity(op,1);const int changed=value(town->mageGuildLevel(),args[0]);
   if(!query(op)){require(changed>=0&&changed<=5,"source guild level outside0..5");settings["guildLevel"].Integer()=changed;persist(JsonNode(),nullptr,nullptr,world);}
  }
  else if(op.code=="M")
  {
   arity(op,4);require(number(args[0])==2,"source town army mode is not admitted");const int index=number(args[1]);require(index>=0&&index<7,"source town guard slot outside0..6");
   const SlotID slot(index);const auto * stack=town->getStackPtr(slot);const auto & empty=settings["emptyGuards"][std::to_string(index)];
   const int type=value(stack?sourceCreature(stack->getId()):-1,args[2]),count=value(stack?stack->getCount():empty.isNull()?0:era_campaign_json::integer(empty),args[3]);
   if(!query(op))
   {
    require(count>=0,"negative source town guard count is not admitted");
    if(type<0||count==0){if(stack)gh.eraseStack({town->id,slot},true);settings["emptyGuards"][std::to_string(index)].Integer()=count;}
    else {if(!stack)gh.insertNewStack({town->id,slot},creature(type).toCreature(),count);else{gh.changeStackType({town->id,slot},creature(type).toCreature());gh.changeStackCount({town->id,slot},count,ChangeValueMode::ABSOLUTE);}settings["emptyGuards"].Struct().erase(std::to_string(index));}
    persist(JsonNode(),nullptr,nullptr,world);
   }
  }
  else if(op.code=="B")
  {
   arity(op,2);require(!query(op),"source building operation takes values");const int mode=number(args[0]),source=number(args[1]);require(source>=0&&source<44,"original building outside0..43");const BuildingID building(source);
   if(mode==3)writeFlag(1,vm,town->hasBuilt(building));
   else
   {
    require(mode>=1&&mode<=5,"source building mode outside1..5");
    if(mode<=2&&settings["guildLevel"].isNull())settings["guildLevel"].Integer()=town->mageGuildLevel();
    auto change=mutation("townBuilding",town->id);change["mode"].Integer()=mode;change["building"].Integer()=source;
    const int lower=era_campaign_town::lowerBuilding(source);change["lower"].Integer()=lower;
    if(mode==1||(mode==2&&lower>=0))require(town->getTown()->buildings.count(mode==1?building:BuildingID(lower))!=0,"unbound source town building");
    persist(change,nullptr,nullptr,world);
   }
  }
  else throw std::runtime_error("Original campaign: unsupported town operation "+op.code);
  return Step::Continue;
 }
 if(c.receiver=="DW")
 {
  const auto * target=object(c,Obj::CREATURE_GENERATOR1);if(!target)target=object(c,Obj::CREATURE_GENERATOR4);const auto * dwelling=dynamic_cast<const CGDwelling *>(target);
  if(!dwelling)return sourceCommandError(c,"not a dwelling");
  if(op.code=="M")
  {
   arity(op,3);const int index=number(args[0]);require(index>=0&&index<4,"original dwelling recruit slot outside0..3");
   require(static_cast<std::size_t>(index)<=dwelling->creatures.size(),"sparse dwelling recruit slots are not admitted");
   const bool present=static_cast<std::size_t>(index)<dwelling->creatures.size();
   const int oldType=present&&!dwelling->creatures[index].second.empty()?sourceCreature(dwelling->creatures[index].second.front()):-1;
   const int type=value(oldType,args[1]),count=value(present?era_campaign_town::recruitQuery(dwelling->creatures[index].first):0,args[2]);
   if(!query(op))
   {
    require(type>=0,"empty source dwelling recruit types are not admitted");
    SetAvailableCreatures change;change.tid=dwelling->id;change.creatures=dwelling->creatures;
    if(!present)change.creatures.resize(index+1);
    change.creatures[index]={era_campaign_town::recruitWord(count),{creature(type)}};gh.sendAndApply(change);state["dwellings"][std::to_string(dwelling->id.getNum())]["configured"].Bool()=true;persist();
   }
  }
  else if(op.code=="G")
  {
   arity(op,3);const int index=number(args[0]);require(index>=0&&index<7,"source dwelling guard slot outside0..6");
   const SlotID slot(index);const auto * stack=dwelling->getStackPtr(slot);
   const int type=value(stack?sourceCreature(stack->getId()):-1,args[1]),count=value(stack?stack->getCount():0,args[2]);
   if(!query(op))
   {
    require(count>=0,"negative source dwelling guard count is not admitted");
    if(type<0||count==0){if(stack)gh.eraseStack({dwelling->id,slot},true);}
    else if(!stack)gh.insertNewStack({dwelling->id,slot},creature(type).toCreature(),count);
    else {gh.changeStackType({dwelling->id,slot},creature(type).toCreature());gh.changeStackCount({dwelling->id,slot},count,ChangeValueMode::ABSOLUTE);}
   }
  }
  else if(op.code=="O")
  {
   arity(op,1);const int old=dwelling->getOwner().isValidPlayer()?dwelling->getOwner().getNum():-1,changed=value(old,args[0]);
   if(!query(op)){require(changed>=-1&&changed<8,"source dwelling owner outside-1..7");gh.setOwner(dwelling,changed<0?PlayerColor::NEUTRAL:PlayerColor(changed));}
  }
  else throw std::runtime_error("Original campaign: unsupported dwelling operation "+op.code);
  return Step::Continue;
 }
 if(c.receiver=="WG")
 {
  const auto * wagon=dynamic_cast<const CRewardableObject *>(object(c,Obj::WAGON));if(!wagon)return sourceCommandError(c,"not a wagon");
  require(op.code=="S"||op.code=="B"||op.code=="A"||op.code=="R","unsupported wagon operation");arity(op,op.code=="R"?2:1);
  auto & data=state["wagons"][std::to_string(wagon->id.getNum())];
  if(data.isNull())
  {
   int present=0,artifactMode=0,artifact=0,resource=0,count=0;
   for(const auto & info:wagon->configuration.info)if(info.visitType==Rewardable::EEventType::EVENT_FIRST_VISIT)
   {
    if(!info.reward.grantedArtifacts.empty())
    {
     present=artifactMode=1;const auto id=info.reward.grantedArtifacts.front();bool found=false;
     for(int source=0;source<=170;++source)if(LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(source))==id){artifact=source;found=true;break;}
     if(!found){artifact=-1;data["nativeArtifact"].Integer()=id.getNum();}
    }
    for(int index=0;index<7;++index)if(info.reward.resources[GameResID(index)]>0){present=1;resource=index;count=info.reward.resources[GameResID(index)];break;}
   }
   data["S"].Integer()=present;data["B"].Integer()=artifactMode;data["A"].Integer()=artifact;data["resource"].Integer()=resource;data["count"].Integer()=count;
  }
  // Native visitor records retain consumption for every player. S resets
  // them and the once-only flag, as the original clears Whom even for S0.
  if(std::any_of(gh.gameState().players.begin(),gh.gameState().players.end(),[&](const auto & entry){return entry.second.visitedObjects.count(wagon->id)!=0;}))data["S"].Integer()=0;
  if(op.code=="R")
  {
   const int resource=value(era_campaign_json::integer(data["resource"]),args[0]),count=value(era_campaign_json::integer(data["count"]),args[1]);
   if(!query(op)){data["resource"].Integer()=static_cast<std::uint32_t>(resource)&15u;data["count"].Integer()=static_cast<std::uint32_t>(count)&31u;}
  }
  else
  {
   require(op.code!="A"||!query(op)||era_campaign_json::integer(data["A"])>=0,"foreign artifact in source wagon query");
   const int changed=value(era_campaign_json::integer(data[op.code]),args[0]);
   if(!query(op)){data[op.code].Integer()=static_cast<std::uint32_t>(changed)&(op.code=="A"?1023u:1u);if(op.code=="A")data.Struct().erase("nativeArtifact");}
  }
  if(query(op)){persist();return Step::Continue;}
  auto config=wagon->configuration;config.visitMode=Rewardable::VISIT_ONCE;config.selectMode=Rewardable::SELECT_FIRST;config.canRefuse=false;
  config.info.clear();config.info.emplace_back();auto & info=config.info.back();info.visitType=Rewardable::EEventType::EVENT_FIRST_VISIT;
  if(data["S"].Integer()==0)info.message.appendLocalString(EMetaText::ADVOB_TXT,156);
  else if(data["B"].Integer()!=0)
  {
   const int source=era_campaign_json::integer(data["A"]);require(source<=170&&(source>=0||data["nativeArtifact"].isNumber()),"unbound source wagon artifact");
   info.reward.grantedArtifacts.push_back(source<0?ArtifactID(era_campaign_json::integer(data["nativeArtifact"])):LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(source)));info.message.appendLocalString(EMetaText::ADVOB_TXT,155);
  }
  else
  {
   const int source=era_campaign_json::integer(data["resource"]);require(source<8,"unbound source wagon resource");GameResID resource(source);
   if(source==7){const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"resource","wake-of-gods.mithril:mithril",true);require(id.has_value(),"source mithril unavailable");resource=GameResID(*id);}
   info.reward.resources[resource]=era_campaign_json::integer(data["count"]);info.message.appendLocalString(EMetaText::ADVOB_TXT,154);
  }
  config.info.emplace_back();config.info.back().visitType=Rewardable::EEventType::EVENT_ALREADY_VISITED;config.info.back().message.appendLocalString(EMetaText::ADVOB_TXT,156);
  persist(JsonNode(),wagon,&config);
  if(op.code=="S"){gh.setObjPropertyValue(wagon->id,ObjProperty::REWARD_CLEARED,false);ChangeObjectVisitors cleared(ChangeObjectVisitors::VISITOR_CLEAR,wagon->id);gh.sendAndApply(cleared);}
  return Step::Continue;
 }
 if(c.receiver=="CH")
 {
  arity(op,1);require(op.code=="S"||op.code=="B"||op.code=="A","unadmitted chest operation");
  const auto * chest=dynamic_cast<const CRewardableObject *>(object(c,Obj::TREASURE_CHEST));
  if(!chest)return sourceCommandError(c,"not a chest");
  auto & data=state["chests"][std::to_string(chest->id.getNum())];
  if(data.isNull())
  {
   int mode=0,bonus=0,artifact=-1;
   for(const auto & info:chest->configuration.info)if(info.visitType==Rewardable::EEventType::EVENT_FIRST_VISIT)
   {
    if(!info.reward.grantedArtifacts.empty()){mode=1;const auto id=info.reward.grantedArtifacts.front();for(int source=0;source<144;++source)if(LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(source))==id){artifact=source;break;}}
    if(info.reward.resources[EGameResID::GOLD]>0)bonus=info.reward.resources[EGameResID::GOLD]/500;
   }
   data["S"].Integer()=mode;data["A"].Integer()=artifact;data["B"].Integer()=era_campaign_chest::bonus(bonus);
  }
  const int old=data[op.code].Integer();require(op.code!="A"||old>=0||!query(op),"unbound original chest artifact");const int changed=value(old,args[0]);
  if(query(op))return Step::Continue;
  const int stored=op.code=="S"?era_campaign_chest::mode(changed):op.code=="B"?era_campaign_chest::bonus(changed):era_campaign_chest::artifact(changed);
  data[op.code].Integer()=stored;
  auto config=chest->configuration;config.info.clear();config.selectMode=Rewardable::SELECT_PLAYER;config.canRefuse=false;config.variables.values["eraCampaignChest"]=1;
  const auto add=[&]() -> Rewardable::VisitInfo & {config.info.emplace_back();auto & info=config.info.back();info.visitType=Rewardable::EEventType::EVENT_FIRST_VISIT;info.reward.removeObject=true;return info;};
  if(data["S"].Integer()!=0)
  {
   const int original=data["A"].Integer();require(original>=0&&original<144,"unbound original chest artifact");auto & info=add();info.reward.grantedArtifacts.push_back(LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(original)));info.message.appendLocalString(EMetaText::GENERAL_TXT,145);info.message.replaceName(info.reward.grantedArtifacts.front());
  }
  else
  {
   auto & gold=add();const int amount=era_campaign_chest::gold(data["B"].Integer());gold.reward.resources[EGameResID::GOLD]=amount;if(amount==0)gold.reward.extraComponents.emplace_back(ComponentType::RESOURCE,GameResID(EGameResID::GOLD),0);
   auto & experience=add();experience.reward.heroExperience=era_campaign_chest::experience(data["B"].Integer());if(experience.reward.heroExperience==0)experience.reward.extraComponents.emplace_back(ComponentType::EXPERIENCE,0);
  }
  persist(JsonNode(),chest,&config);return Step::Continue;
 }
 if(c.receiver=="CD")
 {
  auto world=era_campaign_demolition::bind(state,gh.gameState().getMap().sourceCampaignWorld);
  std::string key;int previous=0;std::size_t argument=0;
  if(op.code=="E"||op.code=="A")
  {
   arity(op,3);require(args[0].access==Access::Read&&args[1].access==Access::Read,"CD threshold needs fixed indices");
   const int faction=number(args[0]),building=number(args[1]);require(faction>=0&&faction<9&&building>=0&&building<44,"CD threshold index outside source table");
   key=op.code+":"+std::to_string(faction)+":"+std::to_string(building);argument=2;
   previous=era_campaign_demolition::minimum(world,faction,building,op.code=="A");
  }
  else if(op.code=="D"||op.code=="M")
  {
   arity(op,1);require(args[0].access==Access::Read||args[0].access==Access::Relative,"CD control does not support output operands");
   key=op.code;previous=era_campaign_demolition::setting(world,key,op.code=="D"?era_campaign_demolition::dailyLimit:era_campaign_demolition::movementLoss);
  }
  else if(op.code=="N")
  {
   arity(op,2);require(args[0].access==Access::Read,"CD surcharge needs a fixed index");const int index=number(args[0]);require(index>=0&&index<100,"CD surcharge index outside source table");
   require(args[1].access==Access::Read||args[1].access==Access::Relative,"CD surcharge does not support output operands");
   key="N:"+std::to_string(index);argument=1;previous=era_campaign_demolition::setting(world,key,era_campaign_demolition::surcharges.at(index));
  }
  else throw std::runtime_error("Original campaign: unadmitted CD operation "+op.code);
  int changed=value(previous,args[argument]);
  if(!query(op))
  {
   if(op.code=="D"||op.code=="M"||op.code=="N")changed=std::max(0,changed);
   require(op.code!="D"||changed<=100,"CD daily limit exceeds the source surcharge table");
   world["demolition"]["settings"][key].Integer()=changed;persist(JsonNode(),nullptr,nullptr,std::move(world));
  }
  return Step::Continue;
 }
 if(c.receiver=="IF")
 {
  era_campaign_dialogs::Dialogs dialogs(state["dialogs"],vm,context);
  auto prompt=dialogs.execute(op);if(prompt.isNull())return Step::Continue;
  if(!gh.gameInfo().getPlayerState(player)->isHuman())
  {
   const auto kind=prompt["kind"].String();
   if(kind=="message")dialogs.reply(prompt,1,"");
   else if(kind=="question")dialogs.reply(prompt,0,"");
   else throw std::runtime_error("Original campaign: interactive AI dialog is not admitted");
   return Step::Continue;
  }
  pending=std::move(prompt);return Step::Suspend;
 }
 if(c.receiver=="UN")
 {
  require(c.selectors.empty(),"universal receiver does not take selectors");
  if(op.code=="B")
  {
   arity(op,2);require(args[0].access==Access::Read&&number(args[0])==1,"unvalidated native object reward override");
   const auto & policy=std::as_const(state)["scriptChestOnly"];const int previous=!policy.isNull()&&policy.Bool()?1:0;
   const int changed=value(previous,args[1]);
   if(!query(op)){require(changed==0||changed==1,"native chest override outside0..1");state["scriptChestOnly"].Bool()=changed!=0;persist();}
   return Step::Continue;
  }
  if(op.code=="P")
  {
   arity(op,2);require(args[0].access==Access::Read&&args[1].access==Access::Write,"unvalidated original WoG option access");
   const auto option=era_compat::source_options::read(gh.gameInfo(),number(args[0]));
   require(option.has_value(),"unvalidated original WoG option access");
   value(*option,args[1]);return Step::Continue;
  }
  if(op.code=="G")
  {
   arity(op,4);for(int i=0;i<3;++i)require(args[i].access==Access::Read,"source text identity requires values");require(number(args[0])==1,"only verified creature text bindings are admitted");const auto selected=creature(number(args[1]));const int field=number(args[2]);require(field>=0&&field<=2,"source creature text field outside0..2");
   auto & binding=state["creatureNameBindings"][std::to_string(selected.getNum())][std::to_string(field)];const int index=value(binding.isNull()?0:era_campaign_json::integer(binding),args[3]);if(!query(op)){require(index>=0&&index<=1000,"source creature text outside local z table");binding.Integer()=index;persist();}return Step::Continue;
  }
  if(op.code=="N")
  {
   require(args.size()==3||args.size()==4,"invalid source name arity");
   for(const auto & arg:args)require(arg.access==Access::Read,"source name arguments must be values");
   const int kind=number(args[0]),destination=number(args[1]),source=number(args[2]);
   require((destination>=1&&destination<=1000)||(destination>=-10&&destination<=-1),"source name string index outside local tables");
   std::string name;
   if(kind==0)
   {
    arity(op,3);require(source>=0&&source<=170,"source artifact name index outside0..170");
    const auto * artifact=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(source)).toArtifact();require(artifact!=nullptr,"unbound source artifact name");name=artifact->getNameTranslated();
   }
   else if(kind==1)
   {
    arity(op,3);require(source>=0&&source<70,"source spell name index outside0..69");const auto * spell=SpellID(source).toSpell();require(spell!=nullptr,"unbound source spell name");name=spell->getNameTranslated();
   }
   else if(kind==3)
   {
    arity(op,4);require(number(args[3])>=0,"negative source creature name plurality");const auto * type=creature(source).toCreature();const int field=number(args[3])?1:0;
    const auto & binding=std::as_const(state)["creatureNameBindings"][std::to_string(type->getId().getNum())][std::to_string(field)];
    name=!binding.isNull()&&binding.Integer()!=0?lookup(vm.z,int(binding.Integer())):LIBRARY->generaltexth->translateWithoutMapOverrides(TextIdentifier(field?type->getNamePluralTextID():type->getNameSingularTextID()));
   }
   else if(kind==4)
   {
    arity(op,3);require(source>=0&&source<28,"source secondary skill name outside0..27");const auto * skill=SecondarySkill(source).toSkill();require(skill!=nullptr,"unbound source secondary skill name");name=skill->getNameTranslated();
   }
   else throw std::runtime_error("Original campaign: unsupported source name kind");
   const auto count=TextOperations::getUnicodeCharactersCount(name);if(count>511)TextOperations::trimRightUnicode(name,count-511);
   writeStringCell(vm,destination,std::move(name));return Step::Continue;
  }
  if(op.code=="V")
  {
   arity(op,2);for(const auto & arg:args)require(arg.access==Access::Write||arg.access==Access::Compare,"source version is read-only");
   // Pinned 358f 72EA9D..CA. Report the emulated script contract, not a
   // fabricated ERA version or native memory addresses from Windows.
   value(358,args[0]);value(281,args[1]);return Step::Continue;
  }
  if(op.code=="R")
  {
   arity(op,1);require(args[0].access==Access::Read,"redraw mode needs a value");const int mode=number(args[0]);require(mode==1||mode==2,"unsupported source redraw mode");
   auto change=mutation("mapRefresh",ObjectInstanceID::NONE);change["mode"].Integer()=mode;change["player"].Integer()=player.getNum();persist(change);return Step::Continue;
  }
  if(op.code=="E")
  {
   arity(op,3);for(const auto & arg:args)require(arg.access==Access::Read,"source placement query needs coordinates");
   const int3 pos(number(args[0]),number(args[1]),number(args[2]));const auto & map=gh.gameState().getMap();require(map.isInTheMap(pos),"source placement query outside map");
   // EmptyPlace2 delegates to EmptyPlace: an entrance, blocked cell,
   // water, rock or local event makes flag1 true (placement is impossible).
   const auto & tile=map.getTile(pos);bool occupied=tile.visitable()||tile.blocked()||tile.isWater()||!tile.getTerrain()->isPassable();
   if(!occupied)for(const auto & object:map.objects)if(object&&object->ID==Obj::EVENT&&object->visitablePos()==pos){occupied=true;break;}
   writeFlag(1,vm,occupied);return Step::Continue;
  }
  if(op.code=="D")
  {
   require(args.size()==3||args.size()==4,"invalid source water path arity");
   for(const auto & arg:args)require(arg.access==Access::Read,"source water path needs value arguments");
   const int3 pos(number(args[0]),number(args[1]),number(args[2]));require(gh.gameState().getMap().isInTheMap(pos),"source water path outside map");
   const int enabled=args.size()==4?number(args[3]):1;require(enabled==1,"removing an untracked original water path is not admitted");
   // Original StepWater changes the terrain to swamp and draws208/1 with
   // ZObrevno.def. Its omitted fourth operand uniquely defaults to1.
   const auto handler=LIBRARY->objtypeh->getHandlerFor(Obj::LOG,MapObjectSubID(0));
   std::shared_ptr<const ObjectTemplate> appearance;
   for(const auto & candidate:handler->getTemplates())if(candidate->animationFile==AnimationPath::builtin("objects/zobrevno.def")){appearance=candidate;break;}
   require(appearance!=nullptr,"original water path artwork unavailable");
   auto change=mutation("terrainAppearance",ObjectInstanceID::NONE);change["x"].Integer()=pos.x;change["y"].Integer()=pos.y;change["z"].Integer()=pos.z;change["terrain"].Integer()=4;persist(change);
   auto logs=gh.createNewObject(pos,Obj::LOG,MapObjectSubID(0));logs->appearance=appearance;logs->setAnchorPos(pos);gh.newObject(logs,player);
   state["objectIdentities"][std::to_string(logs->id.getNum())].Vector()={JsonNode(208),JsonNode(1)};persist();return Step::Continue;
  }
  if(op.code=="S"||op.code=="H")
  {
   arity(op,5);require(!query(op),"fog arguments must be values");const int3 center(number(args[0]),number(args[1]),number(args[2]));const int target=number(args[3]),radius=number(args[4]);
   require(gh.gameState().getMap().isInTheMap(center)&&radius>=0,"invalid source fog area");
   if(op.code=="H")era_compat::source_fog::hide(gh,center,radius,target);
   else
   {
    const PlayerColor owner(target);require(owner.isValidPlayer(),"invalid source reveal player");
    if(gh.gameInfo().getPlayerState(owner,false))gh.changeFogOfWar(center,radius,owner,ETileVisibility::REVEALED);
   }
   return Step::Continue;
  }
  if(op.code=="J")
  {
   arity(op,3);require(args[0].access==Access::Read&&number(args[0])==6,"unadmitted source UN:J mode");
   require(args[1].access==Access::Read&&args[2].access==Access::Write,"source artifact selection needs class flags and an output");
   const int classes=number(args[1]);require(classes>0&&(classes&~30)==0,"unadmitted source random artifact class mask");
   const auto selected=gh.randomizer->rollOriginalArtifact(classes);require(selected.has_value(),"no allowed original artifact remains");
   value(*selected,args[2]);return Step::Continue;
  }
  if(op.code=="K"||op.code=="M")
  {
   require(!args.empty()&&args[0].access==Access::Read,"calendar mode needs a value");
   auto settings=era_campaign_calendar_json::read(state);const int mode=number(args[0]);
   if(op.code=="K")
   {
    arity(op,2);require(mode==1||mode==2,"unknown source week setting");
    auto & selected=mode==1?settings.week:settings.message;selected=value(selected,args[1]);era_campaign_calendar::validate(settings);
    if(!query(op)){era_campaign_calendar_json::write(state,settings);persist();}
   }
   else
   {
    require(mode>=0&&mode<=3,"unknown source month setting");arity(op,mode==2?2:1);settings.month=mode;
    if(mode==2){const int selected=value(settings.creature,args[1]);creature(selected);if(!query(op))settings.creature=selected;}
    era_campaign_calendar_json::write(state,settings);persist();
   }
   return Step::Continue;
  }
  require(op.code=="O"||op.code=="I","unsupported universal operation "+op.code);
  require(op.code=="O"?(args.size()>=3&&args.size()<=5):(args.size()>=5&&args.size()<=9),"unsupported universal object arity");
  for(const auto & arg:args)require(arg.access==Access::Read,"object mutation needs value arguments");
  const int3 anchor(number(args[0]),number(args[1]),number(args[2]));const auto & map=gh.gameState().getMap();require(map.isInTheMap(anchor),"object anchor outside map");
  if(op.code=="O")
  {
   const int clearDescription=args.size()>3?number(args[3]):0,refresh=args.size()>4?number(args[4]):1;
   require(clearDescription==0||clearDescription==1,"invalid description removal flag");require(refresh==1,"deferred object refresh not admitted");
   std::array<std::vector<const CGObjectInstance *>,4> primary;
   for(const auto & obj:map.objects)if(obj&&obj->ID!=Obj::HERO&&obj->appearance)
   {
    // Original tile rebuild 0x505c60: visit bits first; then the blocking
    // footprint of the eight entrance-bearing types; then other blockers.
    // Pure ground decals do not acquire DrawNum. A hole is a fallback.
    if(obj->visitableAt(anchor))primary[0].push_back(obj.get());
    else if(obj->blockingAt(anchor))
    {
     const int type=int(identity(obj.get()).ID);
     const bool entrance=type==17||type==20||type==33||type==42||type==53||type==77||type==87||type==98;
     primary[entrance?1:2].push_back(obj.get());
    }
    else if(obj->coveringAt(anchor)&&identity(obj.get()).ID==Obj::HOLE)primary[3].push_back(obj.get());
   }
   const CGObjectInstance * target=nullptr;
   for(const auto & layer:primary)if(!layer.empty())
   {
    if(layer.size()==1){target=layer.front();break;}
    // DrawNum scans the draw list backwards. Its first ordering key is the
    // signed depth byte at this tile (0x505880). Distinct depths are sufficient
    // to resolve e.g. the authored town overlapping a ground-priority mine.
    int highest=-1;bool tied=false;
    for(const auto * candidate:layer)
    {
     const auto offset=candidate->anchorPos()-anchor;
     const auto & appearance=*candidate->appearance;
     const int rank=era_campaign_drawing::depth(offset.x,offset.y,appearance.printPriority,[&](int x,int y){return appearance.isBlockedAt(x,y);});
     if(rank>highest){highest=rank;target=candidate;tied=false;}
     else if(rank==highest)tied=true;
    }
    if(tied&&clearRockBatch()){target=nullptr;break;}
    require(!tied,"ambiguous primary drawing order needs source selection validation");break;
   }
   if(target){const auto removed=target->id;const auto mask=objectMask(removed);if(mask!=255)state["objectAccessPositions"][era_campaign_hints::positionKey(target->visitablePos())].Integer()=mask;require(gh.removeObject(target,player),"object removal failed");if(objectId==removed)objectId=ObjectInstanceID::NONE;for(const auto & field:{"objectAccess","objectIdentities","leftTroops"})if(!state[field].isNull())state[field].Struct().erase(std::to_string(removed.getNum()));}
   if(!state["tileIdentities"].isNull())state["tileIdentities"].Struct().erase(era_campaign_hints::positionKey(anchor));
   if(clearDescription)for(const auto & field:{"objectDescriptions","objectAccessPositions"})if(!state[field].isNull())state[field].Struct().erase(era_campaign_hints::positionKey(anchor));
   persist();return Step::Continue;
  }
  if(args.size()==9)require(number(args[8])==1,"deferred object refresh not admitted");
  int source=number(args[3]),subtype=number(args[4]);require(source>=0&&source!=static_cast<int>(Obj::HERO),"unsupported source object type");
  int visual=args.size()>6?number(args[5]):source,visualSubtype=args.size()>6?number(args[6]):subtype;
  if(source==76){if(visual==source&&visualSubtype==subtype){subtype=random(6,false);source=79;visual=source;visualSubtype=subtype;}else{source=79;subtype=random(6,false);}}
  const bool customTown=source==98&&subtype==0&&visual==63&&visualSubtype==1;
  require((visual==source&&visualSubtype==subtype)||customTown,"different source object appearance not admitted");
  const int surface=args.size()==6?number(args[5]):args.size()>7?number(args[7]):-1;require(surface>=-1&&surface<=8,"source surface outside -1..8");
  auto mapped=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remapObject({Obj(source),subtype});
  if(source==17&&subtype==93)
  {
   // AddStrObject initializes the original DwMonster[93] entry to Fire.
   // The date-dependent correction happens at the next visit, not creation.
   const auto fire=LIBRARY->objtypeh->getHandlerFor("wake-of-gods.messengersandemissaries","core:creatureGeneratorCommon","naturalCalamityFire");
   mapped={Obj(fire->getIndex()),fire->getSubIndex()};
  }
  const MapObjectID type(mapped.ID);const MapObjectSubID sub(mapped.subID);
  require(LIBRARY->objtypeh->knownObjects().count(type)&&LIBRARY->objtypeh->knownSubObjects(type).count(sub),"unbound source object identity");
  const auto handler=LIBRARY->objtypeh->getHandlerFor(type,sub);
  const auto wanted=source==124?map.getTile(anchor).getTerrainID():surface>=0?LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(TerrainId(surface)):TerrainId::NONE;
  const auto visualMapped=customTown?LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remapObject({Obj(visual),visualSubtype}):mapped;
  require(LIBRARY->objtypeh->knownObjects().count(visualMapped.ID)&&LIBRARY->objtypeh->knownSubObjects(visualMapped.ID).count(visualMapped.subID),"unbound source object appearance");
  const auto visualHandler=LIBRARY->objtypeh->getHandlerFor(visualMapped.ID,visualMapped.subID);
  auto templates=LIBRARY->objtypeh->getOriginalTemplates(visualMapped.ID,visualMapped.subID);const bool originalTemplate=!templates.empty();
  if(templates.empty())templates=visualHandler->getTemplates();
  if(wanted!=TerrainId::NONE)templates.erase(std::remove_if(templates.begin(),templates.end(),[&](const auto & item){return !item->canBePlacedAt(wanted);}),templates.end());
  require(!templates.empty(),"source object has no template for its surface");
  auto created=handler->create(&gh.gameInfo(),nullptr);
  // CGDwelling::initObj configures its recruit rows and guards in newObject.
  // Configuring it here as well appends a second native guard army.
  if(source!=17&&source!=20)handler->configureObject(created.get(),*gh.randomizer);
  gh.gs->getMap().generateUniqueInstanceName(created.get());created->appearance=originalTemplate?templates.back():templates.front();
  // Original DEF rows precede the native event fixup. An event must remain
  // passable; retaining their blocked bit can seal a one-tile passage.
  if(type==Obj::EVENT&&visualMapped.ID==Obj::EVENT){created->appearance=era_compat::sourceEventTemplate(*created->appearance);}
  created->setAnchorPos(anchor);
  if(auto monster=std::dynamic_pointer_cast<CGCreature>(created)){monster->initialCharacter=CGCreature::Character::SAVAGE;monster->neverFlees=true;monster->notGrowingTeam=false;monster->gainedArtifact=ArtifactID::NONE;monster->resources=TResources{};monster->message.clear();monster->clearSlots();monster->putStack(SlotID(0),std::make_unique<CStackInstance>(&gh.gameInfo(),CreatureID(sub.getNum()),5));}
  if(auto resource=std::dynamic_pointer_cast<CGResource>(created)){resource->clearSlots();resource->setAmount(5*resource->getResourceHandler()->getAmountMultiplier());}
  if(auto event=std::dynamic_pointer_cast<CGEvent>(created)){event->humanActivate=true;event->computerActivate=false;event->removeAfterVisit=false;event->availableFor.clear();for(int color=0;color<8;++color)event->availableFor.insert(PlayerColor(color));event->configuration.info.clear();event->configuration.info.emplace_back();event->configuration.info.back().visitType=Rewardable::EEventType::EVENT_FIRST_VISIT;}
  if(customTown)
  {
   created->id=ObjectInstanceID(map.objects.size());auto world=era_campaign_admission::bindWorld(state,map.sourceCampaignWorld);auto & setting=world["towns"][std::to_string(created->id.getNum())];
   setting["visualType"].Integer()=visualMapped.ID.getNum();setting["visualSubtype"].Integer()=visualMapped.subID;persist(JsonNode(),nullptr,nullptr,world);
  }
  gh.newObject(created,player);
  if(source==17||source==20)
  {
   // Original 0x4b8760 fills recruit stock with one base weekly growth
   // immediately, including a dwelling created in the middle of the week.
   const auto dwelling=std::dynamic_pointer_cast<CGDwelling>(created);require(dwelling!=nullptr,"created dwelling type mismatch");
   SetAvailableCreatures stock;stock.tid=dwelling->id;stock.creatures=dwelling->creatures;
   for(auto & row:stock.creatures)if(!row.second.empty())row.first=row.second.front().toCreature()->getGrowth();
   gh.sendAndApply(stock);
  }
  if(!state["tileIdentities"].isNull())state["tileIdentities"].Struct().erase(era_campaign_hints::positionKey(created->visitablePos()));auto & legacy=state["objectIdentities"][std::to_string(created->id.getNum())].Vector();legacy={JsonNode(source),JsonNode(subtype)};persist();return Step::Continue;
 }
 if(c.receiver=="BF")
 {
  require(battleScope&&battleScope->battle!=BattleID::NONE&&c.selectors.empty(),"battlefield receiver outside a live battle");
  require(op.code=="C","unsupported battlefield operation "+op.code);
  require(args.empty()||(args.size()==1&&args[0].kind==Kind::Default),"battlefield clear does not take values");
  const auto * battle=gh.gameState().getBattle(battleScope->battle);require(battle!=nullptr,"battlefield event lost its battle");
  BattleObstaclesChanged changed;changed.battleID=battleScope->battle;
  for(const auto & obstacle:battle->battleGetAllObstacles())changed.changes.emplace_back(obstacle->uniqueID,ObstacleChanges::EOperation::REMOVE);
  if(!changed.changes.empty())gh.sendAndApply(changed);
  return Step::Continue;
 }
 if(c.receiver=="BU")
 {
  require(battleScope&&battleScope->battle!=BattleID::NONE&&c.selectors.empty(),"battle units receiver outside a live battle");
  require(op.code=="S","unsupported battle unit operation "+op.code);arity(op,6);
  for(const auto & arg:args)require(arg.access==Access::Read,"battle summon needs values");
  const auto type=creature(number(args[0]));const int count=number(args[1]),hex=number(args[2]),side=number(args[3]);
  require(type.hasValue()&&count>0&&hex>=0&&hex<187&&(side==0||side==1)&&number(args[4])==-1&&(number(args[5])==0||number(args[5])==1),"unvalidated battle summon arguments");
  const auto * battle=gh.gameState().getBattle(battleScope->battle);require(battle!=nullptr,"battle summon lost its battle");
  const BattleHex position(hex);const auto owner=static_cast<BattleSide>(side);
  if(!battle->getAccessibility().accessible(position,type.toCreature()->isDoubleWide(),owner))return Step::Continue;
  battle::UnitInfo info;info.id=battle->battleNextUnitId();info.count=count;info.type=type;info.side=owner;info.position=position;info.summoned=true;
  BattleUnitsChanged changed;changed.battleID=battleScope->battle;changed.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);info.save(changed.changedStacks.back().data);gh.sendAndApply(changed);return Step::Continue;
 }
 if(c.receiver=="BG")
 {
  require(battleScope&&battleScope->battle!=BattleID::NONE&&c.selectors.empty(),"battle action receiver outside a live action");
  arity(op,1);require(query(op),"battle action mutation is not admitted");
  require(op.code=="A"||op.code=="N"||op.code=="D","unsupported battle action operation "+op.code);
  value(battleScope->action[op.code=="A"?0:op.code=="N"?1:2],args[0]);return Step::Continue;
 }
 if(c.receiver=="BH")
 {
  require(battleScope&&battleScope->battle!=BattleID::NONE&&c.selectors.size()==1,"battle hero receiver outside a live battle");
  const int side=number(c.selectors[0]);require(side==0||side==1,"battle hero side outside0..1");
  require(op.code=="N","unsupported battle hero operation "+op.code);arity(op,1);require(query(op),"battle hero number is read-only");
  const auto * h=gh.gameState().getHero(battleScope->heroes[side]);value(h?h->getHeroTypeID().getNum():-1,args[0]);return Step::Continue;
 }
 if(c.receiver=="BM")
 {
  require(battleScope&&battleScope->battle!=BattleID::NONE&&c.selectors.size()==1,"battle stack receiver outside a live battle");
  const int sourceSlot=number(c.selectors[0]);require(sourceSlot>=0&&sourceSlot<42,"battle stack index outside0..41");
  const auto * battle=gh.gameState().getBattle(battleScope->battle);require(battle!=nullptr,"battle stack event lost its battle");
  const CStack * target=nullptr;
  for(const auto * stack:battle->battleGetAllStacks(true))
   if(stack->sourceMassSlot()>=0&&stack->sourceMassSlot()+21*static_cast<int>(stack->unitSide())==sourceSlot){target=stack;break;}
  if(op.code=="I"||op.code=="N"||op.code=="T"||op.code=="P")
  {
   arity(op,1);require(query(op),"battle stack field mutation is not admitted");
   const int result=op.code=="I"?sourceSlot/21:op.code=="N"?(target?target->getCount():0):op.code=="T"?(target?sourceCreature(target->creatureId()):-1):(target?target->getPosition().toInt():-1);
   value(result,args[0]);return Step::Continue;
  }
  if(op.code=="C")
  {
   arity(op,5);for(const auto & arg:args)require(arg.access==Access::Read,"battle cast needs values");
   const int spell=number(args[0]),hex=number(args[1]),mastery=number(args[2]),power=number(args[3]),check=number(args[4]);
   // The original house restores a Windows global active-stack pointer with
   // a non-combat View Air cast. Native passive casting never changes that
   // pointer, so this exact pinned restoration command has no side effect.
   const bool originalHouse=program.sha256=="93fa71cb6d8768cb610c0c675f65f9fd3454823939167d3ac7474e59926fe59a"&&vm.flags[887];
   if(originalHouse&&spell==2&&mastery==0&&power==0&&check==0)return Step::Continue;
   require(spell==15||spell==42||spell==45||spell==47||spell==50||spell==52||spell==54,"unvalidated battle cast spell");
   require(hex>=0&&hex<187&&mastery>=0&&mastery<=3&&power>=0&&check==1,"unvalidated battle cast arguments");
   const auto * destination=battle->battleGetStackByPos(BattleHex(hex));if(!target||!target->alive()||!destination)return Step::Continue;
   spells::AbilityCaster caster(target,mastery);spells::BattleCast cast(battle,&caster,spells::Mode::PASSIVE,SpellID(spell).toSpell());
   cast.setSpellLevel(mastery);cast.setEffectPower(power);cast.setEffectDuration(power);spells::Target aim;aim.emplace_back(destination);cast.castIfPossible(gh.spellcastEnvironment(),aim);return Step::Continue;
  }
  require(op.code=="M","unsupported battle stack operation "+op.code);arity(op,3);
  for(const auto & arg:args)require(arg.access==Access::Read,"battle enchantment needs values");
  const int spell=number(args[0]),duration=number(args[1]);int mastery=number(args[2]);
  // The source house supplies skill99 for its two-round Stone Skin, outside
  // SetMonMagic's0..3 table. Bound only this pinned undefined value to Expert.
  if(program.sha256=="93fa71cb6d8768cb610c0c675f65f9fd3454823939167d3ac7474e59926fe59a"&&vm.flags[888]&&spell==46&&duration==2&&mastery==99)mastery=3;
  require(spell==29||spell==46||spell==45||spell==54||spell==71||spell==73,"unvalidated direct battle enchantment");
  require(duration>0&&mastery>=0&&mastery<=3,"unvalidated direct battle enchantment duration or mastery");
  if(!target||!target->alive())return Step::Continue;
  // SetMonMagic directly imposes the effect: no target filtering, immunity,
  // resistance, mana or creature charge. Existing spell slots are unchanged.
  const SpellID id(spell);
  if(!target->getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(id)))->empty())return Step::Continue;
  if(spell==71)
  {
   // BM:M imposes poison without its attack-time HP reduction. The first
   // combat round remains intact; later resets subtract10%, up to50%.
   // A local spell-owned profile marker selects the existing source HP
   // arithmetic and disappears with this poison, including Dispel.
   Bonus health;health.type=BonusType::STACK_HEALTH;health.val=0;
   health.valType=BonusValueType::PERCENT_TO_ALL;health.duration=BonusDuration::N_TURNS;
   health.turnsRemain=duration;health.source=BonusSource::SPELL_EFFECT;health.sid=BonusSourceID(id);
   Bonus limit=health;limit.type=BonusType::POISON;limit.val=50;limit.valType=BonusValueType::INDEPENDENT_MAX;
   Bonus profile=health;profile.type=BonusType::ERA_SOURCE_STATUS_HEALTH;profile.val=1;
   profile.valType=BonusValueType::BASE_NUMBER;profile.hidden=true;
   SetStackEffect effect;effect.battleID=battleScope->battle;effect.toAdd.emplace_back(target->unitId(),std::vector<Bonus>{limit,health,profile});gh.sendAndApply(effect);return Step::Continue;
  }
  spells::BattleCast cast(battle,target,spells::Mode::PASSIVE,id.toSpell());
  cast.setSpellLevel(mastery);cast.setEffectDuration(duration);cast.setEffectPower(0);
  spells::Target aim;aim.emplace_back(target);cast.applyEffects(gh.spellcastEnvironment(),aim,false,true);return Step::Continue;
 }
 if(c.receiver=="BA")
 {
  require(c.selectors.empty()&&battleScope.has_value(),"battle receiver outside a battle event");
  if(op.code=="E")
  {
   arity(op,1);require(query(op),"battle network classification is read-only");
   // Original offline/hotseat classification. Remote campaign play is not admitted.
   value(0,args[0]);return Step::Continue;
  }
  if(op.code=="B")
  {
   arity(op,1);require(args[0].access==Access::Read&&number(args[0])==12&&battleScope->battle==BattleID::NONE,"unvalidated battle background");
   state["battleSetup"]["background"].Integer()=12;return Step::Continue;
  }
  require(!args.empty()&&args[0].access==Access::Read,"battle side must be a value");
  const int side=number(args[0]);require(side==0||side==1,"battle side outside 0..1");
  if(op.code=="H")
  {
   arity(op,2);const auto * h=gh.gameState().getHero(battleScope->heroes[side]);const int next=value(h?h->getHeroTypeID().getNum():-2,args[1]);
   if(!query(op))
   {
    require(battleScope->battle==BattleID::NONE,"battle hero mutation after preparation");
    const auto * changed=next>=0?hero(next):nullptr;
    require(next<0||(changed&&gh.gameState().getObj(changed->id)==changed),"battle hero must be an existing map hero");
    battleScope->heroes[side]=changed?changed->id:ObjectInstanceID::NONE;state["battleSetup"]["heroes"][std::to_string(side)].Integer()=battleScope->heroes[side].getNum();
    if(changed)
    {
     const auto * army=gh.gameState().getObj(battleScope->armies[side]);require(army!=nullptr,"battle hero army missing");
     require(changed->getOwner().isValidPlayer(),"battle hero has no player");
     if(army->getOwner()!=changed->getOwner())
     {
      require(army->ID==Obj::EVENT,"battle hero owner replacement requires a scripted army");
      gh.setOwner(army,changed->getOwner());
     }
    }
   }
   return Step::Continue;
  }
  require(op.code=="M","unsupported battle operation "+op.code);arity(op,4);
  require(args[1].access==Access::Read,"battle slot must be a value");const int index=number(args[1]);require(index>=0&&index<7,"battle army slot outside 0..6");
  const auto * army=dynamic_cast<const CArmedInstance *>(gh.gameState().getObj(battleScope->armies[side]));require(army!=nullptr,"battle army missing");
  const SlotID slot(index);const auto * stack=army->getStackPtr(slot);
  const int type=value(stack?sourceCreature(stack->getId()):-1,args[2]),count=value(stack?stack->getCount():0,args[3]);
  if(!query(op))
  {
   if(type<0||count<=0){if(stack)gh.eraseStack({army->id,slot},true);}
   else if(!stack)gh.insertNewStack({army->id,slot},creature(type).toCreature(),count);
   else {gh.changeStackType({army->id,slot},creature(type).toCreature());gh.changeStackCount({army->id,slot},count,ChangeValueMode::ABSOLUTE);}
  }
  return Step::Continue;
 }
 if(c.receiver=="OW")
 {
  require(c.selectors.empty(),"player receiver does not take selectors");
  if(op.code=="C")
  {arity(op,1);require(query(op),"current player is read-only");value(player.getNum(),args[0]);return Step::Continue;}
  require(!args.empty()&&args[0].access==Access::Read,"player needs a color value");
  const int selected=number(args[0]);const PlayerColor who(selected==-1?player.getNum():selected);require(who.isValidPlayer(),"player outside 0..7");
  const auto * owner=gh.gameInfo().getPlayerState(who,false);
  if(op.code=="A")
  {
   arity(op,2);require(query(op),"selected hero mutation is not admitted");
   // OW:A reads PlayerSetup::CurHero, not a player color. In the pinned
   // house continuation the selected hero is the still-visiting HE:T hero.
   // Other contexts need a synchronized selection provider before admission.
   require(program.sha256=="93fa71cb6d8768cb610c0c675f65f9fd3454823939167d3ac7474e59926fe59a"
    &&who==player&&!battleScope&&objectId!=ObjectInstanceID::NONE,"selected hero query outside the validated visit continuation");
   const auto * selectedHero=gh.gameState().getHero(heroId);
   require(selectedHero&&selectedHero->getOwner()==who,"selected visiting hero missing");
   value(selectedHero->getHeroTypeID().getNum(),args[1]);return Step::Continue;
  }
  if(op.code=="D")
  {
   arity(op,2);require(owner!=nullptr&&args[1].access==Access::Read,"town countdown needs an owner and a byte value");
   const int raw=era_campaign_town_clock::byte(number(args[1]));state["townClocks"][std::to_string(who.getNum())].Integer()=raw;
   persist(townClockMutation(who,raw));return Step::Continue;
  }
  if(op.code=="I")
  {
   require(args.size()==2||args.size()==3,"invalid player controller arity");
   for(std::size_t i=1;i<args.size();++i)require(args[i].access==Access::Write||args[i].access==Access::Compare,"player controller mutation not admitted");
   value(owner&&owner->isHuman()?0:1,args[1]);if(args.size()==3)value(!owner||owner->status!=EPlayerStatus::INGAME?1:0,args[2]);return Step::Continue;
  }
  if(op.code=="K")
  {
   arity(op,3);require(owner!=nullptr&&args[1].access==Access::Read,"key needs an owner and a color value");
   const int color=number(args[1]);require(color>=0&&color<8,"key color outside 0..7");
   const int changed=value(owner->visitedObjectsGlobal.count({Obj::KEYMASTER,MapObjectSubID(color)})?1:0,args[2]);
   if(!query(op)){require(changed==0||changed==1,"key state must be 0 or 1");auto change=mutation("playerKey",ObjectInstanceID::NONE);change["player"].Integer()=who.getNum();change["color"].Integer()=color;change["visited"].Bool()=changed!=0;persist(change);}
   return Step::Continue;
  }
  require(op.code=="R","unsupported player operation "+op.code);arity(op,3);require(owner!=nullptr,"resource owner missing");require(args[1].access==Access::Read,"resource needs a type value");
  const int source=number(args[1]);require(source>=0&&source<=7,"resource outside 0..7");
  GameResID resource(source);
  if(source==7){const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"resource","wake-of-gods.mithril:mithril",true);require(id.has_value(),"source mithril unavailable");resource=GameResID(*id);}
  const auto old=owner->resources[resource];require(old>=INT32_MIN&&old<=INT32_MAX,"resource outside source signed word");require(source==7||old!=-1,"source resource getter returned its error sentinel");
  const int changed=value(static_cast<int>(old),args[2]);
  if(!query(op)){auto change=mutation("playerResource",ObjectInstanceID::NONE);change["player"].Integer()=who.getNum();change["resource"].Integer()=resource.getNum();change["amount"].Integer()=changed;persist(change);}
  return Step::Continue;
 }
 if(c.receiver=="HE")
 {
  require(c.selectors.size()==1,"Cave hero selector");const int selected=number(c.selectors[0]);const auto * h=op.code=="O"?hero(selected):ensureHero(selected);
  if(op.code=="O")
  {
   arity(op,1);const int owner=value(h&&h->getOwner().isValidPlayer()?h->getOwner().getNum():-1,args[0]);
   if(!query(op)&&h)
   {
    const PlayerColor player(owner);gh.setOwner(h,player);
    if(player.isValidPlayer())gh.changeFogOfWar(h->getSightCenter(),h->getSightRadius(),player,ETileVisibility::REVEALED);
   }
   return Step::Continue;
  }
  require(h!=nullptr,"source hero missing for HE"+std::to_string(number(c.selectors[0]))+":"+op.code);
  if(op.code=="Y")
  {
   arity(op,4);require(args[0].access==Access::Read&&args[3].access==Access::Read,"curse identity and mode must be values");
   const int kind=number(args[0]),mode=number(args[3]),type=h->getHeroTypeID().getNum();
   require((kind==2||kind==4||kind==65||mode==3)&&mode>=0&&mode<=3,"unvalidated original curse family or mode");
   auto & rows=state["slotCurses"].Vector();require(rows.size()<=1000,"source curse table overflow");
   auto found=std::find_if(rows.begin(),rows.end(),[&](const JsonNode & row){return era_campaign_json::integer(row["hero"])==type&&curseKind(row)==kind;});
   if(query(op))
   {
    const int power=found==rows.end()?(std::any_of(rows.begin(),rows.end(),[&](const JsonNode & row){return era_campaign_json::integer(row["hero"])==type;})?1:0):era_campaign_json::integer((*found)["value"]);
    const int length=found==rows.end()?0:era_campaign_slot_curse::subtract(era_campaign_slot_curse::add(era_campaign_json::integer((*found)["start"]),era_campaign_json::integer((*found)["length"])),int(gh.gameState().day));
    value(power,args[1]);value(length,args[2]);return Step::Continue;
   }
   require(args[1].access==Access::Read&&args[2].access==Access::Read,"curse values require set/get access");
   const int power=number(args[1]),length=number(args[2]),day=gh.gameState().day;
   if(mode==3){for(auto it=rows.begin();it!=rows.end();)if(era_campaign_json::integer((*it)["hero"])==type){const auto row=*it;it=rows.erase(it);restoreSlotCurse(row);}else ++it;persist();return Step::Continue;}
   if(found!=rows.end())
   {
    // In the pinned 3.58f branch flag0 deletes its row without _DelCurse.
    if(mode==0)rows.erase(found);
    else if(mode==1){(*found)["start"].Integer()=day;(*found)["length"].Integer()=length;(*found)["value"].Integer()=power;}
    else {(*found)["length"].Integer()=era_campaign_slot_curse::add(era_campaign_json::integer((*found)["length"]),length);(*found)["value"].Integer()=era_campaign_slot_curse::add(era_campaign_json::integer((*found)["value"]),power);}
    persist();return Step::Continue;
   }
   if(mode==0)return Step::Continue;
   require(rows.size()<1000,"source curse table full");
   if(kind!=2){JsonNode row;row["hero"].Integer()=type;row["kind"].Integer()=kind;row["start"].Integer()=day;row["length"].Integer()=length;row["value"].Integer()=power;rows.push_back(std::move(row));persist();return Step::Continue;}
   const int source=power==-1?random(8,false):power,slot=era_campaign_slot_curse::nativeSlot(source);
   int old=-1;bool restore=false;const auto * place=h->getSlot(ArtifactPosition(slot));
   if(source!=8&&place&&!place->locked&&place->getArt())
   {
    const auto & mapping=LIBRARY->mapFormat->getMapping(EMapFormat::WOG);
    for(int candidate=0;candidate<=143;++candidate)if(mapping.remap(ArtifactID(candidate))==place->getArt()->getTypeId()){old=candidate;break;}
    require(old>=0,"foreign artifact in original slot curse");restore=true;
    gh.removeArtifact(ArtifactLocation(h->id,ArtifactPosition(slot)));
   }
   JsonNode row;row["hero"].Integer()=type;row["start"].Integer()=day;row["length"].Integer()=length;
   row["value"].Integer()=era_campaign_slot_curse::encode(source,old);row["restore"].Bool()=restore;rows.push_back(std::move(row));
   auto & count=state["artifactSlotLocks"][std::to_string(type)][std::to_string(slot)];count.Integer()=era_campaign_slot_curse::lockCount(count.isNull()?0:era_campaign_json::integer(count),1);
   persist();return Step::Continue;
  }
  else if(op.code=="B")
  {
   arity(op,2);require(args[0].access==Access::Read,"hero field must be a value");
   const int field=number(args[0]);
   if(field==2)
   {
    require(args[1].access==Access::Write||args[1].access==Access::Compare,"hero class is read-only");
    value(h->getHeroClassID().getNum(),args[1]);return Step::Continue;
   }
   require(field==0||field==1||field==3,"unsupported hero text field");
   const auto old=field==0?(h->nameCustomTextId.empty()?std::string():h->getNameTranslated()):field==1?(h->biographyCustomTextId.empty()?std::string():h->getBiographyTranslated()):LIBRARY->generaltexth->translate(h->getHeroType()->getBiographyTextID());
   if(args[1].access==Access::Write)writeText(args[1],vm,context,old);
   else
   {
    require(field!=3&&args[1].access==Access::Read,"hero text requires set or get access");
    auto change=mutation("heroText",h->id);change["field"].Integer()=field;change["text"].String()=readText(args[1],vm,context);persist(change);
   }
  }
  else if(op.code=="L")
  {
   require(!args.empty()&&!query(op),"portrait arguments must be values");const int mode=number(args[0]);
   require(mode>=1&&mode<=5,"custom portrait presets are not admitted");
   const auto key=std::to_string(h->getHeroType()->getIconIndex());
   if(mode==3)
   {arity(op,1);if(!state["heroPortraits"].isNull())state["heroPortraits"].Struct().erase(key);persist(mutation("heroAppearance",h->id));return Step::Continue;}
   if(mode==4)
   {
    arity(op,2);const int source=number(args[1]);require(source>=0&&source<156,"original portrait source outside0..155");
    const auto & original=(*LIBRARY->heroh)[source];
    auto & pair=state["heroPortraits"][key];pair["large"].String().clear();pair["small"].String().clear();pair["largeFrame"].Integer()=original->getIconIndex();pair["smallFrame"].Integer()=original->getIconIndex();
    persist(mutation("heroAppearance",h->id));return Step::Continue;
   }
   arity(op,mode==5?3:2);
   const auto filename=[&](const Operand & input)->std::optional<std::string>
   {
    const auto & argument=resolveMacro(input,vm);std::string text;
    if(textOperand(argument,vm))text=readText(argument,vm,context);
    else
    {
     const int index=number(argument);if(index==0)return std::nullopt;
     require((index>=1&&index<=1000)||(index>=-10&&index<=-1),"external portrait string table is not admitted");text=readStringCell(vm,index);
    }
    for(const auto & candidate:era_campaign_media::candidates(text.substr(0,12)))
     if(CResourceHandler::get()->existsResource(ResourcePath(candidate.resource,EResType::IMAGE)))return candidate.resource;
    throw std::runtime_error("Original campaign portrait asset unavailable: "+text);
   };
   std::optional<std::string> large,small;
   if(mode==5){large=filename(args[1]);small=filename(args[2]);}
   else if(mode==1)small=filename(args[1]);else large=filename(args[1]);
   if(!large&&!small){if(!state["heroPortraits"].isNull())state["heroPortraits"].Struct().erase(key);}
   else
   {
    auto & pair=state["heroPortraits"][key];
    if(!pair.isStruct())
    {
     const auto & fallback=(*LIBRARY->heroh)[h->getPortraitSource().getNum()];
     pair["large"].String().clear();pair["small"].String().clear();pair["largeFrame"].Integer()=fallback->getIconIndex();pair["smallFrame"].Integer()=fallback->getIconIndex();
    }
    if(large)pair["large"].String()=*large;if(small)pair["small"].String()=*small;
   }
   if(mode==1||mode==2)writeFlag(mode,vm,true);
   persist(mutation("heroAppearance",h->id));return Step::Continue;
  }
  else if(op.code=="N")
  {arity(op,1);require(query(op),"hero identity is read-only");value(h->getHeroTypeID().getNum(),args[0]);}
  else if(op.code=="R")
  {
   require(args.size()==2||args.size()==3,"invalid hero status arity");require(args[0].access==Access::Read,"hero status needs a fixed field");
   const int field=number(args[0]);require((field>=0&&field<=2)||field==4,"unsupported hero status field");
   if(args.size()==3)require(args[2].access==Access::Read,"hero status redraw needs a value");
   if(field==4)
   {
    const int changed=value(h->tacticFormationEnabled?1:0,args[1]);
    if(!query(op)){auto change=mutation("heroTactics",h->id);change["enabled"].Bool()=changed!=0;persist(change);}
   }
   else if(field==2)
   {
    const int changed=value(static_cast<int>(h->gender),args[1]);
    if(!query(op)){require(changed==0||changed==1,"invalid hero gender");auto change=mutation("heroGender",h->id);change["gender"].Integer()=changed;persist(change);}
   }
   else
   {
    const auto key=std::to_string(h->id.getNum());const std::string name=field==0?"morale":"luck";
    const auto & stored=std::as_const(state)["heroModifiers"][key][name];
    const int changed=value(stored.isNull()?0:era_campaign_terrain::byteQuery(era_campaign_json::integer(stored)),args[1]);
    if(!query(op))
    {
     const int raw=era_campaign_terrain::byteWord(changed);state["heroModifiers"][key][name].Integer()=raw;
     auto change=mutation("heroModifier",h->id);change["field"].Integer()=field;change["amount"].Integer()=era_campaign_terrain::byteQuery(raw);persist(change);
    }
   }
  }
  else if(op.code=="P")
  {
   require(args.size()==3||(args.size()==4&&args[3].access==Access::Read&&number(args[3])==1),"unsupported hero teleport flag");const auto old=h->visitablePos();const int3 pos(value(old.x,args[0]),value(old.y,args[1]),value(old.z,args[2]));
   if(!query(op))require(gh.moveSourceCampaignHero(h->id,h->convertFromVisitablePos(pos)),"hero teleport failed");
  }
  else if(op.code=="I"||op.code=="W")
  {arity(op,1);const int changed=value(op.code=="I"?h->mana:h->movementPointsRemaining(),args[0]);if(!query(op)){if(op.code=="I")gh.setManaPoints(h->id,changed);else gh.setMovePoints(h->id,changed);}}
  else if(op.code=="E")
  {
   require(args.size()>=1&&args.size()<=3,"invalid hero experience arity");
   // The level operand is applied BEFORE the experience operand. Its presence
   // suppresses AddExp even when the experience operand itself is a write.
   if(args.size()>1)
   {
    const int old=era_campaign_hero_experience::levelWord(h->level),changed=value(old,args[1]);
    if(args[1].access!=Access::Write&&args[1].access!=Access::Compare&&!unchangedOperand(args[1]))
    {auto change=mutation("heroLevel",h->id);change["level"].Integer()=era_campaign_hero_experience::levelWord(static_cast<std::uint32_t>(changed));persist(change);}
   }
   const int changed=value(era_campaign_chest::signedWord(h->exp),args[0]);
   if(args[0].access==Access::Write||args[0].access==Access::Compare||unchangedOperand(args[0]))return Step::Continue;
   SetHeroExperience experience;experience.id=h->id;experience.mode=ChangeValueMode::ABSOLUTE;experience.val=static_cast<std::uint32_t>(changed);gh.sendAndApply(experience);
   if(args.size()>1)return Step::Continue;
   const int target=era_campaign_hero_experience::levelFor(changed,LIBRARY->heroh->maxSupportedLevel(),[](int level){return LIBRARY->heroh->reqExp(level);});
   if(static_cast<int>(h->level)>target)
   {auto change=mutation("heroLevel",h->id);change["level"].Integer()=target;persist(change);}
   else if(h->gainsLevel())
   {
    // Reserve heroes have no player to answer or remove a dialog query. Native
    // neutral level-ups choose automatically and finish synchronously.
    if(!h->getOwner().isValidPlayer())gh.expGiven(h);
    else {pending["kind"].String()="hero-experience";pending["hero"].Integer()=h->id.getNum();return Step::Suspend;}
   }
  }
  else if(op.code=="A")
  {
   if(args.size()==1)
   {
    arity(op,1);const int encoded=number(args[0]);require(encoded!=INT32_MIN,"invalid artifact magnitude");
    const auto spec=era_campaign_artifact::decode(encoded<0?-encoded:encoded);require(spec.has_value(),"unbound original artifact encoding");
    const auto id=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(spec->artifact));
    const auto matches=[&](const CArtifactInstance * art){return art&&art->getTypeId()==id&&(spec->artifact!=1||encoded==-1||art->getScrollSpellID().getNum()==spec->spell);};
    std::vector<ArtifactInstanceID> found;
    for(const auto & item:h->artifactsWorn)if(item.first.getNum()>=0&&item.first.getNum()<=18&&!item.second.locked&&matches(item.second.getArt()))found.push_back(item.second.getID());
    for(std::size_t index=0;index<std::min<std::size_t>(64,h->artifactsInBackpack.size());++index){const auto & item=h->artifactsInBackpack[index];if(!item.locked&&matches(item.getArt()))found.push_back(item.getID());}
    if(args[0].access==Access::Compare){require(encoded>=0,"invalid artifact comparison");writeFlag(1,vm,!found.empty());return Step::Continue;}
    require(args[0].access==Access::Read,"unsupported artifact access");
    if(encoded>=0)
    {
     if(h->artifactsInBackpack.size()>=64)return Step::Continue;
     const ArtifactPosition slot(int(ArtifactPosition::BACKPACK_START)+h->artifactsInBackpack.size());
     const bool placed=spec->spell>=0?gh.giveHeroNewScroll(h,SpellID(spec->spell),slot):gh.giveHeroNewArtifact(h,id,slot);require(placed,"original backpack artifact cannot be represented natively");
    }
    else for(const auto instance:found){const auto * art=h->getArtByInstanceId(instance);require(art!=nullptr,"selected artifact disappeared");gh.removeArtifact(ArtifactLocation(h->id,h->getArtPos(art)));}
    return Step::Continue;
   }
   require(args[0].access==Access::Read,"artifact mode must be a value");const int mode=number(args[0]);
   require(mode>=1&&mode<=4,"unsupported extended artifact mode");arity(op,mode==1?3:mode==4?2:4);
   const auto & mapping=LIBRARY->mapFormat->getMapping(EMapFormat::WOG);
   if(mode==4)
   {
    require(args[1].access==Access::Read,"automatic artifact grant needs an identity");
    const auto spec=era_campaign_artifact::decode(number(args[1]));require(spec.has_value(),"unbound automatic artifact encoding");
    if(era_compat::source_artifacts::human(gh,*h))
    {
     pending["kind"].String()="artifact-grant";pending["hero"].Integer()=h->id.getNum();pending["heroType"].Integer()=h->getHeroTypeID().getNum();
     pending["artifact"].Integer()=spec->artifact;pending["spell"].Integer()=spec->spell;return Step::Suspend;
    }
    require(era_compat::source_artifacts::give(gh,*h,spec->artifact,spec->spell),"nonhuman artifact grant unexpectedly suspended");return Step::Continue;
   }
   if(mode==1)
   {
    require(args[2].access==Access::Read,"artifact position must be a value");const int rawSlot=number(args[2]);
    require(rawSlot>=0&&rawSlot<=18,"unvalidated original backpack slot operation");const ArtifactPosition slot(rawSlot);
    const auto * existing=h->getArt(slot);
    if(args[1].access==Access::Write||args[1].access==Access::Compare)
    {
     int source=-1;if(existing){for(int candidate=0;candidate<=143;++candidate)if(mapping.remap(ArtifactID(candidate))==existing->getTypeId()){source=era_campaign_artifact::encode(candidate,existing->getScrollSpellID().getNum());break;}require(source!=-1,"foreign artifact in original slot query");}
     value(source,args[1]);return Step::Continue;
    }
    require(args[1].access==Access::Read,"unsupported artifact slot access");const auto spec=era_campaign_artifact::decode(number(args[1]));require(spec.has_value(),"unbound original artifact encoding");
    if(!h->isPositionFree(slot)){writeFlag(1,vm,false);return Step::Continue;}
    const auto id=mapping.remap(ArtifactID(spec->artifact));const auto * type=id.toArtifact();require(type!=nullptr,"unbound original artifact");
    const bool placed=spec->spell>=0?gh.giveHeroNewScroll(h,SpellID(spec->spell),slot):gh.giveHeroNewArtifact(h,id,slot);writeFlag(1,vm,placed);return Step::Continue;
   }
   require(args[1].access==Access::Read,"artifact identity must be a value");const auto spec=era_campaign_artifact::decode(number(args[1]));require(spec.has_value(),"unbound original artifact encoding");const auto id=mapping.remap(ArtifactID(spec->artifact));
   const auto matches=[&](const CArtifactInstance * art){return art&&art->getTypeId()==id&&(spec->artifact!=1||art->getScrollSpellID().getNum()==spec->spell);};
   if(mode==2)
   {
    const auto counts=era_compat::artifacts::directCounts(*h,matches);
    value(counts.first,args[2]);value(counts.second,args[3]);return Step::Continue;
   }
   std::vector<ArtifactInstanceID> worn,backpack;
   for(const auto & item:h->artifactsWorn)if(!item.second.locked&&matches(item.second.getArt()))worn.push_back(item.second.getID());
   for(const auto & item:h->artifactsInBackpack)if(!item.locked&&matches(item.getArt()))backpack.push_back(item.getID());
   require(args[2].access==Access::Read&&args[3].access==Access::Read,"artifact removal requires values");const int count=number(args[2]),wearFirst=number(args[3]);require(count>=0&&(wearFirst==0||wearFirst==1),"invalid artifact removal selection");
   std::vector<ArtifactInstanceID> order=wearFirst?worn:backpack;const auto & later=wearFirst?backpack:worn;order.insert(order.end(),later.begin(),later.end());
   int remaining=count;for(const auto instance:order){if(remaining==0)break;const auto * art=h->getArtByInstanceId(instance);require(art!=nullptr,"selected artifact disappeared");const auto slot=h->getArtPos(art);require(slot!=ArtifactPosition::PRE_FIRST,"selected artifact position missing");gh.removeArtifact(ArtifactLocation(h->id,slot));--remaining;}
  }
  else if(op.code=="M")
  {arity(op,2);const SpellID spell(number(args[0]));const int changed=value(h->spellbookContainsSpell(spell)?1:0,args[1]);if(!query(op))gh.changeSpells(h,changed!=0,{spell});}
  else if(op.code=="S")
  {
   arity(op,2);require(args[0].access==Access::Read,"secondary skill needs an original index");const int source=number(args[0]);require(source>=0&&source<28,"original secondary skill outside0..27");
   const auto skill=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(SecondarySkill(source));require(skill.toSkill()!=nullptr,"unbound source secondary skill");const int old=h->getSecSkillLevel(skill),level=value(old,args[1]);
   if(!query(op))
   {
    require(level>=0&&level<=3,"source secondary skill outside standard levels0..3");
    // The final original zc4 scenario explicitly grants all28 Expert skills.
    // Original SSkill keeps the extra skills active after SShow's eight slots
    // fill. Native storage supports that list, with classic/touch scrolling;
    // ordinary learning and other unvalidated script contexts keep their cap.
    const bool finalCampaignSkills=program.sha256=="a8a9dfef1ccd7bbc3587d1a2bdad12e4c9a15e182d77d3948fd2199a36940fa9"&&level==3;
    require(old!=0||level==0||h->secSkills.size()<8||finalCampaignSkills,"hidden source skills beyond eight visible slots are not admitted");
    gh.changeSecSkill(h,skill,level,ChangeValueMode::ABSOLUTE);
   }
  }
  else if(op.code=="K")
  {arity(op,1);require(args[0].kind==Kind::Default,"hero removal takes no argument");require(gh.removeObject(h,player),"source hero removal failed");}
  else if(op.code=="F")
  {arity(op,4);for(int i=0;i<4;++i){const auto skill=static_cast<PrimarySkill>(i);const int changed=value(h->getPrimSkillLevel(skill),args[i]);if(!query(op))gh.changePrimSkill(h,skill,args[i].access==Access::Relative?number(args[i]):changed,args[i].access==Access::Relative?ChangeValueMode::RELATIVE:ChangeValueMode::ABSOLUTE);}}
  else if(op.code=="U")
  {
   arity(op,3);auto change=mutation("heroPatrol",h->id);change["x"].Integer()=value(h->patrol.initialPos.x,args[0]);change["y"].Integer()=value(h->patrol.initialPos.y,args[1]);change["radius"].Integer()=value(h->patrol.patrolling?h->patrol.patrolRadius:-1,args[2]);if(!query(op))persist(change);
  }
  else if(op.code=="X")
  {
   require(args.size()==4||args.size()==5,"unsupported Cave specialty arity");auto change=mutation("heroSpecialty",h->id);change["arguments"].Vector();
   const int type=number(args[0]);require(type==4||type==6,"unsupported Cave specialty");
   for(std::size_t i=0;i<args.size();++i){int n=number(args[i]);if(i==1||(type==6&&(i==2||i==3)))n=creature(n).getNum();change["arguments"].Vector().push_back(JsonNode(n));}persist(change);
  }
  else if(op.code=="C")
  {
   if(args.size()==14)
   {
    auto & values=state["armyExchange"].Vector();if(values.empty())values.resize(14,JsonNode(0));require(values.size()==14,"invalid previous army exchange result");
    for(int i=0;i<14;++i)values[i].Integer()=value(values[i].Integer(),args[i]);
    if(query(op)){persist();return Step::Continue;}
    for(int slot=0;slot<7;++slot)if(values[slot*2].Integer()>=0&&values[slot*2+1].Integer()>0)creature(values[slot*2].Integer());
    pending["kind"].String()="army-exchange";pending["hero"].Integer()=h->id.getNum();pending["stacks"].Vector()=values;return Step::Suspend;
   }
   arity(op,4);const int mode=number(args[0]),selector=number(args[1]);require(mode==0||mode==1,"unsupported Cave army mode");
   std::vector<SlotID> slots;
   if(mode==0){require(selector>=0&&selector<7,"invalid army slot");slots.push_back(SlotID(selector));}
   else {const auto selected=creature(selector);for(const auto & slot:h->Slots())if(slot.second->getId()==selected)slots.push_back(slot.first);}
   if(slots.empty()&&query(op)){value(0,args[2]);value(0,args[3]);}
   for(const auto slot:slots)
   {
    const auto * stack=h->getStackPtr(slot);int type=args[2].access==Access::Read&&!unchangedOperand(args[2])?number(args[2]):value(stack?sourceCreature(stack->getId()):-1,args[2]);const int count=value(stack?stack->getCount():0,args[3]);
    if(mode==0&&args[2].access==Access::Read&&!unchangedOperand(args[2]))
    {
     // 358f740E18..68: -1 assigns the old source type back unchanged;
     // -2 clears its low bit. Apply this to SOURCE IDs, not remapped IDs.
     if(type==-1)type=stack?sourceCreature(stack->getId()):-1;
     else if(type==-2&&stack)type=sourceCreature(stack->getId())&~1;
    }
    if(query(op))continue;
    if(type<0||count<=0){if(stack)gh.eraseStack({h->id,slot},true);}
    else if(!stack)gh.insertNewStack({h->id,slot},creature(type).toCreature(),count);
    else {gh.changeStackType({h->id,slot},creature(type).toCreature());gh.changeStackCount({h->id,slot},count,ChangeValueMode::ABSOLUTE);}
   }
  }
  else if(op.code=="T")
  {
   arity(op,5);require(!query(op),"scripted battle arguments must be values");
   const int3 position(number(args[0]),number(args[1]),number(args[2]));
   require(gh.gameState().getMap().isInTheMap(position),"scripted battle location outside map");
   const int source=number(args[3]),count=number(args[4]);creature(source);require(count>0,"scripted battle needs defenders");
   pending["kind"].String()="battle";pending["hero"].Integer()=h->id.getNum();pending["x"].Integer()=position.x;pending["y"].Integer()=position.y;pending["z"].Integer()=position.z;
   pending["creature"].Integer()=source;pending["count"].Integer()=count;return Step::Suspend;
  }
  else throw std::runtime_error("Original campaign: unsupported Cave hero operation "+op.code);
  return Step::Continue;
 }
 if(c.receiver=="PO")
 {
  require(op.code=="N","source tile property operation is not admitted");arity(op,1);
  const auto raw=position(c);const auto decoded=era_bridge::tile_properties::coordinates(raw.x,raw.y,raw.z);
  const int3 pos(decoded[0],decoded[1],decoded[2]);
  require(gh.gameState().getMap().isInTheMap(pos),"source tile property outside map");
  era_compat::mithril::initializeSiteMarkers(gh);
  const auto changed=value(era_compat::tile_properties::number(gh.gameState(),pos),args[0]);
  if(!query(op))
  {
   EraGameplayChange packet;packet.system="tileProperties";
   packet.state=era_compat::tile_properties::state(gh.gameState());
   era_compat::tile_properties::setNumber(packet.state,pos,changed);gh.sendAndApply(packet);
  }
  persist();return Step::Continue;
 }
 if(c.receiver=="TR")
 {
  const auto pos=position(c);require(gh.gameState().getMap().isInTheMap(pos),"terrain position outside map");const auto & tile=gh.gameState().getMap().getTile(pos);
  if(op.code=="T")
  {
   arity(op,8);
   // Pinned campaigns change terrain/frame/road/mirror only. The other
   // fields stay native; in particular argument5 aliases the river frame
   // in the original PE, so it must not be silently mapped to roadDir.
   for(const int index:{2,3,5,7})require(unchangedOperand(args[index]),"unadmitted terrain river/attribute field");
   int sourceTerrain=-1;const auto & mapping=LIBRARY->mapFormat->getMapping(EMapFormat::WOG);
   for(int i=0;i<10;++i)if(mapping.remap(TerrainId(i))==tile.getTerrainID()){sourceTerrain=i;break;}
   require(sourceTerrain>=0,"terrain has no original type");
   const std::array<int,4> indices={{0,1,4,6}};
   const std::array<int,4> current={{sourceTerrain,tile.terView,tile.getRoadID().getNum(),tile.extTileFlags}};
   auto change=mutation("terrainAppearance",ObjectInstanceID::NONE);bool changed=false;
   change["x"].Integer()=pos.x;change["y"].Integer()=pos.y;change["z"].Integer()=pos.z;
   const std::array<std::string,4> fields={{"terrain","frame","road","mirror"}};
   for(std::size_t i=0;i<indices.size();++i)
   {
    const auto & arg=args[indices[i]];if(unchangedOperand(arg))continue;
    const int result=value(era_campaign_terrain::byteQuery(current[i]),arg);
    if(arg.access==Access::Write||arg.access==Access::Compare)continue;
    const int raw=era_campaign_terrain::byteWord(result);
    if(i==0)require(raw<10,"unadmitted terrain type");
    if(i==2)require(raw<=3,"unadmitted road type");
    change[fields[i]].Integer()=i==0?mapping.remap(TerrainId(raw)).getNum():raw;changed=true;
   }
   if(changed)persist(change);
   return Step::Continue;
  }
  require(op.code=="P"||op.code=="E","unsupported terrain operation "+op.code);arity(op,1);
  const int old=op.code=="P"?!tile.blocked():era_campaign_terrain::entranceValue(tile.visitable());const int changed=value(old,args[0]);
  if(!query(op))
  {
   auto change=mutation("terrainAccess",ObjectInstanceID::NONE);change["x"].Integer()=pos.x;change["y"].Integer()=pos.y;change["z"].Integer()=pos.z;change["operation"].String()=op.code;change["enabled"].Bool()=op.code=="P"?changed!=0:era_campaign_terrain::entranceVisitable(changed);persist(change);
  }
  return Step::Continue;
 }
 if(c.receiver=="HT")
 {
  require(c.selectors.size()==2,"source type hint needs type and subtype");
  for(const auto & selector:c.selectors)require(selector.access==Access::Read,"source type hint selectors must be values");
  require(op.code=="T"||op.code=="W"||op.code=="V","unsupported source type hint mode");arity(op,op.code=="T"?1:3);
  for(const auto & arg:args)require(arg.access==Access::Read,"source type hint arguments must be values");
  const auto packed=era_campaign_type_hints::key(number(c.selectors[0]),number(c.selectors[1]),op.code.front(),op.code=="T"?0:number(args[0]),op.code=="T"?0:number(args[1]));
  const int string=number(args.back());require(string>=0&&string<=1000,"external source type hint strings are not admitted");
  auto & hints=state["typeHints"].Vector();auto found=std::find_if(hints.begin(),hints.end(),[&](const JsonNode & entry){return !entry.isNull()&&entry["key"].Integer()==packed;});
  if(string==0){if(found!=hints.end())*found=JsonNode();}
  else
  {
   if(found==hints.end())found=std::find_if(hints.begin(),hints.end(),[](const JsonNode & entry){return entry.isNull();});
   if(found==hints.end()){hints.emplace_back();found=std::prev(hints.end());}
   (*found)["key"].Integer()=packed;(*found)["string"].Integer()=string;
  }
  persist();return Step::Continue;
 }
 if(c.receiver=="HO")
 {
  require(c.selectors.size()==1,"hero interaction needs a hero number");const int target=number(c.selectors[0]);require(target>=0&&target<156,"original hero interaction number outside0..155");
  const auto key=std::to_string(target);arity(op,1);
  if(op.code=="H")
  {
   const auto & argument=resolveMacro(args[0],vm);const auto & saved=state["heroDescriptions"][key];const int previous=saved.isNull()?0:era_campaign_json::integer(saved);int changed;
   if(argument.kind==Kind::Variable&&argument.space=='z'){require(argument.access==Access::Read&&argument.index!=nullptr,"unsupported hero hint reference");changed=number(*argument.index);}
   else changed=value(previous,args[0]);
   require(changed>=0&&changed<=1000,"external hero hint table is not admitted");
   if(!query(op)){state["heroDescriptions"][key].Integer()=changed;persist();}return Step::Continue;
  }
  require(op.code=="S"||op.code=="R"||op.code=="D"||op.code=="E","unsupported hero interaction operation");
  const bool all=op.code=="S"||op.code=="R";require(all?args[0].kind==Kind::Default:args[0].access==Access::Read,"unsupported hero access argument");
  const auto & saved=state["heroAccess"][key];const int old=saved.isNull()?255:era_campaign_json::integer(saved);require(old>=0&&old<=255,"invalid source hero access mask");int owner=all?0:number(args[0]);if(owner==-1)owner=player.getNum();
  state["heroAccess"][key].Integer()=era_campaign_object_access::change(old,op.code[0],owner);persist();return Step::Continue;
 }
 if(c.receiver=="OB")
 {
  const auto pos=position(c);require(gh.gameState().getMap().isInTheMap(pos),"object position outside map");const auto key=era_campaign_hints::positionKey(pos);const auto * obj=object(c);
  if(op.code=="B")
  {
   require(!tileIdentity(pos),"native default effect of a retyped plot tile is not admitted");
   require(args.empty()||(args.size()==1&&args[0].kind==Kind::Default),"object hint removal takes no value");
   for(const auto & field:{"objectDescriptions","objectAccessPositions"})if(!state[field].isNull())state[field].Struct().erase(key);
   if(obj&&!state["objectAccess"].isNull())state["objectAccess"].Struct().erase(std::to_string(obj->id.getNum()));persist();return Step::Continue;
  }
  arity(op,1);
  if(op.code=="H")
  {
   const auto & argument=resolveMacro(args[0],vm);const auto & saved=state["objectDescriptions"][key];
   const int previous=saved.isNull()?0:era_campaign_json::integer(saved);
   int changed;
   if(argument.kind==Kind::Variable&&argument.space=='z'){require(argument.access==Access::Read&&argument.index!=nullptr,"unsupported hint string reference");changed=number(*argument.index);}
   else changed=value(previous,args[0]);
   require(changed>=0&&changed<=1000,"external hint string table is not admitted");
   if(!query(op)){state["objectDescriptions"][key].Integer()=changed;persist();}return Step::Continue;
  }
  if(op.code=="S"||op.code=="R"||op.code=="D"||op.code=="E")
  {
   const bool all=op.code=="S"||op.code=="R";require(all?args[0].kind==Kind::Default:args[0].access==Access::Read,"unsupported object access argument");
   const auto & saved=state["objectAccessPositions"][key];const int old=saved.isNull()?(obj?objectMask(obj->id):255):era_campaign_json::integer(saved);require(old>=0&&old<=255,"invalid coordinate object access mask");
   int owner=all?0:number(args[0]);if(owner==-1)owner=player.getNum();
   const int changed=era_campaign_object_access::change(old,op.code[0],owner);require(!tileIdentity(pos)||changed==0,"native default effect of a retyped plot tile is not admitted");
   state["objectAccessPositions"][key].Integer()=changed;if(obj&&!state["objectAccess"].isNull())state["objectAccess"].Struct().erase(std::to_string(obj->id.getNum()));persist();return Step::Continue;
  }
  require(op.code=="T"||op.code=="U","unsupported source object operation");auto source=tileIdentity(pos).value_or(obj?identity(obj):ObjectTypeIdentifier{Obj::NOTHING,-1});
  const bool present=obj||tileIdentity(pos).has_value();const int raw=present?(op.code=="T"?int(source.ID):source.subID):-1;
  // Original Apply(size2) reads a signed short, then writes the low16 bits.
  const int old=raw>=32768?raw-65536:raw;const int changed=value(old,args[0]);
  if(!query(op))
  {
   if(changed==old&&!tileIdentity(pos)&&obj&&(source.ID==Obj::ARENA||source.ID==Obj::LIBRARY_OF_ENLIGHTENMENT||source.ID==Obj::WAR_MACHINE_FACTORY))return Step::Continue;
   const bool disabled=state["objectAccessPositions"][key].isNumber()&&era_campaign_json::integer(state["objectAccessPositions"][key])==0;
   if(op.code=="T")source.ID=Obj(era_campaign_timers::word(changed));else source.subID=era_campaign_timers::word(changed);
   // Original decorative plot initializers write T91 then OB:S in the
   // immediately following command. Stage that identity until access is
   // disabled; do not instantiate a sign with an unrelated decoration subtype.
   bool pairedDisable=false;
   if(!disabled&&source.ID==Obj::SIGN&&vm.initializing&&!vm.continuations.empty())
   {
    const auto & call=vm.continuations.back();
    if(call.initializer&&call.command+1<program.initializers.size())
    {
     const auto & next=program.initializers[call.command+1];
     pairedDisable=next.receiver=="OB"&&next.conditions.empty()&&next.operations.size()==1&&next.operations[0].code=="S"&&next.operations[0].args.size()==1&&next.operations[0].args[0].kind==Kind::Default&&position(next)==pos;
    }
   }
   const bool inertMonsterSign=obj&&obj->ID==Obj::MONSTER&&source.ID==Obj::SIGN&&(disabled||pairedDisable);
   require(!obj||(obj->ID!=Obj::HERO&&obj->ID!=Obj::EVENT&&obj->ID!=Obj::TOWN&&(obj->ID!=Obj::MONSTER||inertMonsterSign)),"retyping this native object class is not admitted");
   if(!disabled&&!pairedDisable)
   {
    require(source.ID==Obj::ARENA||source.ID==Obj::LIBRARY_OF_ENLIGHTENMENT||source.ID==Obj::WAR_MACHINE_FACTORY,"unvalidated active source object type");
    // The original new-design commands are T106U0/T4U0/T41U0. Their
    // decoration subtype24..26 is invalid for the target class until U0.
    const bool pairedSubtype=op.code=="T"&&c.operations.size()==2&&c.operations[1].code=="U"&&c.operations[1].args.size()==1&&c.operations[1].args[0].access==Access::Read;
    if(!pairedSubtype){retypeService(obj,source);return Step::Continue;}
   }
   state["tileIdentities"][key].Vector()={JsonNode(int(source.ID)),JsonNode(source.subID)};persist();
  }
  return Step::Continue;
 }
 if(c.receiver=="TM")
 {
  require(c.selectors.size()==1,"timer needs one ID");const int id=number(c.selectors[0]);require(id>=1&&id<=100,"timer ID outside 1..100");auto settings=timer(id);
  if(op.code=="S")
  {arity(op,4);for(int i=0;i<4;++i)settings[i]=era_campaign_timers::word(value(settings[i],args[i]));}
  else if(op.code=="D"||op.code=="E")
  {arity(op,1);require(args[0].access==Access::Read,"timer access needs a player value");era_campaign_timers::access(settings,op.code=="E",number(args[0]));}
  else throw std::runtime_error("Original campaign: unsupported timer operation "+op.code);
  setTimer(id,settings);return Step::Continue;
 }
 if(c.receiver=="MO")
 {
  const auto * monster=dynamic_cast<const CGCreature *>(object(c,Obj::MONSTER));
  if(!monster)return Step::Continue; // Original MO permits a defeated/missing stack.
  arity(op,1);auto change=mutation("monster",monster->id);
  if(op.code=="M")change["message"].String()=args[0].kind==Kind::Number&&args[0].number==-1?std::string():readText(args[0],vm,context);
  else if(op.code=="O")change["notGrowing"].Bool()=(static_cast<std::uint32_t>(value(monster->notGrowingTeam?1:0,args[0]))&1u)!=0;
  else if(op.code=="U")change["neverFlees"].Bool()=(static_cast<std::uint32_t>(value(monster->neverFlees?1:0,args[0]))&1u)!=0;
  else if(op.code=="R")change["aggression"].Integer()=number(args[0])==0?-4:10; // Original one-argument R: join / never join.
  else if(op.code=="G")
  {
   const int count=value(monster->getStackCount(SlotID(0)),args[0]);
   if(!query(op)){require(count>=0,"negative source monster count");change["count"].Integer()=count;persist(change);}
   return Step::Continue;
  }
  else throw std::runtime_error("Original campaign: unsupported Cave monster operation "+op.code);
  if(!query(op))persist(change);return Step::Continue;
 }
 if(c.receiver=="LE")
 {
  const auto * event=dynamic_cast<const CGEvent *>(object(c,Obj::EVENT));if(!event)return Step::Continue;
  auto config=event->configuration;
  auto info=std::find_if(config.info.begin(),config.info.end(),[](const Rewardable::VisitInfo & i){return i.visitType==Rewardable::EEventType::EVENT_FIRST_VISIT;});
  require(info!=config.info.end(),"local event has no native reward");auto & reward=info->reward;
  if(op.code=="M")
  {
   require(args.size()==1||args.size()==2,"invalid source event message arity");std::string text;
   const auto & argument=resolveMacro(args.back(),vm);
   if(args.size()==2)
   {
    require(args[0].access==Access::Read&&number(args[0])==1,"unsupported source event message mode");
    if(argument.access==Access::Write){writeText(argument,vm,context,event->message.toString());return Step::Continue;}
    require(argument.access==Access::Read,"event message needs a string reference");
    if(argument.kind==Kind::Variable&&argument.space=='z')text=readText(argument,vm,context);
    else{const int index=number(argument);require(index==-1||(index>=1&&index<=1000)||(index>=-10&&index<=-2),"external event message strings are not admitted");if(index!=-1)text=readStringCell(vm,index);}
   }
   else text=argument.kind==Kind::Number&&argument.number==-1?std::string():readText(argument,vm,context);
   auto change=mutation("event",event->id);change["message"].String()=text;
   for(auto & item:config.info)if(item.visitType==Rewardable::EEventType::EVENT_FIRST_VISIT){item.message.clear();item.message.appendRawString(text);}persist(change,event,&config);return Step::Continue;
  }
  if(op.code=="L"||op.code=="I")
  {
   arity(op,1);require(args[0].access==Access::Read,"event switch needs a value");auto change=mutation("event",event->id);change[op.code=="L"?"removeAfterVisit":"computer"].Bool()=(static_cast<std::uint32_t>(number(args[0]))&1u)!=0;persist(change);return Step::Continue;
  }
  if(op.code=="D")
  {
   arity(op,2);auto change=mutation("event",event->id);auto allowed=event->availableFor;const PlayerColor target(number(args[0]));if(number(args[1]))allowed.erase(target);else allowed.insert(target);
   change["players"].Vector();for(const auto color:allowed)change["players"].Vector().push_back(JsonNode(int(color.getNum())));persist(change);return Step::Continue;
  }
  if(op.code=="G"||op.code=="X")
  {
   const auto key=std::to_string(event->id.getNum());auto & slots=state["guards"][key];
   if(slots.isNull())
   {
    slots.Vector();for(const auto & entry:event->Slots()){JsonNode slot;slot["slot"].Integer()=entry.first.getNum();slot["creature"].Integer()=entry.second->getId().getNum();slot["count"].Integer()=entry.second->getCount();slots.Vector().push_back(slot);}
    state["guardsEnabled"][key].Bool()=!slots.Vector().empty();
   }
   if(op.code=="G")
   {
    arity(op,3);const int index=number(args[0]);require(index>=0&&index<7,"invalid local guard slot");auto & values=slots.Vector();
    auto existing=std::find_if(values.begin(),values.end(),[&](const JsonNode & entry){return entry["slot"].Integer()==index;});
    const int type=value(existing==values.end()?-1:sourceCreature(CreatureID((*existing)["creature"].Integer())),args[1]);
    const int count=value(existing==values.end()?0:(*existing)["count"].Integer(),args[2]);
    if(query(op))return Step::Continue;
    if(existing!=values.end())values.erase(existing);
    if(type>=0&&count>0){JsonNode entry;entry["slot"].Integer()=index;entry["creature"].Integer()=creature(type).getNum();entry["count"].Integer()=count;values.push_back(entry);}
   }
   else {arity(op,1);state["guardsEnabled"][key].Bool()=number(args[0])!=0;}
   auto change=mutation("eventGuards",event->id);change["slots"].Vector();if(state["guardsEnabled"][key].Bool())change["slots"]=slots;persist(change);return Step::Continue;
  }
  if(op.code=="E")
  {arity(op,1);const int changed=value(reward.heroExperience,args[0]);if(!query(op))reward.heroExperience=changed;}
  else if(op.code=="R")
  {arity(op,2);const GameResID resource(number(args[0]));reward.resources[resource]=value(reward.resources[resource],args[1]);}
  else if(op.code=="C")
  {
   arity(op,3);const int index=number(args[0]);require(index>=0&&index<7,"invalid reward creature slot");
   // Preserve original table slots separately from VCMI's compact reward list.
   const auto key=std::to_string(event->id.getNum());auto & table=state["creatureRewards"][key];
   if(table.isNull()){table.Vector();for(const auto & stack:reward.creatures){JsonNode slot;slot["type"].Integer()=sourceCreature(stack.getId());slot["count"].Integer()=stack.getCount();table.Vector().push_back(slot);}}
   while(table.Vector().size()<=std::size_t(index)){JsonNode slot;slot["type"].Integer()=-1;slot["count"].Integer()=0;table.Vector().push_back(slot);}
   auto & slot=table.Vector()[index];slot["type"].Integer()=value(slot["type"].Integer(),args[1]);slot["count"].Integer()=value(slot["count"].Integer(),args[2]);
   if(query(op))return Step::Continue;
   reward.creatures.clear();for(const auto & entry:table.Vector())if(entry["type"].Integer()>=0&&entry["count"].Integer()>0)reward.creatures.emplace_back(creature(entry["type"].Integer()),entry["count"].Integer());
  }
  else if(op.code=="A")
  {arity(op,2);const int index=number(args[0]);if(index<0||std::size_t(index)>=reward.grantedArtifacts.size())return Step::Continue;reward.grantedArtifacts[index]=ArtifactID(value(reward.grantedArtifacts[index].getNum(),args[1]));}
  else if(op.code=="O"||op.code=="U")
  {
   arity(op,1);const auto type=op.code=="O"?BonusType::MORALE:BonusType::LUCK;int old=0;
   auto & bonuses=reward.heroBonuses;for(const auto & b:bonuses)if(b->type==type)old=b->val;
   const int changed=value(old,args[0]);if(query(op))return Step::Continue;
   bonuses.erase(std::remove_if(bonuses.begin(),bonuses.end(),[&](const auto & b){return b->type==type;}),bonuses.end());
   if(changed)bonuses.push_back(std::make_shared<Bonus>(BonusDuration::ONE_BATTLE,type,BonusSource::OBJECT_INSTANCE,changed,BonusSourceID(event->id)));
  }
  else throw std::runtime_error("Original campaign: unsupported Cave local event operation "+op.code);
  if(!query(op))persist(JsonNode(),event,&config);return Step::Continue;
 }
 if(c.receiver=="CE")
 {
  require(c.selectors.size()==1,"castle event selector");const int id=number(c.selectors[0]);
  for(const auto & obj:gh.gameState().getMap().objects)if(const auto * town=dynamic_cast<const CGTownInstance *>(obj.get()))
   for(std::size_t i=0;i<town->events.size();++i)
   {
    const auto & event=town->events[i];const auto message=event.message.toString();std::size_t used=0;int eventId=-1;
    try{eventId=std::stoi(message,&used);}catch(const std::exception &){continue;}
    if(eventId!=id)continue;
    auto change=mutation("castleEvent",town->id);change["index"].Integer()=i;
    if(op.code=="F"){arity(op,1);change["firstOccurrence"].Integer()=value(event.firstOccurrence+1,args[0])-1;}
    else if(op.code=="U"){arity(op,1);require(number(args[0])==39,"unbound Cave source building");change["building"].Integer()=BuildingID::DWELL_LVL_7;}
    else if(op.code=="C"){arity(op,2);const int tier=number(args[0]);require(tier>=0&&tier<7,"castle creature tier");change["creatureTier"].Integer()=tier;change["creatureCount"].Integer()=value(tier<int(event.creatures.size())?event.creatures[tier]:0,args[1]);}
    else throw std::runtime_error("Original campaign: unsupported Cave castle event operation "+op.code);
    if(!query(op))persist(change);return Step::Continue;
   }
  throw std::runtime_error("Original campaign: castle event not found "+std::to_string(id));
 }
 throw std::runtime_error("Original campaign: unsupported receiver "+c.receiver+":"+op.code);
}
SourceCampaignProcessor::SourceCampaignProcessor(CGameHandler & game):impl(std::make_unique<Impl>(game)){}
SourceCampaignProcessor::~SourceCampaignProcessor()=default;
bool SourceCampaignProcessor::battleEvent(int stage,ObjectInstanceID attacker,ObjectInstanceID defender,ObjectInstanceID attackerHero,ObjectInstanceID defenderHero,std::function<void()> resume){return impl->battleEvent(stage,attacker,defender,attackerHero,defenderHero,std::move(resume));}
bool SourceCampaignProcessor::battleRound(BattleID battle,int sourceRound,std::function<void()> resume){return impl->battleRound(battle,sourceRound,std::move(resume));}
bool SourceCampaignProcessor::battleField(BattleID battle,std::function<void()> resume){return impl->battleField(battle,std::move(resume));}
void SourceCampaignProcessor::battleAction(BattleID battle,int stage,const BattleAction & action){impl->battleAction(battle,stage,action);}
const CGHeroInstance * SourceCampaignProcessor::battleHero(int side,const CGHeroInstance * fallback)
{
 impl->bind();if(!impl->active)return fallback;
 const auto & row=std::as_const(impl->state)["battleSetup"]["heroes"][std::to_string(side)];
 return row.isNull()?fallback:impl->gh.gameState().getHero(ObjectInstanceID(era_campaign_json::integer(row)));
}
int SourceCampaignProcessor::battleBackground()
{
 impl->bind();if(!impl->active)return -1;
 const auto & row=std::as_const(impl->state)["battleSetup"]["background"];return row.isNull()?-1:era_campaign_json::integer(row);
}
void SourceCampaignProcessor::battlePrepared()
{impl->bind();if(impl->active&&!impl->state["battleSetup"].isNull()){impl->state["battleSetup"]=JsonNode();impl->persist();}}
bool SourceCampaignProcessor::demolitionFight(ObjectInstanceID hero,ObjectInstanceID town,int building){return impl->demolitionFight(hero,town,building);}
void SourceCampaignProcessor::demolitionBattleEnding(ObjectInstanceID attacker,ObjectInstanceID defender,bool won){impl->demolitionBattleEnding(attacker,defender,won);}
void SourceCampaignProcessor::demolitionBattleEnded(ObjectInstanceID attacker,ObjectInstanceID defender,bool won){impl->demolitionBattleEnded(attacker,defender,won);}
bool SourceCampaignProcessor::preservesAuthoredObjects(){impl->bind();return impl->active;}
int32_t SourceCampaignProcessor::namedInteger(const std::string & name)
{
 impl->bind();if(!impl->active)return 0;
 const auto found=impl->vm.associative.find(era_campaign::associativeName(name));
 return found==impl->vm.associative.end()?0:found->second.integer;
}
void SourceCampaignProcessor::setNamedInteger(const std::string & name,int32_t value)
{
 impl->bind();if(!impl->active)return;
 impl->vm.associative[era_campaign::associativeName(name)].integer=value;
 impl->persist();
}
bool SourceCampaignProcessor::onReady(PlayerColor player){return impl->onReady(player);}
bool SourceCampaignProcessor::draft(QueryID query,int selection,const std::string & text,PlayerColor player)
{
 impl->bind();
 if(!impl->active||!impl->shown||*impl->shown!=query||player!=impl->player||!impl->pending.isStruct())return false;
 const auto top=impl->gh.queries->topQuery(player);if(!top||top->queryID!=query)return false;
 const auto kind=impl->pending["kind"].String();if(kind!="extended"&&kind!="checklist"&&kind!="pictures")return false;
 try{State checked=impl->vm;JsonNode definitions=impl->state["dialogs"];era_campaign_dialogs::Dialogs dialogs(definitions,checked,impl->context);dialogs.reply(impl->pending,selection,text);}
 catch(const std::runtime_error &){return false;}
 impl->pending["draft"]["selection"].Integer()=selection;impl->pending["draft"]["text"].String()=text;impl->persist();return true;
}
bool SourceCampaignProcessor::reply(QueryID query,int selection,const std::string & text,PlayerColor player)
{
 impl->bind();
 if(!impl->active||!impl->shown||*impl->shown!=query||player!=impl->player||!impl->pending.isStruct())return false;
 const auto top=impl->gh.queries->topQuery(player);if(!top||top->queryID!=query)return false;
 // Validate on a copy; a malformed packet must not change the suspended VM.
 try
 {
  State checked=impl->vm;JsonNode definitions=impl->state["dialogs"];
  era_campaign_dialogs::Dialogs dialogs(definitions,checked,impl->context);dialogs.reply(impl->pending,selection,text);
 }
 catch(const std::runtime_error &){return false;}
 impl->pending["replyText"].String()=text;
 return impl->gh.queryReply(query,selection,player);
}
bool SourceCampaignProcessor::deployTroops(ObjectInstanceID hero,SlotID slot,CreatureID creature,int count,const int3 & position,bool takeBack,PlayerColor player)
{return impl->deployTroops(hero,slot,creature,count,position,takeBack,player);}
bool SourceCampaignProcessor::visit(const CGObjectInstance * object,const CGHeroInstance * hero,bool actualEntry){return impl->visit(object,hero,actualEntry);}
void SourceCampaignProcessor::visitEnded(ObjectInstanceID object,ObjectInstanceID hero)
{
 impl->bind();if(!impl->active||!impl->vm.initialized)return;
 const auto key=std::to_string(hero.getNum());const auto saved=std::as_const(impl->state)["postVisits"][key];
 if(saved.isNull()||saved["object"].Integer()!=object.getNum())return;
 impl->state["postVisits"].Struct().erase(key);impl->persist();
 const auto * visiting=impl->gh.gameState().getHero(hero);if(!visiting||!visiting->getOwner().isValidPlayer())return;
 const int x=saved["x"].Integer(),y=saved["y"].Integer(),z=saved["z"].Integer();
 const std::vector<std::vector<std::int32_t>> selectors={{int(saved["type"].Integer())},{int(saved["type"].Integer()),int(saved["subtype"].Integer())},{x,y,z}};
 // A scripted teleport can finish its native visit while HE:P is executing.
 // Unrelated objects have no post trigger and must not re-enter the VM merely
 // because this campaign declares a post trigger for some other coordinate.
 Executor probe(impl->program,impl->vm,impl->context,*impl);
 if(!probe.hasMatchingAny("OB",selectors,true))return;
 require(impl->vm.continuations.empty(),"post visit while another script is suspended");
 impl->heroId=hero;impl->objectId=ObjectInstanceID::NONE;impl->player=visiting->getOwner();impl->updateContext();
 impl->vm.v[998]=x;impl->vm.v[999]=y;impl->vm.v[1000]=z;
 Executor executor(impl->program,impl->vm,impl->context,*impl);
 if(executor.dispatchAny("OB",selectors,true))impl->run();
 else{impl->heroId=ObjectInstanceID::NONE;impl->persist();}
}
bool SourceCampaignProcessor::visitPosition(const int3 & position,const CGHeroInstance * hero){return impl->visitPosition(position,hero);}
bool SourceCampaignProcessor::beginTurn(PlayerColor player)
{
 impl->bind();if(!impl->active)return false;
 require(player.isValidPlayer(),"invalid source turn player");const auto day=int(impl->gh.gameState().day);
 auto & previous=impl->state["queuedTurnDays"][std::to_string(player.getNum())];
 if(previous.isNumber()&&era_campaign_json::integer(previous)==day)return true;
 impl->expireSlotCurses(player,day);impl->fireTurn(day);impl->prepareWanderingDay(day);previous.Integer()=day;auto & queue=impl->state["turnQueue"].Vector();require(queue.size()<=35,"excessive queued source turns");
 for(const auto & kind:{"prepare","wandering","timers","globals","finish"})
 {
  JsonNode pass;pass["kind"].String()=kind;pass["player"].Integer()=player.getNum();pass["day"].Integer()=day;pass["cursor"].Integer()=std::string(kind)=="timers"?1:0;queue.push_back(std::move(pass));
 }
 impl->ensureTurnBarriers();impl->persist();impl->pumpTurns();return true;
}
void SourceCampaignProcessor::syncTownClock(PlayerColor player)
{impl->bind();impl->syncClock(player,false);}
bool SourceCampaignProcessor::townClockEnded(PlayerColor player)
{impl->bind();return impl->syncClock(player,true);}
bool SourceCampaignProcessor::turnPending(PlayerColor player)
{
 impl->bind();if(!impl->active||impl->state["turnQueue"].isNull())return false;
 for(const auto & pass:era_campaign_json::array(impl->state["turnQueue"]))if(pass["kind"].String()=="finish"&&era_campaign_json::integer(pass["player"])==player.getNum())return true;
 return false;
}
bool SourceCampaignProcessor::timedEvent(const CMapEvent & event,PlayerColor player)
{
 impl->bind();if(!impl->active)return false;
 if(event.message.toString().rfind("ZVSE",0)==0)return true;
 std::size_t used=0;int id=-1;try{id=std::stoi(event.message.toString(),&used);}catch(const std::exception &){return false;}
 impl->player=player;impl->heroId=ObjectInstanceID::NONE;impl->objectId=ObjectInstanceID::NONE;impl->updateContext();
 require(impl->vm.continuations.empty(),"timed event while another script is suspended");
 Executor executor(impl->program,impl->vm,impl->context,*impl);executor.dispatch("GE",{id});impl->run();return false;
}
MetaString SourceCampaignProcessor::eventMessage(const CMapEvent & event) const
{
 if(!impl->active)return event.message;
 const auto message=event.message.toString();std::size_t used=0;
 try{std::stoi(message,&used);}catch(const std::exception &){return event.message;}
 MetaString result;result.appendRawString(message.substr(used));return result;
}
