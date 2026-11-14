# Inventaire de compatibilité WoG / ERA

Référence : **TUM 3.5.0 fourni**, port WoG VCMI **9.1.82**, jeu **0.4.169**.

Cet inventaire couvre toutes les déclarations des fichiers source recensés. Il ne certifie pas la compatibilité intégrale ERA. « À rapprocher » indique l’absence d’un lien de preuve sémantique précis dans cet inventaire ; cela ne signifie pas que la fonctionnalité est absente du jeu.

Les règles sont identifiées par fichier, ligne, empreinte et identité source. Les liens natifs contiennent les empreintes des implémentations et des preuves. Les événements homonymes restent distincts. Une adaptation partielle ne devient pas une validation de tout l’événement.

## Résultat actuel

| Périmètre | Inventorié | État établi |
|---|---:|---|
| Fichiers ERM | 109 | 484 déclencheurs, 1 rappel après événement et 104 sections initiales |
| Événements avec adaptation référencée | 49 | Couverture partielle, preuves historiques et périmètres explicités |
| Programmes de remplacement d’objets | 102 | 102 acceptés par le compilateur strict ; admission native du lot167 vérifiée |
| Créatures de la table source | 363 | Identités et empreintes ; parité globale non attestée |
| Fichiers CFG de créatures | 241 | 1330 règles, dont 233 fichiers avec identité résolue |
| Autres configurations source | 14 | 511 déclarations de villes, réglages et éditeur à rapprocher |
| Plugins Windows du pack TUM | 13 | Empreintes recensées ; exécution binaire non prise en charge |
| Lignes d’expérience | 1888 | 43 contrats historiques reliés individuellement ;23 nouveaux contrats dans le lot167 |
| Artefacts du catalogue | 110 | 110 actifs ; 229 propriétés CFG recensées |
| Banques de créatures | 34 | 34 définitions enregistrées ; preuves détaillées à rapprocher |
| Habitations de la table source | 172 | 61 définitions enregistrées ; parité à rapprocher |

Le [lot167](wog-adventure-port.md) dispose d’une admission native séparée :102 programmes,18 états des six nouvelles banques,45 résultats de Grotte,54 acteurs et23 lignes XP supplémentaires. Les preuves distinguent les scénarios natifs, les primitives réutilisées et les moteurs historiques ; elles ne certifient pas tout ERA.

Les lignes XP sans liaison individuelle incluent des bonus, des valeurs par défaut et les23 nouveaux contrats regroupés séparément. Elles ne représentent pas autant de sorts manquants. De même, une habitation peut réutiliser une définition WoG existante ; l’absence d’une définition TUM séparée ne suffit pas à établir son absence du jeu.

### Points concrets à examiner

Toutes les banques de ce catalogue ont une définition enregistrée ; l’enregistrement seul n’établit pas la parité de chaque état.

Les fichiers CFG de créatures sans identité résolue sont listés séparément dans le JSON. Ils ne sont pas automatiquement des créatures à ajouter : certaines lignes peuvent être des variantes inutilisées ou dépendre d’options externes. Le fichier non numérique 350s.cfg est conservé comme cas distinct.

## Travaux de rapprochement et lacunes

### 1. Rapprocher les événements et règles sans preuve exacte

Événements, propriétés CFG, statistiques et lignes XP sans liaison sémantique individuelle ; les43 contrats historiques et les23 nouveaux contrats du lot167 ont des preuves séparées. Ne pas déclarer les contenus absents.

Critère de clôture : Une preuve et un périmètre explicites par règle, ou une lacune identifiée avec contre-exemple.

### 2. Interopérabilité Reborn, ERA Scripts et Advanced Classes

Références ES_*, AC_*, tum_reborn et conditions de dépendances dans les scripts Archer/TUM.

Critère de clôture : Définir les packs de référence, importer leurs sources et valider chaque condition utile.

### 3. Options de WoGification et dialogues

Lot169 : six règles par partie disponibles et testées, avec héritage auteur, persistance, effets natifs et défilement tactile. Les dix options forcées OFF par TUM restent exclues ; les options conditionnées par ERA Scripts/Reborn/Advanced Classes dépendent de ces packs externes.

Critère de clôture : Combinaisons supportées, interface tactile, persistance et effets sur les cartes vérifiés.

### 4. Cartes et campagnes originales WoG

Quatre campagnes, onze scénarios et Cave inventoriés ; les 137 sources des campagnes compilent avec exceptions documentées. Noyau natif de fonctions, boucles et reprise après sérialisation vérifié ; adaptations des événements, quêtes et combats et validation des victoires non terminées. Sous-mod Maps maintenu désactivé. État détaillé : docs/wog-original-campaign-runtime.md.

