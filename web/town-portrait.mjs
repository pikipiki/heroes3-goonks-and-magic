import{buildingSizes}from'./town-building-sizes.mjs';
import{townBuildingArt}from'./town/building-art.mjs';
// Anchors describe complete buildings, with a common baseline on each terrace.
export const TOWN_SITES=[
 ['fort',['fort','citadel','castle'],.52,.28,.40,.20],
 ['guild',['mageGuild1','mageGuild2','mageGuild3','mageGuild4','mageGuild5'],.17,.28,.21,.21],
 ['grail',['grail'],.86,.09,.11,.055],
 ['hall',['villageHall','townHall','cityHall','capitol'],.18,.44,.27,.15],
 ['market',['marketplace'],.50,.44,.24,.12],
 ['forge',['blacksmith'],.83,.44,.20,.12],
 ['dwelling1',['dwellingLvl1','dwellingUpLvl1'],.17,.62,.25,.14],
 ['dwelling2',['dwellingLvl2','dwellingUpLvl2'],.50,.62,.25,.14],
 ['dwelling3',['dwellingLvl3','dwellingUpLvl3'],.83,.62,.25,.14],
 ['dwelling4',['dwellingLvl4','dwellingUpLvl4'],.17,.92,.25,.15],
 ['dwelling5',['dwellingLvl5','dwellingUpLvl5'],.50,.92,.25,.14],
 ['dwelling6',['dwellingLvl6','dwellingUpLvl6'],.83,.92,.27,.13],
 ['dwelling7',['dwellingLvl7','dwellingUpLvl7'],.84,.315,.21,.18],
 ['tavern',['tavern','special3'],.10,.76,.18,.11],
 ['silo',['resourceSilo'],.30,.76,.12,.09],
 ['stable',['special2'],.50,.76,.16,.10],
 ['shipyard',['shipyard','ship'],.71,.76,.18,.11],
 ['lighthouse',['special1'],.91,.76,.11,.11]
];
const localKey=b=>String(b.key||'').split(':').at(-1);
export function isGoonkTown(state){return state.townFaction==='goonk:goonk'||(state.buildings||[]).some(b=>String(b.key).startsWith('goonk:'));}
export function townPortraitBuildings(width,height,buildings=[]){const result=[];for(const [site,variants,x,y,maxW,maxH]of TOWN_SITES){const building=[...variants].reverse().map(key=>buildings.find(b=>b.built&&localKey(b)===key)).find(Boolean);if(!building)continue;const key=localKey(building),artKey=buildingSizes[key]?key:key==='mageGuild5'?'mageGuild4':key,[sw,sh]=buildingSizes[artKey]||[90,100],scale=Math.min(width*maxW/sw,height*(height<480&&site==='dwelling4'?.13:maxH)/sh),w=sw*scale,h=sh*scale,left=Math.max(0,Math.min(width-w,width*x-w/2)),top=Math.max(0,Math.min(height-h,height*y-h)),hitW=Math.max(44,w),hitH=Math.max(44,h);result.push({...building,key,artKey,site,x:left,y:top,w,h,hit:{x:Math.max(0,Math.min(width-hitW,left+w/2-hitW/2)),y:Math.max(0,Math.min(height-hitH,top+h/2-hitH/2)),w:hitW,h:hitH}});}return result;}
export function portraitTownFaction(state){if(isGoonkTown(state))return 'goonk';const key=String(state.townFaction||'').split(':').at(-1);return townBuildingArt[key]?key:null;}
export const supportsTownPortrait=state=>!!portraitTownFaction(state);
export function factionPortraitBuildings(width,height,buildings,faction){
 if(faction==='goonk')return townPortraitBuildings(width,height,buildings);
 const catalog=townBuildingArt[faction]||{},byId=new Map(buildings.map(b=>[b.id,b])),groups=new Map();
 const base=b=>byId.get(b.baseId)||b;
 const depth=b=>{let n=0;const seen=new Set();while(b&&b.upgradeId>=0&&!seen.has(b.id)){seen.add(b.id);b=byId.get(b.upgradeId);n++;}return n;};
 for(const b of buildings){const key=localKey(base(b));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
 const order=['fort','mageGuild1','grail','villageHall','marketplace','blacksmith',...Array.from({length:7},(_,i)=>'dwellingLvl'+(i+1))];
 const families=[...groups.keys()].filter(key=>groups.get(key).some(b=>catalog[localKey(b)])).sort((a,b)=>{const x=order.indexOf(a),y=order.indexOf(b);return(x<0?100:x)-(y<0?100:y)||a.localeCompare(b);});
 const columns=4,rows=Math.max(1,Math.ceil((families.length-3)/columns)),topHeight=Math.min(height*.25,Math.max(60,height*.21)),rowHeight=(height-topHeight-8)/rows,result=[];
 for(let i=0;i<families.length;i++){
  const records=groups.get(families[i]),building=records.filter(b=>b.built&&(!families[i].startsWith('dwelling')||localKey(b).startsWith('dwelling'))).sort((a,b)=>depth(b)-depth(a)||b.id-a.id)[0];if(!building)continue;
  const key=localKey(building),fallbacks=[key,...records.sort((a,b)=>depth(b)-depth(a)).map(localKey),key.replace('Up2','Up'),key.replace(/Up2|Up/g,'')],artKey=fallbacks.find(k=>catalog[k]);if(!artKey)continue;
  const meta=catalog[artKey],cell=i<3?{x:[width*.25,width*.01,width*.77][i],y:4,w:i===0?width*.5:width*.22,h:topHeight-5}:{x:(i-3)%columns*width/columns+3,y:topHeight+Math.floor((i-3)/columns)*rowHeight,w:width/columns-6,h:rowHeight-3};
  // Keep an entire native sprite within its own terrace and touch cell.
  const scale=Math.min(1.5,cell.w/meta.width,(cell.h-5)/meta.height),w=meta.width*scale,h=meta.height*scale,x=cell.x+(cell.w-w)/2,y=cell.y+cell.h-h,hitW=Math.max(44,cell.w),hitH=Math.max(44,cell.h);
  result.push({...building,key,artKey,site:families[i],x,y,w,h,hit:{x:Math.max(0,Math.min(width-hitW,cell.x+(cell.w-hitW)/2)),y:Math.max(0,Math.min(height-hitH,cell.y+(cell.h-hitH)/2)),w:hitW,h:hitH}});
 }
 return result;
}
export function createTownPortrait({root,scene,asset,command,getState}){
 const overlay=document.createElement('section');overlay.className='town-portrait-buildings';overlay.setAttribute('aria-label','Bâtiments de la ville');overlay.hidden=true;root.querySelector('.mobile-play').append(overlay);
 const images=new Map(),buttons=new Map();let hovered=null,signature='',activeFaction=null;
 const image=url=>{if(!url)return null;if(!images.has(url)){const img=new Image();img.src=url;images.set(url,img);}return images.get(url);};
 const ready=img=>img?.complete&&img.naturalWidth>0;
 const backgrounds=new Map();
 return {
  paint(ctx,width,height,state,enabled){
   const faction=portraitTownFaction(state);
   if(!enabled||state.mode!=='town'||!faction||root.clientWidth>=root.clientHeight){overlay.hidden=true;delete root.dataset.townLayout;return false;}
   if(activeFaction!==faction){activeFaction=faction;images.clear();backgrounds.clear();buttons.clear();overlay.replaceChildren();hovered=null;signature='';}
   if(!backgrounds.has(faction))backgrounds.set(faction,image(new URL(faction==='goonk'?'./town/portrait-v2.webp':'./town/'+faction+'/portrait-v1.webp',import.meta.url).href));const background=backgrounds.get(faction);
   const buildings=factionPortraitBuildings(width,height,state.buildings,faction);const artwork=buildings.map(b=>({b,picture:image(faction==='goonk'?asset('goonk/structure-'+b.artKey+'.png'):new URL('./town/'+faction+'/structures/'+b.artKey+'.webp',import.meta.url).href),outline:faction==='goonk'?image(asset('goonk/outline-'+b.artKey+'.png')):null}));
   if(!ready(background)||artwork.some(item=>!ready(item.picture))){overlay.hidden=true;delete root.dataset.townLayout;return false;}
   root.dataset.townLayout='portrait';overlay.dataset.faction=faction;overlay.hidden=false;overlay.style.width=width+'px';overlay.style.height=height+'px';
   const scale=Math.max(width/background.naturalWidth,height/background.naturalHeight),bw=width/scale,bh=height/scale;ctx.drawImage(background,(background.naturalWidth-bw)/2,(background.naturalHeight-bh)/2,bw,bh,0,0,width,height);
   for(const {b,picture,outline}of artwork){ctx.drawImage(picture,b.x,b.y,b.w,b.h);if(hovered===b.id){if(ready(outline))ctx.drawImage(outline,b.x,b.y,b.w,b.h);else{ctx.save();ctx.shadowColor='#ffe78a';ctx.shadowBlur=8;ctx.drawImage(picture,b.x,b.y,b.w,b.h);ctx.restore();}}}
   const next=JSON.stringify([faction,width,height,!!state.turn,buildings.map(b=>[b.id,b.name])]);
   if(signature!==next){signature=next;const active=new Set(buildings.map(b=>b.id));for(const [id,button]of buttons)if(!active.has(id)){button.remove();buttons.delete(id);if(hovered===id)hovered=null;}
    for(const b of buildings){let button=buttons.get(b.id);if(!button){button=document.createElement('button');button.className='town-building-hit';button.dataset.townBuilding=b.id;const label=document.createElement('span');label.className='town-building-name';button.append(label);button.addEventListener('pointerenter',()=>hovered=b.id);button.addEventListener('pointerleave',()=>hovered=null);button.addEventListener('focus',()=>hovered=b.id);button.addEventListener('blur',()=>hovered=null);button.addEventListener('click',event=>{event.stopPropagation();const current=getState();if(current.mode==='town'&&current.turn&&current.buildings?.some(record=>record.id===b.id&&record.built)){hovered=b.id;command(39,b.id);}});buttons.set(b.id,button);overlay.append(button);}
     button.setAttribute('aria-label',b.name);const nameLabel=button.querySelector('span'),labelWidth=Math.min(180,Math.max(70,b.name.length*6.5+16));nameLabel.textContent=b.name;nameLabel.style.width=labelWidth+'px';nameLabel.style.left=(Math.max(6,Math.min(width-labelWidth-6,b.hit.x+b.hit.w/2-labelWidth/2))-b.hit.x)+'px';button.disabled=!state.turn;Object.assign(button.style,{left:b.hit.x+'px',top:b.hit.y+'px',width:b.hit.w+'px',height:b.hit.h+'px'});
    }
   }
   return true;
  }
 };
}
