import {plainGameText} from './game-text.mjs';
import {getLanguage} from './i18n.mjs';
if(typeof document!=='undefined'){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./commander-tree.css',import.meta.url).href;document.head.append(link);}
const tr=(en,fr)=>getLanguage()==='fr'?fr:en;
export function commanderAbilityState(ability,tree){
 if(ability.learned)return 'learned';
 if(ability.requires.every(id=>(tree.skills.find(s=>s.id===id)?.rank??0)>=tree.masterRank))return 'ready';
 return 'locked';
}
// Read-only view of the live engine graph. Only current native choices can act.
export function renderCommanderTree(tree,choices,{filter=null,onFilter=()=>{},onSelect=()=>{}}={}){
 const root=document.createElement('section');root.className='commander-tree';root.setAttribute('aria-label',tr('Commander specialization tree','Arbre de spécialisation du commandant'));
 const intro=document.createElement('p');intro.className='tree-intro';intro.textContent=tr('Combine two skills at Master rank to unlock an ability. Learn it at a level-up.','Combine deux compétences au rang Maître pour débloquer une capacité. Apprends-la lors d’une montée de niveau.');root.append(intro);
 const filters=document.createElement('nav');filters.className='tree-skills';filters.setAttribute('aria-label',tr('Filter connections by skill','Filtrer les connexions par compétence'));
 const button=(label,active,callback)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(active));b.onclick=callback;return b;};
 const all=button(tr('All connections','Toutes les connexions'),filter===null,()=>onFilter(null));all.className='tree-all';filters.append(all);
 const names=tr(['Attack','Defense','Health','Damage','Speed','Magic'],['Attaque','Défense','Vie','Dégâts','Vitesse','Magie']);
 for(const skill of tree.skills){const group=document.createElement('div');group.className='tree-skill';const b=button(`${names[skill.id]??skill.name} · ${skill.rank}/${tree.maxRank}`,filter===skill.id,()=>onFilter(filter===skill.id?null:skill.id));b.dataset.treeSkill=skill.id;b.title=plainGameText(skill.description||'');group.append(b);if(skill.selectable){const selected=tree.selectedSkill===skill.id,learn=button(selected?tr('✓ Selected','✓ Sélectionnée'):tr('Improve','Améliorer'),selected,()=>onSelect(skill.id));learn.dataset.treeChoose=skill.id;group.append(learn);}filters.append(group);}root.append(filters);
 const list=document.createElement('div');list.className='tree-abilities';
 for(const ability of tree.abilities.filter(a=>filter===null||a.requires.includes(filter))){
  const state=commanderAbilityState(ability,tree),selected=tree.selectedSkill===ability.id,card=document.createElement('article');card.className='tree-ability';card.dataset.treeAbility=ability.id;card.dataset.status=state;
  const parents=document.createElement('div');parents.className='tree-parents';
  for(const id of ability.requires){const skill=tree.skills.find(s=>s.id===id),parent=document.createElement('span');parent.textContent=`${names[id]??skill?.name} ${skill?.rank??0}/${tree.masterRank}`;parent.dataset.met=String((skill?.rank??0)>=tree.masterRank);parents.append(parent);}card.append(parents);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 200 22');svg.setAttribute('aria-hidden','true');svg.innerHTML='<path d="M45 0v7l55 12 55-12V0M100 19v3" fill="none" stroke="currentColor" stroke-width="2"/>';card.append(svg);
  const description=document.createElement('p');description.className='tree-effect';description.textContent=plainGameText(ability.description);card.append(description);
  const status=document.createElement('strong');status.className='tree-status';status.textContent=state==='learned'?tr('✓ Learned','✓ Acquise'):state==='ready'?tr('◆ Ready to learn','◆ Prête à apprendre'):tr('🔒 Master ranks required','🔒 Rangs Maître requis');card.append(status);
  if(ability.selectable){const b=button(selected?tr('✓ Selected — confirm below','✓ Sélectionnée — confirme ci-dessous'):tr('Choose this ability','Choisir cette capacité'),selected,()=>onSelect(ability.id));b.dataset.treeChoose=ability.id;card.append(b);}
  list.append(card);
 }
 root.append(list);return root;
}
