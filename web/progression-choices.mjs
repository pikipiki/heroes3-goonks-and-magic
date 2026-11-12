import {getLanguage,translate} from './i18n.mjs';
import {plainGameText} from './game-text.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(a,b)=>getLanguage()==='fr'?b:a;
if(typeof document!=='undefined'){const s=document.createElement('link');s.rel='stylesheet';s.href=new URL('./progression.css',import.meta.url).href;document.head.append(s);}
export function paintProgressionArtifacts(root){
 const atlas=window.goonkArtifactAtlas,ids=window.goonkArtifactIds;if(!atlas||!ids)return;
 for(const c of root.querySelectorAll('[data-progression-icon]')){const id=Number(c.dataset.progressionIcon),i=ids.get(id);if(i===undefined||c._atlas===atlas&&c._id===id)continue;c.getContext('2d').drawImage(atlas,i%8*96,Math.floor(i/8)*96,96,96,0,0,64,64);c._atlas=atlas;c._id=id;}
}
export function createProgressionChoices({root,command}){
 const panel=document.createElement('section');panel.className='progression-page progression-choices';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','progression-title');root.append(panel);
 let state,data,identity='',family=null,requested=null,signature='';
 const selected=()=>data?.choices?.findIndex(c=>c.selected)??-1;
 function select(index){if(!data.choices[index]?.selectable)return;requested=selected()===index?null:index;command(98,index,data.queryId);patch();}
 panel.addEventListener('change',e=>{if(e.target.matches('[data-progression-family]')){family=Number(e.target.value);const i=data.choices.findIndex(c=>c.familyId===family);if(i>=0)select(i);patch();}});
 panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.progressionChoice!==undefined)select(Number(b.dataset.progressionChoice));if(b.hasAttribute('data-progression-confirm')){const i=selected();if(i>=0&&requested===null){b.disabled=true;command(99,i,data.queryId);}}if(b.hasAttribute('data-progression-cancel'))command(100,0,data.queryId);});
 function build(){
  const families=[...new Map(data.choices.filter(c=>Number.isInteger(c.familyId)).map(c=>[c.familyId,c.familyName])).entries()];
  panel.innerHTML=`<header><h2 id="progression-title">${esc(data.visitedObject||data.title)}</h2></header><div class="progression-scroll"><details class="progression-rules"><summary>${tr('Rules and price','Règles et coût')}</summary><p>${esc(plainGameText((data.lines||[]).filter(l=>l!=='or').join('\n')))}</p></details>${families.length?`<label class="progression-family">${tr('Goonk family','Famille de Goonks')}<select data-progression-family>${families.map(([id,name])=>`<option value="${id}">${esc(name)}</option>`).join('')}</select></label>`:''}<div class="progression-offers">${data.choices.map((c,i)=>`<button type="button" data-progression-choice="${i}" class="progression-offer">${Number.isInteger(c.icon)?`<canvas width="64" height="64" data-progression-icon="${c.icon}" aria-hidden="true"></canvas>`:''}<span>${esc(Number.isInteger(c.familyId)?c.label.split('\n').slice(1).join('\n'):c.label)}</span><strong class="progression-choice-status"></strong></button>`).join('')}</div></div><footer><p class="progression-summary" aria-live="polite"></p><button type="button" class="primary" data-progression-confirm>${tr('Confirm purchase','Confirmer l’achat')}</button><button type="button" data-progression-cancel>${tr('Leave without paying','Repartir sans payer')}</button></footer>`;
 }
 function patch(){
  const i=selected(),choice=data.choices[i],select=panel.querySelector('[data-progression-family]');if(select&&document.activeElement!==select)select.value=String(family);
  for(const [index,c]of data.choices.entries()){const b=panel.querySelector(`[data-progression-choice="${index}"]`),active=c.selected;b.hidden=Number.isInteger(c.familyId)&&c.familyId!==family;b.disabled=!c.selectable;b.setAttribute('aria-pressed',String(!!active));const label=b.querySelector('.progression-choice-status'),value=active?tr('✓ Selected','✓ Sélectionnée'):tr('Choose','Choisir');if(label.textContent!==value)label.textContent=value;}
  const summary=panel.querySelector('.progression-summary'),label=requested!==null?tr('Selecting…','Sélection…'):choice?translate(choice.label):tr('Choose an improvement.','Choisis une amélioration.');if(summary.textContent!==label)summary.textContent=label;
  panel.querySelector('[data-progression-confirm]').disabled=requested!==null||!choice||Number.isInteger(choice.familyId)&&choice.familyId!==family;
 }
 return {update(next){state=next;data=next.mode==='dialog'&&next.dialogPresentation?.progression?next.dialogPresentation:null;panel.hidden=!data;root.toggleAttribute('data-progression-choice',!!data);if(!data){identity='';signature='';requested=null;return false;}
  const id=next.windowToken+':'+data.queryId,structure=JSON.stringify([getLanguage(),data.progression,data.choices.map(c=>[c.label,c.familyId,c.familyName,c.icon])]);
  if(identity!==id){identity=id;family=data.choices.find(c=>c.selected)?.familyId??data.choices[0]?.familyId??null;requested=null;signature='';}
  if(requested!==null&&selected()===requested)requested=null;
  if(signature!==structure){signature=structure;build();}patch();return true;
 },paint(){if(panel.hidden)return false;paintProgressionArtifacts(panel);return true;}};
}
