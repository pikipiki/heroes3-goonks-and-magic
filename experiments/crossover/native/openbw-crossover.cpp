// Native crossover scenario and rendering DTOs; upstream source remains unchanged.
namespace bwgame {struct unit_t;}
int crossover_weapon_contact(bwgame::unit_t*,bwgame::unit_t*,int);
int crossover_movement_speed(const bwgame::unit_t*,int);
// Scenario option only: ordinary StarCraft maps retain their original terrain.
bool crossover_arena_requested=false;
#include "../vendor/openbw/web/sandbox.h"
namespace bwgame {
bool crossover_hero_sound(const unit_t* unit,xy position);
struct crossover_play_ui : play_ui {
 using play_ui::play_ui;
 void play_sound(int id,xy position,const unit_t* unit,bool race) override {
  if(crossover_hero_sound(unit,position))return;
  play_ui::play_sound(id,position,unit,race);
 }
};
}
// Keep the audited upstream entry unchanged, substituting only the UI subclass
// so Heroes sounds are not doubled by their simulation stand-ins' SC sounds.
#define play_ui crossover_play_ui
#include "../vendor/openbw/web/wasm_main.cpp"
#undef play_ui

OPENBW_EXPORT(openbw_crossover_arena) void openbw_crossover_arena(int enabled){crossover_arena_requested=enabled!=0;}
namespace { bwgame::a_string crossover_census; }
namespace {
struct CrossoverGroup { int stack; int owner; bool heroes; int initial; bwgame::a_vector<bwgame::unit_id> ids; };
bwgame::a_vector<CrossoverGroup> crossover_groups;
struct SoundOrigin { bwgame::xy position;bool heroes; };
bwgame::a_vector<SoundOrigin> crossover_sound_origins;
void remember_crossover_sounds(){crossover_sound_origins.clear();if(!g_ui)return;for(const auto & group:crossover_groups)for(auto id:group.ids){const auto unit=g_ui->get_unit(id);if(unit&&unit->sprite)crossover_sound_origins.push_back({unit->sprite->position,group.heroes});}}
struct CrossoverSpell {int stack,id,charges,radius,ready=0; bwgame::a_vector<int32_t> rows;};
bwgame::a_vector<CrossoverSpell> crossover_spells;
int crossover_battle=-1;
bwgame::a_string crossover_result;
std::array<bwgame::unit_type_t,128> crossover_types;
std::array<bwgame::weapon_type_t,128> crossover_weapons;
bwgame::xy crossover_camera;
bwgame::a_vector<uint8_t> crossover_pixels;
struct MagicDefinition {bwgame::unit_type_t type;bwgame::weapon_type_t weapon;bwgame::flingy_type_t flingy;const bwgame::unit_type_t* base=nullptr;int attack=0,movementScale=1000,baseDamage=0,baseArmor=0;bool disabled=false,berserk=false,cloned=false,shooting=false;int luck=0,morale=0,retaliations=0;int melee=0,ranged=0,fire=0;};
std::map<int,MagicDefinition> crossover_magic_definitions;
}
// Apply Heroes movement effects after native speed upgrades, including iscript
// walking. Editing flingy.top_speed alone cannot affect infantry script movement.
int crossover_movement_speed(const bwgame::unit_t* unit,int speed){
 if(!unit||speed<=0)return speed;
 for(const auto & entry:crossover_magic_definitions)if(unit->unit_type==&entry.second.type)
  return std::max(1,int(int64_t(speed)*entry.second.movementScale/1000));
 return speed;
}
namespace {
std::map<std::pair<int,int>,std::pair<int,int>> crossover_damage_rules;
struct CrossoverContact {int source,target,frame,obstacle=-1;};bwgame::a_vector<CrossoverContact> crossover_contacts;
bwgame::a_string crossover_contact_json;
std::map<std::pair<int,int>,int> crossover_last_contact;
struct CrossoverObstacle {int id,x,y;bool blocks,stops,triggers;bwgame::unit_id blocker;};bwgame::a_vector<CrossoverObstacle> crossover_obstacles;
std::map<std::pair<int,int>,int> crossover_hazard_contact;
bool crossover_retaliating=false;std::map<int,std::pair<int,int>> crossover_retaliation_counts;



bool crossover_live(bwgame::unit_id id,int owner) { auto u=g_ui->get_unit(id);return u && !g_ui->unit_dying(u) && u->hp.raw_value>0; }
void crossover_attack_owner(int owner) {
  if(!g_ui || crossover_battle<0)return;
  bwgame::unit_t* target=nullptr;
  for(auto* u:bwgame::ptr(g_ui->st.player_units[1-owner]))if(!g_ui->unit_dying(u) && u->hp.raw_value>0){target=u;break;}
  if(!target)return;
  // Original StarCraft selection/order decoder, not direct combat or HP writes.
  for(auto* u:bwgame::ptr(g_ui->st.player_units[owner]))if(!g_ui->unit_dying(u) && u->hp.raw_value>0){
    bwgame::a_vector<uint8_t> bytes;bwgame::bw_cmd cmd(bytes);
    uint16_t id=g_ui->get_unit_id(u).raw_value;cmd.select(&id,1);
    cmd.order(bwgame::Orders::AttackMove,target->sprite->position,0,false);
    g_ui->apply_commands(owner,bytes.data(),bytes.size());
  }
}
}
bool bwgame::crossover_hero_sound(const unit_t* source,xy position){
 if(!g_ui)return false;
 int nearest=32*32;bool hero=false;
 const auto consider=[&](xy at,bool heroes){const int dx=at.x-position.x,dy=at.y-position.y,distance=dx*dx+dy*dy;if(distance<nearest){nearest=distance;hero=heroes;}};
 for(const auto & group:crossover_groups)for(auto id:group.ids){const auto unit=g_ui->get_unit(id);if(unit==source&&source)return group.heroes;if(!source&&unit&&unit->sprite)consider(unit->sprite->position,group.heroes);}
 if(source||position==xy())return false;
 // iscript supplies a bare sprite position, including death sounds. Prefer the
 // nearest live actor; the previous tick covers a just-removed Heroes proxy.
 for(const auto & origin:crossover_sound_origins)consider(origin.position,origin.heroes);
 return hero;
}
int crossover_weapon_contact(bwgame::unit_t* target,bwgame::unit_t* source,int damage){
 if(!g_ui||crossover_battle<0||!target||!source)return damage;int from=-1,to=-1;
 for(const auto& group:crossover_groups)for(auto id:group.ids){const auto* unit=g_ui->get_unit(id);if(unit==source)from=group.stack;if(unit==target)to=group.stack;}
 if(from<0||to<0)return damage;const auto key=std::make_pair(from,to);const int frame=g_ui->st.current_frame;
 if(!crossover_last_contact.count(key)||frame-crossover_last_contact[key]>=12){if(crossover_contacts.size()<256)crossover_contacts.push_back({from,to,frame});crossover_last_contact[key]=frame;}
 const auto rule=crossover_damage_rules.find(key);if(rule!=crossover_damage_rules.end()){const auto sourceDefinition=crossover_magic_definitions.find(from);const bool ranged=sourceDefinition!=crossover_magic_definitions.end()?sourceDefinition->second.shooting:(source->unit_type->ground_weapon->max_range>32||source->unit_type->id==bwgame::UnitTypes::Terran_Firebat);damage=int(int64_t(damage)*(ranged?rule->second.second:rule->second.first)/1000);}
 const auto sourceRules=crossover_magic_definitions.find(from);if(sourceRules!=crossover_magic_definitions.end()){
  const auto & d=sourceRules->second;if(d.luck&&int(g_ui->lcg_rand(0)%24)<std::min(3,std::abs(d.luck)))damage=d.luck>0?damage*2:damage/2;
  if(d.morale&&int(g_ui->lcg_rand(0)%24)<std::min(3,std::abs(d.morale)))source->ground_weapon_cooldown=d.morale>0?source->ground_weapon_cooldown/2:std::min(255,int(source->ground_weapon_cooldown)+source->unit_type->ground_weapon->cooldown);
 }
 const auto definition=crossover_magic_definitions.find(to);if(definition!=crossover_magic_definitions.end()&&definition->second.fire>0&&source->unit_type->ground_weapon->max_range<=32&&source->unit_type->id!=bwgame::UnitTypes::Terran_Firebat){g_ui->unit_deal_damage(source,bwgame::fp8::from_raw(int(int64_t(damage)*definition->second.fire/100)),nullptr,~0);}
 if(definition!=crossover_magic_definitions.end()){
  const auto & d=definition->second;if(d.cloned&&damage>0)for(const auto& group:crossover_groups)if(group.stack==to)for(auto id:group.ids){auto* unit=g_ui->get_unit(id);if(unit&&unit!=target&&!g_ui->unit_dying(unit))g_ui->unit_deal_damage(unit,unit->hp,nullptr,~0);}if(d.cloned)damage=std::max(damage,(int(target->hp.raw_value)+int(target->shield_points.raw_value)+8192)*4);
  if(!crossover_retaliating&&d.retaliations>0&&!d.disabled&&target->order_target.unit&&source->unit_type->ground_weapon->max_range<=32){auto & used=crossover_retaliation_counts[g_ui->get_unit_id(target).raw_value];if(used.first!=frame/96)used={frame/96,0};if(used.second<d.retaliations){++used.second;crossover_retaliating=true;g_ui->weapon_deal_damage(target->unit_type->ground_weapon,g_ui->weapon_damage_amount(target->unit_type->ground_weapon,target->owner),1,source,bwgame::direction_t(),target,target->owner);crossover_retaliating=false;}}
 }
 return damage;
}
OPENBW_EXPORT(openbw_crossover_setup) int openbw_crossover_setup(int battle,int count) {
  if(!g_ui || count<2 || count>32 || (g_inbuf.size()!=size_t(count*16) && g_inbuf.size()!=size_t(count*48) && g_inbuf.size()!=size_t(count*56)))return 0;
  const auto* rows=reinterpret_cast<const int32_t*>(g_inbuf.data());
  const int stride=g_inbuf.size()/count/4;
  int totals[2]={0,0};
  for(int i=0;i<count;i++){
    const auto* row=rows+i*stride;
    if(row[0]<0 || row[1]<0 || row[1]>1 || (row[2]!=0 && row[2]!=32 && row[2]!=37 && row[2]!=38 && row[2]!=65 && row[2]!=66) || row[3]<0 || row[3]>128)return 0;
    if(stride>=12 && (row[4]<0 || row[4]>1 || row[5]<1 || row[5]>10000 || row[6]<0 || row[7]<row[6] || row[7]>10000 || row[8]<0 || row[8]>1000 || row[9]<1 || row[9]>100 || row[10]<0 || row[10]>1))return 0;
    if(stride==14&&(row[12]<0||row[12]>row[5]||row[13]<row[3]||row[13]>128))return 0;
    totals[row[1]]+=row[3];
  }
  if(totals[0]<1 || totals[1]<1 || totals[0]>128 || totals[1]>128)return 0;
  bwgame::a_vector<bwgame::unit_t*> remove;
  for(int owner=0;owner<8;owner++)for(auto* u:bwgame::ptr(g_ui->st.player_units[owner]))remove.push_back(u);
  for(auto* u:remove)g_ui->kill_unit(u);
  // Scenario setup: a field battle has no base-elimination melee triggers.
  for(auto& triggers:g_ui->st.running_triggers)triggers.clear();
  g_ui->st.alliances[0][1]=0;g_ui->st.alliances[1][0]=0;
  crossover_groups.clear();crossover_spells.clear();crossover_magic_definitions.clear();crossover_damage_rules.clear();crossover_contacts.clear();crossover_last_contact.clear();crossover_obstacles.clear();crossover_hazard_contact.clear();crossover_battle=battle;g_ui->competitive=false;g_ui->rep_on=false;
  const auto origin=g_ui->game_st.start_locations[0];
  const int direction=origin.x<int(g_ui->game_st.map_width)/2?1:-1;
  crossover_camera=origin+bwgame::xy(direction>0?-120:-620,-150);
  bool enemyStarcraft=false;for(int i=0;i<count;i++)if(rows[i*stride+1]==1&&(stride<12||rows[i*stride+4]==0))enemyStarcraft=true;
  for(auto upgrade:{bwgame::UpgradeTypes::Terran_Infantry_Armor,bwgame::UpgradeTypes::Terran_Infantry_Weapons,bwgame::UpgradeTypes::Zerg_Carapace,bwgame::UpgradeTypes::Zerg_Melee_Attacks,bwgame::UpgradeTypes::Zerg_Missile_Attacks,bwgame::UpgradeTypes::Protoss_Ground_Armor,bwgame::UpgradeTypes::Protoss_Ground_Weapons,bwgame::UpgradeTypes::Protoss_Plasma_Shields,bwgame::UpgradeTypes::U_238_Shells,bwgame::UpgradeTypes::Metabolic_Boost,bwgame::UpgradeTypes::Adrenal_Glands,bwgame::UpgradeTypes::Muscular_Augments,bwgame::UpgradeTypes::Grooved_Spines,bwgame::UpgradeTypes::Leg_Enhancements,bwgame::UpgradeTypes::Singularity_Charge})g_ui->st.upgrade_levels[1][upgrade]=enemyStarcraft?g_ui->get_upgrade_type(upgrade)->max_level:0;
  g_ui->st.tech_researched[1][bwgame::TechTypes::Stim_Packs]=true;g_ui->st.tech_researched[1][bwgame::TechTypes::Burrowing]=true;
  int placed[2]={0,0};
  for(int i=0;i<count;i++){
    const auto* row=rows+i*stride;CrossoverGroup group{row[0],row[1],stride>=12 && row[4]!=0,row[3],{}};
    const bwgame::unit_type_t* definition=g_ui->get_unit_type(bwgame::UnitTypes(row[2]));
    if(stride>=12 || group.owner==0){
      auto& type=crossover_types[i];type=*definition;
      // The campaign map may override unit HP; crossover health comes from the live battle.
      if(stride>=12)type.hitpoints=bwgame::fp8::integer(std::max(1,row[5]-(type.has_shield?type.shield_points:0)));
      if(group.heroes){
        // Private definitions preserve Heroes stats without editing SC types.
        auto& weapon=crossover_weapons[i];weapon=*definition->ground_weapon;
        type.armor_upgrade=bwgame::UpgradeTypes::unk_18;type.hitpoints=bwgame::fp8::integer(row[5]);type.has_shield=false;type.flags=bwgame::unit_type_t::flags_t(uint32_t(type.flags)&~uint32_t(bwgame::unit_type_t::flag_regens_hp));type.armor=row[8]/4;
        weapon.damage_amount=(row[6]+row[7]+1)/2;weapon.damage_bonus=0;
        weapon.damage_type=bwgame::weapon_type_t::damage_type_normal;
        weapon.cooldown=std::max(12,std::min(48,160/row[9]));
        type.ground_weapon=&weapon;type.air_weapon=row[10]?&weapon:nullptr;
      }
      if(group.owner==0){
        // Manual stance: no acquisition or retaliation while idle. Move returns
        // here when complete; attacks happen only after an explicit player order.
        type.human_ai_idle=type.computer_ai_idle=type.return_to_idle=g_ui->get_order_type(bwgame::Orders::Nothing);
      }
      definition=&type;
    }
    for(int j=0;j<row[3];j++){
      const int index=placed[row[1]]++;
      // Five lanes keep each five-creature cohort together and upright sprites legible when the field is projected vertically.
      const int lanes=5;const bool compact=totals[0]>35||totals[1]>12;const int fieldX=compact?60+row[1]*420+(index%8)*24:row[1]?680-(index/lanes)*70:60+(index/lanes)*70,fieldY=compact?125+(index/8)*20:50+(index%lanes)*100;
      const bwgame::xy at=crossover_camera+bwgame::xy(direction>0?fieldX:799-fieldX,fieldY);
      auto* unit=g_ui->trigger_create_unit(definition,at,row[1]);
      if(!unit){crossover_battle=-1;return 0;}
      if(stride==14&&j==0&&row[3]>0&&row[12]<row[5]){int missing=row[5]-row[12];if(unit->unit_type->has_shield){const int shieldLoss=std::min(missing,unit->shield_points.integer_part());unit->shield_points-=bwgame::fp8::integer(shieldLoss);missing-=shieldLoss;}if(missing>0)unit->hp=std::max(bwgame::fp8::from_raw(1),unit->hp-bwgame::fp8::integer(missing));}
      if(group.heroes){unit->status_flags&=~(bwgame::unit_t::status_flag_speed_upgrade|bwgame::unit_t::status_flag_cooldown_upgrade);g_ui->update_unit_speed(unit);}
      if(group.owner==0)g_ui->issue_order(unit,false,g_ui->get_order_type(bwgame::Orders::Nothing),{});
      group.ids.push_back(g_ui->get_unit_id(unit));
    }
    crossover_groups.push_back(std::move(group));
  }
  g_ui->screen_pos=origin-bwgame::xy(g_ui->view_width/3,g_ui->view_height/3);
  remember_crossover_sounds();crossover_attack_owner(1);
  return 1;
}
// VCMI provides damage at each live caster count, including target immunities.
OPENBW_EXPORT(openbw_crossover_spell_setup) int openbw_crossover_spell_setup(int stack,int spell,int charges,int radius) {
 if(!g_ui||crossover_battle<0||(spell!=21&&spell!=22)||charges<1||charges>32||radius<1||radius>128)return 0;
 const CrossoverGroup* caster=nullptr;for(const auto& g:crossover_groups)if(g.stack==stack&&g.heroes&&g.owner==0)caster=&g;
 if(!caster)return 0;
 for(const auto& s:crossover_spells)if(s.stack==stack&&s.id==spell)return 0;
 const size_t stride=caster->ids.size()+3;
 if(g_inbuf.size()!=stride*crossover_groups.size()*4)return 0;
 const auto* rows=reinterpret_cast<const int32_t*>(g_inbuf.data());
 for(size_t i=0;i<crossover_groups.size();++i){if(rows[i*stride]!=crossover_groups[i].stack||rows[i*stride+1]<0||rows[i*stride+1]>100)return 0;for(size_t n=2;n<stride;++n)if(rows[i*stride+n]<0||rows[i*stride+n]>1000000)return 0;}
 CrossoverSpell value;value.stack=stack;value.id=spell;value.charges=charges;value.radius=radius;value.rows.assign(rows,rows+stride*crossover_groups.size());crossover_spells.push_back(std::move(value));return 1;
}
OPENBW_EXPORT(openbw_crossover_cast) int openbw_crossover_cast(int stack,int spell,int x,int y) {
 if(!g_ui||x<0||x>799||y<0||y>499)return 0;
 CrossoverSpell* config=nullptr;for(auto& s:crossover_spells)if(s.stack==stack&&s.id==spell)config=&s;
 if(!config||config->charges<1||int(g_ui->st.current_frame)<config->ready)return 0;
 const CrossoverGroup* caster=nullptr;int alive=0;bwgame::unit_t* source=nullptr;
 int totals[2]={0,0};for(const auto& g:crossover_groups){for(auto id:g.ids)if(crossover_live(id,g.owner)){++totals[g.owner];if(g.stack==stack){++alive;source=g_ui->get_unit(id);}}if(g.stack==stack)caster=&g;}
 if(!caster||!source||!totals[0]||!totals[1])return 0;
 const bwgame::xy point=crossover_camera+bwgame::xy(x,y);const size_t stride=caster->ids.size()+3;
 struct Hit {bwgame::unit_t* unit;int damage,resistance;};bwgame::a_vector<Hit> hits;
 for(size_t i=0;i<crossover_groups.size();++i){const auto& g=crossover_groups[i];const int damage=config->rows[i*stride+2+alive];if(!damage)continue;for(auto id:g.ids)if(crossover_live(id,g.owner)){auto* unit=g_ui->get_unit(id);const auto delta=unit->sprite->position-point;if(delta.x*delta.x+delta.y*delta.y<=config->radius*config->radius)hits.push_back({unit,damage,config->rows[i*stride+1]});}}
 if(hits.empty())return 0;
 --config->charges;config->ready=int(g_ui->st.current_frame)+24;
 for(auto id:caster->ids)if(crossover_live(id,caster->owner))g_ui->issue_order(g_ui->get_unit(id),false,g_ui->get_order_type(bwgame::Orders::Nothing),{});
 for(const auto& hit:hits)if(!hit.resistance||int(g_ui->lcg_rand(0)%100)>=hit.resistance)g_ui->unit_deal_damage(hit.unit,bwgame::fp8::integer(hit.damage),source,caster->owner);
 return 1;
}
// Transaction from the isolated VCMI battle: damage, healing, resurrection,
// summons, control, speed and weapon/defence bonuses use native RTS actors.
OPENBW_EXPORT(openbw_crossover_damage_rules) int openbw_crossover_damage_rules(int count){if(count<0||count>16384||g_inbuf.size()!=size_t(count*16))return 0;const auto* rows=reinterpret_cast<const int32_t*>(g_inbuf.data());for(int i=0;i<count;i++)if(rows[i*4+2]<0||rows[i*4+2]>100000||rows[i*4+3]<0||rows[i*4+3]>100000)return 0;crossover_damage_rules.clear();for(int i=0;i<count;i++)crossover_damage_rules[{rows[i*4],rows[i*4+1]}]={rows[i*4+2],rows[i*4+3]};return 1;}
OPENBW_EXPORT(openbw_crossover_contacts) const char* openbw_crossover_contacts(){auto& out=crossover_contact_json;out="[";bool comma=false;for(const auto& hit:crossover_contacts){if(comma)out+=',';comma=true;out+=bwgame::format("{\"source\":%d,\"target\":%d,\"frame\":%d",hit.source,hit.target,hit.frame);if(hit.obstacle>=0)out+=bwgame::format(",\"obstacle\":%d",hit.obstacle);out+='}';}out+=']';crossover_contacts.clear();return out.c_str();}
OPENBW_EXPORT(openbw_crossover_obstacles) int openbw_crossover_obstacles(int count){
 if(!g_ui||count<0||count>256||g_inbuf.size()!=size_t(count*24))return 0;const auto* rows=reinterpret_cast<const int32_t*>(g_inbuf.data());for(int i=0;i<count;i++)if(rows[i*6]<0||rows[i*6+1]<0||rows[i*6+1]>799||rows[i*6+2]<0||rows[i*6+2]>499)return 0;
 for(auto & obstacle:crossover_obstacles)if(obstacle.blocks){bool retained=false;for(int i=0;i<count;i++)if(rows[i*6]==obstacle.id&&rows[i*6+1]==obstacle.x&&rows[i*6+2]==obstacle.y)retained=true;if(!retained)if(auto* unit=g_ui->get_unit(obstacle.blocker))g_ui->kill_unit(unit);}
 bwgame::a_vector<CrossoverObstacle> next;for(int i=0;i<count;i++){const auto* r=rows+i*6;CrossoverObstacle obstacle{r[0],r[1],r[2],bool(r[3]),bool(r[4]),bool(r[5]),{}};for(const auto & old:crossover_obstacles)if(old.id==r[0]&&old.x==r[1]&&old.y==r[2])obstacle.blocker=old.blocker;
  if(obstacle.blocks&&!g_ui->get_unit(obstacle.blocker)){auto* unit=g_ui->trigger_create_unit(g_ui->get_unit_type(bwgame::UnitTypes::Terran_Supply_Depot),crossover_camera+bwgame::xy(obstacle.x,obstacle.y),7);if(unit)obstacle.blocker=g_ui->get_unit_id(unit);g_ui->st.alliances[0][7]=g_ui->st.alliances[1][7]=g_ui->st.alliances[7][0]=g_ui->st.alliances[7][1]=1;}next.push_back(obstacle);
 }crossover_obstacles=std::move(next);return 1;
}
OPENBW_EXPORT(openbw_crossover_apply_magic) int openbw_crossover_apply_magic(int count){
 constexpr int stride=27;if(!g_ui||count<1||count>128||g_inbuf.size()!=size_t(count*stride*4))return 0;
 const auto* rows=reinterpret_cast<const int32_t*>(g_inbuf.data());int totals[2]={0,0};std::set<int> keys;
 for(int i=0;i<count;i++){const auto* r=rows+i*stride;if(r[0]<0||r[1]<0||r[1]>1||r[2]<0||r[2]>128||r[3]<0||r[4]<1||r[4]>10000||r[3]>r[2]*r[4]||r[5]<0||r[5]>1000||r[6]<0||r[6]>1000||r[7]<0||r[8]<r[7]||r[8]>10000||r[9]<0||r[9]>100||r[26]<100||r[26]>10000||r[11]<0||r[11]>799||r[12]<0||r[12]>499||!keys.insert(r[0]).second)return 0;totals[r[1]]+=r[2];}
 if(totals[0]>128||totals[1]>128||keys.size()>128)return 0;
 for(int i=0;i<count;i++){
  const auto* r=rows+i*stride;CrossoverGroup* group=nullptr;for(auto& g:crossover_groups)if(g.stack==r[0])group=&g;
  if(!group){if(!r[2])continue;if(crossover_groups.size()>=128)return 0;crossover_groups.push_back({r[0],r[1],bool(r[22]),0,{}});group=&crossover_groups.back();}
  const bool newGroup=group->initial==0&&group->ids.empty();
  auto& d=crossover_magic_definitions[group->stack];bwgame::a_vector<bwgame::unit_t*> live;for(auto id:group->ids)if(crossover_live(id,group->owner))live.push_back(g_ui->get_unit(id));
  if(!d.base){d.base=live.empty()?g_ui->get_unit_type(bwgame::UnitTypes(r[21])):live.front()->unit_type;d.baseDamage=group->initial?d.base->ground_weapon->damage_amount:(r[7]+r[8]+1)/2;d.baseArmor=group->initial||!group->heroes?d.base->armor:r[6]/4;d.attack=r[5];d.type=*d.base;d.weapon=*d.base->ground_weapon;d.flingy=*g_ui->get_flingy_type(d.base->flingy);}
  const int shieldMaximum=!group->heroes&&d.base->has_shield?d.base->shield_points:0;
  const int maximum=std::max(1,r[4]-shieldMaximum),desiredHealth=r[20]?0:r[3],desiredCount=r[20]?0:r[2];
  d.type.hitpoints=bwgame::fp8::integer(maximum);d.type.armor=d.baseArmor;d.weapon.damage_amount=d.baseDamage;d.weapon.damage_bonus=group->heroes?0:d.base->ground_weapon->damage_bonus;d.weapon.damage_type=d.base->ground_weapon->damage_type;
  if(!r[10])d.weapon.max_range=std::min(32,d.base->ground_weapon->max_range);
  else d.weapon.max_range=d.base->ground_weapon->max_range;
  if(r[1]==0)d.type.human_ai_idle=d.type.computer_ai_idle=d.type.return_to_idle=g_ui->get_order_type(bwgame::Orders::Nothing);
  d.type.ground_weapon=&d.weapon;d.type.air_weapon=r[10]?&d.weapon:nullptr;d.movementScale=r[26];d.disabled=r[13]&1;d.berserk=r[13]&2;d.cloned=r[13]&4;d.shooting=r[10];d.luck=r[23];d.morale=r[24];d.retaliations=r[25];d.melee=r[15];d.ranged=r[16];d.fire=r[17];
  std::sort(live.begin(),live.end(),[](auto* a,auto* b){return a->hp<b->hp;});
  while(int(live.size())>desiredCount){g_ui->unit_deal_damage(live.front(),live.front()->hp,nullptr,~0);live.erase(live.begin());}
  while(int(live.size())<desiredCount){const auto at=crossover_camera+bwgame::xy(std::clamp(r[11]+int(live.size()%4)*16,0,799),std::clamp(r[12]+int(live.size()/4)*16,0,499));auto* unit=g_ui->trigger_create_unit(&d.type,at,r[1]);if(!unit)return 0;group->ids.push_back(g_ui->get_unit_id(unit));live.push_back(unit);if(r[1]==0)g_ui->issue_order(unit,false,g_ui->get_order_type(bwgame::Orders::Nothing),{});}
  // The Heroes cohort has one wounded member. Repack aggregate durability
  // without healing or dropping distributed damage when switching simulations.
  for(size_t i=0;i<live.size();i++){auto* unit=live[i];unit->unit_type=&d.type;unit->flingy_type=&d.flingy;if(unit->owner!=r[1])g_ui->set_unit_owner(unit,r[1],false);unit->lockdown_timer=d.disabled?255:0;
   if(group->heroes)unit->status_flags&=~(bwgame::unit_t::status_flag_speed_upgrade|bwgame::unit_t::status_flag_cooldown_upgrade);g_ui->update_unit_speed(unit);
   const int available=i? r[4]:desiredHealth-(desiredCount-1)*r[4],hp=std::min(maximum,std::max(1,available)),shields=std::clamp(available-maximum,0,shieldMaximum);
   if(shieldMaximum&&shields<unit->shield_points.integer_part())g_ui->create_shield_damage_effect(unit,bwgame::direction_t());unit->hp=bwgame::fp8::integer(hp);unit->shield_points=bwgame::fp8::integer(shields);
   if(r[14])g_ui->move_unit(unit,crossover_camera+bwgame::xy(r[11],r[12]));
  }
 }
 return 1;
}
OPENBW_EXPORT(openbw_crossover_ai_tick) void openbw_crossover_ai_tick() {
  remember_crossover_sounds();
  if(g_ui&&g_ui->st.current_frame%12==0)for(const auto& group:crossover_groups){const auto rule=crossover_magic_definitions.find(group.stack);if(rule==crossover_magic_definitions.end()||!rule->second.berserk||rule->second.disabled)continue;for(auto id:group.ids)if(crossover_live(id,group.owner)){auto* unit=g_ui->get_unit(id);bwgame::unit_t* target=nullptr;int nearest=0x7fffffff;for(const auto& other:crossover_groups)for(auto candidate:other.ids)if(!(candidate==id)&&crossover_live(candidate,other.owner)){auto* enemy=g_ui->get_unit(candidate);const auto delta=enemy->sprite->position-unit->sprite->position;const int distance=delta.x*delta.x+delta.y*delta.y;if(distance<nearest){nearest=distance;target=enemy;}}if(target)g_ui->issue_order(unit,false,g_ui->get_order_type(bwgame::Orders::AttackUnit),{target->sprite->position,target});}}
  if(g_ui)for(const auto& obstacle:crossover_obstacles)if(obstacle.triggers||obstacle.stops)for(const auto & group:crossover_groups)for(auto id:group.ids)if(crossover_live(id,group.owner)){auto* unit=g_ui->get_unit(id);const auto delta=unit->sprite->position-crossover_camera-bwgame::xy(obstacle.x,obstacle.y);if(std::abs(delta.x)>26||std::abs(delta.y)>23)continue;const auto key=std::make_pair(group.stack,obstacle.id);const int frame=g_ui->st.current_frame;if(!crossover_hazard_contact.count(key)||frame-crossover_hazard_contact[key]>=96){if(obstacle.stops)g_ui->issue_order(unit,false,g_ui->get_order_type(bwgame::Orders::Nothing),{});if(obstacle.triggers&&crossover_contacts.size()<256)crossover_contacts.push_back({-1,group.stack,frame,obstacle.id});crossover_hazard_contact[key]=frame;}}
  if(g_ui && crossover_battle>=0 && g_ui->st.current_frame%96==0)crossover_attack_owner(1);
}
OPENBW_EXPORT(openbw_crossover_attack) void openbw_crossover_attack() { crossover_attack_owner(0); }
OPENBW_EXPORT(openbw_crossover_battle_state) const char* openbw_crossover_battle_state() {
  if(!g_ui || crossover_battle<0)return "null";
  auto& out=crossover_result;out=bwgame::format("{\"battleId\":%d,\"frame\":%d,\"groups\":[",crossover_battle,int(g_ui->st.current_frame));
  bool comma=false;int totals[2]={0,0};
  for(const auto& group:crossover_groups){
    int alive=0;for(auto id:group.ids)if(crossover_live(id,group.owner))++alive;
    totals[group.owner]+=alive;
    if(comma)out+=',';comma=true;
    int casts=0,ready=0;for(const auto& spell:crossover_spells)if(spell.stack==group.stack){casts=spell.charges;ready=spell.ready;break;}
    out+=bwgame::format("{\"id\":%d,\"side\":%d,\"initial\":%d,\"survivors\":%d,\"casts\":%d,\"spellReady\":%d}",group.stack,group.owner,group.initial,alive,casts,ready);
  }
  out+=bwgame::format("],\"upgrades\":{\"terranWeapons\":%d,\"terranArmor\":%d,\"zergMelee\":%d,\"zergMissile\":%d,\"zergArmor\":%d,\"protossWeapons\":%d,\"protossArmor\":%d,\"protossShields\":%d},\"finished\":%s}",g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Terran_Infantry_Weapons),g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Terran_Infantry_Armor),g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Zerg_Melee_Attacks),g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Zerg_Missile_Attacks),g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Zerg_Carapace),g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Protoss_Ground_Weapons),g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Protoss_Ground_Armor),g_ui->player_upgrade_level(1,bwgame::UpgradeTypes::Protoss_Plasma_Shields),totals[0]==0||totals[1]==0?"true":"false");
  return out.c_str();
}
OPENBW_EXPORT(openbw_crossover_census) const char* openbw_crossover_census() {
  if (!g_ui) return "null";
  auto& out = crossover_census;
  out = bwgame::format("{\"frame\":%d,\"view\":{\"x\":%d,\"y\":%d,\"width\":%d,\"height\":%d},\"units\":[",
    (int)g_ui->st.current_frame,g_ui->screen_pos.x,g_ui->screen_pos.y,(int)g_ui->view_width,(int)g_ui->view_height);
  bool comma = false;
  bwgame::a_vector<std::pair<int,bwgame::unit_t*>> actors;
  if(crossover_battle>=0){for(const auto& group:crossover_groups)for(auto id:group.ids)if(auto* unit=g_ui->get_unit(id))if(unit->sprite)actors.push_back({g_ui->unit_dying(unit)?group.owner:unit->owner,unit});}
  else for(int owner=0;owner<8;owner++)for(auto* unit:bwgame::ptr(g_ui->st.player_units[owner]))if(unit->sprite)actors.push_back({owner,unit});
  for(const auto & actor:actors){const int owner=actor.first;auto* unit=actor.second;
    if (comma) out += ',';
    comma = true;
    int stack=-1;bool heroes=false;
    for(const auto& group:crossover_groups)for(auto id:group.ids)if(id==g_ui->get_unit_id(unit)){stack=group.stack;heroes=group.heroes;}
    out += bwgame::format("{\"stackId\":%d,\"heroes\":%s,\"maxHp\":%d,\"shields\":%d,\"maxShields\":%d,\"order\":%d,\"cooldown\":%d,\"id\":%u,\"type\":%d,\"owner\":%d,\"completed\":%s,\"hp\":%d,\"hp256\":%d,\"shields256\":%d,\"x\":%d,\"y\":%d}",
      stack,heroes?"true":"false",unit->unit_type->hitpoints.integer_part(),unit->unit_type->has_shield?unit->shield_points.integer_part():0,unit->unit_type->has_shield?unit->unit_type->shield_points:0,int(unit->order_type->id),int(unit->ground_weapon_cooldown),(unsigned)g_ui->get_unit_id(unit).raw_value,(int)unit->unit_type->id,owner,
      g_ui->u_completed(unit)?"true":"false",unit->hp.ceil().integer_part(),int(unit->hp.raw_value),unit->unit_type->has_shield?int(unit->shield_points.raw_value):0,unit->sprite->position.x,unit->sprite->position.y);
  }
  out += "]}";
  return out.c_str();
}

