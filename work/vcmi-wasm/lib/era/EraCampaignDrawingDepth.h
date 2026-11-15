/* WoG 3.58f 0x5056b0: per-tile drawing depth, not an object instance ID. */
#pragma once
#include <array>
#include <stdexcept>
namespace era_campaign_drawing
{
template<class Blocked> int depth(int x,int y,int printPriority,Blocked blocked)
{
 if(x<0||x>=8||y<0||y>=6)throw std::runtime_error("Original drawing footprint outside8x6");
 if(printPriority!=0)return 0;
 std::array<std::array<int,6>,8> ranks{};
 for(int column=0;column<=x;++column)
 {
  int next=1;
  for(int row=0;row<=y;++row)
  {
   if(row>0&&blocked(column,row)&&!blocked(column,row-1))next=1;
   if(column>0&&!blocked(column,row)&&blocked(column-1,row))next=ranks[column-1][row];
   ranks[column][row]=next++;
  }
 }
 return ranks[x][y];
}
}
