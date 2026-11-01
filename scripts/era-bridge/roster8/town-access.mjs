/** Source town costs and explicit fourth-upgrade access; no gameplay invention. */
export function readTownBuildingCost(text,id){const m=new RegExp('^BuildingCost'+String(id).padStart(4,'0')+'="([^"\\r\\n]+)"','m').exec(text);if(!m)throw new Error('Missing original building cost '+id);const n=m[1].trim().split(/\s+/).map(Number);if(n.length!==7||n.some(v=>!Number.isSafeInteger(v)||v<0))throw new Error('Invalid source building cost');return Object.fromEntries(['wood','mercury','ore','sulfur','crystal','gems','gold'].map((k,i)=>[k,n[i]]));}
export function castleFourthAccess(town,cfg){
 const creatures=structuredClone(town.creatures),hallSlots=structuredClone(town.hallSlots);
 if(creatures[6].at(-1)!=='supremeArchangel')throw new Error('Unexpected native Castle third-upgrade identity');
 creatures[6].push('tum-era:cherub');if(!hallSlots[4][2].includes('dwellingUp3Lvl7'))hallSlots[4][2].push('dwellingUp3Lvl7');
 if(!town.structures?.dwellingUp2Lvl7)throw new Error('Missing native third-dwelling graphic');
 return {'core:castle':{town:{creatures,hallSlots,buildingsIcons:'tum-era/castle-hall',structures:{dwellingUp3Lvl7:{...town.structures.dwellingUp2Lvl7,builds:'dwellingUp3Lvl7',hidden:false}},buildings:{dwellingUp3Lvl7:{id:57,name:'Upg. Portal of Splendor',description:'Allows recruitment and upgrades of Cherubim.',upgrades:'dwellingUp2Lvl7',requires:['dwellingUp2Lvl7'],cost:readTownBuildingCost(cfg,77)}}}}};
}
