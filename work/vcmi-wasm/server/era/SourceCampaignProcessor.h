/* Original campaign event host; GPL-2.0-or-later. */
#pragma once
#include "../../lib/constants/EntityIdentifiers.h"
#include <memory>
#include <string>
class CGameHandler;
VCMI_LIB_NAMESPACE_BEGIN
class CGObjectInstance;
class CGHeroInstance;
class CMapEvent;
class MetaString;
VCMI_LIB_NAMESPACE_END
class SourceCampaignProcessor
{
 struct Impl;
 std::unique_ptr<Impl> impl;
public:
 explicit SourceCampaignProcessor(CGameHandler & handler);
 ~SourceCampaignProcessor();
 void onReady(PlayerColor player);
 bool reply(QueryID query,int selection,const std::string & text,PlayerColor player);
 bool draft(QueryID query,int selection,const std::string & text,PlayerColor player);
 bool visit(const CGObjectInstance * object,const CGHeroInstance * hero);
 bool timedEvent(const CMapEvent & event,PlayerColor player);
 MetaString eventMessage(const CMapEvent & event) const;
};
