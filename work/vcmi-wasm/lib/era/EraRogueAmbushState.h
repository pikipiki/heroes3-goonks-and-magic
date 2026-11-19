/* Source127 persisted visit phases; GPL-2.0-or-later. */
#pragma once
#include "../json/JsonNode.h"
#include <string>
namespace era_compat::rogues
{
inline const JsonNode & pending(const JsonNode & mapRules,int controller)
{return mapRules["rogues"]["pending"][std::to_string(controller)];}
inline bool checkpoint(const JsonNode & mapRules,int controller)
{
    if(controller<0||controller>=8||!mapRules["rules"]["127"].Bool())return false;
    const auto & job=pending(mapRules,controller);
    return job.isStruct()&&job["controller"].Integer()==controller
        &&(job["phase"].String()=="warning"||job["phase"].String()=="reward");
}
}
