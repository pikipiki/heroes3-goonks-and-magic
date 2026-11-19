import {screenHeaderMarkup,actionDockMarkup,buttonMarkup,statGridMarkup,createMaterialSelects,useRadarChart,useScreenComponents,escapeUI,renderMarkup} from './ui/material-components.mjs';
import {getLanguage} from './locale-state.mjs';
import {plainGameText} from './game-text.mjs';
import {creaturePortrait} from './creature-portraits.mjs';
const esc=value=>escapeUI(plainGameText(value??''));
const names={fr:['Rouge','Bleu','Ocre','Vert','Orange','Violet','Turquoise','Rose'],en:['Red','Blue','Tan','Green','Orange','Purple','Teal','Pink']};
const codes={fr:['Rg','Bl','Oc','Vt','Or','Vi','Tu','Rs'],en:['Rd','Bl','Tn','Gr','Or','Pu','Te','Pi']};
const labels={Towns:'Villes',Heroes:'Héros',Gold:'Or','Wood and ore':'Bois et minerai','Rare resources':'Ressources rares',Obelisks:'Obélisques',Artifacts:'Artefacts','Army strength':'Puissance des armées','Daily income':'Revenus quotidiens'};
const icon=(id,label)=>Number.isInteger(id)?`<canvas width="48" height="48" data-guild-icon="${id}" role="img" aria-label="${esc(label)}"></canvas>`:'';
export function createThievesGuildView(panel){
 let data={},view='radar',color=null,comparison=null,language='',selects,disposeRadar;
 const fr=()=>language==='fr',t=(en,french)=>fr()?french:en;
 const colorName=player=>names[language][player.color]||t('Kingdom','Royaume');
 function showView(){
  for(const button of panel.querySelectorAll('[data-guild-view]'))button.setAttribute('aria-pressed',String(button.dataset.guildView===view));
  for(const section of panel.querySelectorAll('[data-guild-section]'))section.hidden=section.dataset.guildSection!==view;
  if(view==='radar')radar();
 }
 function radar(){
  disposeRadar?.();disposeRadar=null;
  const host=panel.querySelector('[data-guild-radar]');if(!host)return;
  const players=data.players||[],selected=[players.find(player=>player.color===color),players.find(player=>player.color===comparison&&player.color!==color)].filter(Boolean);
  const rows=(data.rows||[]).filter(row=>selected.length>0&&selected.every(player=>Number.isInteger(row.ranks?.[player.color])&&row.ranks[player.color]>=1&&row.ranks[player.color]<=players.length));
  const status=panel.querySelector('.guild-radar-status'),legend=panel.querySelector('.guild-radar-legend');
  status.textContent=rows.length<3?t('Not enough shared intelligence: at least 3 known rankings are needed.','Renseignements communs insuffisants : au moins 3 classements connus sont nécessaires.'):t(`${rows.length} known rankings. Unknown rankings are omitted.`,`${rows.length} classements connus. Les classements inconnus sont omis.`);
  renderMarkup(legend,selected.map((player,index)=>`<span data-guild-series="${index}">${esc(colorName(player))}</span>`).join(' / '));
  host.hidden=rows.length<3;summaryVisibility();
  function summaryVisibility(){panel.querySelector('.guild-radar-summary')?.classList.toggle('guild-radar-known-facts',rows.length<3);}
  const summary=panel.querySelector('.guild-radar-summary');
  renderMarkup(summary,`<ul>${(rows.length<3?(data.rows||[]):rows).map(row=>`<li>${esc(fr()?labels[row.label]||row.label:row.label)}: ${selected.map(player=>`${esc(colorName(player))} ${row.ranks?.[player.color]??'?'} `).join(' ; ')}</li>`).join('')}</ul>`);
  if(rows.length>=3){const palette=['#f8d575','#82d7ef'];disposeRadar=useRadarChart(host,{metrics:rows.map(row=>({name:fr()?labels[row.label]||row.label:row.label,max:players.length,min:0})),series:selected.map((player,index)=>({id:`kingdom-${player.color}`,label:colorName(player),color:palette[index],data:rows.map(row=>players.length+1-row.ranks[player.color]),fillArea:index===0,hideMark:false,valueFormatter:value=>t(`Rank ${players.length+1-value}`,`Rang ${players.length+1-value}`)})),label:t('Kingdom rankings radar. Exact ranks are available in the table tab.','Radar des classements des royaumes. Les rangs exacts sont disponibles dans l’onglet tableau.')});}
 }
 function profile(){
  const players=data.players||[],player=players.find(player=>player.color===color)||players[0],container=panel.querySelector('.guild-profile');if(!player){renderMarkup(container,`<p>${t('No intelligence available.','Aucun renseignement disponible.')}</p>`);return;}
  const skills=t(['Attack','Defense','Power','Knowledge'],['Attaque','Défense','Puissance','Connaissance']),abbreviations=t(['ATK','DEF','PWR','KNW'],['ATT','DÉF','PUI','CON']);
  const personality=fr()?({Builder:'Constructeur',Warrior:'Guerrier',Explorer:'Explorateur'}[player.personality]||player.personality):player.personality;
  renderMarkup(container,`<article class="guild-profile-card"><h3>${t('Best hero','Meilleur héros')}</h3><div class="guild-profile-identity">${icon(player.heroPortrait,player.hero||'?')}<strong>${esc(player.hero||'?')}</strong></div></article><article class="guild-profile-card"><h3>${t('Strongest creature','Créature la plus puissante')}</h3><div class="guild-profile-identity">${Number.isInteger(player.creatureId)?creaturePortrait({id:player.creatureId,name:player.creature}):''}<strong>${esc(player.creature||'?')}</strong></div><p class="guild-personality"><span>${t('Personality','Personnalité')}</span> ${esc(personality||'?')}</p></article>${statGridMarkup(skills.map((name,index)=>({name:abbreviations[index],value:player.primarySkills?.[index]??'?',icon:icon(data.primaryIcons?.[index],name)})),{label:t('Best hero characteristics','Caractéristiques du meilleur héros')})}`);
  container.querySelectorAll('.ui-stat-grid dt').forEach((node,index)=>{node.title=skills[index];node.setAttribute('aria-label',skills[index]);});
 }
 panel.addEventListener('click',event=>{const tab=event.target.closest('.guild-view-tabs [data-guild-view]');if(!tab||panel.dataset.kind!=='thieves-guild')return;view=tab.dataset.guildView;showView();});
 panel.addEventListener('change',event=>{if(event.target.matches('[data-guild-compare]')){comparison=event.target.value===''?null:Number(event.target.value);radar();return;}if(!event.target.matches('[data-guild-player]'))return;color=Number(event.target.value);if(comparison===color){comparison=null;const compare=panel.querySelector('[data-guild-compare]');if(compare)compare.value='';}panel.querySelectorAll('[data-guild-player]').forEach(input=>{input.value=String(color);});selects?.update();profile();radar();});
 return{update(next){
  disposeRadar?.();disposeRadar=null;data=next||{};language=getLanguage()==='fr'?'fr':'en';const players=data.players||[];if(!players.some(player=>player.color===color))color=players[0]?.color??null;
  if(!players.some(player=>player.color===comparison)||comparison===color)comparison=null;
  const playerField=(compare=false)=>`<label class="guild-player-field"><span class="guild-field-label">${compare?t('Compare with','Comparer avec'):t('Kingdom to inspect','Royaume à consulter')}</span><select ${compare?'data-guild-compare':'data-guild-player'} aria-label="${compare?t('Compare with','Comparer avec'):t('Kingdom to inspect','Royaume à consulter')}" ${players.length?'':'disabled'}>${compare?`<option value="" ${comparison===null?'selected':''}>${t('No comparison','Sans comparaison')}</option>`:''}${players.map(player=>`<option value="${player.color}" ${(compare?comparison:color)===player.color?'selected':''}>${esc(colorName(player))}</option>`).join('')}</select></label>`;
  const flag=player=>`<span class="kingdom-flag" data-color="${player.color}" aria-hidden="true"></span>`;
  const rankings=(data.rows||[]).map(row=>`<tr><th scope="row">${esc(fr()?labels[row.label]||row.label:row.label)}</th>${players.map(player=>`<td>${row.ranks?.[player.color]?`<span class="guild-rank">${esc(row.ranks[player.color])}</span>`:`<span aria-label="${t('Unknown','Inconnu')}">?</span>`}</td>`).join('')}</tr>`).join('');
  panel.dataset.players=String(players.length);panel.dataset.guildLayout='responsive';
  renderMarkup(panel,screenHeaderMarkup({title:t('Thieves’ Guild','Guilde des voleurs'),closeAttributes:'data-service-back',closeLabel:t('Close','Fermer')})+`<nav class="guild-view-tabs" data-ui-tabs data-ui-tabs-landscape aria-label="${t('Intelligence views','Vues des renseignements')}">${['radar','rankings','intelligence'].map(key=>buttonMarkup({label:key==='radar'?t('Radar','Radar'):key==='rankings'?t('Table','Tableau'):t('Details','Détails'),attributes:`id="guild-tab-${key}" data-guild-view="${key}" aria-controls="guild-${key}" aria-pressed="${view===key}"`})).join('')}</nav><div class="guild-workspace" translate="no"><section id="guild-radar" class="guild-radar" data-guild-section="radar" role="tabpanel" aria-labelledby="guild-tab-radar"><div class="guild-radar-controls">${playerField()}${playerField(true)}</div><p class="guild-radar-explanation">${t('Compare known kingdom rankings. Points farther from the centre indicate a better rank.','Compare les classements connus des royaumes. Les points éloignés du centre indiquent un meilleur rang.')}</p><p class="guild-radar-status" role="status"></p><p class="guild-radar-legend"></p><div class="guild-radar-chart" data-guild-radar aria-describedby="guild-radar-summary"></div><div id="guild-radar-summary" class="guild-radar-summary"></div></section><section id="guild-rankings" class="guild-rankings" data-guild-section="rankings" role="tabpanel" aria-labelledby="guild-tab-rankings"><table aria-label="${t('Kingdom rankings','Classements des royaumes')}"><thead><tr><th scope="col">${t('Kingdoms','Royaumes')}</th>${players.map(player=>`<th scope="col" aria-label="${esc(colorName(player))}">${flag(player)}<abbr title="${esc(colorName(player))}">${codes[language][player.color]||'?'}</abbr></th>`).join('')}</tr></thead><tbody>${rankings}</tbody></table></section><section id="guild-intelligence" class="guild-details" data-guild-section="intelligence" role="tabpanel" aria-labelledby="guild-tab-intelligence">${playerField()}<div class="guild-profile"></div></section></div>`+actionDockMarkup(`<p class="guild-help" translate="no">${t('? = unknown','? = inconnu')}</p>`));
  profile();showView();selects=createMaterialSelects(panel);selects.update();useScreenComponents(panel);
 }};
}
