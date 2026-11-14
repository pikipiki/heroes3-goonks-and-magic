import {plainGameText} from './game-text.mjs';
import {renderCommanderTree} from './commander-tree.mjs';
import {getLanguage} from './i18n.mjs';
import {createProgressionChoices} from './progression-choices.mjs';
const text=value=>plainGameText(value||'');
// Keep all decisions native. The DOM is a responsive presentation of the live
// components and sends clicks to their current logical coordinates.
export function createDialogPresentation({root,command,pointer,refresh=()=>{}}){
 const progression=createProgressionChoices({root,command});
 const panel=document.createElement('section');panel.className='dialog-presentation';panel.hidden=true;panel.setAttribute('aria-labelledby','dialog-presentation-title');root.append(panel);
 let state,key,dirty=false,icons=[],classic=false,inspect=0,lastMode='',captureAfter=0,hasSnapshot=false,snapshotGeometry='',treeOpen=false,treeFilter=null,replyingTo=null,campaignExit=null;
 function holdCampaign(){panel.dataset.waiting='true';for(const button of panel.querySelectorAll('button'))button.disabled=true;}
 window.addEventListener('goonk-language',()=>{key=undefined;if(state)update(state);});
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(state?.dialogKind==='source-campaign'&&(button.hasAttribute('data-dialog-confirm')||button.hasAttribute('data-dialog-cancel'))){replyingTo=state.dialogPresentation.queryId;holdCampaign();}
  if(button.hasAttribute('data-commander-tree')){treeOpen=!treeOpen;key=undefined;update(state);}
  else if(button.hasAttribute('data-dialog-classic')){classic=true;update(state);refresh();}
  else if(button.dataset.dialogInfo!==undefined){inspect=Number(button.dataset.dialogInfo);key=undefined;update(state);}
  else if(button.hasAttribute('data-dialog-confirm'))command(state.dialogKind==='commander'?43:1);
  else if(button.hasAttribute('data-dialog-cancel'))command(0);
  else if(button.dataset.dialogChoice!==undefined){const choice=state.dialogPresentation.choices[Number(button.dataset.dialogChoice)];const r=choice.rect;pointer({x:Math.round(r.x+r.w/2),y:Math.round(r.y+r.h/2)},1);}
 });
 function update(next,settled=false){
  if(campaignExit&&(next.mode!=='map'||next.campaignPending)){clearTimeout(campaignExit);campaignExit=null;}
  // The final native reward window follows the last script-state packet. Wait
  // briefly for it before revealing the adventure map between those packets.
  if(!settled&&state?.dialogKind==='source-campaign'&&next.mode==='map'&&!next.campaignPending){
   if(!campaignExit)campaignExit=setTimeout(()=>{campaignExit=null;update(next,true);},120);holdCampaign();return;
  }
  // Keep the current text and scroll position while the native reply travels
  // to the server. A transient adventure frame must not flash behind a quest.
  if(state?.dialogKind==='source-campaign'&&next.campaignPending&&
     (next.mode!=='dialog'||(replyingTo!==null&&next.dialogPresentation?.queryId===replyingTo))){holdCampaign();return;}
  replyingTo=null;if(panel.dataset.waiting){delete panel.dataset.waiting;for(const button of panel.querySelectorAll('button'))button.disabled=false;}
  if(progression.update(next)){state=next;panel.hidden=true;key=undefined;icons=[];root.setAttribute('data-dialog-presentation','');return;}
  if(!['commander','commander-level-up'].includes(next.dialogKind)){treeOpen=false;treeFilter=null;}
  state=next;if(next.mode!==lastMode||next.dialogKind!=='commander'){classic=false;inspect=0;}lastMode=next.mode;const data=next.mode==='dialog'&&!classic&&next.dialogPresentation;
  panel.hidden=!data;root.toggleAttribute('data-dialog-presentation',!!data);
  if(!data){key=undefined;icons=[];hasSnapshot=false;return;}
  const nextKey=JSON.stringify(data);if(nextKey===key)return;key=nextKey;
  const scroll=panel.querySelector('.commander-tree')?.scrollTop||0;
  const previous=panel.querySelector('[data-dialog-choice]:focus')?.dataset.dialogChoice;
  panel.replaceChildren();panel.dataset.kind=next.dialogKind||'message';panel.dataset.tree=String(treeOpen&&!!data.commanderTree);panel.dataset.selectable=String((data.choices||[]).some(c=>c.selectable||c.inspectable));panel.dataset.choices=String((data.choices||[]).length);panel.dataset.detailed=String((data.choices||[]).some(c=>c.selectable&&c.label?.length>35));
  const header=document.createElement('header'),title=document.createElement('h2');title.id='dialog-presentation-title';const heading=data.title==='Game message'?(data.lines||[]).map(line=>String(line).match(/^\{([^{}]+)\}\s*\n/)).find(Boolean)?.[1]:null;
  title.textContent=heading||data.title;header.append(title);
  if(data.commanderTree){const toggle=document.createElement('button');toggle.type='button';toggle.dataset.commanderTree='';toggle.textContent=getLanguage()==='fr'?(treeOpen?'Compétences et équipement':'Arbre de spécialisation'):(treeOpen?'Skills and equipment':'Specialization tree');toggle.setAttribute('aria-pressed',String(treeOpen));header.append(toggle);}
  const content=document.createElement('div');content.className='dialog-copy';
  if(data.visitedObject){const image=document.createElement('canvas');image.className='visited-object-art';image.width=192;image.height=160;image.setAttribute('aria-label',data.visitedObject);content.append(image);}
  const lines=next.dialogKind==='commander'?[]:next.dialogKind==='commander-level-up'?['Choose a skill to upgrade.']:[...new Set((data.lines||[]).map(line=>text(heading?String(line).replace(/^\{[^{}]+\}\s*\n/, ''):line)).filter(line=>line&&line!=='or'))];
  for(const line of lines){const p=document.createElement('p');p.textContent=line;content.append(p);}
  if(data.unit){const preview=document.createElement('canvas');preview.className='commander-preview';preview.width=192;preview.height=240;preview.setAttribute('aria-label',data.unit.name);const summary=document.createElement('section');summary.className='commander-summary';summary.append(preview);const name=document.createElement('h3');name.textContent=text(data.unit.name);const speed=document.createElement('small');speed.className='commander-speed';speed.textContent='➟ '+data.unit.speed;speed.setAttribute('aria-label','Speed: '+data.unit.speed);name.append(speed);summary.append(name);const stats=document.createElement('dl');stats.className='commander-facts';for(const [label,value]of [['Attack',data.unit.attack],['Defense',data.unit.defense],['Damage',data.unit.damageMin+'–'+data.unit.damageMax],['Health',data.unit.health]]){const group=document.createElement('div'),term=document.createElement('dt'),number=document.createElement('dd');term.textContent=({Attack:'⚔',Defense:'🛡',Damage:'✹',Health:'♥',Speed:'➟'})[label];term.setAttribute('aria-label',label);term.title=label;number.textContent=value;group.append(term,number);stats.append(group);}summary.append(stats);content.append(summary);}
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
  if(data.cancel&&next.dialogKind!=='commander'){const cancel=document.createElement('button');cancel.type='button';cancel.dataset.dialogCancel='';cancel.textContent='← Back';actions.append(cancel);}
  panel.append(header,content,choices,actions);
  if(treeOpen&&data.commanderTree){const pending=(data.choices||[]).find(c=>c.selected);if(next.dialogKind==='commander-level-up'&&pending){confirm.textContent='✓ '+text(pending.label);}const tree=renderCommanderTree(data.commanderTree,data.choices||[],{filter:treeFilter,onFilter:id=>{treeFilter=id;key=undefined;update(state);},onSelect:id=>command(96,id)});content.hidden=true;choices.hidden=true;panel.insertBefore(tree,actions);tree.scrollTop=scroll;}
  dirty=true;captureAfter=performance.now()+80;panel.setAttribute('aria-busy','true');
  const geometry=JSON.stringify([data.title,next.dialogKind,state.rect,(data.choices||[]).map(c=>c.rect)]);
  if(hasSnapshot&&geometry===snapshotGeometry)drawIcons();else hasSnapshot=false;snapshotGeometry=geometry;
  if(previous!==undefined)panel.querySelector(`[data-dialog-choice="${previous}"]`)?.focus({preventScroll:true});
 }
 let trimmedObject=null,objectCrop=null;
 const snapshot=document.createElement('canvas');snapshot.width=800;snapshot.height=600;const context=snapshot.getContext('2d');
 function drawIcons(){for(const {canvas,rect:r}of icons)if(r?.w>0&&r.h>0){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,96,96);const scale=Math.min(96/r.w,96/r.h);ctx.drawImage(snapshot,r.x,r.y,r.w,r.h,(96-r.w*scale)/2,(96-r.h*scale)/2,r.w*scale,r.h*scale);}}
 return{update,get classic(){return classic;},show(){classic=false;key=undefined;update(state);refresh();},paint(source){if(progression.paint())return true;if(panel.hidden)return false;const preview=panel.querySelector('.commander-preview'),u=state.previewUnits?.[0],r=u&&window.goonkCreaturePreviewRects?.get(u.previewKey);if(preview&&r&&window.goonkCreaturePreviewAtlas){const c=preview.getContext('2d'),z=Math.min(preview.width/r.w,preview.height/r.h);c.clearRect(0,0,preview.width,preview.height);c.drawImage(window.goonkCreaturePreviewAtlas,r.x,r.y,r.w,r.h,(preview.width-r.w*z)/2,(preview.height-r.h*z)/2,r.w*z,r.h*z);}const art=panel.querySelector('.visited-object-art'),object=window.goonkVisitedObjectAtlas;if(art&&object){const c=art.getContext('2d');c.clearRect(0,0,art.width,art.height);if(trimmedObject!==object){trimmedObject=object;const d=object.getContext('2d').getImageData(0,0,object.width,object.height).data;let left=object.width,top=object.height,right=0,bottom=0;for(let y=0;y<object.height;y++)for(let x=0;x<object.width;x++)if(d[(y*object.width+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}objectCrop=right>=left?{x:left,y:top,w:right-left+1,h:bottom-top+1}:{x:0,y:0,w:object.width,h:object.height};}const r=objectCrop,z=Math.min((art.width-16)/r.w,(art.height-16)/r.h);c.drawImage(object,r.x,r.y,r.w,r.h,(art.width-r.w*z)/2,(art.height-r.h*z)/2,r.w*z,r.h*z);}
if(dirty&&performance.now()>=captureAfter){context.drawImage(source,0,0,800,600);drawIcons();hasSnapshot=true;dirty=false;panel.setAttribute('aria-busy','false');}return true;}};
}
