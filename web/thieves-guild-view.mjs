import {screenHeaderMarkup,actionDockMarkup,buttonMarkup,statGridMarkup,createMaterialSelects,useTabs,useScreenComponents,escapeUI,renderMarkup} from './ui/material-components.mjs';
import {getLanguage} from './i18n.mjs';
import {plainGameText} from './game-text.mjs';
import {creaturePortrait} from './creature-portraits.mjs';
const esc=value=>escapeUI(plainGameText(value??''));
const names={fr:['Rouge','Bleu','Ocre','Vert','Orange','Violet','Turquoise','Rose'],en:['Red','Blue','Tan','Green','Orange','Purple','Teal','Pink']};
const codes={fr:['Rg','Bl','Oc','Vt','Or','Vi','Tu','Rs'],en:['Rd','Bl','Tn','Gr','Or','Pu','Te','Pi']};
const labels={Towns:'Villes',Heroes:'Héros',Gold:'Or','Wood and ore':'Bois et minerai','Rare resources':'Ressources rares',Obelisks:'Obélisques',Artifacts:'Artefacts','Army strength':'Puissance des armées','Daily income':'Revenus quotidiens'};
const icon=(id,label)=>Number.isInteger(id)?`<canvas width="48" height="48" data-guild-icon="${id}" role="img" aria-label="${esc(label)}"></canvas>`:'';
export function createThievesGuildView(panel){
 let data={},view='rankings',color=null,language='',selects;
 const fr=()=>language==='fr',t=(en,french)=>fr()?french:en;
 const colorName=player=>names[language][player.color]||t('Kingdom','Royaume');
 function showView(){
  for(const button of panel.querySelectorAll('[data-guild-view]'))button.setAttribute('aria-pressed',String(button.dataset.guildView===view));
  for(const section of panel.querySelectorAll('[data-guild-section]'))section.hidden=section.dataset.guildSection!==view;
  useTabs(panel.querySelector('.guild-view-tabs'),'[data-guild-view]');
 }
 function profile(){
  const players=data.players||[],player=players.find(player=>player.color===color)||players[0],container=panel.querySelector('.guild-profile');if(!player){renderMarkup(container,`<p>${t('No intelligence available.','Aucun renseignement disponible.')}</p>`);return;}
  const skills=t(['Attack','Defense','Power','Knowledge'],['Attaque','Défense','Puissance','Connaissance']),abbreviations=t(['ATK','DEF','PWR','KNW'],['ATT','DÉF','PUI','CON']);
  const personality=fr()?({Builder:'Constructeur',Warrior:'Guerrier',Explorer:'Explorateur'}[player.personality]||player.personality):player.personality;
  renderMarkup(container,`<article class="guild-profile-card"><h3>${t('Best hero','Meilleur héros')}</h3><div class="guild-profile-identity">${icon(player.heroPortrait,player.hero||'?')}<strong>${esc(player.hero||'?')}</strong></div></article><article class="guild-profile-card"><h3>${t('Strongest creature','Créature la plus puissante')}</h3><div class="guild-profile-identity">${Number.isInteger(player.creatureId)?creaturePortrait({id:player.creatureId,name:player.creature}):''}<strong>${esc(player.creature||'?')}</strong></div><p class="guild-personality"><span>${t('Personality','Personnalité')}</span> ${esc(personality||'?')}</p></article>${statGridMarkup(skills.map((name,index)=>({name:abbreviations[index],value:player.primarySkills?.[index]??'?',icon:icon(data.primaryIcons?.[index],name)})),{label:t('Best hero characteristics','Caractéristiques du meilleur héros')})}`);
  container.querySelectorAll('.ui-stat-grid dt').forEach((node,index)=>{node.title=skills[index];node.setAttribute('aria-label',skills[index]);});
 }
 panel.addEventListener('click',event=>{const tab=event.target.closest('.guild-view-tabs [data-guild-view]');if(!tab||panel.dataset.kind!=='thieves-guild')return;view=tab.dataset.guildView;showView();});
 panel.addEventListener('change',event=>{if(!event.target.matches('[data-guild-player]'))return;color=Number(event.target.value);profile();});
 return{update(next){
  data=next||{};language=getLanguage()==='fr'?'fr':'en';const players=data.players||[];if(!players.some(player=>player.color===color))color=players[0]?.color??null;
  const flag=player=>`<span class="kingdom-flag" data-color="${player.color}" aria-hidden="true"></span>`;
  const rankings=(data.rows||[]).map(row=>`<tr><th scope="row">${esc(fr()?labels[row.label]||row.label:row.label)}</th>${players.map(player=>`<td>${row.ranks?.[player.color]?`<span class="guild-rank">${esc(row.ranks[player.color])}</span>`:`<span aria-label="${t('Unknown','Inconnu')}">?</span>`}</td>`).join('')}</tr>`).join('');
  panel.dataset.players=String(players.length);panel.dataset.guildLayout='responsive';
  renderMarkup(panel,screenHeaderMarkup({title:t('Thieves’ Guild','Guilde des voleurs'),closeAttributes:'data-service-back',closeLabel:t('Close','Fermer')})+`<nav class="guild-view-tabs" aria-label="${t('Intelligence views','Vues des renseignements')}">${['rankings','intelligence'].map((key,index)=>buttonMarkup({label:index?t('Details','Détails'):t('Ranks','Rangs'),attributes:`id="guild-tab-${key}" data-guild-view="${key}" aria-controls="guild-${key}" aria-pressed="${view===key}"`})).join('')}</nav><div class="guild-workspace" translate="no"><section id="guild-rankings" class="guild-rankings" data-guild-section="rankings" role="tabpanel" aria-labelledby="guild-tab-rankings"><table aria-label="${t('Kingdom rankings','Classements des royaumes')}"><thead><tr><th scope="col">${t('Kingdoms','Royaumes')}</th>${players.map(player=>`<th scope="col" aria-label="${esc(colorName(player))}">${flag(player)}<abbr title="${esc(colorName(player))}">${codes[language][player.color]||'?'}</abbr></th>`).join('')}</tr></thead><tbody>${rankings}</tbody></table></section><section id="guild-intelligence" class="guild-details" data-guild-section="intelligence" role="tabpanel" aria-labelledby="guild-tab-intelligence"><label class="guild-player-field"><span class="guild-field-label">${t('Kingdom to inspect','Royaume à consulter')}</span><select data-guild-player aria-label="${t('Kingdom to inspect','Royaume à consulter')}" ${players.length?'':'disabled'}>${players.map(player=>`<option value="${player.color}" ${color===player.color?'selected':''}>${esc(colorName(player))}</option>`).join('')}</select></label><div class="guild-profile"></div></section></div>`+actionDockMarkup(`<p class="guild-help" translate="no">${t('? = unknown','? = inconnu')}</p>`+buttonMarkup({label:t('Back','Retour'),attributes:'data-service-back'})));
  profile();showView();selects=createMaterialSelects(panel);selects.update();useScreenComponents(panel);
 }};
}
