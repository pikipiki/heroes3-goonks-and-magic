/* Original campaign event host; GPL-2.0-or-later. */
#include "StdInc.h"
#include "SourceCampaignProcessor.h"
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
#include "../../lib/era/EraCampaignHints.h"
#include "../../lib/era/EraCampaignDeployment.h"
#include "../../lib/era/EraCampaignArtifactRule.h"
#include "../../lib/era/EraCampaignChestRule.h"
#include "../../lib/era/EraCampaignTownRule.h"
#include "../../lib/era/EraCampaignTerrainRule.h"
#include "../../lib/era/EraCampaignDemolition.h"
#include "../../lib/era/EraCampaignFire.h"
#include "../../lib/era/EraCampaignHeroExperienceRule.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/era/EraCampaignMedia.h"
#include "../../lib/era/EraCampaignTimers.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
#include "../../lib/GameLibrary.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/CCreatureHandler.h"
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
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/PacksForServer.h"
#include "../../lib/networkPacks/ArtifactLocation.h"
#include "../../lib/networkPacks/StackLocation.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/modding/IdentifierStorage.h"
#include "../../lib/modding/ModScope.h"
#include "../../lib/bonuses/Bonus.h"
#include "../../lib/battle/BattleLayout.h"
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
  return nullptr;
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
 int3 position(const Command & c)const
 {
  const bool indirect=c.receiver=="OB"||c.receiver=="TR"||c.receiver=="MO"||c.receiver=="LE"||c.receiver=="CH"||c.receiver=="DW"||c.receiver=="GR";
  const bool dynamicMonster=c.receiver=="MO"&&c.selectors.size()==4&&c.selectors[3].access==Access::Read&&number(c.selectors[3])==1;
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
  bind();if(!active||!vm.initialized||executing||!pending.isNull()||!vm.continuations.empty()||!state["turnQueue"].Vector().empty()||gh.queries->topQuery(who))return false;
  const auto * h=gh.gameState().getHero(requestedHero);if(!h||h->getOwner()!=who||h->isGarrisoned()||h->inBoat()||!slot.validSlot()||slot.getNum()>6||!h->hasStackAtSlot(slot)||!gh.gameInfo().getPlayerState(who)->isHuman())return false;
  const auto & stack=h->getStack(slot);if(stack.getId()!=requestedCreature)return false;
  const auto origin=h->visitablePos();if(!era_campaign_deployment_rule::adjacent(origin.x,origin.y,origin.z,target.x,target.y,target.z)||!era_campaign_deployment::emptyLand(gh.gameState().getMap(),target,state))return false;
  std::int64_t army=0;for(const auto & entry:h->stacks)army+=entry.second->getCount();
  int source;try{source=sourceCreature(requestedCreature);}catch(const std::runtime_error &){return false;}const bool machine=stack.getCreature()->warMachine!=ArtifactID::NONE;
  if(count<1||count>era_campaign_deployment_rule::maximum(stack.getCount(),army,source,machine))return false;
  auto & left=state["leftTroops"].Struct();for(auto it=left.begin();it!=left.end();){int id=-1;try{id=std::stoi(it->first);}catch(const std::exception &){}const auto & objects=gh.gameState().getMap().objects;if(id<0||id>=int(objects.size())||!objects[id])it=left.erase(it);else ++it;}
  if(left.size()>=10000)return false;
  const MapObjectSubID subtype(requestedCreature.getNum());const auto handler=LIBRARY->objtypeh->getHandlerFor(Obj::MONSTER,subtype);
  auto templates=LIBRARY->objtypeh->getOriginalTemplates(Obj::MONSTER,subtype);const bool original=!templates.empty();if(!original)templates=handler->getTemplates();if(templates.empty())return false;
  auto created=std::dynamic_pointer_cast<CGCreature>(handler->create(&gh.gameInfo(),nullptr));if(!created)return false;
  handler->configureObject(created.get(),*gh.randomizer);gh.gs->getMap().generateUniqueInstanceName(created.get());created->appearance=original?templates.back():templates.front();created->setAnchorPos(target+created->getVisitableOffset());
  created->initialCharacter=CGCreature::Character::SAVAGE;created->neverFlees=false;created->notGrowingTeam=false;created->gainedArtifact=ArtifactID::NONE;created->resources=TResources{};created->message.clear();created->clearSlots();created->putStack(SlotID(0),std::make_unique<CStackInstance>(&gh.gameInfo(),requestedCreature,1));
  gh.newObject(created,who);gh.eraseStack({created->id,SlotID(0)});
  if(!gh.moveStack({h->id,slot},{created->id,SlotID(0)},count)){gh.removeObject(created.get(),who);return false;}
  gh.setObjPropertyValue(created->id,ObjProperty::MONSTER_POWER,count*1000);
  auto & record=state["leftTroops"][std::to_string(created->id.getNum())];record["owner"].Integer()=who.getNum();record["takeBack"].Bool()=takeBack;record["position"].Vector()={JsonNode(target.x),JsonNode(target.y),JsonNode(target.z)};
  state["objectIdentities"][std::to_string(created->id.getNum())].Vector()={JsonNode(54),JsonNode(source)};
  auto & result=state["lastTroopDeployment"];result["revision"].Integer()=result["revision"].Integer()+1;result["hero"].Integer()=h->id.getNum();result["object"].Integer()=created->id.getNum();player=who;persist();return true;
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
  state["vm"]=era_campaign_json::writeState(vm);
  state["running"].Bool()=!vm.continuations.empty()||!state["turnQueue"].Vector().empty();
  state["hero"].Integer()=heroId.getNum();state["object"].Integer()=objectId.getNum();state["player"].Integer()=player.getNum();state["pending"]=pending;
  SourceCampaignChange packet;packet.state=state;packet.worldState=std::move(world);packet.changes.Vector();
  if(change.isVector())packet.changes=std::move(change);
  else if(!change.isNull())packet.changes.Vector().push_back(std::move(change));
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
  if(!owner->getTowns().empty())
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
  const auto shadow=era_campaign_town_clock::shadow(next);
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
   if(vm.programSha256.empty())vm.programSha256=program.sha256;
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
 Step execute(const Command &,const Operation &,State &,const Context &)override;
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
  const auto & queue=era_campaign_json::array(state["turnQueue"]);require(queue.size()<=32,"excessive turn queue");
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
  if(pumping||!vm.initialized||!vm.continuations.empty())return;
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
     const auto who=player;queue.erase(queue.begin());persist();gh.newTurnProcessor->preparePlayerTurnStarted(who);
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
 void run()
 {
  require(!executing,"recursive event entry");executing=true;
  try
  {
   updateContext();Executor executor(program,vm,context,*this);const bool done=executor.run();persist();executing=false;
   if(!done){show();return;}
   const auto completedObject=objectId,completedHero=heroId;
   heroId=ObjectInstanceID::NONE;objectId=ObjectInstanceID::NONE;pending=JsonNode();persist();
   completeTurnEvent();
   if(completedObject!=ObjectInstanceID::NONE)
   {
    const auto * obj=gh.gameState().getObj(completedObject);
    const auto * h=gh.gameState().getHero(completedHero);
    // The event still grants its reward after a scripted teleport. The
    // mountain passage, for example, grants morale before moving the hero.
    if(obj&&h&&allowsObject(obj,h)&&!consumeEmptyMonster(obj,h)&&!consumeLeftTroop(obj,h))obj->onHeroVisit(gh,h);
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
  require(source->subID>=0,"plot tile subtype is incomplete");const auto key=era_campaign_hints::positionKey(position);
  require(!state["objectAccessPositions"][key].isNull()&&era_campaign_json::integer(state["objectAccessPositions"][key])==0,"native default effect of a retyped plot tile is not admitted");
  if(!vm.continuations.empty())
  {require(heroId==h->id&&lookup(vm.v,998)==position.x&&lookup(vm.v,999)==position.y&&lookup(vm.v,1000)==position.z,"another plot tile visited while a script is suspended");return true;}
  heroId=h->id;objectId=ObjectInstanceID::NONE;player=h->getOwner();updateContext();vm.v[998]=position.x;vm.v[999]=position.y;vm.v[1000]=position.z;
  Executor executor(program,vm,context,*this);
  if(executor.dispatchAny("OB",{{int(source->ID)},{int(source->ID),source->subID},{position.x,position.y,position.z}})){run();return true;}
  heroId=ObjectInstanceID::NONE;return false;
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
 bool visit(const CGObjectInstance * obj,const CGHeroInstance * h)
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
    if(executor.dispatchAny("HE",{{target->getHeroTypeID().getNum()}})){run();return true;}
   }
   else
   {
    const auto source=identity(obj);
    if(executor.dispatchAny("OB",{{int(source.ID)},{int(source.ID),source.subID},{pos.x,pos.y,pos.z}})){run();return true;}
   }
   const bool handled=!allowsObject(obj,h)||consumeEmptyMonster(obj,h)||consumeLeftTroop(obj,h);heroId=ObjectInstanceID::NONE;objectId=ObjectInstanceID::NONE;return handled;
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
  if(op.code=="R")
  {
   arity(op,1);require(args[0].access==Access::Read,"redraw mode needs a value");const int mode=number(args[0]);require(mode==1||mode==2,"unsupported source redraw mode");
   auto change=mutation("mapRefresh",ObjectInstanceID::NONE);change["mode"].Integer()=mode;change["player"].Integer()=player.getNum();persist(change);return Step::Continue;
  }
  if(op.code=="S"||op.code=="H")
  {
   arity(op,5);require(!query(op),"fog arguments must be values");const int3 center(number(args[0]),number(args[1]),number(args[2]));const PlayerColor owner(number(args[3]));const int radius=number(args[4]);
   require(gh.gameState().getMap().isInTheMap(center)&&owner.isValidPlayer()&&gh.gameInfo().getPlayerState(owner,false)&&radius>=0,"invalid source reveal area");
   if(op.code=="S")gh.changeFogOfWar(center,radius,owner,ETileVisibility::REVEALED);
   else
   {
    // The original hides the owner's whole allied mask, then reopens sight
    // around owned objects. Exclude those cells before sending one mutation.
    FowTilesType hidden,observed;gh.gameInfo().getTilesInRange(hidden,center,radius,ETileVisibility::REVEALED,owner);
    const auto * affected=gh.gameInfo().getPlayerState(owner);
    for(int color=0;color<8;++color)if(const auto * ally=gh.gameInfo().getPlayerState(PlayerColor(color),false))if(ally->team==affected->team)
     for(const auto * object:ally->getOwnedObjects())gh.gameInfo().getTilesInRange(observed,object->getSightCenter(),object->getSightRadius(),ETileVisibility::REVEALED,object->getOwner());
    for(const auto & tile:observed)hidden.erase(tile);
    gh.changeFogOfWar(hidden,owner,ETileVisibility::HIDDEN);
   }
   return Step::Continue;
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
    // Pure ground decals do not acquire DrawNum. River Delta is a fallback.
    if(obj->visitableAt(anchor))primary[0].push_back(obj.get());
    else if(obj->blockingAt(anchor))
    {
     const int type=int(identity(obj.get()).ID);
     const bool entrance=type==17||type==20||type==33||type==42||type==53||type==77||type==87||type==98;
     primary[entrance?1:2].push_back(obj.get());
    }
    else if(obj->coveringAt(anchor)&&identity(obj.get()).ID==Obj(124))primary[3].push_back(obj.get());
   }
   const CGObjectInstance * target=nullptr;
   for(const auto & layer:primary)if(!layer.empty())
   {
    require(layer.size()==1,"ambiguous primary drawing order needs source selection validation");
    target=layer.front();break;
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
  gh.gs->getMap().generateUniqueInstanceName(created.get());created->appearance=originalTemplate?templates.back():templates.front();created->setAnchorPos(anchor);
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
 if(c.receiver=="OW")
 {
  require(c.selectors.empty(),"player receiver does not take selectors");
  if(op.code=="C")
  {arity(op,1);require(query(op),"current player is read-only");value(player.getNum(),args[0]);return Step::Continue;}
  require(!args.empty()&&args[0].access==Access::Read,"player needs a color value");
  const int selected=number(args[0]);const PlayerColor who(selected==-1?player.getNum():selected);require(who.isValidPlayer(),"player outside 0..7");
  const auto * owner=gh.gameInfo().getPlayerState(who,false);
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
  require(c.selectors.size()==1,"Cave hero selector");const auto * h=hero(number(c.selectors[0]));
  if(op.code=="O")
  {arity(op,1);const int owner=value(h?h->getOwner().getNum():-1,args[0]);if(!query(op)&&h)gh.setOwner(h,PlayerColor(owner));return Step::Continue;}
  require(h!=nullptr,"source hero missing for HE"+std::to_string(number(c.selectors[0]))+":"+op.code);
  if(op.code=="B")
  {
   arity(op,2);require(args[0].access==Access::Read,"hero text field must be a value");
   const int field=number(args[0]);require(field==0||field==1||field==3,"unsupported hero text field");
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
     require((index>=1&&index<=1000)||(index>=-10&&index<=-1),"external portrait string table is not admitted");text=lookup(vm.z,index);
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
   arity(op,2);require(args[0].access==Access::Read&&number(args[0])==2,"unsupported hero status field");
   const int changed=value(static_cast<int>(h->gender),args[1]);
   if(!query(op)){require(changed==0||changed==1,"invalid hero gender");auto change=mutation("heroGender",h->id);change["gender"].Integer()=changed;persist(change);}
  }
  else if(op.code=="P")
  {
   arity(op,3);const auto old=h->visitablePos();const int3 pos(value(old.x,args[0]),value(old.y,args[1]),value(old.z,args[2]));
   if(!query(op))require(gh.moveHero(h->id,h->convertFromVisitablePos(pos),EMovementMode::MONOLITH),"hero teleport failed");
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
   {pending["kind"].String()="hero-experience";pending["hero"].Integer()=h->id.getNum();return Step::Suspend;}
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
   require(mode>=1&&mode<=3,"unsupported extended artifact mode");arity(op,mode==1?3:4);
   const auto & mapping=LIBRARY->mapFormat->getMapping(EMapFormat::WOG);
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
   std::vector<ArtifactInstanceID> worn,backpack;
   for(const auto & item:h->artifactsWorn)if(!item.second.locked&&matches(item.second.getArt()))worn.push_back(item.second.getID());
   for(const auto & item:h->artifactsInBackpack)if(!item.locked&&matches(item.getArt()))backpack.push_back(item.getID());
   if(mode==2){value(worn.size()+backpack.size(),args[2]);value(worn.size(),args[3]);return Step::Continue;}
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
    require(old!=0||level==0||h->secSkills.size()<8,"hidden source skills beyond eight visible slots are not admitted");
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
    const auto * stack=h->getStackPtr(slot);const int type=args[2].access==Access::Read&&!unchangedOperand(args[2])?number(args[2]):value(stack?sourceCreature(stack->getId()):-1,args[2]);const int count=value(stack?stack->getCount():0,args[3]);
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
   const auto & access=state["objectAccessPositions"][key];require(!access.isNull()&&era_campaign_json::integer(access)==0,"retyping requires disabled native object effects");
   require(!obj||(obj->ID!=Obj::HERO&&obj->ID!=Obj::MONSTER&&obj->ID!=Obj::EVENT&&obj->ID!=Obj::TOWN),"retyping this native object class is not admitted");
   if(op.code=="T")source.ID=Obj(era_campaign_timers::word(changed));else source.subID=era_campaign_timers::word(changed);
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
    else{const int index=number(argument);require(index==-1||(index>=1&&index<=1000)||(index>=-10&&index<=-2),"external event message strings are not admitted");if(index!=-1)text=lookup(vm.z,index);}
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
  if(op.code=="R")
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
bool SourceCampaignProcessor::demolitionFight(ObjectInstanceID hero,ObjectInstanceID town,int building){return impl->demolitionFight(hero,town,building);}
void SourceCampaignProcessor::demolitionBattleEnding(ObjectInstanceID attacker,ObjectInstanceID defender,bool won){impl->demolitionBattleEnding(attacker,defender,won);}
void SourceCampaignProcessor::demolitionBattleEnded(ObjectInstanceID attacker,ObjectInstanceID defender,bool won){impl->demolitionBattleEnded(attacker,defender,won);}
bool SourceCampaignProcessor::preservesAuthoredObjects(){impl->bind();return impl->active;}
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
bool SourceCampaignProcessor::visit(const CGObjectInstance * object,const CGHeroInstance * hero){return impl->visit(object,hero);}
bool SourceCampaignProcessor::visitPosition(const int3 & position,const CGHeroInstance * hero){return impl->visitPosition(position,hero);}
bool SourceCampaignProcessor::beginTurn(PlayerColor player)
{
 impl->bind();if(!impl->active)return false;
 require(player.isValidPlayer(),"invalid source turn player");const auto day=int(impl->gh.gameState().day);
 auto & previous=impl->state["queuedTurnDays"][std::to_string(player.getNum())];
 if(previous.isNumber()&&era_campaign_json::integer(previous)==day)return true;
 impl->fireTurn(day);previous.Integer()=day;auto & queue=impl->state["turnQueue"].Vector();require(queue.size()<=28,"excessive queued source turns");
 for(const auto & kind:{"prepare","timers","globals","finish"})
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
