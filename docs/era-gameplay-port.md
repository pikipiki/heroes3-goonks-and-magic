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

Les variables nommées ERA et le service `SN:W` disposent désormais d'un
adaptateur exécutable : une même entrée conserve indépendamment un entier et
une chaîne. Les noms ASCII sont insensibles à la casse, avec conservation de
leur première orthographe, comme le dictionnaire source. Les opérations de
lecture, modification, suppression et effacement partagent ce dictionnaire.
La sauvegarde/reprise conserve les deux champs sans rejouer les instructions ;
les anciennes sauvegardes sans dictionnaire restent lisibles. Les seuils
de classes du script Advanced Classes sont compilés sans réécriture.
Les noms dynamiques non ASCII restent refusés tant que leur page de codes
n'est pas reproduite. Cette étape ne suffit pas à rendre un profil complet
jouable ; la référence est `tests/fixtures/era-gameplay/era-associative-reference.json`.

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
nécessitent encore leurs validations dédiées.

Le port comprend également les bonus magiques, les sorts supplémentaires,
le retour de l'équipement de la dernière créature et la sérialisation JSON
pour les transferts de campagne. Ces parcours supplémentaires nécessitent
encore leurs scénarios natifs dédiés.

Les bannières disposent d'un premier port vérifié : acquisition depuis le sac,
neuf styles, conservation lors du remplacement du compagnon, restitution
unique et destruction lors de son renvoi explicite. La bannière gratuite
n'est accordée qu'une fois. Sept combats vérifient les statistiques source
au rang 10 et la conservation des bonus du héros ; les autres effets de
bannière et les transitions de campagne restent à clôturer. Le détail figure
dans `scripts/era-bridge/gameplay/henchmen-banner-native-validation.json`.

Le compagnon possède aussi un menu classique accessible au pointeur depuis le
drapeau du héros. Le transfert d'une bannière tenue est proposé par un bouton
sur mobile et par le drapeau en vue classique, y compris pour un compagnon mort,
suivant cette exception du script source. Les autres mutations sont bloquées
pendant qu'un objet est tenu. Le panneau défile réellement au doigt sur téléphone
et iPad ; aucun clavier n'est nécessaire. Les combats vérifient également la
réduction de défense et le gain d'expérience de la bannière. Un combat témoin
vérifie le blocage partiel : 195 dégâts reçus sans effet, 97 lorsque la bannière
se déclenche. Les combinaisons avec les défenses intrinsèques restent à vérifier.

L'activation du compagnon est enregistrée dans la partie : les nouveaux réglages
de l'installation ne remplacent plus le choix sauvegardé. Un scénario vérifie
aussi la reprise d'une sauvegarde produite par le moteur précédent, avec le
compagnon conservé malgré un réglage d'installation désactivé.

L'expérience de troupe du compagnon de l'IA est multipliée selon la difficulté
uniquement pour le combat, puis plafonnée suivant la table source. Une base de
combat distincte préserve l'expérience enregistrée sur le héros et fournit le
rang temporaire aux bonus et aux effets de créature. Les scénarios vérifient
1000 → 1000/3000/5000 selon la difficulté et 40000 → 56000 au plafond.
Après retraite, sauvegarde, rechargement et second combat, le multiplicateur
ne s'accumule pas. Le témoin sur l'ancien moteur détecte l'absence de cet effet.
Les réglages et les sept variantes de statistiques du joueur passent aussi sur
ce moteur. Voir `scripts/era-bridge/gameplay/henchmen-ai-native-validation.json`.

## Raccordements et validations restant nécessaires

La règle ERA Scripts 779 des pierres de connaissance possède un raccordement
natif séparé. Les 120 résultats de calcul sont comparés au code original de
`h3era.exe`. Les visites en jeu vérifient le gain affiché et attribué au joueur
et à l'IA (2185), au spécialiste (2327), ainsi que le témoin désactivé (1150).
Le choix est conservé après sauvegarde malgré un changement de configuration.
Cela ne valide pas encore le pack ERA Scripts complet, ni les visites à distance
du script Sorcery I. La preuve détaillée est conservée dans
`scripts/era-bridge/gameplay/era-scripts779-native-validation.json`.

