// Stable read-only DTOs for the crossover; upstream simulation is included unchanged.
#include "../vendor/openbw/web/wasm_main.cpp"

namespace { bwgame::a_string crossover_census; }
OPENBW_EXPORT(openbw_crossover_census) const char* openbw_crossover_census() {
  if (!g_ui) return "null";
  auto& out = crossover_census;
  out = bwgame::format("{\"frame\":%d,\"view\":{\"x\":%d,\"y\":%d,\"width\":%d,\"height\":%d},\"units\":[",
    (int)g_ui->st.current_frame,g_ui->screen_pos.x,g_ui->screen_pos.y,(int)g_ui->view_width,(int)g_ui->view_height);
  bool comma = false;
  for (int owner=0;owner<8;owner++) for (auto* unit : bwgame::ptr(g_ui->st.player_units[owner])) {
    if (comma) out += ',';
    comma = true;
    out += bwgame::format("{\"id\":%u,\"type\":%d,\"owner\":%d,\"completed\":%s,\"hp\":%d,\"x\":%d,\"y\":%d}",
      (unsigned)g_ui->get_unit_id(unit).raw_value,(int)unit->unit_type->id,owner,
      g_ui->u_completed(unit)?"true":"false",unit->hp.integer_part(),unit->sprite->position.x,unit->sprite->position.y);
  }
  out += "]}";
  return out.c_str();
}
