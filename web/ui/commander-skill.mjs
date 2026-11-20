import {escapeUI,uiText} from './primitives.mjs';
const skills=['attack','defense','health','damage','speed','magic'];
export const commanderSkillArt=id=>skills[id]?new URL('../h3-theme/commander/'+skills[id]+'.svg',import.meta.url).href:'';
export function createCommanderSkillIcon(id,{size=20}={}){const img=document.createElement('img');img.className='commander-skill-icon';img.src=commanderSkillArt(id);img.alt='';img.width=img.height=size;return img;}
export function commanderChoiceMarkup(choices,selected){
 const prompt=uiText('Choose a skill','Choisir une compétence');
 return `<label class="commander-choice-field"><select data-commander-choice aria-label="${escapeUI(uiText('Commander skill','Compétence du commandant'))}">${selected<0?`<option value="" selected disabled>${escapeUI(prompt)}</option>`:''}${choices.map((choice,index)=>`<option value="${index}" data-icon="${escapeUI(commanderSkillArt(choice.skillId??index))}" ${index===selected?'selected':''} ${!choice.inspectable&&!choice.selectable?'disabled':''}>${escapeUI(choice.label||prompt)}</option>`).join('')}</select></label>`;
}
