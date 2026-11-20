import {createMaterialSelects} from '../material-select.mjs';
import {uiText} from './primitives.mjs';
const records=new WeakMap();
// One selector for mutually exclusive hero pages; native buttons remain the
// command bridge. Commander/classic actions retain their own visible controls.
export function useHeroNavigation(nav){
 if(!nav)return;
 let record=records.get(nav);
 if(!record){
  const label=document.createElement('label'),select=document.createElement('select');
  label.className='ui-hero-section-field';select.dataset.uiHeroSection='';select.dataset.uiMenuDirection='down';label.append(select);nav.prepend(label);
  record={select,fields:createMaterialSelects(nav),signature:''};records.set(nav,record);
  select.addEventListener('change',()=>{const value=select.value;nav.querySelector(value==='classic'?'[data-hero-classic]':value==='rebalance'?'[data-hero-source-rebalance]':`[data-hero-tab="${value}"]`)?.click();});
 }
 nav.classList.add('ui-hero-navigation');nav.classList.remove('ui-tabs','ui-action-dock');nav.removeAttribute('role');
 const buttons=[...nav.querySelectorAll('[data-hero-tab],[data-hero-classic],[data-hero-source-rebalance]')],selected=buttons.find(button=>button.getAttribute('aria-pressed')==='true');
 const signature=JSON.stringify(buttons.map(button=>[button.dataset.heroTab||button.hasAttribute('data-hero-classic')&&'classic'||'rebalance',button.textContent,button.disabled]));
 if(record.signature!==signature){record.select.replaceChildren(...buttons.map(button=>{const option=document.createElement('option');option.value=button.dataset.heroTab||(button.hasAttribute('data-hero-classic')?'classic':'rebalance');option.textContent=button.textContent.trim();option.disabled=button.disabled;return option;}));record.signature=signature;}
 if(selected)record.select.value=selected.dataset.heroTab;
 record.select.setAttribute('aria-label',uiText('Hero sheet section','Rubrique de la fiche du héros'));
 record.fields.update();
}