Critère de clôture : Inventorier scripts/dépendances puis terminer les scénarios de référence jusqu’à leurs conditions de victoire.

### 5. Étendre la référence à une distribution ERA figée

Le dépôt source fourni est TUM3.5, pas tous les packs WoG/ERA et leurs plugins Windows.

Critère de clôture : Manifeste versionné des packs, options, scripts, plugins et cartes ; remplacement natif des comportements requis.

## Mécanismes déjà recensés

| Mécanisme | État | Périmètre et preuve |
|---|---|---|
| Sorts d’expérience | validated-source-contract | 43 lignes / 36 acteurs, 40 nouveaux propriétaires et 3 services préservés. [checkpoint166-validation.json](../outputs/wog-priorities-0.4.147/checkpoint166-validation.json), [contracts.json](../outputs/wog-priorities-0.4.147/source-xp-complete166/contracts.json) |
| Artefacts source | availability-only | 110 identités actives ; les preuves de comportement restent propres à chaque mécanisme. [checkpoint162-validation.json](../outputs/wog-priorities-0.4.147/checkpoint162-validation.json) |
| Neuf recrutements de huitième famille | historical-native-contract | 18 acteurs et neuf villes ; validation historique, pas validation globale des options ERA. [eighth-reviewed-actor-contracts.json](../outputs/wog-priorities-0.4.147/eighth-reviewed-actor-contracts.json), [checkpoint159-validation.json](../outputs/wog-priorities-0.4.147/checkpoint159-validation.json) |
| Chaîne Topaze → Saphir | historical-native-contract | Évolutions, paiement et effets propres aux cinq étapes. [checkpoint157-validation.json](../outputs/wog-priorities-0.4.147/checkpoint157-validation.json) |
| Spécialistes des machines | historical-native-contract | Preuves existantes des spécialistes ; inventaire ERM événementiel encore à rapprocher. [native-machine-specialists.json](../outputs/wog-priorities-0.4.147/native-machine-specialists.json) |
| Aventures WoG et dépendances — lot167 | validated-native-scoped | 102 remplacements natifs au premier jour ;18 états des six banques ;45 résultats de Grotte ;54 acteurs et23 lignes XP supplémentaires, avec scopes natifs, transferts de primitives et continuités explicités. Les43 contrats historiques restent distincts. [descriptor-final13.json](../outputs/wog-priorities-0.4.147/adventure167/source-contracts/adventure-port/descriptor-final13.json) |
| Options de partie WoG — lot169 | validated-native-scoped | Six choix par partie avec héritage par option ; commandants, XP,195,228,300,301. Effets natifs ON/OFF, sauvegardes/rechargement et sauvegarde168 vérifiés ; six formats tactiles et stabilité des panneaux. Les options de packs externes restent hors de cette référence. [native-validation.json](../outputs/wog-priorities-0.4.147/options169/native-validation.json), [mobile-ui-validation.json](../outputs/wog-priorities-0.4.147/options169/mobile-ui-validation.json), [source-option-references.json](../outputs/wog-priorities-0.4.147/options169/source-option-references.json) |

Les 49 liaisons événementielles détaillées dans le JSON couvrent notamment les artefacts238,259,260,197,266,261,264/265,220,262/263,268,269/270/271 et les quatre blocs de roster. Les preuves historiques gardent leur moteur d’origine : leur présence ne constitue pas une nouvelle exécution de tous les tests sur la version courante.

## Tous les scripts de la référence

Les événements et sections initiales de chaque fichier sont détaillés dans [events.csv](../outputs/era-compatibility/events.csv).

