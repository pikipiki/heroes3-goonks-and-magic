import{townBuildingCrops}from'./town-building-crops.mjs';
// Pack complete sprites and their captions into separate touch cells. A short
// gutter belongs to neither building, so neighboring taps stay unambiguous.
export function townBuildingLabel(building,faction,language='en'){
 if(building.label||building.name)return building.label||building.name;
 const key=String(building.key||'').split(':').at(-1),fr=language==='fr';
 const names={fort:['Fort','Fort'],citadel:['Citadel','Citadelle'],castle:['Castle','Château'],villageHall:['Hall','Mairie'],townHall:['Hall','Mairie'],cityHall:['Hall','Mairie'],capitol:['Capitol','Capitole'],marketplace:['Market','Marché'],blacksmith:['Forge','Forge'],tavern:['Tavern','Taverne'],resourceSilo:['Silo','Silo'],shipyard:['Shipyard','Chantier'],ship:['Shipyard','Chantier'],grail:['Grail','Graal']};
 if(/^mageGuild\d+$/.test(key))return fr?'Guilde':'Mage guild';
 const dwelling=key.match(/^dwelling(?:Up\d?)?Lvl(\d+)$/);if(dwelling)return (fr?'Troupes ':'Troops ')+dwelling[1];
 if(faction==='goonk'){if(key==='special1')return fr?'Phare':'Lighthouse';if(key==='special2')return fr?'Écuries':'Stables';if(key==='special3')return fr?'Taverne':'Tavern';}
 return names[key]?.[fr?1:0]||building.name||key;
}
const intersects=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const contains=(a,b)=>a.x<=b.x&&a.y<=b.y&&a.x+a.w>=b.x+b.w&&a.y+a.h>=b.y+b.h;
export function wrapTownBuildingLabel(text,width,measure=text=>text.length*4.7){
 const lines=[];let line='';for(const word of String(text).split(/\s+/)){const next=line?line+' '+word:word;if(measure(next)<=width){line=next;continue;}if(line){lines.push(line);line='';}if(measure(word)<=width){line=word;continue;}for(const character of word){if(line&&measure(line+character)>width){lines.push(line);line='';}line+=character;}}if(line)lines.push(line);return lines.length?lines:[''];
}
function pack(width,height,records,factor,strategy=0,measure){
 const measureText=measure||(text=>text.length*4.7);
 const gap=3,placed=[],free=[{x:2,y:2,w:width-4,h:height-4}];
 const sizes=records.map((b,index)=>{const sw=b.w*factor,sh=b.h*factor,w=Math.ceil(Math.max(60,sw,...b.label.split(/\s+/).map(word=>measureText(word)+6))),labelLines=wrapTownBuildingLabel(b.label,w-6,measureText),labelHeight=labelLines.length*12+2;return {b,index,sw,sh,labelLines,labelHeight,w:w+gap,h:Math.ceil(Math.max(44,sh+labelHeight))+gap};}).sort((a,b)=>(strategy===1?b.w*b.h-a.w*a.h:strategy===2?b.h-a.h:Math.max(b.w,b.h)-Math.max(a.w,a.h))||a.index-b.index);
 for(const item of sizes){
  let best=null;
  for(const rect of free){if(item.w>rect.w||item.h>rect.h)continue;const short=Math.min(rect.w-item.w,rect.h-item.h),long=Math.max(rect.w-item.w,rect.h-item.h);const score=strategy===3?rect.w*rect.h-item.w*item.h:short*1000+long;if(!best||score<best.score)best={x:rect.x,y:rect.y,w:item.w,h:item.h,score};}
  if(!best)return null;
  const next=[];
  for(const rect of free){if(!intersects(rect,best)){next.push(rect);continue;}if(best.x>rect.x)next.push({...rect,w:best.x-rect.x});if(best.x+best.w<rect.x+rect.w)next.push({...rect,x:best.x+best.w,w:rect.x+rect.w-best.x-best.w});if(best.y>rect.y)next.push({...rect,h:best.y-rect.y});if(best.y+best.h<rect.y+rect.h)next.push({...rect,y:best.y+best.h,h:rect.y+rect.h-best.y-best.h});}
  free.splice(0,free.length,...next.filter((rect,i)=>!next.some((other,j)=>i!==j&&contains(other,rect)&&(other.w*other.h>rect.w*rect.h||j<i))));
  const hit={x:best.x,y:best.y,w:item.w-gap,h:item.h-gap};placed.push({...item.b,x:hit.x+(hit.w-item.sw)/2,y:hit.y+(hit.h-item.labelHeight-item.sh)/2,w:item.sw,h:item.sh,hit,labelHeight:item.labelHeight,labelLines:item.labelLines,_order:item.index});
 }
 return placed.sort((a,b)=>a._order-b._order);
}
export function denseTownBuildings(width,height,buildings,faction,language='en',measure){
 const records=buildings.map(b=>{const crop=townBuildingCrops[faction]?.[b.artKey],scale=crop?Math.min(1/crop[2],1/crop[3]):1;return {...b,crop,w:crop?b.w*crop[2]*scale:b.w,h:crop?b.h*crop[3]*scale:b.h,label:townBuildingLabel(b,faction,language)};});
 for(const factor of [1.65,1.6,1.55,1.5,1.45,1.4,1.35,1.3,1.25,1.2,1.15,1.1,1.05,1,.95,.9,.85,.8,.75,.7,.65,.6,.55,.5]){for(let strategy=0;strategy<4;strategy++){const result=pack(width,height,records,factor,strategy,measure);if(result)return result;}}
 return records;
}
