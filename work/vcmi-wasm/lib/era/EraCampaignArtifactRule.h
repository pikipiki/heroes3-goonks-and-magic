/* Defined original artifact encodings used by campaign slot operations. */
#pragma once
#include <optional>
namespace era_campaign_artifact
{
struct Spec{int artifact;int spell=-1;};
inline std::optional<Spec> decode(int encoded)
{
 if(encoded==1000)return Spec{0,-1};
 if(encoded>=1001&&encoded<=1081)return Spec{1,encoded-1001};
 if(encoded>=0&&encoded<=143)return Spec{encoded,-1};
 return std::nullopt;
}
inline int encode(int artifact,int spell=-1)
{return artifact==0?1000:artifact==1&&spell>=0?1001+spell:artifact;}
}
