import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {buildCompatibilityInventory} from './inventory.mjs';

const labels = {unassessed:'À rapprocher',partial:'Adaptation partielle référencée',
  'offline-adapter-only':'Adaptation hors moteur','implemented-unverified':'Implémentation sans preuve native complète',
  'validated-source-contract':'Contrat source validé'};
const cell = value => String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
const csv = rows => rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';

export function renderCompatibilityReport(report) {
  const s=report.summary;
  return `# Inventaire de compatibilité WoG / ERA\n\n`+
    `Référence : **TUM ${report.reference.tumMetadata.mod_version} fourni**, port WoG VCMI **${report.reference.wogPortVersion}**, jeu **${report.reference.release}**.\n\n`+
    `Cet inventaire couvre toutes les déclarations des fichiers source recensés. Il ne certifie pas la compatibilité intégrale ERA. « À rapprocher » indique l’absence d’un lien de preuve sémantique précis dans cet inventaire ; cela ne signifie pas que la fonctionnalité est absente du jeu.\n\n`+
    `Les règles sont identifiées par fichier, ligne, empreinte et identité source. Les liens natifs contiennent les empreintes des implémentations et des preuves. Les événements homonymes restent distincts. Une adaptation partielle ne devient pas une validation de tout l’événement.\n\n`+
    `## Résultat actuel\n\n`+
    `| Périmètre | Inventorié | État établi |\n|---|---:|---|\n`+
    `| Fichiers ERM | ${s.sourceScripts} | ${s.triggerDeclarations} déclencheurs et ${s.initializationSections} sections initiales |\n`+
    `| Événements avec adaptation référencée | ${s.eventStatuses.partial??0} | Couverture partielle, preuves historiques et périmètres explicités |\n`+
    `| Programmes de remplacement d’objets | ${s.sourceReplacers} | ${s.acceptedOfflineReplacers} acceptés par le compilateur strict hors moteur |\n`+
    `| Créatures de la table source | ${s.sourceCreatures} | Identités et empreintes ; parité globale non attestée |\n`+
    `| Fichiers CFG de créatures | ${s.creatureConfigs} | ${s.creaturePropertyRules} règles, dont ${s.resolvedCreatureConfigs} fichiers avec identité résolue |\n`+
    `| Autres configurations source | ${s.globalConfigs} | ${s.globalConfigRules} déclarations de villes, réglages et éditeur à rapprocher |\n`+
    `| Plugins Windows du pack TUM | ${s.sourcePlugins} | Empreintes recensées ; exécution binaire non prise en charge |\n`+
    `| Lignes d’expérience | ${s.experienceRules} | ${s.xpStatuses['validated-source-contract']??0} contrats de sorts validés exactement |\n`+
    `| Artefacts du catalogue | ${s.artifacts} | ${s.activeArtifacts} actifs ; ${s.artifactPropertyRules} propriétés CFG recensées |\n`+
    `| Banques de créatures | ${s.banks} | ${s.registeredBanks} définitions enregistrées ; preuves détaillées à rapprocher |\n`+
    `| Habitations de la table source | ${s.dwellings} | ${s.registeredDwellings} définitions enregistrées ; parité à rapprocher |\n\n`+
    `Les ${s.experienceRules-(s.xpStatuses['validated-source-contract']??0)} autres lignes XP incluent des bonus et des valeurs par défaut. Elles ne représentent pas autant de sorts manquants. De même, une habitation peut réutiliser une définition WoG existante ; l’absence d’une définition TUM séparée ne suffit pas à établir son absence du jeu.\n\n`+
    `### Points concrets à examiner\n\n`+
    `Les banques source suivantes n’ont pas de définition TUM enregistrée sous leur identité attendue dans le manifeste courant. Cela établit un écart d’enregistrement à examiner, sans affirmer l’absence d’un équivalent dans un autre module.\n\n`+
    `| ID source | Banque |\n|---:|---|\n`+
    report.banks.filter(b=>!b.nativeDefinitions.length).map(b=>`| ${b.sourceId} | ${cell(b.name)} |`).join('\n')+
    `\n\nLes fichiers CFG de créatures sans identité résolue sont listés séparément dans le JSON. Ils ne sont pas automatiquement des créatures à ajouter : certaines lignes peuvent être des variantes inutilisées ou dépendre d’options externes. Le fichier non numérique 350s.cfg est conservé comme cas distinct.\n\n`+
    `## Travaux de rapprochement et lacunes\n\n`+
    report.backlog.map(b=>`### ${b.priority}. ${b.title}\n\n${b.scope}\n\nCritère de clôture : ${b.acceptance}\n`).join('\n')+
    `\n## Mécanismes déjà recensés\n\n`+
    `| Mécanisme | État | Périmètre et preuve |\n|---|---|---|\n`+
    report.nativeMechanisms.map(m=>`| ${cell(m.name)} | ${cell(m.status)} | ${cell(m.scope)} ${m.evidence.map(e=>`[${path.basename(e.file)}](../${e.file})`).join(', ')} |`).join('\n')+
    `\n\nLes ${report.events.reduce((n,e)=>n+e.bindings.length,0)} liaisons événementielles détaillées dans le JSON couvrent notamment les artefacts238,259,260,197,266,261,264/265,220,262/263,268,269/270/271 et les quatre blocs de roster. Les preuves historiques gardent leur moteur d’origine : leur présence ne constitue pas une nouvelle exécution de tous les tests sur la version courante.\n\n`+
    `## Tous les scripts de la référence\n\n`+
    `Les événements et sections initiales de chaque fichier sont détaillés dans [events.csv](../outputs/era-compatibility/events.csv).\n\n`+
    `| Fichier | Déclencheurs | Adaptations référencées | Hors moteur | À rapprocher |\n|---|---:|---:|---:|---:|\n`+
    report.scripts.map(r=>`| ${cell(r.file)} | ${r.triggers} | ${r.statusCounts.partial??0} | ${r.statusCounts['offline-adapter-only']??0} | ${r.statusCounts.unassessed??0} |`).join('\n')+
    `\n\n## Sources et limites\n\n`+
    `Le manifeste complet des fichiers TUM et leurs SHA256 figurent dans [inventory.json](../outputs/era-compatibility/inventory.json). Le même fichier contient chaque propriété CFG, chaque ligne XP, chaque objet, chaque habitation et chaque module WoG recensé. Les cartes originales sont marquées désactivées par le manifeste [Maps](../mod/wake-of-gods/Mods/maps/mod.json). Les cartes Goonk publiques ne prouvent pas leur compatibilité.\n\n`+
    `Les scripts complets du WoG d’origine, les packs ERA Scripts/Reborn/Advanced Classes et les sources de tous les plugins Windows ne font pas partie de cette référence TUM. Leur couverture exhaustive exige un manifeste distinct de ces sources et versions. Aucun pourcentage global de portage n’est déduit de ces comptes.\n\n`+
    `## Régénération et contrôle\n\n`+
    '```sh\nnpm run audit:compatibility -- --source ../Third-Upgrade-Mod-Full\nnpm run audit:compatibility -- --source ../Third-Upgrade-Mod-Full --check\n```\n\n'+
    `Le contrôle échoue sur une liaison source périmée, une référence manquante, une admission XP altérée ou un rapport qui ne correspond plus aux entrées. La commande ne modifie aucune donnée du jeu et ne lit aucune sauvegarde ni préférence locale.\n`;
}

