import {plainGameText} from './game-text.mjs';
import {getLanguage} from './i18n.mjs';
if(typeof document!=='undefined'){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./commander-tree.css',import.meta.url).href;document.head.append(link);}
const tr=(en,fr)=>getLanguage()==='fr'?fr:en;
const art=['attack','defense','health','damage','speed','magic'];
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
function icon(id){const image=el('img','tree-skill-icon');image.src=new URL('./h3-theme/commander/'+(art[id]||'magic')+'.svg',import.meta.url).href;image.alt='';image.width=32;image.height=32;return image;}
export function commanderAbilityState(ability,tree){
 if(ability.learned)return 'learned';
 if(ability.requires.every(id=>(tree.skills.find(s=>s.id===id)?.rank??0)>=tree.masterRank))return 'ready';
 return 'locked';
}
// Display the native graph; selecting still only prepares the native level-up choice.
export function renderCommanderTree(tree,choices,{filter=null,onFilter=()=>{},onSelect=()=>{}}={}){
 const root=el('section','commander-tree');root.setAttribute('aria-label',tr('Commander specialization tree','Arbre de spécialisation du commandant'));
 const names=tr(['Attack','Defense','Health','Damage','Speed','Magic'],['Attaque','Défense','Vie','Dégâts','Vitesse','Magie']);
 const ranks=tr(['Untrained','Basic','Advanced','Expert','Master','Grandmaster'],['Non apprise','Basique','Avancé','Expert','Maître','Grand maître']);
 const mastered=tree.skills.filter(s=>s.rank>=tree.masterRank).length,learned=tree.abilities.filter(a=>a.learned).length;
 const intro=el('div','tree-overview');intro.append(el('strong','',tr('Build your commander’s abilities','Développe les capacités de ton commandant')),el('p','tree-intro',tr(`Raise two skills to Master (${tree.masterRank}/${tree.maxRank}), then choose their ability at a level-up.`,`Monte deux compétences au rang Maître (${tree.masterRank}/${tree.maxRank}), puis choisis leur capacité lors d’une montée de niveau.`)),el('small','tree-summary',tr(`${mastered}/${tree.skills.length} Master skills · ${learned}/${tree.abilities.length} abilities learned`,`${mastered}/${tree.skills.length} compétences Maître · ${learned}/${tree.abilities.length} capacités acquises`)));root.append(intro);
 const filters=el('nav','tree-skills');filters.setAttribute('aria-label',tr('Filter abilities by skill','Filtrer les capacités par compétence'));
 const button=(label,active,callback)=>{const b=el('button','',label);b.type='button';b.setAttribute('aria-pressed',String(active));b.onclick=callback;return b;};
 const all=button(tr('All abilities','Toutes les capacités'),filter===null,()=>onFilter(null));all.className='tree-all';filters.append(all);
 for(const skill of tree.skills){
  const group=el('div','tree-skill'),name=names[skill.id]??skill.name,b=button('',filter===skill.id,()=>onFilter(filter===skill.id?null:skill.id));b.dataset.treeSkill=skill.id;b.title=plainGameText(skill.description||'');
  const copy=el('span','tree-skill-copy');copy.append(el('strong','',name),el('small','',`${ranks[skill.rank]||skill.rank} · ${skill.rank}/${tree.maxRank}`));b.append(icon(skill.id),copy);
  const progress=el('span','tree-ranks');progress.setAttribute('role','meter');progress.setAttribute('aria-label',name);progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax',String(tree.maxRank));progress.setAttribute('aria-valuenow',String(skill.rank));for(let rank=1;rank<=tree.maxRank;rank++){const pip=el('i','');pip.dataset.filled=String(skill.rank>=rank);progress.append(pip);}b.append(progress);group.append(b);
  if(skill.selectable){const selected=tree.selectedSkill===skill.id,learn=button(selected?tr('✓ Selected','✓ Sélectionnée'):tr('Improve '+name,'Améliorer '+name),selected,()=>onSelect(skill.id));learn.dataset.treeChoose=skill.id;group.append(learn);}filters.append(group);
 }
 root.append(filters);
 if(filter!==null){const skill=tree.skills.find(s=>s.id===filter);if(skill){const detail=el('section','tree-filter-description');detail.append(icon(filter),el('strong','',names[filter]??skill.name),el('p','',plainGameText(skill.description||'')));root.append(detail);}}
 const list=el('div','tree-abilities');
 const priority=a=>a.selectable?0:commanderAbilityState(a,tree)==='ready'?1:a.learned?2:3;
 const missing=a=>a.requires.reduce((n,id)=>n+Math.max(0,tree.masterRank-(tree.skills.find(s=>s.id===id)?.rank||0)),0);
 const abilities=tree.abilities.filter(a=>filter===null||a.requires.includes(filter)).sort((a,b)=>priority(a)-priority(b)||missing(a)-missing(b)||a.id-b.id);
 for(const ability of abilities){
  const state=commanderAbilityState(ability,tree),selected=tree.selectedSkill===ability.id,card=el('article','tree-ability');card.dataset.treeAbility=ability.id;card.dataset.status=state;
  const parents=el('div','tree-parents');
  for(const id of ability.requires){const skill=tree.skills.find(s=>s.id===id),parent=el('span',''),rank=skill?.rank??0;parent.dataset.met=String(rank>=tree.masterRank);parent.append(icon(id),el('strong','',names[id]??skill?.name),el('small','',`${Math.min(rank,tree.masterRank)}/${tree.masterRank} · ${rank>=tree.masterRank?tr('Master ✓','Maître ✓'):tr('Master required','Maître requis')}`));const bar=el('progress','');bar.max=tree.masterRank;bar.value=Math.min(rank,tree.masterRank);bar.setAttribute('aria-label',`${names[id]} ${rank}/${tree.masterRank}`);parent.append(bar);parents.append(parent);}card.append(parents);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 200 22');svg.setAttribute('aria-hidden','true');svg.innerHTML='<path d="M45 0v7l55 12 55-12V0M100 19v3" fill="none" stroke="currentColor" stroke-width="2"/>';card.append(svg);
  const lines=plainGameText(ability.description||'').split('\n').filter(Boolean),title=ability.name||(lines.length>1?lines.shift():tr('Special ability','Capacité spéciale'));
  const heading=el('div','tree-ability-heading'),medallion=el('span','tree-combination');for(const id of ability.requires)medallion.append(icon(id));heading.append(medallion,el('h3','',title));card.append(heading,el('p','tree-effect',lines.join('\n')));
  const status=el('strong','tree-status',state==='learned'?tr('✓ Learned','✓ Acquise'):ability.selectable?tr('Choose at this level-up','À choisir à cette montée de niveau'):state==='ready'?tr('Unlocked · choose at a level-up','Débloquée · à choisir à une montée de niveau'):tr('Locked · both Master ranks required','Verrouillée · deux rangs Maître requis'));card.append(status);
  if(ability.selectable){const b=button(selected?tr('✓ Selected — confirm below','✓ Sélectionnée — confirme ci-dessous'):tr('Choose this ability','Choisir cette capacité'),selected,()=>onSelect(ability.id));b.dataset.treeChoose=ability.id;card.append(b);}list.append(card);
 }
 root.append(list);return root;
}
