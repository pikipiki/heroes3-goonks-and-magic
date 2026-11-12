import{hdCreaturePortrait,paintHDCreature}from'./goonk-hd-portraits.mjs';
// Creatures outside the illustrated town rosters use the native portrait atlas.
export function creaturePortrait(unit){return `<canvas class="unit-portrait" width="96" height="96" data-creature-portrait="${Number(unit.id)}" data-creature-key="${String(unit.key||'').replace(/[^a-z0-9:_.-]/gi,'')}" role="img" aria-label="${String(unit.name||'Creature').replace(/[&<>"']/g,'')}"></canvas>`;}
// Portrait artwork is static between atlas updates. Cache its CSS geometry;
// measuring every animation frame forces layout after unrelated UI writes.
const portraitRoots=new WeakMap(),portraitSizes=new WeakMap();
let resizeObserver;
function portraitCanvases(root){
 if(typeof MutationObserver==='undefined'||typeof ResizeObserver==='undefined')return root.querySelectorAll('[data-creature-portrait]');
 let record=portraitRoots.get(root);
 if(!record){
  record={dirty:true,nodes:[]};
  record.observer=new MutationObserver(()=>{record.dirty=true;});
  record.observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-creature-portrait','data-creature-key']});
  portraitRoots.set(root,record);
 }
 if(record.dirty){
  const nodes=[...root.querySelectorAll('[data-creature-portrait]')],present=new Set(nodes);
  for(const old of record.nodes)if(!present.has(old)){resizeObserver?.unobserve(old);portraitSizes.delete(old);}
  record.nodes=nodes;record.dirty=false;
 }
 return record.nodes;
}
function portraitSize(canvas){
 if(typeof ResizeObserver!=='undefined'){
  resizeObserver??=new ResizeObserver(entries=>{for(const entry of entries)portraitSizes.delete(entry.target);});
  let size=portraitSizes.get(canvas);
  if(size===undefined){const box=canvas.getBoundingClientRect();size=Math.max(box.width,box.height);portraitSizes.set(canvas,size);resizeObserver.observe(canvas);}
  return size;
 }
 const box=canvas.getBoundingClientRect();return Math.max(box.width,box.height);
}
export function paintCreaturePortraits(root){
 const atlas=window.goonkPortraitAtlas,ids=window.goonkPortraitIds;
 for(const c of portraitCanvases(root)){
  const id=Number(c.dataset.creaturePortrait),hd=hdCreaturePortrait({key:c.dataset.creatureKey}),index=ids?.get(id),source=hd?.image||atlas;
  if(!source||!hd&&index===undefined)continue;
  const size=hd?Math.min(768,Math.max(96,Math.ceil(portraitSize(c)*(devicePixelRatio||1)))):96;
  if(c._portraitSource===source&&c._portraitIndex===id&&c._portraitVersion===window.goonkPortraitVersion&&c.width===size)continue;
  if(c.width!==size||c.height!==size){c.width=size;c.height=size;}
  const ctx=c.getContext('2d');ctx.clearRect(0,0,size,size);
  if(hd)paintHDCreature(ctx,hd,size,size);else ctx.drawImage(atlas,index%8*96,Math.floor(index/8)*96,96,96,0,0,size,size);
  c._portraitSource=source;c._portraitIndex=id;c._portraitVersion=window.goonkPortraitVersion;
 }
}
if(typeof window!=='undefined'){window.addEventListener('goonk-portraits',()=>{window.goonkPortraitVersion=(window.goonkPortraitVersion||0)+1;paintCreaturePortraits(document);});window.addEventListener('goonk-hd-portraits',()=>paintCreaturePortraits(document));}
