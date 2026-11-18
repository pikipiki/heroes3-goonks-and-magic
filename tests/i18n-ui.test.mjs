import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTranslator} from '../web/i18n.mjs';
const catalogue=JSON.parse(fs.readFileSync(new URL('../web/i18n-dictionary.json',import.meta.url),'utf8'));
const translate=createTranslator(catalogue);

test('English battle labels cover title-case and uppercase screen tags',()=>{
 assert.equal(translate('⚔️ Écran d’action'),'⚔️ Action screen');
 assert.equal(translate('ÉCRAN D’ACTION'),'ACTION SCREEN');
 assert.equal(translate('CAMÉRA DE SUIVI'),'TRACKING CAMERA');
 assert.equal(translate('Écran d’action. Touchez une case ou une cible pour préparer une action.'),'Action screen. Tap a tile or target to prepare an action.');
});

test('Live health stats translate short PV labels without rewriting words or identifiers',()=>{
 assert.equal(translate('Wolf Rider × 6 · 10/10 PV'),'Wolf Rider × 6 · 10/10 HP');
 assert.equal(translate('40/40 HP','fr'),'40/40 PV');
 assert.equal(translate('Pick a hex or a target'),'Pick a hex or a target');
 assert.equal(translate('HPV / SPV / saved_PV / PV2'),'HPV / SPV / saved_PV / PV2');
});

test('Dynamic feedback and hero instructions translate while preserving names and amounts',()=>{
 assert.equal(translate('À placer · Ogre Leader'),'To place · Ogre Leader');
 assert.equal(translate('Construction demandée : Goblin Barracks'),'Construction requested: Goblin Barracks');
 assert.equal(translate('Recrutement confirmé : 12 créatures'),'Recruitment confirmed: 12 creatures');
 assert.equal(translate('Armée du héros (7 emplacements) : touche une troupe pour la scinder ou voir sa fiche animée.'),'Hero army (7 slots): tap a troop to split it or view its animated details.');
});

test('Contextual actions and owned war machines translate in both directions',()=>{
 for(const [fr,en]of [['Lancer Résurrection','Cast Résurrection'],['Soigner','Heal'],['Ce héros possède déjà cette machine de guerre.','This hero already owns this war machine.']]){
  assert.equal(translate(en,'fr'),fr);assert.equal(translate(fr,'en'),en);
 }
});

test('Recruitment labels and native creature names are complete in both languages',()=>{
 for(const [fr,en]of [['Salle de recrutement','Recruitment hall'],['Tout recruter','Recruit all'],['Serpent de mer','Sea Serpent'],['Léviathan','Leviathan'],['Défense','Defense'],['Attaque','Attack'],['Guilde des mages','Mage guild'],['État du bâtiment','Building status'],['Catégories','Categories'],['Campagne','Campaign'],['Nouvelle partie','New game']]){
  assert.equal(translate(en,'fr'),fr);assert.equal(translate(fr,'en'),en);
 }
 assert.equal(translate('Recruit 12','fr'),'Recruter 12');
 assert.equal(translate('Creatures in stack: 15','fr'),'Créatures dans la troupe : 15');
});

test('Already localized catalogue entries remain unchanged, including proper names',()=>{
 for(const [fr,en]of Object.entries(catalogue)){
  assert.equal(translate(fr,'fr'),fr,'French text: '+fr);
  assert.equal(translate(en,'en'),en,'English text: '+en);
 }
 assert.equal(translate('Picpique, Lancier de cristal × 3','en'),'Picpique, Crystal Lancer × 3');
 assert.equal(translate('Picpique, Crystal Lancer × 3','en'),'Picpique, Crystal Lancer × 3');
 assert.equal(translate('Bienvenue dans Heroes Goonk · 2026','fr'),'Bienvenue dans Heroes Goonk · 2026');
});