Le port natif du mithril couvre désormais les neuf familles de sites du script
42 : mines, logements, moulins/roues, universités, sanctuaires, huttes,
monolithes, chantiers navals et villes. Les achats passent par le serveur avec
contrôle du propriétaire, de la proximité, du solde et de la révision. L'état
est conservé dans la sauvegarde. Le panneau mobile présente les coûts et les
effets actifs, avec une colonne de commandes à droite en paysage.
Chaque ville utilise une seule fiche et un sélecteur tactile pour ses neuf
terrains, avec le coût du choix affiché. Les achats et le défilement sont
vérifiés sans clavier sur les formats téléphone et iPad. Le même panneau permet
les achats, le choix du terrain et la fermeture à la souris sur ordinateur,
avec des vérifications en 1280 × 720 et 1440 × 900 sans émulation tactile.

L'interface classique permet aussi un clic droit sur l'entrée du site ou un
Ctrl-clic sur son dessin, y compris lorsqu'un héros le recouvre. Une confirmation
précède le paiement ; les villes proposent les neuf terrains de siège.
Les parcours vérifiés figurent dans `outputs/era-gameplay/mithril-native-classic.json`.

L'activation du mithril est désormais enregistrée avec chaque nouvelle partie.
Changer les réglages de l'installation ne modifie plus ce choix à la reprise.
Les anciennes sauvegardes contenant des améliorations ou une graine mithril
conservent leur activation, leurs paiements et les durées restantes. Sans
choix enregistré ni trace d'utilisation, une ancienne partie reste désactivée.
Ces migrations concernent les sauvegardes natives Goonk, et non les fichiers
binaires ERA. Les résultats sont dans `outputs/era-gameplay/mithril-native-legacy.json`.

`scripts/era-bridge/gameplay/mithril.json` lie ce travail à la référence amont
figée et conserve les écarts restant à résoudre. Le réglage
`modules.mithrilEnhancements` est désactivé par défaut. Les interactions avec
les autres options WoG, l'interface classique et plusieurs parcours natifs
nécessitent encore leur validation. L'université avancée propose bien son
amélioration après la visite normale : le scénario dédié vérifie le passage
de Sagesse de base à avancée et le débit de 3000 pièces d'or. Cinq
parcours dédiés vérifient les deux choix de compétence, le cours unique,
le refus à 2999 pièces d'or, le refus du prix et une seconde visite avec un
second paiement. Les messages suivent les étapes source : accord sur le
prix, choix éventuel, puis apprentissage et paiement. Les journaux natifs
confirment aussi que la compétence choisie est attribuée avant l'accusé de
réception, tandis que le cours unique l'est après, comme dans FU8189.
L'avancement gratuit de l'IA reste à valider par des scénarios dédiés. Ce
travail ne constitue pas le port complet de la priorité 4.

Les parcours mithril vérifient aussi les récompenses effectives de la roue
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

Onze scénarios de siège complètent les parcours de sites. Le moteur applique
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
Le générateur indépendant est désormais initialisé comme FastRand.Rng :
quatre mots fournis par une source aléatoire système, puis le tirage 11–55.
Neuf états de démarrage, dont les limites de rejet, sont comparés à l'unité
Pascal originale compilée. La graine est créée au début d'une partie neuve ;
une ancienne sauvegarde sans graine l'obtient au premier changement de sort
ou de compétence. Elle n'utilise plus le générateur général de la partie.
Deux reprises de la même sauvegarde, avec et sans changement de sort, donnent
les mêmes ressources pour quatorze mines aux jours 8 et 15. Le test réussit
pour une partie neuve et pour une sauvegarde créée par l'ancien moteur, qui
échoue sur ce même test en décalant les tirages. Les preuves figurent dans
`outputs/era-gameplay/mithril-native-random-isolation.json`. Les méthodes machine du DLL ERA livré sont également exécutées sous Unicorn :
56 graines et neuf états de démarrage concordent. Seule la frontière de
l’entropie système est remplacée par des entrées contrôlées ; le démarrage
Windows complet et la synchronisation restent hors de cette exécution bornée.
La chaîne d’initialisation et le branchement VR:T/VR:R sont attestés séparément
dans `tests/fixtures/era-gameplay/era-native-random-attestation.json`.

Quatre parcours natifs vérifient les branches IA : deux compétences de base
deviennent avancées gratuitement, la troisième reste de base et une compétence
experte reste intacte. Sans amélioration, rien ne progresse. Trois unités de
mithril conservées apportent exactement 300 pièces d’or supplémentaires par
jour ; le module désactivé ne change pas les revenus. Le script source prévoit
cette compensation, sans achat automatique des sites par l’IA. Les résultats
figurent dans `outputs/era-gameplay/mithril-native-ai.json`.

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
