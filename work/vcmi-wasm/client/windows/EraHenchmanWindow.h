#pragma once
#include "../../lib/era/EraCreaturePrices.h"
#include "InfoWindows.h"
#include "GUIClasses.h"
#include "../CPlayerInterface.h"
#include "../GameEngine.h"
#include "../GameInstance.h"
#include "../gui/WindowHandler.h"
#include "../../lib/era/EraHenchmanModel.h"
#include "../../lib/networkPacks/HenchmanPacks.h"
#include "../../lib/callback/CCallback.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/texts/CGeneralTextHandler.h"

namespace era_compat::henchmen
{
class ClassicHenchmanFlag final : public CIntObject
{
    std::function<void()> action;
    std::function<void()> contextAction;
public:
    ClassicHenchmanFlag(const Rect & area,std::function<void()> callback,std::function<void()> context)
        :CIntObject(LCLICK|SHOW_POPUP),action(std::move(callback)),contextAction(std::move(context)){pos=area;}
    void clickPressed(const Point &) override{if(action)action();}
    void showPopupWindow(const Point &) override{if(contextAction)contextAction();}
};

inline std::string classicText(const char * french,const char * english)
{return CGeneralTextHandler::getPreferredLanguage().rfind("fr",0)==0?french:english;}

inline std::vector<std::string> classicBannerNames()
{
    return {classicText("Vitalité","Health"),classicText("Attaque","Attack"),
        classicText("Défense","Defence"),classicText("Dégâts","Damage"),
        classicText("Vitesse","Speed"),classicText("Expérience","Experience"),
        classicText("Réduction de défense","Defence reduction"),
        classicText("Blocage partiel","Partial block"),classicText("Ripostes","Retaliations")};
}

inline bool classicAction(ObjectInstanceID id,uint32_t expected,int operation,int slot=-1)
{
    auto * player=GAME->interface();
    if(!player||!player->makingTurn)return false;
    const auto * hero=player->cb->getHero(id);
    if(!hero||hero->getOwner()!=player->playerID||hero->battle
        ||hero->henchman.revision!=expected||!enabled(*player->cb))return false;
    player->cb->henchmanAction(hero,operation,slot);return true;
}

inline void classicChoose(const CGHeroInstance & hero)
{
    std::vector<std::string> names;std::vector<int> slots;
    for(const auto & [slot,stack]:hero.Slots())
        if(slot.validSlot()&&canSelect(hero,slot.getNum()))
        {
            names.push_back(stack->getType()->getNamePluralTranslated()+" × "+std::to_string(stack->getCount()));
            slots.push_back(slot.getNum());
        }
    if(names.empty())
    {
        GAME->interface()->showInfoDialog(classicText("Aucune créature ne peut devenir compagnon.",
            "No creature is available to become a henchman."));return;
    }
    ENGINE->windows().createAndPushWindow<CObjectListWindow>(names,nullptr,
        classicText("Choisir un compagnon","Choose a henchman"),
        classicText("Une créature quitte son groupe pour devenir ton compagnon.",
            "One creature leaves its stack to become your henchman."),
        [id=hero.id,revision=hero.henchman.revision,slots](int choice)
        {if(choice>=0&&choice<int(slots.size()))classicAction(id,revision,HenchmanAction::SELECT,slots[choice]);});
}

inline void classicBannerStyles(const CGHeroInstance & hero,std::optional<uint32_t> expected=std::nullopt)
{
    ENGINE->windows().createAndPushWindow<CObjectListWindow>(classicBannerNames(),nullptr,
        classicText("Bannière de guerre","Warlord's Banner"),
        classicText("Choisis le bonus de la bannière de ton compagnon.",
            "Choose your henchman's banner bonus."),
        [id=hero.id,revision=expected.value_or(hero.henchman.revision)](int choice)
        {if(choice>=0&&choice<=8)classicAction(id,revision,HenchmanAction::SET_BANNER_STYLE,choice);});
}

inline void openClassicHenchman(const CGHeroInstance & hero)
{
    auto * player=GAME->interface();
    if(!player||!enabled(*player->cb))return;
    const auto rules=settings(*player->cb);
    std::string text=classicText("Aucun compagnon choisi.","No henchman selected.");
    std::string subtitle=text;
    if(hero.henchman.stack)
    {
        const auto growth=progress(hero,player->cb->getDate(Date::DAY));
        subtitle=classicText("Niveau ","Level ")+std::to_string(growth.level)+" · "+
            (hero.henchman.alive?classicText("En vie","Alive"):classicText("Mort","Dead"));
        text=hero.henchman.stack->getType()->getNameSingularTranslated()+" · "+
            classicText("Niveau ","Level ")+std::to_string(growth.level)+"\n"+
            (hero.henchman.alive?classicText("En vie","Alive"):classicText("Mort","Dead"))+" · "+
            std::to_string(growth.experience)+" XP\n"+std::to_string(growth.nextLevel)+
            classicText(" XP avant le niveau suivant"," XP until next level");
        if(rules.stackExperience)
            text+="\n"+classicText("Expérience de troupe : ","Stack experience: ")+
                std::to_string(hero.henchman.stack->getAverageExperience())+" · "+
                classicText("Rang ","Rank ")+std::to_string(hero.henchman.stack->getExpRank());
        if(rules.banner&&bannerStyle(hero)>=0&&bannerStyle(hero)<=8)
            text+="\n"+classicText("Bannière : ","Banner: ")+classicBannerNames()[bannerStyle(hero)];
    }
    if(!player->makingTurn||hero.getOwner()!=player->playerID||hero.battle)
    {player->showInfoDialog(text);return;}

    enum {CHOOSE,REVIVE,STYLE,EQUIP,RETURN,DISMISS,INFO};
    std::vector<std::string> names;std::vector<int> actions;
    const auto offer=[&](int action,std::string title){actions.push_back(action);names.push_back(std::move(title));};
    offer(CHOOSE,classicText("Choisir ou remplacer le compagnon","Choose or replace henchman"));
    if(hero.henchman.stack)
    {
        const auto * town=hero.getVisitedTown();
        const auto cost=era_bridge::henchmen::resurrectionCost(
            era_compat::creature_prices::gold(hero.cb,*hero.henchman.stack->getType()),
            progress(hero,player->cb->getDate(Date::DAY)).level);
        if(!hero.henchman.alive&&(rules.reviveAnywhere||(town&&town->getOwner()==hero.getOwner()))
            &&cost>=0&&player->cb->getResource(hero.getOwner(),GameResID::GOLD)>=cost)
            offer(REVIVE,classicText("Ressusciter · ","Resurrect · ")+std::to_string(cost)+classicText(" or"," gold"));
        if(rules.banner)
        {
            if(bannerStyle(hero)>=0)
            {
                offer(STYLE,classicText("Configurer la bannière","Configure banner"));
                if(ArtifactUtils::getArtBackpackPosition(&hero,bannerArtifact())!=ArtifactPosition::PRE_FIRST)
                    offer(RETURN,classicText("Remettre la bannière dans le sac","Return banner to backpack"));
            }
            else if((hero.henchman.alive||!rules.reviveAnywhere)&&availableBanner(hero)!=ArtifactPosition::PRE_FIRST)
                offer(EQUIP,classicText("Équiper une bannière du sac","Equip a banner from backpack"));
        }
        offer(DISMISS,classicText("Renvoyer le compagnon","Dismiss henchman"));
    }
    offer(INFO,classicText("Informations","Information"));
    ENGINE->windows().createAndPushWindow<CObjectListWindow>(names,nullptr,
        classicText("Compagnon","Henchman"),subtitle,
        [id=hero.id,revision=hero.henchman.revision,actions,details=text](int choice)
        {
            auto * player=GAME->interface();
            const auto * current=player?player->cb->getHero(id):nullptr;
            if(!current||current->henchman.revision!=revision||choice<0||choice>=int(actions.size()))return;
            switch(actions[choice])
            {
                case CHOOSE:classicChoose(*current);break;
                case INFO:player->showInfoDialog(details);break;
                case REVIVE:classicAction(id,revision,HenchmanAction::RESURRECT);break;
                case STYLE:classicBannerStyles(*current);break;
                case EQUIP:classicAction(id,revision,HenchmanAction::EQUIP_BANNER);break;
                case RETURN:classicAction(id,revision,HenchmanAction::RETURN_BANNER);break;
                case DISMISS:
                    player->showYesNoDialog(classicText(
                        "Renvoyer le compagnon ? Sa bannière équipée sera perdue.",
                        "Dismiss the henchman? Its equipped banner will be lost."),
                        [id,revision]{classicAction(id,revision,HenchmanAction::DISMISS);},{});
                    break;
            }
        });
}
}