// Transparent StarCraft sprite layer for the shared Heroes battlefield. Rendering
// only: does not change simulation positions, health or orders.
OPENBW_EXPORT(openbw_crossover_layer) const uint8_t* openbw_crossover_layer() {
  if(!g_ui || crossover_battle<0)return nullptr;
  constexpr int width=800,height=500;
  bwgame::a_vector<uint8_t> indexed(width*height,0);
  const auto screen=g_ui->screen_pos;const int w=g_ui->view_width,h=g_ui->view_height,sw=g_ui->screen_width,sh=g_ui->screen_height;
  g_ui->screen_pos=crossover_camera;g_ui->view_width=width;g_ui->view_height=height;g_ui->screen_width=width;g_ui->screen_height=height;
  for(const auto& group:crossover_groups)if(!group.heroes)for(auto id:group.ids){auto* u=g_ui->get_unit(id);if(u && !g_ui->unit_dying(u))g_ui->draw_sprite(u->sprite,indexed.data(),width);}
  g_ui->screen_pos=screen;g_ui->view_width=w;g_ui->view_height=h;g_ui->screen_width=sw;g_ui->screen_height=sh;
  crossover_pixels.resize(width*height*4);
  for(size_t i=0;i<indexed.size();i++){const auto color=indexed[i];for(int c=0;c<3;c++)crossover_pixels[i*4+c]=g_ui->tileset_img.wpe[color*4+c];crossover_pixels[i*4+3]=color?255:0;}
  return crossover_pixels.data();
}
OPENBW_EXPORT(openbw_crossover_camera_x) int openbw_crossover_camera_x(){return crossover_camera.x;}
OPENBW_EXPORT(openbw_crossover_camera_y) int openbw_crossover_camera_y(){return crossover_camera.y;}

