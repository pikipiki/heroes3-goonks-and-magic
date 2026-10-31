// IDs match the native whitelist in client/MobileBridge.cpp.
export const cheatCodes = [
  {id:0,title:'Or et ressources',code:'vcmiresources 100',description:'Ajoute 100 000 pièces d’or et 100 de chaque ressource.',target:'player'},
  {id:1,title:'Déplacements illimités',code:'vcmimove',description:'Le héros sélectionné peut se déplacer sans limite.',target:'hero'},
  {id:2,title:'Révéler la carte',code:'vcmimap',description:'Dévoile la carte pour ton joueur.',target:'player'},
  {id:3,title:'Tous les sorts',code:'vcmispells',description:'Donne au héros le livre de sorts, tous les sorts et 999 points de magie.',target:'hero'},
  {id:4,title:'Tout construire dans la ville',code:'vcmibuild',description:'Construit les bâtiments de la ville ouverte ou sélectionnée.',target:'town'},
  {id:5,title:'Gagner un niveau',code:'vcmilevel 1',description:'Fait monter le héros sélectionné d’un niveau.',target:'hero'},
  {id:6,title:'Chance maximale',code:'vcmiluck',description:'Augmente la chance du héros sélectionné.',target:'hero'},
  {id:7,title:'Moral maximal',code:'vcmimorale',description:'Augmente le moral du héros sélectionné.',target:'hero'}
];
export function unavailableReason(cheat,state={}) {
  if(!state.cheatReady)return 'Disponible pendant ton tour, sur la carte ou dans une ville.';
  if(!state.cheatsAllowed)return 'Les codes sont désactivés dans cette partie.';
  if(cheat.target==='hero'&&!state.heroName)return 'Sélectionne un héros.';
  if(cheat.target==='town'&&!state.townName&&!state.selectedTownName)return 'Ouvre ou sélectionne une ville.';
  return '';
}
