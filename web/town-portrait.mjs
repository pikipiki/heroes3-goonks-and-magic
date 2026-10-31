import{buildingSizes}from'./town-building-sizes.mjs';
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
export function createTownPortrait({root,scene,asset,command,getState}){
 const overlay=document.createElement('section');overlay.className='town-portrait-buildings';overlay.setAttribute('aria-label','Bâtiments de la ville');overlay.hidden=true;root.querySelector('.mobile-play').append(overlay);
 const images=new Map(),buttons=new Map();let hovered=null,signature='';
 const image=url=>{if(!url)return null;if(!images.has(url)){const img=new Image();img.src=url;images.set(url,img);}return images.get(url);};
 const ready=img=>img?.complete&&img.naturalWidth>0;
 const background=image(new URL('./town/portrait-v2.webp',import.meta.url).href);
 return {
  paint(ctx,width,height,state,enabled){
   if(!enabled||state.mode!=='town'||!isGoonkTown(state)||width>=height){overlay.hidden=true;delete root.dataset.townLayout;return false;}
   const buildings=townPortraitBuildings(width,height,state.buildings);const artwork=buildings.map(b=>({b,picture:image(asset('goonk/structure-'+b.artKey+'.png')),outline:image(asset('goonk/outline-'+b.artKey+'.png'))}));
   if(!ready(background)||artwork.some(item=>!ready(item.picture))){overlay.hidden=true;delete root.dataset.townLayout;return false;}
   root.dataset.townLayout='portrait';overlay.hidden=false;overlay.style.width=width+'px';overlay.style.height=height+'px';
   const scale=Math.max(width/background.naturalWidth,height/background.naturalHeight),bw=width/scale,bh=height/scale;ctx.drawImage(background,(background.naturalWidth-bw)/2,(background.naturalHeight-bh)/2,bw,bh,0,0,width,height);
   for(const {b,picture,outline}of artwork){ctx.drawImage(picture,b.x,b.y,b.w,b.h);if(hovered===b.id&&ready(outline))ctx.drawImage(outline,b.x,b.y,b.w,b.h);}
   const next=JSON.stringify([width,height,!!state.turn,buildings.map(b=>[b.id,b.name])]);
   if(signature!==next){signature=next;const active=new Set(buildings.map(b=>b.id));for(const [id,button]of buttons)if(!active.has(id)){button.remove();buttons.delete(id);if(hovered===id)hovered=null;}
    for(const b of buildings){let button=buttons.get(b.id);if(!button){button=document.createElement('button');button.className='town-building-hit';button.dataset.townBuilding=b.id;const label=document.createElement('span');label.className='town-building-name';button.append(label);button.addEventListener('pointerenter',()=>hovered=b.id);button.addEventListener('pointerleave',()=>hovered=null);button.addEventListener('focus',()=>hovered=b.id);button.addEventListener('blur',()=>hovered=null);button.addEventListener('click',event=>{event.stopPropagation();const current=getState();if(current.mode==='town'&&current.turn&&current.buildings?.some(record=>record.id===b.id&&record.built)){hovered=b.id;command(39,b.id);}});buttons.set(b.id,button);overlay.append(button);}
     button.setAttribute('aria-label',b.name);const nameLabel=button.querySelector('span'),labelWidth=Math.min(180,Math.max(70,b.name.length*6.5+16));nameLabel.textContent=b.name;nameLabel.style.width=labelWidth+'px';nameLabel.style.left=(Math.max(6,Math.min(width-labelWidth-6,b.hit.x+b.hit.w/2-labelWidth/2))-b.hit.x)+'px';button.disabled=!state.turn;Object.assign(button.style,{left:b.hit.x+'px',top:b.hit.y+'px',width:b.hit.w+'px',height:b.hit.h+'px'});
    }
   }
   return true;
  }
 };
}
