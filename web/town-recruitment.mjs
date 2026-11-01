export const isNativeFort=state=>state.mode==='dialog'&&state.dialogKind==='fort'&&state.fortAreas?.length>0;
// Native hit areas remain authoritative, including extra modded recruitment rows.
// Copy each live panel separately so mobile layouts can reflow without stretching.
export function createNativeFort({root,getState,pointer}){
 const panel=document.createElement('section');panel.className='native-fort';panel.hidden=true;panel.setAttribute('aria-label','Créatures du château');
 const help=document.createElement('p');help.className='native-fort-help';help.textContent='Choisis une créature pour recruter tes troupes.';
 const grid=document.createElement('div');grid.className='native-fort-grid';panel.append(help,grid);root.querySelector('.mobile-play').append(panel);
 let signature='',canvases=[];
 return {paint(source){
  const state=getState(),active=isNativeFort(state);panel.hidden=!active;
  if(!active){delete root.dataset.nativeFort;return false;}root.dataset.nativeFort='true';
  const areas=state.fortAreas,key=JSON.stringify(areas);
  if(key!==signature){signature=key;grid.replaceChildren();canvases=areas.map((r,index)=>{
   const button=document.createElement('button');button.className='native-fort-card';button.setAttribute('aria-label','Recruter les créatures du niveau '+(index+1));
   const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');button.append(canvas);grid.append(button);
   button.addEventListener('click',event=>{event.stopPropagation();const latest=getState();if(!isNativeFort(latest)||!latest.turn)return;const area=latest.fortAreas[index];if(area)pointer({x:area.x+area.w/2,y:area.y+area.h/2},1);});return canvas;
  });}
  const sx=source.width/800,sy=source.height/600,dpr=Math.min(devicePixelRatio||1,2);
  for(let i=0;i<canvases.length;i++){
   const canvas=canvases[i],r=areas[i];canvas.parentElement.disabled=!state.turn;
   const box=canvas.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight||!box.width||!r.w||!r.h)continue;
   const width=Math.round(box.width*dpr),height=Math.round(width*r.h/r.w);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
   const ctx=canvas.getContext('2d');ctx.clearRect(0,0,width,height);ctx.drawImage(source,r.x*sx,r.y*sy,r.w*sx,r.h*sy,0,0,width,height);
  }
  return true;
 }};
}
