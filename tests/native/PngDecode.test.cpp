#include <atomic>
#include <cassert>
#include <cstdlib>
#include <thread>
#include <vector>
#define STB_IMAGE_IMPLEMENTATION
#include "../../work/vcmi-wasm/lib/html5/stb_image.h"
thread_local stbi_uc *vcmi_png_palette_indexes;
thread_local stbi_uc *vcmi_png_palette;
thread_local int vcmi_png_palette_len;
thread_local int vcmi_png_palette_n;
// Two indexed PNGs use different palette colors and pixel indices. Every
// decoder must retain its own buffers while another worker is decoding.
static const unsigned char png0[] = {137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,8,0,0,0,8,8,3,0,0,0,243,209,78,185,0,0,0,6,80,76,84,69,231,50,10,17,100,200,147,176,180,17,0,0,0,12,73,68,65,84,120,156,99,96,160,14,0,0,0,72,0,1,46,184,60,126,0,0,0,0,73,69,78,68,174,66,96,130};
static const unsigned char png1[] = {137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,8,0,0,0,8,8,3,0,0,0,243,209,78,185,0,0,0,6,80,76,84,69,231,50,10,17,100,200,147,176,180,17,0,0,0,14,73,68,65,84,120,156,99,96,132,2,6,202,24,0,9,72,0,65,85,20,150,249,0,0,0,0,73,69,78,68,174,66,96,130};
int main() {
 std::atomic<int> arrived{0},phase{0};
 std::vector<std::thread> workers;
 for(int t=0;t<8;t++) workers.emplace_back([&,t] {
  for(int i=0;i<200;i++) {
   const auto *png=t%2?png1:png0;const auto length=t%2?sizeof(png1):sizeof(png0);
   int w=0,h=0,n=0;auto *data=stbi_load_from_memory(png,length,&w,&h,&n,0);
   assert(data&&w==8&&h==8&&vcmi_png_palette_len==2);
   arrived.fetch_add(1);while(arrived.load()<(i+1)*8) std::this_thread::yield();
   assert(vcmi_png_palette_indexes[0]==t%2);
   assert(vcmi_png_palette[(t%2)*4]==(t%2?17:231));
   stbi_image_free(data);free(vcmi_png_palette_indexes);free(vcmi_png_palette);
   vcmi_png_palette_indexes=nullptr;vcmi_png_palette=nullptr;
   phase.fetch_add(1);while(phase.load()<(i+1)*8) std::this_thread::yield();
  }
 });
 for(auto &worker:workers)worker.join();
}
