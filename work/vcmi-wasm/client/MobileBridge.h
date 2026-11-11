#pragma once
#include "../lib/int3.h"
void publishMobileState();

bool isMobilePresentationActive();
bool requestMobileTownHall(int townId);
const std::vector<int3> & mobileExchangeMarkers();

void publishMobileBattleAtlas();

#include "../lib/mapObjects/CGObjectInstance.h"
void publishMobileVisitedObject(const CGObjectInstance * object);