| Fichier | Déclencheurs | Après événement | Adaptations référencées | Hors moteur | À rapprocher |
|---|---:|---:|---:|---:|---:|
| Data/s/-1000 tum - Archer.erm | 91 | 0 | 0 | 0 | 91 |
| Data/s/000_Beholders's Sanctuary (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/001_Mansion (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/002_Spit (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/003_Red Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/004_Black Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/005_Ivory Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/006_Churchyard (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/007_Experimental Shop (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/008_Wolf Raider Picket (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/009_Pantheon (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/010_Mithril Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/011_Experimental Factory (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/012_Wolf Raider Gaol (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/013_Blue Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/014_Lava Spit (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/015_Monstrous Eyes' Sanctuary (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/016_Haunted Mansion (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/017_Bone Pillar (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/018_City of the Dead (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/019_Sacred Temple (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/020_Seminarium (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/021_Phantom Ship (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/022_Sorceress Castle (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/023_Outpost of Souls (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/024_Rotten Dragons Valley (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/025_Magical Utopia (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/026_Legendary Dragon Utopia (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/027_Dreadnought Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/028_Heaven's Door (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/029_Forbidden Cliffs (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/030_Olympus Forbidden (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/031_Sins Generator (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/032_Dragon Mausoleum (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/033_Dragon City (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/034_Behemoth Ancient Crag (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/035_Volcanic Well (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/036_Supreme Pyre( replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/037_Elemental Stockpile (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/038_Gargoyle Stonevault (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/039_Halls of Temptation (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/040_Royal Treasury (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/041_Fire Dragon Castle (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/042_Ice Dragon Castle (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/100_Training Grounds with Archery (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/1000 tum - consts.erm | 0 | 0 | 0 | 0 | 1 |
| Data/s/1000 tum - stdlib.erm | 40 | 0 | 0 | 0 | 40 |
| Data/s/101_Giant Golden Pavilion (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/102_Wineyard (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/103_Alehouse (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/104_Ziggurat [Fangarm] (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/109_Order of Fire (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/110_Order of Ice (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/111_Dragon Slayer Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/112_Cursed Temple of Archers (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/113_Bloody Temple (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/114_Temple of Souls (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/115_Legendary Cursed Temple (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/116_Order of Thunder (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/117_Dragon Sanctuary (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/118_Laboratory (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/130_Black Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/131_Mysterious Cave (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/132_Cathedral (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/133_Treehouse (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/134_Dragon Factory (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/135_Lust Chambers (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/136_Wolf Cave (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/137_Primeval Maw (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/138_Ziggurat (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/139_Coral Reef (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/140_Swamp Hut (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/141_Drowned Hall (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/142_Ancient Crypt (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/143_Frigate of the fallen (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/144_Defunct Treetop Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/145_Training Tower (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/146_Peon Hut (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/147_Mire (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/148_Altar of Darkness (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/149_Butt Excavation (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/150_ Black Alder (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/151_Quaggy Relic (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/152_Squalid Nide (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/153_Rusty Habitation (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/154_Turquoise Passage (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/155_Baba Yaga's Hut (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/156_Sparky Meadow (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/157_Mysterious portal (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/158_Lizard Soldier Den (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/159_Slith Pool (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/160_Illusory Dragon Shrine (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/161_Primitive stable (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/162_Ruins in Lava (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/163_Evil Cathedral (replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/164_Dark Shrine(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/165_Black Pond(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/166_Gates of Tartarus(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/167_Shadow Vault(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/168_Imperial Barracks(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/169_Green Dragon Nest(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/170_Red Dragon Nest(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/171_Faerie Dragon Nest(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/172_Rust Dragon Nest(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/173_Azure Dragon Nest(replacer).erm | 2 | 0 | 0 | 1 | 2 |
| Data/s/Mysterious Cave.erm | 33 | 1 | 0 | 0 | 34 |
| Data/s/options_library.erm | 2 | 0 | 0 | 0 | 3 |
| Data/s/Third Upgrade Mod.erm | 110 | 0 | 49 | 0 | 61 |
| Data/s/Unit_and_Artifact_Description_on_CtrlClick.erm | 4 | 0 | 0 | 0 | 4 |

## Sources et limites

Le manifeste complet des fichiers TUM et leurs SHA256 figurent dans [inventory.json](../outputs/era-compatibility/inventory.json). Le même fichier contient chaque propriété CFG, chaque ligne XP, chaque objet, chaque habitation et chaque module WoG recensé. Les cartes originales sont marquées désactivées par le manifeste [Maps](../mod/wake-of-gods/Mods/maps/mod.json). Les cartes Goonk publiques ne prouvent pas leur compatibilité.

Les scripts complets du WoG d’origine, les packs ERA Scripts/Reborn/Advanced Classes et les sources de tous les plugins Windows ne font pas partie de cette référence TUM. Leur couverture exhaustive exige un manifeste distinct de ces sources et versions. Aucun pourcentage global de portage n’est déduit de ces comptes.

## Régénération et contrôle

```sh
npm run audit:compatibility -- --source ../Third-Upgrade-Mod-Full
npm run audit:compatibility -- --source ../Third-Upgrade-Mod-Full --check
```

Le contrôle échoue sur une liaison source périmée, une référence manquante, une admission XP altérée ou un rapport qui ne correspond plus aux entrées. La commande ne modifie aucune donnée du jeu et ne lit aucune sauvegarde ni préférence locale.
