/** Read the original SPTRAITS descriptor rows without treating multiline prose as rows. */
export function readSpellCatalogue(text) {
 const rows=[];
 for(const line of text.split(/\r?\n/)) {
  const c=line.split('\t');
  if(c.length<29||!c[0]||!c[1]||!/^\d+$/.test(c[2])||!c.slice(7,29).every(v=>/^-?\d+$/.test(v.trim())))continue;
  const level=Number(c[2]);
  if(level<0||level>5)throw Error('Invalid source spell level');
  rows.push({id:rows.length,name:c[0],level});
 }
 if(rows.length<70||rows[0].name!=='Summon Boat'||rows[69].name!=='Air Elemental')throw Error('SPTRAITS source identity or row sequence is incomplete');
 return rows.slice(0,70);
}
