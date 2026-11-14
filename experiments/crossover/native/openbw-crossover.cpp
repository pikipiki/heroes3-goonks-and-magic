// Native crossover scenario and rendering DTOs; upstream source remains unchanged.
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

namespace { bwgame::a_string crossover_census; }
namespace {
struct CrossoverGroup { int stack; int owner; bool heroes; bwgame::a_vector<bwgame::unit_id> ids; };
bwgame::a_vector<CrossoverGroup> crossover_groups;
struct SoundOrigin { bwgame::xy position;bool heroes; };
bwgame::a_vector<SoundOrigin> crossover_sound_origins;
void remember_crossover_sounds(){crossover_sound_origins.clear();if(!g_ui)return;for(const auto & group:crossover_groups)for(auto id:group.ids){const auto unit=g_ui->get_unit(id);if(unit&&unit->sprite)crossover_sound_origins.push_back({unit->sprite->position,group.heroes});}}
struct CrossoverSpell {int stack,id,charges,radius,ready=0; bwgame::a_vector<int32_t> rows;};
bwgame::a_vector<CrossoverSpell> crossover_spells;
int crossover_battle=-1;
bwgame::a_string crossover_result;
std::array<bwgame::unit_type_t,32> crossover_types;
std::array<bwgame::weapon_type_t,32> crossover_weapons;
bwgame::xy crossover_camera;
bwgame::a_vector<uint8_t> crossover_pixels;

bool crossover_live(bwgame::unit_id id,int owner) { auto u=g_ui->get_unit(id);return u && u->owner==owner && !g_ui->unit_dying(u) && u->hp.integer_part()>0; }
void crossover_attack_owner(int owner) {
  if(!g_ui || crossover_battle<0)return;
  bwgame::unit_t* target=nullptr;
  for(auto* u:bwgame::ptr(g_ui->st.player_units[1-owner]))if(!g_ui->unit_dying(u) && u->hp.integer_part()>0){target=u;break;}
  if(!target)return;
  // Original StarCraft selection/order decoder, not direct combat or HP writes.
  for(auto* u:bwgame::ptr(g_ui->st.player_units[owner]))if(!g_ui->unit_dying(u) && u->hp.integer_part()>0){
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
OPENBW_EXPORT(openbw_crossover_setup) int openbw_crossover_setup(int battle,int count) {
  if(!g_ui || count<2 || count>32 || (g_inbuf.size()!=size_t(count*16) && g_inbuf.size()!=size_t(count*48)))return 0;
  const auto* rows=reinterpret_cast<const int32_t*>(g_inbuf.data());
  const int stride=g_inbuf.size()/count/4;
  int totals[2]={0,0};
  for(int i=0;i<count;i++){
    const auto* row=rows+i*stride;
    if(row[0]<0 || row[1]<0 || row[1]>1 || (row[2]!=0 && row[2]!=32 && row[2]!=37) || row[3]<1 || row[3]>128)return 0;
    if(stride==12 && (row[4]<0 || row[4]>1 || row[5]<1 || row[5]>10000 || row[6]<0 || row[7]<row[6] || row[7]>10000 || row[8]<0 || row[8]>1000 || row[9]<1 || row[9]>100 || row[10]<0 || row[10]>1))return 0;
    totals[row[1]]+=row[3];
  }
  if(totals[0]<1 || totals[1]<1 || totals[0]>128 || totals[1]>128)return 0;
  bwgame::a_vector<bwgame::unit_t*> remove;
  for(int owner=0;owner<8;owner++)for(auto* u:bwgame::ptr(g_ui->st.player_units[owner]))remove.push_back(u);
  for(auto* u:remove)g_ui->kill_unit(u);
  // Scenario setup: a field battle has no base-elimination melee triggers.
  for(auto& triggers:g_ui->st.running_triggers)triggers.clear();
  g_ui->st.alliances[0][1]=0;g_ui->st.alliances[1][0]=0;
  crossover_groups.clear();crossover_spells.clear();crossover_battle=battle;g_ui->competitive=false;g_ui->rep_on=false;
  const auto origin=g_ui->game_st.start_locations[0];
  const int direction=origin.x<int(g_ui->game_st.map_width)/2?1:-1;
  crossover_camera=origin+bwgame::xy(direction>0?-120:-620,-150);
  int placed[2]={0,0};
  for(int i=0;i<count;i++){
    const auto* row=rows+i*stride;CrossoverGroup group{row[0],row[1],stride==12 && row[4]!=0,{}};
    const bwgame::unit_type_t* definition=g_ui->get_unit_type(bwgame::UnitTypes(row[2]));
    if(group.heroes || group.owner==0){
      auto& type=crossover_types[i];type=*definition;
      if(group.heroes){
        // Private definitions preserve Heroes stats without editing SC types.
        auto& weapon=crossover_weapons[i];weapon=*definition->ground_weapon;
        type.hitpoints=bwgame::fp8::integer(row[5]);type.has_shield=false;type.flags=bwgame::unit_type_t::flags_t(uint32_t(type.flags)&~uint32_t(bwgame::unit_type_t::flag_regens_hp));type.armor=row[8]/4;
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
      const bwgame::xy at=origin+bwgame::xy(direction*(row[1]*420+(index%8)*24),(index/8)*24);
      auto* unit=g_ui->trigger_create_unit(definition,at,row[1]);
      if(!unit){crossover_battle=-1;return 0;}
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
OPENBW_EXPORT(openbw_crossover_ai_tick) void openbw_crossover_ai_tick() {
  remember_crossover_sounds();
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
    out+=bwgame::format("{\"id\":%d,\"side\":%d,\"initial\":%d,\"survivors\":%d,\"casts\":%d,\"spellReady\":%d}",group.stack,group.owner,int(group.ids.size()),alive,casts,ready);
  }
  out+=bwgame::format("],\"finished\":%s}",totals[0]==0||totals[1]==0?"true":"false");
  return out.c_str();
}
OPENBW_EXPORT(openbw_crossover_census) const char* openbw_crossover_census() {
  if (!g_ui) return "null";
  auto& out = crossover_census;
  out = bwgame::format("{\"frame\":%d,\"view\":{\"x\":%d,\"y\":%d,\"width\":%d,\"height\":%d},\"units\":[",
    (int)g_ui->st.current_frame,g_ui->screen_pos.x,g_ui->screen_pos.y,(int)g_ui->view_width,(int)g_ui->view_height);
  bool comma = false;
  for (int owner=0;owner<8;owner++) for (auto* unit : bwgame::ptr(g_ui->st.player_units[owner])) {
    if(g_ui->unit_dying(unit))continue;
    if (comma) out += ',';
    comma = true;
    int stack=-1;bool heroes=false;
    for(const auto& group:crossover_groups)for(auto id:group.ids)if(id==g_ui->get_unit_id(unit)){stack=group.stack;heroes=group.heroes;}
    out += bwgame::format("{\"stackId\":%d,\"heroes\":%s,\"maxHp\":%d,\"order\":%d,\"cooldown\":%d,\"id\":%u,\"type\":%d,\"owner\":%d,\"completed\":%s,\"hp\":%d,\"x\":%d,\"y\":%d}",
      stack,heroes?"true":"false",unit->unit_type->hitpoints.integer_part(),int(unit->order_type->id),int(unit->ground_weapon_cooldown),(unsigned)g_ui->get_unit_id(unit).raw_value,(int)unit->unit_type->id,owner,
      g_ui->u_completed(unit)?"true":"false",unit->hp.integer_part(),unit->sprite->position.x,unit->sprite->position.y);
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
 for(const auto& group:crossover_groups)if(group.owner==0 && (stack<0 || group.stack==stack))for(auto id:group.ids){
  auto* u=g_ui->get_unit(id);if(!u || g_ui->unit_dying(u))continue;
  bwgame::a_vector<uint8_t> bytes;bwgame::bw_cmd cmd(bytes);uint16_t selected=id.raw_value;cmd.select(&selected,1);
  cmd.order(attack?bwgame::Orders::AttackMove:bwgame::Orders::Move,target,0,false);g_ui->apply_commands(0,bytes.data(),bytes.size());
 }
}

// Isolated native sprites let the shared view enlarge each creature without
// enlarging formations or duplicating neighbouring units from a cropped layer.
OPENBW_EXPORT(openbw_crossover_sprite) const uint8_t* openbw_crossover_sprite(int requested) {
 if(!g_ui || crossover_battle<0 || requested<1 || requested>65535)return nullptr;
 bwgame::unit_t* unit=nullptr;
 for(const auto& group:crossover_groups)if(!group.heroes)for(auto id:group.ids)if(id.raw_value==requested && crossover_live(id,group.owner))unit=g_ui->get_unit(id);
 if(!unit)return nullptr;
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
 for(const auto& group:crossover_groups)if(group.owner==0 && (stack<0 || group.stack==stack))for(auto id:group.ids){
  auto* u=g_ui->get_unit(id);if(!u || g_ui->unit_dying(u))continue;
  bwgame::a_vector<uint8_t> bytes;bwgame::bw_cmd cmd(bytes);uint16_t selected=id.raw_value;cmd.select(&selected,1);
  cmd.order(bwgame::Orders::Stop,u->sprite->position,0,false);g_ui->apply_commands(0,bytes.data(),bytes.size());
 }
}
OPENBW_EXPORT(openbw_crossover_target) void openbw_crossover_target(int stack,int requested) {
 if(!g_ui || crossover_battle<0 || requested<1 || requested>65535)return;
 auto* target=g_ui->get_unit(bwgame::unit_id(uint16_t(requested)));
 if(!target || target->owner!=1 || g_ui->unit_dying(target))return;
 for(const auto& group:crossover_groups)if(group.owner==0 && (stack<0 || group.stack==stack))for(auto id:group.ids){
  auto* u=g_ui->get_unit(id);if(!u || g_ui->unit_dying(u))continue;
  bwgame::a_vector<uint8_t> bytes;bwgame::bw_cmd cmd(bytes);uint16_t selected=id.raw_value;cmd.select(&selected,1);
  cmd.order(bwgame::Orders::AttackDefault,target->sprite->position,uint16_t(requested),false);g_ui->apply_commands(0,bytes.data(),bytes.size());
 }
}
