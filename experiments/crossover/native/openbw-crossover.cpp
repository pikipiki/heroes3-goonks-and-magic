// Native crossover scenario and rendering DTOs; upstream source remains unchanged.
#include "../vendor/openbw/web/wasm_main.cpp"

namespace { bwgame::a_string crossover_census; }
namespace {
struct CrossoverGroup { int stack; int owner; bool heroes; bwgame::a_vector<bwgame::unit_id> ids; };
bwgame::a_vector<CrossoverGroup> crossover_groups;
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
  crossover_groups.clear();crossover_battle=battle;g_ui->competitive=false;g_ui->rep_on=false;
  const auto origin=g_ui->game_st.start_locations[0];
  const int direction=origin.x<int(g_ui->game_st.map_width)/2?1:-1;
  crossover_camera=origin+bwgame::xy(direction>0?-120:-620,-150);
  int placed[2]={0,0};
  for(int i=0;i<count;i++){
    const auto* row=rows+i*stride;CrossoverGroup group{row[0],row[1],stride==12 && row[4]!=0,{}};
    const bwgame::unit_type_t* definition=g_ui->get_unit_type(bwgame::UnitTypes(row[2]));
    if(group.heroes){
      // Heroes keep their own HP/damage. OpenBW executes combat using a private
      // per-cohort definition; original StarCraft definitions are never changed.
      auto& type=crossover_types[i];type=*definition;
      auto& weapon=crossover_weapons[i];weapon=*definition->ground_weapon;
      type.hitpoints=bwgame::fp8::integer(row[5]);type.has_shield=false;type.flags=bwgame::unit_type_t::flags_t(uint32_t(type.flags)&~uint32_t(bwgame::unit_type_t::flag_regens_hp));type.armor=row[8]/4;
      weapon.damage_amount=(row[6]+row[7]+1)/2;weapon.damage_bonus=0;
      weapon.damage_type=bwgame::weapon_type_t::damage_type_normal;
      weapon.cooldown=std::max(12,std::min(48,160/row[9]));
      type.ground_weapon=&weapon;type.air_weapon=row[10]?&weapon:nullptr;
      definition=&type;
    }
    for(int j=0;j<row[3];j++){
      const int index=placed[row[1]]++;
      const bwgame::xy at=origin+bwgame::xy(direction*(row[1]*420+(index%8)*24),(index/8)*24);
      auto* unit=g_ui->trigger_create_unit(definition,at,row[1]);
      if(!unit){crossover_battle=-1;return 0;}
      group.ids.push_back(g_ui->get_unit_id(unit));
    }
    crossover_groups.push_back(std::move(group));
  }
  g_ui->screen_pos=origin-bwgame::xy(g_ui->view_width/3,g_ui->view_height/3);
  crossover_attack_owner(1);
  return 1;
}
OPENBW_EXPORT(openbw_crossover_ai_tick) void openbw_crossover_ai_tick() {
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
    out+=bwgame::format("{\"id\":%d,\"side\":%d,\"initial\":%d,\"survivors\":%d}",group.stack,group.owner,int(group.ids.size()),alive);
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
