// The native spellbook is paged outside combat. Collect those pages behind a
// single scrollable list, then resolve the native page only when casting.
export function createSpellScroll(command){
 let key=null,current={},pages=new Map(),waiting=null,cast=null,lastMove=null;
 function move(target){
  if(waiting!==null)return;
  const page=current.page??0;if(page===target)return;
  const next=page+(target>page?1:-1),moveKey=`${page}:${next}`;
  if(lastMove===moveKey)return;lastMove=moveKey;waiting=next;command(50,next>page?1:-1);
 }
 function advance(){
  if(waiting!==null)return;
  if(cast){const {spell,run}=cast;if((current.page??0)===spell.nativePage){cast=null;run();}else move(spell.nativePage);return;}
  if(current.inCombat!==false||current.scrollable||current.pages<=1)return;
  for(let page=0;page<current.pages;page++)if(!pages.has(page)){move(page);break;}
 }
 return{
  reset(){key=null;current={};pages=new Map();waiting=null;cast=null;lastMove=null;},
  accept(book,identity){
   const nextKey=JSON.stringify([identity,book.school,book.combatSpells]);
   if(key!==nextKey){this.reset();key=nextKey;}
   current=book;const page=book.page??0;
   if(page===waiting){waiting=null;lastMove=null;}
   pages.set(page,(book.spells||[]).map(spell=>({...spell,nativePage:page})));
   const spells=[...pages].sort(([a],[b])=>a-b).flatMap(([,items])=>items);
   queueMicrotask(advance);
   return {...book,spells:[...new Map(spells.map(spell=>[spell.id,spell])).values()]};
  },
  choose(spell,run){cast={spell,run};advance();},
 };
}
