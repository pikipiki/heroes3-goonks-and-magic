/* Original campaign event host; GPL-2.0-or-later. */
#include "StdInc.h"
#include "SourceCampaignProcessor.h"
#include "../CGameHandler.h"
#include "../queries/CQuery.h"
#include "../queries/QueriesProcessor.h"
#include "../queries/VisitQueries.h"
#include "../../lib/era/EraCampaignExecutor.h"
#include "../../lib/era/EraCampaignJson.h"
#include "../../lib/era/EraCampaignDialogs.h"
#include "../../lib/era/EraCampaignPictures.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
#include "../../lib/GameLibrary.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/StartInfo.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/mapping/CCastleEvent.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/mapObjects/CGPandoraBox.h"
#include "../../lib/mapObjects/CGCreature.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/networkPacks/SourceCampaignChange.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/ArtifactLocation.h"
#include "../../lib/networkPacks/StackLocation.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/modding/IdentifierStorage.h"
#include "../../lib/modding/ModScope.h"
#include "../../lib/bonuses/Bonus.h"

using namespace era_campaign;
namespace
{
void require(bool test,const std::string & message){if(!test)throw std::runtime_error("Original campaign: "+message);}
void arity(const Operation & op,std::size_t n){require(op.args.size()==n,"invalid "+op.code+" arity");}
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
 explicit Impl(CGameHandler & game):gh(game){}
 int number(const Operand & o)const{return readNumber(o,vm,context);}
 int value(int old,const Operand & o)
 {
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
  require(source.has_value(),"foreign creature cannot be represented by original source ID");return *source;
 }
 const CGObjectInstance * object(const Command & c,MapObjectID type=MapObjectID())const
 {
  require(c.selectors.size()==3,"object needs three coordinates");
  const int3 pos(number(c.selectors[0]),number(c.selectors[1]),number(c.selectors[2]));
  const auto & map=gh.gameState().getMap();if(!map.isInTheMap(pos))return nullptr;
  for(const auto id:map.getTile(pos).visitableObjects)
  {
   const auto * obj=gh.gameState().getObj(id);
   if(obj&&(!type.hasValue()||obj->ID==type)&&obj->ID!=Obj::HERO)return obj;
  }
  return nullptr;
 }
 JsonNode mutation(const std::string & kind,ObjectInstanceID id)const
 {JsonNode change;change["kind"].String()=kind;change["object"].Integer()=id.getNum();return change;}
 void persist(JsonNode change=JsonNode(),const CGEvent * event=nullptr,const Rewardable::Configuration * reward=nullptr)
 {
  state["contract"].String()="source-campaign-state-v1";
  state["vm"]=era_campaign_json::writeState(vm);
  state["running"].Bool()=!vm.continuations.empty();
  state["hero"].Integer()=heroId.getNum();state["object"].Integer()=objectId.getNum();state["player"].Integer()=player.getNum();state["pending"]=pending;
  SourceCampaignChange packet;packet.state=state;packet.changes.Vector();
  if(!change.isNull())packet.changes.Vector().push_back(std::move(change));
  if(event&&reward)packet.rewardConfigurations.emplace(event->id,*reward);
  gh.sendAndApply(packet);
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
   // Only the closed six-receiver Cave host is admitted by this implementation.
   if(entry["id"].String()!="cave-gerfrex")continue;
   const JsonNode source(JsonPath::builtin(entry["resource"].String()));
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
   if(state["hero"].isNumber())heroId=ObjectInstanceID(state["hero"].Integer());
   if(state["object"].isNumber())objectId=ObjectInstanceID(state["object"].Integer());
   if(state["player"].isNumber())player=PlayerColor(state["player"].Integer());
   active=true;return;
  }
 }
 void updateContext()
 {
  context.day=gh.gameState().day;
  const auto * h=gh.gameState().getHero(heroId);context.currentHero=h?h->getHeroTypeID().getNum():-1;
  context.builtinFlag=[this](int flag){if(flag==1000)return gh.gameInfo().getPlayerState(player)->isHuman();if(flag==999)return false;return false;};
 }
 int32_t random(int32_t maximum,bool)override{return gh.randomizer->getDefault().nextInt(maximum);}
 Step execute(const Command &,const Operation &,State &,const Context &)override;
 void run()
 {
  require(!executing,"recursive event entry");executing=true;
  try
  {
   updateContext();Executor executor(program,vm,context,*this);const bool done=executor.run();persist();executing=false;
   if(!done){show();return;}
   const auto completedObject=objectId,completedHero=heroId;
   heroId=ObjectInstanceID::NONE;objectId=ObjectInstanceID::NONE;pending=JsonNode();persist();
   if(completedObject!=ObjectInstanceID::NONE)
   {
    const auto * obj=gh.gameState().getObj(completedObject);
    const auto * h=gh.gameState().getHero(completedHero);
    // The event still grants its reward after a scripted teleport. The
    // mountain passage, for example, grants morale before moving the hero.
    if(obj&&h)obj->onHeroVisit(gh,h);
   }
  }
  catch(...){executing=false;throw;}
 }
 void show()
 {
  require(pending.isStruct(),"suspension without a dialog");
  if(shown)return;
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
 void onReady(PlayerColor who)
 {
  bind();if(!active)return;
  if(!vm.initialized&&!vm.initializing)
  {
   player=who;updateContext();Executor executor(program,vm,context,*this);executor.initialize();run();
  }
  if(!pending.isNull()&&who==player&&!shown)
  {
   const auto * obj=gh.gameState().getObj(objectId);const auto * h=gh.gameState().getHero(heroId);
   if(obj&&h)gh.queries->addQuery(std::make_shared<MapObjectVisitQuery>(&gh,obj,h));
   show();
  }
 }
 bool visit(const CGObjectInstance * obj,const CGHeroInstance * h)
 {
  bind();if(!active)return false;
  if(const auto * monster=dynamic_cast<const CGCreature *>(obj);monster&&monster->getStackCount(SlotID(0))==0)
  {
   InfoWindow message;message.player=h->getOwner();message.text=monster->message;gh.showInfoDialog(&message);
   gh.giveResources(h->getOwner(),monster->resources);
   if(monster->gainedArtifact!=ArtifactID::NONE)gh.giveHeroNewArtifact(h,monster->gainedArtifact,ArtifactPosition::FIRST_AVAILABLE);
   gh.removeObject(monster,h->getOwner());return true;
  }
  if(obj->ID!=Obj::EVENT)return false;
  const auto * local=dynamic_cast<const CGEvent *>(obj);
  const bool human=gh.gameInfo().getPlayerState(h->getOwner())->isHuman();
  if(!local||!local->availableFor.count(h->getOwner())||(human?!local->humanActivate:!local->computerActivate))return false;
  require(vm.initialized&&vm.continuations.empty(),"local event while another script is suspended");
  heroId=h->id;objectId=obj->id;player=h->getOwner();updateContext();
  const auto pos=obj->visitablePos();vm.v[998]=pos.x;vm.v[999]=pos.y;vm.v[1000]=pos.z;
  Executor executor(program,vm,context,*this);executor.dispatch("LE",{pos.x,pos.y,pos.z});run();return true;
 }
};
Step SourceCampaignProcessor::Impl::execute(const Command & c,const Operation & op,State &,const Context &)
{
 const auto & args=op.args;
 comparison.reset();
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
 if(c.receiver=="HE")
 {
  require(c.selectors.size()==1,"Cave hero selector");const auto * h=hero(number(c.selectors[0]));
  if(op.code=="O")
  {arity(op,1);const int owner=value(h?h->getOwner().getNum():-1,args[0]);if(!query(op)&&h)gh.setOwner(h,PlayerColor(owner));return Step::Continue;}
  require(h!=nullptr,"source hero missing");
  if(op.code=="P")
  {
   arity(op,3);const auto old=h->visitablePos();const int3 pos(value(old.x,args[0]),value(old.y,args[1]),value(old.z,args[2]));
   if(!query(op))require(gh.moveHero(h->id,h->convertFromVisitablePos(pos),EMovementMode::MONOLITH),"hero teleport failed");
  }
  else if(op.code=="I"||op.code=="W")
  {arity(op,1);const int changed=value(op.code=="I"?h->mana:h->movementPointsRemaining(),args[0]);if(!query(op)){if(op.code=="I")gh.setManaPoints(h->id,changed);else gh.setMovePoints(h->id,changed);}}
  else if(op.code=="A")
  {
   arity(op,1);const int id=number(args[0]);
   if(args[0].access==Access::Compare){writeFlag(1,vm,h->hasArt(ArtifactID(id),false,true));return Step::Continue;}
   require(args[0].access==Access::Read,"unsupported artifact access");
   if(id>=0)gh.giveHeroNewArtifact(h,ArtifactID(id),ArtifactPosition::FIRST_AVAILABLE);
   else for(;;){const auto slot=h->getArtPos(ArtifactID(-id),false,false);if(slot==ArtifactPosition::PRE_FIRST)break;gh.removeArtifact(ArtifactLocation(h->id,slot));}
  }
  else if(op.code=="M")
  {arity(op,2);const SpellID spell(number(args[0]));const int changed=value(h->spellbookContainsSpell(spell)?1:0,args[1]);if(!query(op))gh.changeSpells(h,changed!=0,{spell});}
  else if(op.code=="S")
  {arity(op,2);const SecondarySkill skill(number(args[0]));const int changed=value(h->getSecSkillLevel(skill),args[1]);if(!query(op))gh.changeSecSkill(h,skill,changed,ChangeValueMode::ABSOLUTE);}
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
   arity(op,4);const int mode=number(args[0]),selector=number(args[1]);require(mode==0||mode==1,"unsupported Cave army mode");
   std::vector<SlotID> slots;
   if(mode==0){require(selector>=0&&selector<7,"invalid army slot");slots.push_back(SlotID(selector));}
   else for(const auto & slot:h->Slots())if(sourceCreature(slot.second->getId())==selector)slots.push_back(slot.first);
   if(slots.empty()&&query(op)){value(0,args[2]);value(0,args[3]);}
   for(const auto slot:slots)
   {
    const auto * stack=h->getStackPtr(slot);const int type=value(stack?sourceCreature(stack->getId()):-1,args[2]);const int count=value(stack?stack->getCount():0,args[3]);
    if(query(op))continue;
    if(type<0||count<=0){if(stack)gh.eraseStack({h->id,slot},true);}
    else if(!stack)gh.insertNewStack({h->id,slot},creature(type).toCreature(),count);
    else {gh.changeStackType({h->id,slot},creature(type).toCreature());gh.changeStackCount({h->id,slot},count,ChangeValueMode::ABSOLUTE);}
   }
  }
  else throw std::runtime_error("Original campaign: unsupported Cave hero operation "+op.code);
  return Step::Continue;
 }
 if(c.receiver=="OB")
 {
  arity(op,1);require(op.code=="T","unsupported Cave object operation");const auto * obj=object(c);value(obj?obj->ID.getNum():-1,args[0]);require(query(op),"object type mutation not admitted");return Step::Continue;
 }
 if(c.receiver=="MO")
 {
  const auto * monster=dynamic_cast<const CGCreature *>(object(c,Obj::MONSTER));
  if(!monster)return Step::Continue; // Original MO permits a defeated/missing stack.
  arity(op,1);auto change=mutation("monster",monster->id);
  if(op.code=="M")change["message"].String()=readText(args[0],vm,context);
  else if(op.code=="O")change["notGrowing"].Bool()=value(monster->notGrowingTeam?1:0,args[0])==1;
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
   arity(op,1);const auto text=readText(args[0],vm,context);auto change=mutation("event",event->id);change["message"].String()=text;
   for(auto & item:config.info)if(item.visitType==Rewardable::EEventType::EVENT_FIRST_VISIT){item.message.clear();item.message.appendRawString(text);}persist(change,event,&config);return Step::Continue;
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
void SourceCampaignProcessor::onReady(PlayerColor player){impl->onReady(player);}
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
bool SourceCampaignProcessor::visit(const CGObjectInstance * object,const CGHeroInstance * hero){return impl->visit(object,hero);}
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
