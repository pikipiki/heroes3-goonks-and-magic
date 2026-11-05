import icons from './spell-icons-data.mjs';
const decoded=new Map();
export const spellIconURL=id=>icons[Number(id)]||`./web/h3-theme/spells/${Number(id)}.png`;
// Keep decoded originals alive across book openings, focus changes and categories.
// Start during mobile UI initialization, while the much larger game is loading.
export function warmSpellIcons(){
 if(typeof Image==='undefined'||decoded.size)return;
 for(const [id,url]of Object.entries(icons)){
  const image=new Image();decoded.set(id,image);image.src=url;
  image.decode?.().catch(()=>{});
 }
}
