import {plainGameText} from './game-text.mjs';
const text=value=>plainGameText(value||'');
// Keep all decisions native. The DOM is a responsive presentation of the live
// components and sends clicks to their current logical coordinates.
export function createDialogPresentation({root,command,pointer,refresh=()=>{}}){
 const panel=document.createElement('section');panel.className='dialog-presentation';panel.hidden=true;panel.setAttribute('aria-labelledby','dialog-presentation-title');root.append(panel);
 let state,key,dirty=false,icons=[],classic=false,inspect=0,lastMode='',captureAfter=0,hasSnapshot=false,snapshotGeometry='';
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.hasAttribute('data-dialog-classic')){classic=true;update(state);refresh();}
  else if(button.dataset.dialogInfo!==undefined){inspect=Number(button.dataset.dialogInfo);key=undefined;update(state);}
  else if(button.hasAttribute('data-dialog-confirm'))command(state.dialogKind==='commander'?43:1);
  else if(button.hasAttribute('data-dialog-cancel'))command(0);
  else if(button.dataset.dialogChoice!==undefined){const choice=state.dialogPresentation.choices[Number(button.dataset.dialogChoice)];const r=choice.rect;pointer({x:Math.round(r.x+r.w/2),y:Math.round(r.y+r.h/2)},1);}
 });
 function update(next){
  state=next;if(next.mode!==lastMode||next.dialogKind!=='commander'){classic=false;inspect=0;}lastMode=next.mode;const data=next.mode==='dialog'&&!classic&&next.dialogPresentation;
  panel.hidden=!data;root.toggleAttribute('data-dialog-presentation',!!data);
  if(!data){key=undefined;icons=[];hasSnapshot=false;return;}
  const nextKey=JSON.stringify(data);if(nextKey===key)return;key=nextKey;
  const previous=panel.querySelector('[data-dialog-choice]:focus')?.dataset.dialogChoice;
  panel.replaceChildren();panel.dataset.kind=next.dialogKind||'message';panel.dataset.selectable=String((data.choices||[]).some(c=>c.selectable||c.inspectable));panel.dataset.choices=String((data.choices||[]).length);
  const header=document.createElement('header'),title=document.createElement('h2');title.id='dialog-presentation-title';const heading=data.title==='Game message'?(data.lines||[]).map(line=>String(line).match(/^\{([^{}]+)\}\s*\n/)).find(Boolean)?.[1]:null;
  title.textContent=heading||data.title;header.append(title);
  const content=document.createElement('div');content.className='dialog-copy';
  if(data.visitedObject){const image=document.createElement('canvas');image.className='visited-object-art';image.width=192;image.height=160;image.setAttribute('aria-label',data.visitedObject);content.append(image);}
  const lines=next.dialogKind==='commander'?[]:next.dialogKind==='commander-level-up'?['Choose a skill to upgrade.']:[...new Set((data.lines||[]).map(line=>text(heading?String(line).replace(/^\{[^{}]+\}\s*\n/, ''):line)).filter(line=>line&&line!=='or'))];
  for(const line of lines){const p=document.createElement('p');p.textContent=line;content.append(p);}
  if(data.unit){const name=document.createElement('h3');name.textContent=text(data.unit.name);content.append(name);const stats=document.createElement('dl');stats.className='commander-facts';for(const [label,value]of [['Attack',data.unit.attack],['Defense',data.unit.defense],['Damage',data.unit.damageMin+'–'+data.unit.damageMax],['Health',data.unit.health],['Speed',data.unit.speed]]){const group=document.createElement('div'),term=document.createElement('dt'),number=document.createElement('dd');term.textContent=label;number.textContent=value;group.append(term,number);stats.append(group);}content.append(stats);}
  const selected=next.dialogKind==='commander'?data.choices?.[inspect]:(data.choices||[]).find(choice=>choice.selected);
  if(selected?.description){const description=document.createElement('p');description.className='dialog-choice-description';description.textContent=text(selected.description);content.append(description);}
  const choices=document.createElement('div');choices.className='dialog-choices';icons=[];
  for(const [index,choice] of (data.choices||[]).entries()){
   const item=document.createElement(choice.selectable||choice.inspectable?'button':'article');item.className='dialog-choice';
   if(choice.selectable){item.type='button';item.dataset.dialogChoice=index;item.setAttribute('aria-pressed',String(!!choice.selected));}
   if(choice.inspectable){item.type='button';item.dataset.dialogInfo=index;item.setAttribute('aria-pressed',String(index===inspect));}
   const icon=document.createElement('canvas');icon.width=96;icon.height=96;icon.setAttribute('aria-hidden','true');
   const label=document.createElement('strong');label.textContent=text(choice.label)||'Reward';item.append(icon,label);
   choices.append(item);icons.push({canvas:icon,rect:choice.rect});
  }
  const actions=document.createElement('footer'),confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.dataset.dialogConfirm='';confirm.textContent=next.dialogKind==='commander'?'← Back':next.dialogKind==='commander-level-up'?'✓ Confirm skill':'✓ Confirm';actions.append(confirm);
  if(next.dialogKind==='commander'){const classicButton=document.createElement('button');classicButton.type='button';classicButton.dataset.dialogClassic='';classicButton.textContent='Classic view';actions.append(classicButton);}
  if(data.cancel){const cancel=document.createElement('button');cancel.type='button';cancel.dataset.dialogCancel='';cancel.textContent='← Back';actions.append(cancel);}
  panel.append(header,content,choices,actions);dirty=true;captureAfter=performance.now()+80;panel.setAttribute('aria-busy','true');
  const geometry=JSON.stringify([data.title,next.dialogKind,state.rect,(data.choices||[]).map(c=>c.rect)]);
  if(hasSnapshot&&geometry===snapshotGeometry)drawIcons();else hasSnapshot=false;snapshotGeometry=geometry;
  if(previous!==undefined)panel.querySelector(`[data-dialog-choice="${previous}"]`)?.focus({preventScroll:true});
 }
 const snapshot=document.createElement('canvas');snapshot.width=800;snapshot.height=600;const context=snapshot.getContext('2d');
 function drawIcons(){for(const {canvas,rect:r}of icons)if(r?.w>0&&r.h>0){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,96,96);const scale=Math.min(96/r.w,96/r.h);ctx.drawImage(snapshot,r.x,r.y,r.w,r.h,(96-r.w*scale)/2,(96-r.h*scale)/2,r.w*scale,r.h*scale);}}
 return{update,get classic(){return classic;},show(){classic=false;key=undefined;update(state);refresh();},paint(source){if(panel.hidden)return false;const art=panel.querySelector('.visited-object-art'),object=window.goonkVisitedObjectAtlas;if(art&&object){const c=art.getContext('2d');c.clearRect(0,0,art.width,art.height);const z=Math.min(art.width/object.width,art.height/object.height);c.drawImage(object,(art.width-object.width*z)/2,(art.height-object.height*z)/2,object.width*z,object.height*z);}
if(dirty&&performance.now()>=captureAfter){context.drawImage(source,0,0,800,600);drawIcons();hasSnapshot=true;dirty=false;panel.setAttribute('aria-busy','false');}return true;}};
}
