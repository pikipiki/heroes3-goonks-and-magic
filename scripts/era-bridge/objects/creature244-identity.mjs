/** Identity only. Existing Catoblepas abilities/stats are not a faithful244port. */
export function source244NativeIdentity({erm,constants,roster,definition,upgrades}={}){
 if(!/!#DC\(MON_CATOBLEPAS\)\s*=\s*244\s*;/.test(constants??'')
   ||[...(erm??'').matchAll(/!!UN:T7\/4\/2\/\(MON_CATOBLEPAS\);/g)].length!==1
   ||!/!!MA:U103\/244;/.test(erm??''))throw Error('Source244 named constant/town/upgrade identity missing');
 if(JSON.stringify(roster)!=='["gorgon","mightyGorgon","tumCatopleba"]'
   ||!upgrades?.includes('tumCatopleba')
   ||definition?.graphics?.animation!=='creatures/fortress/battle/CR244'
   ||definition?.graphics?.map!=='creatures/fortress/map/AVWCR244'
   ||definition?.graphics?.iconSmall!=='creatures/fortress/iconsSmall/CPrS244X'
   ||definition?.graphics?.iconLarge!=='creatures/fortress/iconsBig/CPrL244X')throw Error('Native244 roster/resources identity missing');
 return {eraId:244,native:'third-upgrades:tumCatopleba',identityVerified:true,wholeActorPortComplete:false,evidence:'MON_CATOBLEPAS=244; UN:T7/4/2 namedslot and MA:U103/244; nativeFortress fifthrow/mightyGorgonupgrade/four244resourcekeys agree. Existing native balance,XP andabilities remain separately unaudited.'};
}
