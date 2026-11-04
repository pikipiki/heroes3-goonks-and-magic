const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const schoolIndex=school=>school===-1?0:[0,3,1,2].indexOf(school)+1;
export function createMobileSpellbook({root,command}){
 const panel=document.createElement('section');panel.className='mobile-spellbook';panel.hidden=true;panel.setAttribute('aria-label','Spellbook');root.querySelector('.mobile-play').append(panel);
 let signature='',state={},book={},pending=null,reusing=null,navigation=null;const used=new Map();
 const hero=()=>state.heroId??state.heroName??'current';
 function choose(spell){pending={...spell,hero:hero(),mana:book.mana,school:book.school,page:book.page};reusing=null;command(49,spell.id);}
 panel.addEventListener('error',event=>{const img=event.target;if(!img.matches?.('.spell-icon'))return;const spell=book.spells?.find(s=>s.id===Number(img.dataset.icon));const original=document.querySelector('#canvas');if(spell&&original&&Number.isFinite(spell.x)&&Number.isFinite(spell.y)){const canvas=document.createElement('canvas');canvas.width=65;canvas.height=64;canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(original,spell.x,spell.y,65,64,0,0,65,64);img.replaceWith(canvas);}else img.hidden=true;},true);
 panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.spell!==undefined){const spell=book.spells?.find(s=>s.id===Number(b.dataset.spell));if(spell?.enabled)choose(spell);return;}
  if(b.dataset.reuse!==undefined){const previous=used.get(hero());if(!previous||book.mana<previous.cost)return;reusing={...previous};navigation=null;signature='';advanceReuse();return;}
  reusing=null;if(b.dataset.school!==undefined)command(51,Number(b.dataset.school));if(b.dataset.page!==undefined)command(50,Number(b.dataset.page));if(b.dataset.closeBook!==undefined){pending=null;command(0);}
 });
 function advanceReuse(){if(!reusing)return;const position=JSON.stringify(book);if(position===navigation)return;navigation=position;const spell=book.spells?.find(s=>s.id===reusing.id);if(spell){if(spell.enabled)choose(spell);else reusing=null;return;}
  if(book.school!==reusing.school){command(51,schoolIndex(reusing.school));return;}
  if(book.page!==reusing.page&&reusing.page<book.pages){command(50,book.page<reusing.page?1:-1);return;}
  reusing=null;
 }
 return{update(next){state=next;const mana=next.spellbook?.mana??next.heroMana;
  if(pending&&hero()===pending.hero&&Number.isFinite(mana)&&mana<pending.mana){used.set(pending.hero,{...pending});pending=null;signature='';}
  if(pending&&next.mode!=='spellbook'&&(next.mode!=='battle'||(!next.spellTargeting&&next.canAct)))pending=null;
  panel.hidden=next.mode!=='spellbook';if(panel.hidden){signature='';reusing=null;return;}
  book=next.spellbook||{};const previous=used.get(hero()),key=JSON.stringify([book,previous,reusing]);if(key===signature)return;signature=key;
  const reuseDisabled=!previous||book.mana<previous.cost||!!reusing;
  panel.innerHTML=`<header><h2>Spellbook <small>${book.mana??0} mana</small></h2><button data-close-book aria-label="Close spellbook">✕</button></header><nav class="spell-schools" aria-label="Spell categories">${['All','Air','Earth','Fire','Water'].map((name,i)=>`<button data-school="${i}" aria-pressed="${i===0?book.school===-1:[0,3,1,2][i-1]===book.school}">${name}</button>`).join('')}</nav><div class="spell-list">${(book.spells||[]).map(s=>`<button class="spell-row" data-spell="${s.id}" ${s.enabled?'':'disabled'}><span class="spell-symbol" aria-hidden="true"><img class="spell-icon" data-icon="${s.id}" src="./web/h3-theme/spells/${Number(s.id)}.png" alt=""></span><span><strong>${esc(s.name)}</strong><small>Level ${s.level} · ${s.cost} mana</small><span>${esc(s.description).replace(/[{}]/g,'')}</span></span></button>`).join('')||'<p>No spells in this category.</p>'}</div><footer><button data-reuse ${reuseDisabled?'disabled':''} ${reusing?'aria-busy="true"':''} title="${esc(previous?previous.name:'No spell used yet')}">Reuse last spell${previous?` · ${esc(previous.name)}`:''}</button><div class="spell-pagination"><button data-page="-1" ${book.page>0?'':'disabled'}>← Previous page</button><span>Page ${(book.page??0)+1}</span><button data-page="1" ${book.page+1>=book.pages?'disabled':''}>Next page →</button></div></footer>`;
  if(reusing)queueMicrotask(advanceReuse);
 },get active(){return !panel.hidden;}};
}