OPENBW_EXPORT(openbw_crossover_order) void openbw_crossover_order(int stack,int x,int y,int attack) {
 if(!g_ui || crossover_battle<0 || x<0 || y<0 || x>=800 || y>=500)return;
 const auto target=crossover_camera+bwgame::xy(x,y);
 for(const auto& group:crossover_groups)if(stack<0 || group.stack==stack)for(auto id:group.ids){
  auto* u=g_ui->get_unit(id);if(!u || u->owner!=0 || g_ui->unit_dying(u))continue;
  bwgame::a_vector<uint8_t> bytes;bwgame::bw_cmd cmd(bytes);uint16_t selected=id.raw_value;cmd.select(&selected,1);
  cmd.order(attack?bwgame::Orders::AttackMove:bwgame::Orders::Move,target,0,false);g_ui->apply_commands(0,bytes.data(),bytes.size());
 }
}

// Isolated native sprites let the shared view enlarge each creature without
// enlarging formations or duplicating neighbouring units from a cropped layer.
OPENBW_EXPORT(openbw_crossover_sprite) const uint8_t* openbw_crossover_sprite(int requested) {
 if(!g_ui || crossover_battle<0 || requested<1 || requested>65535)return nullptr;
 bwgame::unit_t* unit=nullptr;
 for(const auto& group:crossover_groups)if(!group.heroes)for(auto id:group.ids)if(id.raw_value==requested){
  // Dead units leave the live lookup before their original death script ends.
  // Only render the same generation; never resolve a recycled unit slot.
  auto* candidate=id.index()?g_ui->st.units_container.try_get(id.index()-1):nullptr;
  if(candidate&&g_ui->get_unit_id(candidate)==id&&candidate->sprite)unit=candidate;
 }
 if(!unit||!unit->sprite)return nullptr;
 constexpr int width=96,height=96;
 std::array<uint8_t,width*height> indexed{};
 const auto camera=g_ui->screen_pos;
 const int vw=g_ui->view_width,vh=g_ui->view_height,sw=g_ui->screen_width,sh=g_ui->screen_height;
 const auto selection=g_ui->current_selection_sprites_set.at(unit->sprite->index);
 g_ui->current_selection_sprites_set.at(unit->sprite->index)=nullptr;
 g_ui->screen_pos=unit->sprite->position-bwgame::xy(48,64);
 g_ui->view_width=g_ui->screen_width=width;g_ui->view_height=g_ui->screen_height=height;
 g_ui->draw_sprite(unit->sprite,indexed.data(),width);
 g_ui->screen_pos=camera;g_ui->view_width=vw;g_ui->view_height=vh;g_ui->screen_width=sw;g_ui->screen_height=sh;
 g_ui->current_selection_sprites_set.at(unit->sprite->index)=selection;
 static std::array<uint8_t,width*height*4> pixels;
 for(size_t i=0;i<indexed.size();i++){
  const auto color=indexed[i];for(int channel=0;channel<3;channel++)pixels[i*4+channel]=g_ui->tileset_img.wpe[color*4+channel];pixels[i*4+3]=color?255:0;
 }
 return pixels.data();
}

