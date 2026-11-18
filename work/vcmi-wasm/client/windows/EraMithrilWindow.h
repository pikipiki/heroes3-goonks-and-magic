#pragma once
#include "InfoWindows.h"
#include "GUIClasses.h"
#include "../CPlayerInterface.h"
#include "../GameEngine.h"
#include "../GameInstance.h"
#include "../gui/WindowHandler.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/callback/CCallback.h"
#include "../../lib/texts/CGeneralTextHandler.h"

namespace era_compat::mithril
{
inline std::string windowText(const std::string & key)
{return LIBRARY->generaltexth->translate("tum-era.mithril."+key);}

inline bool openClassicInformation()
{
    auto * player=GAME->interface();
    if(!player||!displayEnabled(*player->cb))return false;
    const auto currency=resource();
    const int amount=currency==GameResID::NONE?0:player->cb->getResourceAmount(currency);
    auto text=windowText("display.total");
    boost::replace_first(text,"%d",std::to_string(amount));
    boost::replace_first(text,"%s",windowText(era_bridge::mithril::displayPlural(amount)?"display.plural":"display.singular"));
    if(!enabled(*player->cb)){player->showInfoDialog(text);return true;}
    const auto owner=player->playerID;
    player->showYesNoDialog(text+"\n\n"+windowText("display.question"),[owner]{
        const auto * current=GAME->interface();
        if(!current||current->playerID!=owner)return;
        std::string prices="{"+windowText("display.title")+"}\n\n"+windowText("display.help");
        for(int row=0;row<11;++row)prices+="\n\n"+windowText("display.price."+std::to_string(row));
        GAME->interface()->showInfoDialog(prices);
    },{});
    return true;
}

inline void confirmClassicUpgrade(ObjectInstanceID id,int choice)
{
    auto * player=GAME->interface();
    if(!player||!player->makingTurn)return;
    const auto * object=player->cb->getObj(id);
    if(!object)return;
    const auto proposed=offer(*player->cb,*object,player->playerID,choice);
    if(!proposed.available())return;
    const auto currency=resource();
    const auto balance=player->cb->getPlayerState(player->playerID)->resources[currency];
    const auto text=windowText(proposed.kind==MINE&&map_rules::weeklyMines(*player->cb)?"mine.protect":"upgrade."+std::to_string(proposed.kind))+
        "\n\n"+std::to_string(proposed.cost)+" Mithril / "+std::to_string(balance);
    if(balance<proposed.cost)
    {
        player->showInfoDialog(text+"\n\n"+windowText("insufficient"));
        return;
    }
    const auto expected=revision(*player->cb);
    const auto owner=player->playerID;
    player->showYesNoDialog(text,[id,choice,expected,owner]{
        auto * current=GAME->interface();
        if(current&&current->makingTurn&&current->playerID==owner)
            current->cb->mithrilAction(id,choice,expected);
    },{});
}

inline bool openClassicUpgrade(const CGObjectInstance & object,const int3 & tile,bool entranceOnly=true)
{
    auto * player=GAME->interface();
    if(!player||!player->makingTurn||(entranceOnly&&tile!=object.visitablePos())
        ||!enabled(*player->cb))return false;
    const auto proposed=offer(*player->cb,object,player->playerID);
    if(!proposed.available())return false;
    if(proposed.kind==TOWN)
    {
        std::vector<std::string> terrains;
        for(int choice=0;choice<9;++choice)
            terrains.push_back(windowText("terrain."+std::to_string(choice))+" ("+
                std::to_string(choice<7?1:3)+" Mithril)");
        ENGINE->windows().createAndPushWindow<CObjectListWindow>(terrains,nullptr,
            object.getObjectName(),windowText("terrain.choose"),
            [id=object.id](int choice){confirmClassicUpgrade(id,choice);});
    }
    else confirmClassicUpgrade(object.id,0);
    return true;
}
}
