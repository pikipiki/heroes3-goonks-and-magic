# Portage des systèmes de gameplay ERA

Demande : porter les Henchmen, les packs de progression et les règles WoG
étendues, puis les activer après portage complet. Le propriétaire a choisi des
profils séparés pour Advanced Classes et Reborn.

## État réel

**Le portage complet n'est pas terminé. Aucun nouveau système n'est activé.**
Le noyau Henchmen est maintenant raccordé aux héros, au réseau, aux combats et
aux sauvegardes. Le réglage moteur `modules.henchmen` reste désactivé par défaut.
La compilation candidate est testée localement ; son binaire n'est pas encore
intégré à la version publique.

Les profils cibles sont WoG, ERA Scripts, Advanced Classes et Reborn. Ils sont
définis séparément dans `scripts/era-bridge/gameplay/profiles.mjs`. Le contrôle
d'admission distingue les sources disponibles des preuves de fonctionnement
natif. Aucun profil ne possède actuellement ces preuves complètes.

## Références récupérées

Distribution officielle :
[ERA-Projects/era-project-eng](https://github.com/ERA-Projects/era-project-eng/tree/233993be3eea4646b5c9f351e74f0bb51101adf6),
commit `233993be3eea4646b5c9f351e74f0bb51101adf6`.
Les empreintes des 966 fichiers des six packs sont conservées dans
`scripts/era-bridge/gameplay/reference-lock.json`. La copie intégrale sous
`work/era-gameplay-reference/` et celle de Reborn sous
`work/downloads/tum-reborn-reference/` restent locales et exclues de Git et de
Graphify.

| Pack | Fichiers | Sources ERM |
|---|---:|---:|
| Enhanced Henchmen | 10 | 2 |
| Era Erm Framework | 9 | 4 |
| WoG Scripts | 171 | 92 |
| ERA Scripts | 133 | 87 |
| Advanced Classes Mod | 43 | 6 |
| Third Upgrade Mod Reborn | 600 | 145 |

Les fichiers ERS, configurations, archives et plugins sont recensés séparément
des programmes ERM. Les répertoires `disabled` restent identifiés comme tels ;
leur présence ne constitue pas une demande d'activation. Les empreintes de DLL
ne prouvent pas que leurs comportements ont été reproduits.

Reborn est récupéré depuis le
[dépôt officiel d'Archer30](https://github.com/Archer30/Third-Upgrade-Mod-Reborn/tree/a6ba42b24482a188775e4e4867ffe700dc59c85c),
au commit `a6ba42b24482a188775e4e4867ffe700dc59c85c` du 18 septembre 2025,
intitulé **Updated to 1.7.3+**. La métadonnée `mods.json` indique seulement `1.x` ;
le verrou distingue cette valeur de l'étiquette du commit. C'est le dernier
état du dépôt de l'auteur trouvé le 17 novembre 2026. Il est figé séparément de
la distribution 1.7.3 annoncée sur la page de l'auteur et accessible via Baidu.
L'accès Baidu a été bloqué, mais le dépôt officiel a permis de récupérer les
sources sans recourir à ce téléchargement. Ce blocage de source est levé.

Le dossier fourni ensuite comme référence est **HDHeroes 3 Reborn 0.9.3.4**,
par Suft/Berserker : c'est un autre pack, consacré notamment aux graphismes,
aux sons et à l'IA. Le dépôt
[VMaiko1634/Third-Upgrade-Mod-Full](https://github.com/VMaiko1634/Third-Upgrade-Mod-Full)
contient **Third Upgrade Mod 3.5.0**, déjà utilisé par Goonk ; la vérification des
références distantes n'a trouvé qu'une branche `main`, sans branche ni tag
Reborn. Aucun de ces deux paquets n'est substitué au profil TUM Reborn.

## Premier jalon Henchmen

`work/vcmi-wasm/lib/era/EraHenchmanRules.h` porte les opérations entières
utilisées par les règles suivantes :

- normalisation des réglages, bonus quotidiens et liés au niveau du héros ;
- progression et statistiques supplémentaires ;
- branches classique et alternative du coût d'expérience par niveau ;
- coût de résurrection et perte d'expérience lors d'un remplacement ;
- calcul entier de récompense avec entrées aléatoires/flottantes explicites ;
- expérience de troupe, plafonds, bannière d'expérience et difficulté de l'IA ;
- éligibilité de l'armée, priorité des candidats de l'IA et position proposée ;
- bonus de dégâts magiques et nombre de sorts supplémentaires.

Les entiers sont ramenés à 32 bits après chaque opération, sans débordement
indéfini en C++. Les treize blocs source liés, leurs lignes et leurs empreintes
figurent dans `scripts/era-bridge/gameplay/henchmen.json`. Le script original et
les réglages originaux sont conservés en fixtures, avec la licence amont.

Le modèle flottant est lié aux sources du noyau ERA
[Extern.pas](https://github.com/ethernidee/era/blob/8c2fd47b22b1e67c980f42583a525d36fc318364/Extern.pas#L572)
et [Erm.pas](https://github.com/ethernidee/era/blob/8c2fd47b22b1e67c980f42583a525d36fc318364/Erm.pas#L7677).
Les fonctions mathématiques prennent et rendent des `Single` ; l'affectation
dans une variable entière tronque le résultat. Le port conserve ces frontières
en float32, y compris l'exposant 3/5. Les identités de ces sources sont dans
`scripts/era-bridge/gameplay/math-source.json`.

Deux points empêchent encore de présenter ces calculs comme un système complet :

1. Le modèle mathématique est rapproché des sources primaires, sans comparaison
   différentielle avec le binaire livré. L'analyse native tentée a expiré avant
   de produire des preuves ; elle n'est pas comptée comme une validation.
2. Le script de récompense lit `i^battleExpAIPct^`, tandis que son réglage définit
   `i^hench_battleExpAIPct^`. Aucune définition du premier nom n'a été trouvée dans
   les cinq packs récupérés. Le port ne remplace pas silencieusement l'un par
   l'autre ; le multiplicateur runtime reste une entrée explicite.

## Noyau Henchmen vérifié en jeu

Le scénario `work/browser-tests/wog-henchmen-native-e2e.mjs` vérifie le choix
dans l'armée, l'acteur indépendant (emplacement interne −6), le gain
d'expérience, le remplacement avec retour du compagnon vivant dans l'armée,
la sauvegarde/reprise et la résurrection dans une ville possédée avec paiement
exact. Il vérifie aussi l'absence du système lorsque le réglage est désactivé.
La fiche est contrôlée à 390×844, 844×390, 568×320 et 1024×768, avec défilement,
une seule fermeture et des commandes d'au moins 44 pixels.

Les gardes invoqués par un compagnon Santa Gremlin sont multipliés par son
niveau, conformément à `hench_ManageSantaGuards`. Un scénario distinct crée une
sauvegarde avec l'ancien moteur Henchmen (`42cf1eea…`), puis vérifie le compagnon
et son expérience après reprise avec le nouveau moteur. Les empreintes des
deux moteurs figurent dans `outputs/era-gameplay/henchmen-native-core.json`.
Les sauvegardes antérieures à l'introduction des Henchmen restent à tester.

Les réglages sont lus au démarrage du scénario, normalisés suivant le script
source et conservés dans la sauvegarde. Les scénarios natifs vérifient leur
conservation malgré une modification ultérieure du fichier de réglages, la
désactivation des gardes améliorés et de l'expérience de troupe, la perte de
50 % d'expérience lors d'un remplacement sans retour dans l'armée, ainsi que
la résurrection hors ville et le refus serveur lorsque cette option est
désactivée. Les parcours de magie et de transfert de campagne avec ces réglages
nécessitent encore leurs validations dédiées ; les réglages de bannières ne
constituent pas encore une implémentation de leur équipement.

Le port comprend également les bonus magiques, les sorts supplémentaires,
le retour de l'équipement de la dernière créature et la sérialisation JSON
pour les transferts de campagne. Ces parcours supplémentaires nécessitent
encore leurs scénarios natifs dédiés.

## Raccordements et validations restant nécessaires

Le port natif du mithril couvre désormais les neuf familles de sites du script
42 : mines, logements, moulins/roues, universités, sanctuaires, huttes,
monolithes, chantiers navals et villes. Les achats passent par le serveur avec
contrôle du propriétaire, de la proximité, du solde et de la révision. L'état
est conservé dans la sauvegarde. Le panneau mobile présente les coûts et les
effets actifs, avec une colonne de commandes à droite en paysage.

`scripts/era-bridge/gameplay/mithril.json` lie ce travail à la référence amont
figée et conserve les écarts restant à résoudre. Le réglage
`modules.mithrilEnhancements` est désactivé par défaut. Les interactions avec
les autres options WoG, l'interface classique et plusieurs parcours natifs
nécessitent encore leur validation. L'université avancée propose bien son
amélioration après la visite normale : le scénario dédié vérifie le passage
de Sagesse de base à avancée et le débit de 3000 pièces d'or. Trois
scénarios supplémentaires vérifient chacun des deux choix de compétence et
le refus à 2999 pièces d'or, avec le message prévu par la règle source et
sans perte d'or ni de compétence. L'avancement gratuit de l'IA et
l'enchaînement exact des dialogues source restent à vérifier et porter. Ce
travail ne constitue pas le port complet de la priorité 4.

Les 21 scénarios mithril vérifient aussi les récompenses effectives de la roue
à eau pendant les deux premières semaines, la conservation des quatre stocks
du Conflux après amélioration et la visite de caméra des sorties de monolithe,
suivie du retour à l'entrée. Le panneau se ferme pour laisser voir ce parcours
et présente les quatre créatures améliorées du Conflux.
Changer le sort d'un sanctuaire ou la compétence d'une hutte conserve désormais
les autres récompenses et variables de l'objet. Le scénario de régression
ajoute une récompense en or tirée au hasard au sanctuaire : sa valeur reste
identique après le changement de sort et une nouvelle visite. Le moteur
précédent échoue sur ce même scénario parce qu'il régénère tout l'objet.
Les commandes du mithril disposent d'une plage distincte de celles de l'armée
et de l'inspection en combat. Les scénarios natifs ouvrent la fiche du compagnon
pendant le combat et vérifient le renvoi avec confirmation, le rejet des
demandes périmées, les transferts et le dépôt de troupes avec sauvegarde/reprise.

Onze scénarios de siège complètent les 21 parcours de sites. Le moteur applique
le terrain acheté lors de l'initialisation du combat, au lieu de l'écraser par
le terrain natal de la ville. Les neuf choix sont vérifiés : moral selon
l'alignement, chance des troupes neutres, maîtrise experte des quatre écoles
de magie ou de toutes les écoles, et restrictions de la Terre maudite.
Un nouvel achat remplace l'effet précédent. Le scénario de reprise conserve
les Plaines magiques après sauvegarde, puis vérifie leurs sorts de masse dans
le siège suivant. Ces preuves figurent dans
`outputs/era-gameplay/mithril-native-sieges.json`.

La règle WoG 122 change la ressource produite par les mines chaque lundi à
partir du jour 8. Elle possède un réglage conservé dans la sauvegarde ; sa
valeur livrée est désactivée. Lorsqu'elle est active, le mithril protège la mine
jusqu'au prochain changement hebdomadaire, avec les coûts source 1/3/1/3/3/3/5.
Cette protection n'augmente pas la production. Quatre scénarios vérifient le
réglage conservé malgré un changement de configuration, la protection achetée
le dimanche, la consommation de cette protection le lundi, la production
standard après tirage et la reprise des mines modifiées.

La règle 114 crée des Plaines magiques au début du tour de leur propriétaire,
dès le deuxième jour, à deux cases à
droite et une case plus bas de chaque héros en surface. Elle écarte l'eau,
les cases bloquées et les entrées d'objets, et interdit les achats de terrains
de ville au mithril. Huit variantes natives vérifient ces exclusions, le
premier jour, le souterrain, l'effet des quatre écoles expertes en combat,
la reprise du réglage et du terrain, et son fonctionnement sans le module
mithril. Deux variantes supplémentaires vérifient l'absence du terrain
adverse avant son tour et sa présence après. Le moteur précédent échoue
sur le premier de ces deux cas en donnant les sorts de masse trop tôt. Les preuves figurent dans
`outputs/era-gameplay/map-rules-native-daily-plains.json`.

Les règles WoG 115 et 128 ajoutent respectivement une frappe supplémentaire
et le souffle sur la case derrière la cible. Elles excluent les machines
145–149, les commandants 174–191 et les créatures techniques 122/124/126/128
comme le script source. Les capacités sont appliquées au niveau de la partie,
répliquées et sauvegardées, sans modifier la bibliothèque commune des créatures.
Douze variantes natives vérifient les dégâts directs et collatéraux, une seule
riposte, les règles séparées, les effets déjà présents du Loup pillard et du
Dragon vert, les fiches du Gobelin et de la Baliste, la créature Paladin,
la sauvegarde et les frappes de l'IA neutre. Le Loup pillard ne gagne pas de
troisième frappe. Les aperçus reposant uniquement sur le prototype de
recrutement restent à adapter. Les preuves figurent dans
`outputs/era-gameplay/map-rules-native-creatures.json`.

La règle WoG 121 double les budgets de déplacement sur terre et en bateau
dans le calcul commun aux trajets, à l'affichage et au renouvellement
quotidien. Cinq parcours natifs vérifient les valeurs 4000 et 3000, la
consommation normale de 100 points par case, le renouvellement le lendemain,
la sauvegarde d'un budget entamé et la conservation du réglage malgré un
changement de configuration. Les cas désactivés conservent 2000 et 1500
points. Un héros recruté à la taverne reçoit immédiatement son budget doublé
complet. Ces preuves figurent dans
`outputs/era-gameplay/map-rules-native-movement.json`.

La règle WoG 124 autorise plusieurs Capitoles pour un même joueur, en
conservant les coûts et prérequis propres à chaque ville. Son réglage est
figé par partie. Trois parcours natifs vérifient la construction et le débit
de 10000 pièces d'or dans une seconde ville Château, la limite habituelle
quand le réglage est désactivé, et sa conservation après sauvegarde malgré
un changement de configuration globale. Deux parcours supplémentaires
vérifient la conservation d'un Capitole capturé avec la règle active et
sa suppression habituelle quand elle est désactivée. Le moteur précédent
échoue sur le premier cas en détruisant le bâtiment capturé. Cette règle ne porte pas les
anciennes neuvième et dixième compétences : son remplacement par les
Capitoles multiples est celui de la révision ERA de décembre 2022.

Les sanctuaires suivent le mélange des 70 sorts de la bibliothèque ERA avant
de prendre le premier sort admissible ; les huttes utilisent le tirage sûr
SplitMix32. Le moteur conserve une graine dans la plage source 11–55 et un
compteur par objet. Les calculs sont comparés au Pascal original compilé :
56 graines, bornes signées et cas de rejet, plus des séquences de 32 tirages
pour les 45 graines possibles. Six scénarios natifs vérifient les séquences,
l'exclusion des offres courantes et interdites, et leur continuation après
sauvegarde/reprise. La référence et ses sources figées sont dans
`tests/fixtures/era-gameplay/mithril-random-reference.json`.
La comparaison porte sur ces calculs ; l'isolation du flux aléatoire global
et l'initialisation du générateur unique nécessitent encore leur rapprochement
avec l'exécutable ERA livré.

- Parcours de mort en combat, transferts de campagne et anciennes sauvegardes.
- Choix/équipement des bannières et interactions avec les autres capacités.
- Progression de troupe de l'IA et interface classique.
- Vérifications natives dédiées des sorts, inventaires et variantes de placement.
- Port des règles et remplacements natifs requis par les autres packs.
- Validation des profils complets avant toute activation publique.

## Contrôles reproductibles

```sh
node scripts/era-bridge/gameplay/henchmen.mjs --check
node scripts/era-bridge/gameplay/reference.mjs work/era-gameplay-reference --check
node --test tests/era-henchman-rules-native.test.mjs tests/era-henchmen-contract.test.mjs tests/era-gameplay-profiles.test.mjs
```

Le premier contrôle ne dépend pas du checkout amont. Le second exige la copie
locale au commit figé et vérifie les fichiers réels. Les tests natifs compilent
la bibliothèque sous UBSan. La validation en jeu est distincte :

```sh
PORT=8797 GOONK_ENGINE_DIR=work/downloads/henchmen-native-engine node work/browser-tests/server.mjs
node work/browser-tests/wog-henchmen-native-e2e.mjs
```

Ce scénario utilise une carte synthétique et des sauvegardes éphémères en
mémoire. Il ne modifie aucune sauvegarde personnelle ni donnée publiée.