OPENBW_EXPORT(openbw_crossover_stop) void openbw_crossover_stop(int stack) {
 if(!g_ui || crossover_battle<0)return;
 for(const auto& group:crossover_groups)if(stack<0 || group.stack==stack)for(auto id:group.ids){
  auto* u=g_ui->get_unit(id);if(!u || u->owner!=0 || g_ui->unit_dying(u))continue;
  bwgame::a_vector<uint8_t> bytes;bwgame::bw_cmd cmd(bytes);uint16_t selected=id.raw_value;cmd.select(&selected,1);
  cmd.order(bwgame::Orders::Stop,u->sprite->position,0,false);g_ui->apply_commands(0,bytes.data(),bytes.size());
 }
}
OPENBW_EXPORT(openbw_crossover_target) void openbw_crossover_target(int stack,int requested) {
 if(!g_ui || crossover_battle<0 || requested<1 || requested>65535)return;
 auto* target=g_ui->get_unit(bwgame::unit_id(uint16_t(requested)));
 if(!target || target->owner!=1 || g_ui->unit_dying(target))return;
 for(const auto& group:crossover_groups)if(stack<0 || group.stack==stack)for(auto id:group.ids){
  auto* u=g_ui->get_unit(id);if(!u || u->owner!=0 || g_ui->unit_dying(u))continue;
  bwgame::a_vector<uint8_t> bytes;bwgame::bw_cmd cmd(bytes);uint16_t selected=id.raw_value;cmd.select(&selected,1);
  cmd.order(bwgame::Orders::AttackDefault,target->sprite->position,uint16_t(requested),false);g_ui->apply_commands(0,bytes.data(),bytes.size());
 }
}