export function inventoryArtifacts(report) {
  const eventRows=report.events.map(e=>[e.id,e.source.file,e.source.line,e.source.endLine,e.source.trigger,e.status,
    e.source.codeSha256,e.bindings.map(b=>b.scope).join(' / '),
    e.bindings.flatMap(b=>b.implementation.map(p=>p.file)).join(' / '),
    e.bindings.flatMap(b=>b.evidence.map(p=>p.file)).join(' / ')]);
  return new Map([
    ['outputs/era-compatibility/inventory.json',JSON.stringify(report,null,2)+'\n'],
    ['outputs/era-compatibility/events.csv',csv([['id','sourceFile','line','endLine','trigger','status','codeSha256','scope','implementation','evidence'],...eventRows])],
    ['docs/era-compatibility.md',renderCompatibilityReport(report)]
  ]);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const {values}=parseArgs({options:{source:{type:'string',default:'../Third-Upgrade-Mod-Full'},check:{type:'boolean',default:false}}});
  const projectRoot=path.resolve('.'),sourceRoot=path.resolve(values.source);
  const bindings=JSON.parse(fs.readFileSync(new URL('./source-bindings.json',import.meta.url)));
  const report=buildCompatibilityInventory({projectRoot,sourceRoot,bindings});
  for(const [relative,contents]of inventoryArtifacts(report)) {
    const file=path.join(projectRoot,relative);
    if(values.check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==contents)throw Error('Stale compatibility inventory: '+relative);}
    else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,contents);}
  }
  console.log(JSON.stringify({checked:values.check,...report.summary},null,2));
}
