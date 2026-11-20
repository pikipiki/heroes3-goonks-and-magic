import {createAccordion,commanderSkillArt,escapeUI,ratingMarkup,chipMarkup} from './ui/material-components.mjs';
import {renderMarkup,setClickHandler} from './ui/material-components.mjs';
import {plainGameText} from './game-text.mjs';
import {getLanguage} from './locale-state.mjs';
if(typeof document!=='undefined'){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./commander-tree.css',import.meta.url).href;document.head.append(link);}
const tr=(en,fr)=>getLanguage()==='fr'?fr:en;
const iconMarkup=id=>`<img class="tree-skill-icon" src="${escapeUI(commanderSkillArt(id))}" width="20" height="20" alt="">`;
export function commanderAbilityState(ability,tree){
 if(ability.learned)return 'learned';
 if(ability.requires.every(id=>(tree.skills.find(s=>s.id===id)?.rank??0)>=tree.masterRank))return 'ready';
 return 'locked';
}
// Inspection is local. Only explicit native selectable choices prepare a level-up;
// confirmation remains in the existing dialog action dock.
export function renderCommanderTree(tree,choices,{filter=null,expanded=null,masteryOpen=false,onFilter=()=>{},onSelect=()=>{}}={}){
 const root=document.createElement('section');root.className='commander-tree';root.setAttribute('aria-label',tr('Commander specialization tree','Arbre de spécialisation du commandant'));
 const names=tr(['Attack','Defense','Health','Damage','Speed','Magic'],['Attaque','Défense','Vie','Dégâts','Vitesse','Magie']);
 const mastered=tree.skills.filter(skill=>skill.rank>=tree.masterRank).length,learned=tree.abilities.filter(ability=>ability.learned).length;
 const rank=(skill,max=tree.maxRank)=>ratingMarkup({value:Math.min(skill?.rank??0,max),max,label:`${names[skill?.id]||''} : ${Math.min(skill?.rank??0,max)}/${max}`});
 renderMarkup(root,`<div class="tree-toolbar"><label class="tree-filter"><span>${escapeUI(tr('Abilities','Capacités'))}</span><select data-tree-filter aria-label="${escapeUI(tr('Filter abilities','Filtrer les capacités'))}"><option value="all" ${filter===null?'selected':''}>${escapeUI(tr('All abilities','Toutes les capacités'))}</option>${tree.skills.map(skill=>`<option value="${skill.id}" data-icon="${escapeUI(commanderSkillArt(skill.id))}" ${filter===skill.id?'selected':''}>${escapeUI(names[skill.id]??skill.name)}</option>`).join('')}</select></label><small class="tree-summary">${escapeUI(tr(`${learned}/${tree.abilities.length} learned`,`${learned}/${tree.abilities.length} acquises`))}</small></div><p class="tree-intro">${escapeUI(tr('Two Master skills unlock their shared ability.', 'Deux compétences Maître débloquent leur capacité commune.'))}</p>`);
 root.querySelector('[data-tree-filter]').addEventListener('change',event=>onFilter(event.target.value==='all'?null:Number(event.target.value)));
 const mastery=createAccordion({parent:root,className:'tree-mastery',open:masteryOpen,markup:`<summary>${escapeUI(tr(`${mastered}/${tree.skills.length} Master skills`,`${mastered}/${tree.skills.length} compétences Maître`))}</summary><div class="tree-mastery-rows">${tree.skills.map(skill=>`<div class="tree-mastery-row" data-tree-skill="${skill.id}">${iconMarkup(skill.id)}<span class="tree-rank-copy"><span>${escapeUI(names[skill.id]??skill.name)}</span>${rank(skill)}</span>${skill.selectable?`<button type="button" data-tree-choose="${skill.id}" aria-pressed="${tree.selectedSkill===skill.id}">${escapeUI(tree.selectedSkill===skill.id?tr('Selected','Sélectionnée'):tr('Improve','Améliorer'))}</button>`:`<small>${skill.rank}/${tree.maxRank}</small>`}</div>`).join('')}</div>`});
 for(const button of mastery.querySelectorAll('[data-tree-choose]'))setClickHandler(button,()=>onSelect(Number(button.dataset.treeChoose)));
 const list=document.createElement('div');list.className='tree-abilities';root.append(list);
 const priority=ability=>ability.selectable?0:commanderAbilityState(ability,tree)==='ready'?1:ability.learned?2:3;
 const missing=ability=>ability.requires.reduce((n,id)=>n+Math.max(0,tree.masterRank-(tree.skills.find(skill=>skill.id===id)?.rank||0)),0);
 const abilities=tree.abilities.filter(ability=>filter===null||ability.requires.includes(filter)).sort((a,b)=>priority(a)-priority(b)||missing(a)-missing(b)||a.id-b.id);
 for(const ability of abilities){
  const state=commanderAbilityState(ability,tree),selected=tree.selectedSkill===ability.id;
  const lines=plainGameText(ability.description||'').split('\n').filter(Boolean),title=ability.name||(lines.length>1?lines.shift():ability.requires.map(id=>names[id]).join(' + '));
  const status=ability.learned?tr('Learned','Acquise'):ability.selectable?tr('Available','Disponible'):state==='ready'?tr('Unlocked','Débloquée'):tr('Locked','Verrouillée');
  const prerequisite=ability.requires.map(id=>{const skill=tree.skills.find(item=>item.id===id);return `<div class="tree-prerequisite" data-met="${(skill?.rank??0)>=tree.masterRank}">${iconMarkup(id)}<span class="tree-rank-copy"><span>${escapeUI(names[id])}</span>${rank(skill,tree.masterRank)}</span></div>`;}).join('');
  const accordion=createAccordion({parent:list,className:'tree-ability',open:expanded?expanded.includes(ability.id):selected,markup:`<summary><span class="tree-ability-heading"><span class="tree-combination">${ability.requires.map(iconMarkup).join('')}</span><span class="tree-ability-title">${escapeUI(title)}</span>${chipMarkup({label:status})}</span></summary><p class="tree-effect">${escapeUI(lines.join('\n'))}</p><div class="tree-prerequisites" aria-label="${escapeUI(tr('Master ranks required','Rangs Maître requis'))}">${prerequisite}</div>${ability.selectable&&!ability.learned?`<button type="button" data-tree-choose="${ability.id}" aria-pressed="${selected}">${escapeUI(selected?tr('Selected — confirm below','Sélectionnée — confirme ci-dessous'):tr('Choose this ability','Choisir cette capacité'))}</button>`:''}`});
  accordion.dataset.treeAbility=ability.id;accordion.dataset.status=state;
  accordion.addEventListener('toggle',()=>{if(accordion.open)for(const other of list.querySelectorAll('[data-tree-ability]'))if(other!==accordion)other.open=false;});
  const button=accordion.querySelector('[data-tree-choose]');if(button)setClickHandler(button,()=>onSelect(ability.id));
 }
 return root;
}
