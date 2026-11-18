# Portage des systèmes de gameplay ERA

Demande : porter les Henchmen, les packs de progression et les règles WoG
étendues, puis les activer après portage complet. Le propriétaire a choisi des
profils séparés pour Advanced Classes et Reborn.

## État réel

**Le portage complet n'est pas terminé. Les profils complets restent désactivés.**
Le noyau Henchmen est maintenant raccordé aux héros, au réseau, aux combats et
aux sauvegardes. Le réglage moteur `modules.henchmen` reste désactivé par défaut.
Les étapes vérifiées sont intégrées progressivement aux binaires publiés.
Les règles WoG validées disposent de choix indépendants par nouvelle partie.

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

Le calcul original `Calc_Class_Points_Original` d’Advanced Classes 1.1
est désormais compilé avec ses 339 instructions inchangées et exécuté dans
le moteur candidat. Le lecteur accepte les conditions structurées `if/el/en`
et les identifiants de fonctions explicitement liés, dans un contrat AST v2.
Les programmes classiques conservent le contrat v1 et leur sortie binaire
JSON ; les anciens moteurs refusent le contrat v2.
La lecture `HE:B2` retourne la classe réelle du héros sans autoriser sa mutation.

Les parcours natifs tactiles en paysage et portrait, ainsi qu’à la souris,
vérifient les points des compétences présentes, leurs drapeaux de maîtrise,
le mode facilité au niveau 27, le Badge du courage dans le sac puis équipé,
et les récompenses d’arène. Une sauvegarde pendant une condition restaure
le dialogue et poursuit la branche choisie sans la réévaluer ni la rejouer.
Les dépendances de classe du commandant et d’ensembles d’artefacts utilisent
ici des réponses contrôlées : leurs calculs réels restent à porter, de même
que les promotions, compétences au-delà du niveau Expert et autres systèmes
du pack. Cette validation bornée n’admet pas le profil complet. Les preuves
figurent dans `scripts/era-bridge/gameplay/advanced-class-points-native-validation.json`.

Le compilateur prend aussi en charge les variables scalaires locales `x`/`y`
d’ERM2 : déclarations `VA` ou en ligne, allocations dans les limites source
16/100, remise à zéro du dictionnaire de noms à chaque nouveau déclencheur,
et interpolation des noms de héros dans les variables persistantes.
Le script original `acm_GetHeroClass` s’exécute ainsi sans réécriture :
16 combinaisons de drapeaux Maître/Grand Maître vérifient les classes simples
et hybrides, leur priorité, un autre héros et la préservation des variables
lors d’un appel imbriqué. Les sauvegardes sont reprises au toucher en portrait
et à la souris. Ces drapeaux sont des entrées contrôlées ; cette étape ne
porte pas encore leur attribution par les promotions. Les variables locales
`e` restent refusées ; les chaînes locales `z` disposent du contrat borné ci-dessous.
La preuve bornée est `scripts/era-bridge/gameplay/advanced-class-identity-native-validation.json`.

Les tableaux locaux numériques `x`/`y` à indices constants utilisent désormais
les mêmes plages contiguës que les scalaires. Les indices négatifs, `[SIZE]`,
les adresses `(@tableau)` et les tailles constantes respectent le préprocesseur
ERA ; une taille zéro réserve un emplacement, comme dans le noyau d’origine.
Les tableaux dépassant les 16 arguments ou 100 variables locales sont refusés.
Les parcours natifs vérifient un appel imbriqué, la restitution des quatre
arguments, les deux limites des plages et deux sauvegardes/reprises en portrait,
paysage et à la souris. Les 133 anciens programmes et la sonde Advanced Classes
compilée conservent exactement leurs octets. Cette extension produit le contrat
AST v4 existant ; elle n’admet pas encore les helpers de tableaux de chaînes
des packs complets. Preuve bornée :
`scripts/era-bridge/gameplay/era3-local-arrays-native-validation.json`.

Les chaînes locales nommées `z` et leurs tableaux utilisent maintenant les dix
cellules négatives ERA3. Pour une allocation de trois cellules, les éléments
occupent `z-3`, `z-2`, `z-1` ; les adresses calculées ajoutent l’indice à cette
base. La réutilisation des plages conserve leur contenu. Le résultat inhabituel
de `[SIZE]` sur cette plage négative suit le calcul source : pour cette première
allocation de trois cellules, il vaut `-1`, et non la longueur du tableau.
Chaque appel commence avec des chaînes vides ; un retour normal ou anticipé
restaure les chaînes de l’appelant. Les gestionnaires d’un même déclencheur
partagent leur plage. Les sauvegardes conservent aussi les appels imbriqués
et les chaînes à restaurer après un événement suspendu.

Cette extension utilise AST v6 et la sauvegarde native 920, sans changer les
19 choix de partie. Les anciens programmes conservent leurs contrats et leur
comportement. Les valeurs admises sont ASCII, sans NUL, jusqu’à 511 octets ;
les conversions de page de codes et la troncature restent à rapprocher de la
source avant admission. Les arguments `FU:P` textuels, les locales `e`, les
chaînes ERT et les profils complets restent à porter. La preuve bornée est
`scripts/era-bridge/gameplay/era3-string-locals-native-validation.json`.

Les adaptateurs natifs utilisent aussi cette portée lorsque `UN:N` écrit un
nom dans une cellule locale, et lorsque les dialogues reçoivent un indice de
chaîne numérique. Les menus à choix lisent donc les textes du bon appel,
y compris après une sauvegarde imbriquée. Le contrôle sur le moteur précédent
reproduit les noms locaux vides et le remplacement d’un libellé par un appel
imbriqué ; le moteur corrigé conserve les trois noms attendus. Les lecteurs de
sauvegarde antérieurs à 921 refusent ce nouveau format. Les indices numériques
des portraits et messages d’événement passent par le même résolveur ; leurs
scénarios ERA3 complets restent à vérifier. Preuve bornée :
`scripts/era-bridge/gameplay/era3-string-receivers-native-validation.json`.

La forme ERA3 `VR:R0/min/max` dispose du contrat AST v7 : le premier entier
est ignoré, et le tirage inclusif entre les deux bornes remplace la valeur
précédente. Des bornes égales ou inversées rendent la borne minimale sans
consommer de tirage. La forme à un paramètre conserve son addition ; en ERA3, une borne supérieure
nulle ou négative ne consomme aucun tirage et conserve la valeur précédente.
Les scénarios natifs couvrent les bornes signées, le domaine int32 entier,
une sauvegarde imbriquée et la reproduction exacte de la suite après reprise
d’un même point de contrôle. La sauvegarde devient 922, avec toujours 19 choix
de partie. Le générateur utilisé est celui du jeu natif ; son flux n’est pas
présenté comme identique au générateur ERA. Le réensemencement, les paramètres
libres et le générateur indépendant `VR:T` restent à porter. Preuve bornée :
`scripts/era-bridge/gameplay/era3-random-ranges-native-validation.json`.

La libération explicite `VA(-nom)` des variables et tableaux `x`/`y` suit
également l’allocateur ERA : récupération de la fin de plage ou ajout du bloc
à la liste libre, puis première plage assez grande en partant de la plus récente.
Les blocs voisins ne sont pas fusionnés. La réutilisation conserve le contenu
des registres du déclencheur ; elle n’insère aucune remise à zéro. Les scénarios
natifs vérifient les adresses effectivement choisies, les valeurs conservées,
la réallocation d’un nom dans l’autre plage et une reprise pendant ce parcours.
Les nouveaux déclencheurs repartent avec des plages vides et les mêmes limites.
La preuve des tableaux ci-dessus couvre aussi ces règles de libération.

Le bornage entier `VR:F` applique les limites dans l’ordre ERA (maximum,
puis minimum), y compris pour un intervalle inversé, puis utilise la valeur
de remplacement éventuelle sans la borner une seconde fois. Les nouveaux
programmes qui utilisent cette opération portent un contrat AST v3, refusé
par les lecteurs précédents avant l’exécution de leurs instructions. Les
contrats v1/v2 existants conservent leurs programmes compilés. Les bornes
omises `d`, les flottants et les dialogues de diagnostic restent hors périmètre.

Les fonctions originales `acm_GetSecSkillLevel` et `acm_SetSecSkillLevel`
s’exécutent également dans le moteur candidat : les niveaux demandés sont
bornés entre 0 et 5, tandis que le moteur conserve un niveau natif entre 0
et 3. Douze entrées, dont les extrêmes signés, une baisse du niveau natif et
une autre compétence sont vérifiées avec sauvegarde/reprise. Les adaptateurs
de drapeaux de maîtrise sont ici contrôlés et limités à Pathfinding ; les
helpers originaux utilisant les tableaux de noms et les chaînes locales
restent à porter, ainsi que les effets des compétences Maître/Grand Maître.
Ces essais sont regroupés avec les calculs et classes déjà vérifiés dans
une même partie, sur téléphone en portrait/paysage et à la souris, pour
réduire le coût des contrôles sans remplacer le moteur par une simulation.
La preuve est `scripts/era-bridge/gameplay/advanced-class-skill-levels-native-validation.json`.

Les appels numériques `FU:P` disposent maintenant d’un mode ERA 3 distinct :
les paramètres en entrée/sortie reçoivent leur valeur courante, les registres
`x` non transmis démarrent à zéro, puis les sorties sont recopiées dans leur
ordre d’origine. Les campagnes WoG 3.58 conservent la convention précédente,
avec passage de l’indice de destination. Les programmes ERA utilisent un
contrat AST v4 explicite ; les importations refusent un mélange silencieux
des deux conventions. Les importations de sources ERA sans signature `ZVSE2`
peuvent déclarer leur dialecte à l’échelle du lot.

Un témoin natif vérifie l’ancien résultat avant et après le changement. Les
parcours ERA 3 vérifient les sorties numériques ordinaires, nommées et rapides,
les destinations dupliquées, les registres de l’appelant et la sauvegarde
suspendue dans un appel imbriqué. Les chaînes/ERT, les modificateurs, les
arguments de comparaison et les boucles `DO` restent hors de ce mode borné.
Cette étape ne valide pas le profil complet.
La preuve est `scripts/era-bridge/gameplay/era3-numeric-calls-native-validation.json`.

Les appels ERA 3 sauvegardent aussi les quinze variables rapides `f` à `t`.
La fonction appelée hérite de leurs valeurs ; au retour, l’appelant les retrouve
avant la recopie des sorties, y compris lors d’un retour anticipé. Les reprises
natives couvrent deux appels imbriqués, un instantané vide, les extrêmes signés
et les sorties vers `f` et `g`. Le témoin sur le moteur précédent reproduit
l’écrasement des variables de l’appelant. La nouvelle capacité de sauvegarde
empêche ce moteur de perdre silencieusement les instantanés ; il refuse le
nouveau fichier avant d’exécuter les scripts. Les continuations anciennes sans
instantané gardent leur comportement partagé au retour, tandis que les nouveaux
appels enregistrent leur instantané. Ce correctif conservait les seize choix existants. Les
règles des déclencheurs, les registres réservés et les locales `z`/`e` restent
hors du périmètre de ce correctif `FU:P`. Preuve :
`scripts/era-bridge/gameplay/era3-quick-scope-native-validation.json`.

Le nombre d’arguments et leurs indicateurs de syntaxe numériques sont portés
avec `FU:A` et `FU:S` dans un contrat AST v5 explicite. Les arguments manquants
peuvent recevoir des valeurs par défaut ; ces valeurs sont évaluées avant la
modification des registres. Un argument transmis en sortie donne l’indicateur
zéro, une entrée ordinaire ou non transmise donne un. Les extensions à chaînes,
flottants et modificateurs restent refusées. Le lecteur précédent accepte
v4 et refuse v5 avant exécution. Le codec réel et les parcours natifs vérifient
les appels sans argument, les 16 arguments, les destinations nommées/rapides,
les valeurs par défaut dépendantes et les métadonnées d’appels imbriqués
après sauvegarde/reprise en portrait, paysage et à la souris. Cette étape
ne valide pas les profils complets.
La preuve est `scripts/era-bridge/gameplay/era3-function-metadata-native-validation.json`.

Le traitement de fin de combat Henchmen suit aussi les deux côtés, sans filtre
supplémentaire sur le vainqueur ou le match nul. Le script source applique son
filtre de gain nul uniquement avec `campaignTransfer`. Six parcours natifs
vérifient un compagnon humain vivant après retraite : 100 points fixes avec
transfert désactivé, zéro avec transfert activé, sans expérience pour le héros.
Le héros retiré est inspecté dans la taverne avant recrutement, puis de nouveau
après une sauvegarde/reprise, sur téléphone portrait/paysage et à la souris.
Un témoin avec l'ancien moteur confirme la récompense manquante. Les combats
nuls, autres pertes, gains négatifs et acteurs absents restent à vérifier.
La preuve est `scripts/era-bridge/gameplay/henchmen-battle-outcomes-native-validation.json`.

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

1. Une comparaison bornée exécute les fonctions mathématiques extraites de la
   DLL et le véritable en-tête C++ compilé en WebAssembly : aucun écart avec
   l'expression du port sur 6 865 entrées initiales et un million de bases de
   coût, pour chacun des mots de contrôle x87 `0x037f` et `0x027f`. La fixture
   permanente vérifie 452 assertions sur des valeurs sélectionnées, sans code
   Windows. Les empreintes et limites figurent dans
   `scripts/era-bridge/gameplay/henchmen-math-binary-validation.json`.
   L'exécution x86 a utilisé une traduction sur hôte ARM64 ; le processus ERA
   Windows, son état FPU réel, ses exceptions et le domaine int32 complet
   restent à valider. Cette preuve ne suffit donc pas à activer le profil.
2. Le script de récompense lit `i^battleExpAIPct^`, tandis que son réglage définit
   `i^hench_battleExpAIPct^`. Aucune définition du premier nom n'a été trouvée dans
   les cinq packs récupérés. Le moteur consulte maintenant la cellule entière
   du VM source actif ; une cellule absente vaut zéro, sans substitution par le
   réglage préfixé ni par la chaîne associée. L'intégration des profils complets
   au même espace de variables reste à terminer.

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
se déclenche. Les interactions avec la défense intrinsèque de la créature source
273 au rang 10 donnent 160, 80 ou 64 dégâts selon les protections déclenchées.
Un témoin privé rend la protection intrinsèque systématique et vérifie que deux
déclenchements retiennent la protection la plus forte, sans multiplier leurs
réductions. Ce témoin ne modifie aucune règle distribuée.

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

L'export vers le scénario suivant remet maintenant l'expérience de troupe à
zéro, suivant les cellules nommées réinitialisées par ERA. Il conserve la
progression propre du compagnon, son type et son état de vie. Les essais C++
avec contrôles mémoire vérifient aussi les deux réglages de bannière, l'absence
de transfert et la conservation des données du héros donneur. La compilation
WebAssembly passe. Cinq parcours natifs entre deux scénarios vérifient aussi la
victoire, les deux réglages de transfert et de bannière gratuite, le compagnon
mort et la bannière rendue au sac avant la victoire. Le témoin sur l'ancien
moteur conserve à tort 7501 points d'expérience de troupe au lieu de zéro.
Les réglages du scénario d'arrivée décident maintenant du transfert et de la
bannière. Quatre changements de réglages passent en jeu, ainsi que les variantes
de référence, de compagnon mort et de bannière rendue. Sans transfert, choisir
un nouveau compagnon reçoit correctement la bannière gratuite du nouveau
scénario. Les sauvegardes produites par l'ancien moteur restent chargeables,
et les contrôles de résurrection passent. Le marqueur d'importation est dérivé
à la construction du scénario et ne change pas le format des sauvegardes.
Les preuves figurent également dans
`scripts/era-bridge/gameplay/henchmen-campaign-settings-native-validation.json`.
Le redémarrage, les héros réservés absents d'un scénario intermédiaire et les
anciens transferts sauvegardés restent à vérifier.
Voir
`scripts/era-bridge/gameplay/henchmen-campaign-native-validation.json`.

Le héros humain attaquant reçoit maintenant la proposition de choisir un
compagnon avant le combat. Les sept emplacements de l'armée restent accessibles
au toucher et à la souris, sans clavier. Refuser conserve ce choix après
sauvegarde ; annuler seulement le choix de créature permet une nouvelle
proposition au combat suivant. Les parcours natifs vérifient aussi le retrait
d'une seule créature, l'absence de proposition pour la dernière créature de
l'armée et le témoin désactivé. Les contrôles précédents du noyau passent sur
la même compilation. Voir
`scripts/era-bridge/gameplay/henchmen-prompt-native-validation.json`.
L'entrée réelle dans une ville possédée propose maintenant de ressusciter le
compagnon. Le paiement, le refus, le manque d'or et la sauvegarde passent au
toucher et à la souris. La visite interne de début de tour conserve les
récompenses des bâtiments sans ouvrir cette question avant l'affichage du tour.
Une ville ennemie déclenche le siège sans résurrection ni paiement. Pour l'IA,
la trace native vérifie la mise à jour pendant sa visite sans débit de
ressources, avant le choix automatique d'un nouveau compagnon de combat ;
elle ne constitue pas une lecture directe de son compagnon hors combat.
L'ancien moteur échoue sur l'absence de cette mise à jour. Les neuf contrôles
du noyau passent sur le même moteur. Voir
`scripts/era-bridge/gameplay/henchmen-town-native-validation.json`.
Les visites reprises après un script de campagne utilisent maintenant le même
traitement natif. Un parcours vérifie le script de début de visite, une
sauvegarde au milieu de son dialogue, la résurrection payée, l'entrée en ville
et le script de fin de visite, dans cet ordre. Une sauvegarde produite par le
moteur précédent sans cette métadonnée reprend aussi correctement. Les visites
sans script à la souris et les téléportations originales de campagne passent
sur cette compilation. Voir
`scripts/era-bridge/gameplay/henchmen-town-script-native-validation.json`.
La fidélité des visites initiales d'un scénario reste à rapprocher de la source ERA.

Dans l'interface classique, le clic droit sur le drapeau ouvre aussi le menu
du compagnon sans Ctrl. Il réutilise les choix explicites de sélection,
résurrection, bannière et informations, plutôt que la succession automatique
de fenêtres du script original. Le clic droit réel et le changement de bonus
passent ; tenir un artefact n'ouvre pas ce menu et ne l'équipe pas. Le dépôt
tactile d'une bannière conserve son fonctionnement. Voir
`scripts/era-bridge/gameplay/henchmen-context-native-validation.json`.

Les victoires de l'IA vérifient maintenant la variable partagée de récompense :
150 donne 150 XP avec une base contrôlée de 100 ; absence, valeur négative et
débordement signé donnent zéro. Les noms sont insensibles à la casse ASCII,
et les cellules entière et chaîne restent distinctes. La sauvegarde avant et
après combat conserve le résultat. Un script peut aussi transférer, retirer et
restituer le héros : sa liste est actualisée sans doublon, sa vue est révélée
au nouveau propriétaire et les événements exécutables sans texte ni ressource
n'ajoutent plus une fenêtre vide. Les téléportations originales restent
fonctionnelles. L'ancien moteur conserve 100 XP au lieu de 250 dans le témoin.
Voir `scripts/era-bridge/gameplay/henchmen-shared-reward-native-validation.json`.

Un héros bloqué à la limite de niveau de sa carte garde désormais la
récompense fixe du compagnon lorsque `campaignTransfer` est désactivé. Avec
ce réglage activé, le gain nul du héros supprime bien la récompense, comme
l'indique le test source de la ligne 764. Les deux parcours utilisent un
combat réel avec une limite de niveau 1, puis une sauvegarde et un rechargement.
Le moteur précédent échoue au témoin sans transfert (0 au lieu de 100).
La capture d'expérience au placement du compagnon est également conservée
dans l'état sérialisé du combat. Un témoin sans script et une modification
BA0 avant combat accordent chacun 1 point au compagnon ; une modification
BR0 de 400 points pendant le combat en accorde 20. Les scénarios passent
avec rechargement, y compris depuis la version précédente du moteur. Les
anciens états de combat dépourvus de capture gardent le calcul précédent.
Les pertes, retraites et changements d'expérience négatifs restent à valider.

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

Le moteur candidat propose aussi « Améliorations au mithril » dans les options
WoG de création de partie : Carte, Oui ou Non. Ce septième choix correspond à
l'activation native de l'option source 36 ; il ne change pas les réglages de
l'installation. Les six combinaisons avec le réglage du module sont vérifiées
au toucher, dont des achats effectifs et leur rechargement avec le réglage
global inversé. Deux parcours supplémentaires utilisent uniquement la souris.
Le nouveau format lit les six octets des anciennes sauvegardes sans décaler
les champs suivants et initialise le nouveau choix à Carte. Deux sauvegardes
réellement produites par le moteur précédent conservent leur activation.
L'interface continue d'afficher les six anciens réglages lorsque le moteur
publié ne connaît pas encore le septième. Ces preuves ne constituent ni
l'activation du profil WoG complet ni le port des écritures UN:P des packs
externes. Détails : `scripts/era-bridge/gameplay/mithril-options-native-validation.json`.

Le catalogue candidat contient dix-neuf réglages par partie : les six premiers,
le mithril et douze règles de carte (111, 112, 114, 115, 116, 117, 121, 122, 123, 124, 128 et 130). Les règles
114/115/121/122/124/128 peuvent hériter de leur configuration, être activées ou
être désactivées sans changer les autres parties. Les tests inversent
volontairement leur configuration globale : combats avec dégâts effectifs,
déplacements et renouvellement quotidien, production hebdomadaire avec
protection au mithril, achat du second Capitole et effet des plaines magiques.
Le chargement conserve les choix des anciens catalogues à six, sept, treize,
quatorze, quinze, seize, dix-sept ou dix-huit réglages. Le format courant préfixe le catalogue par sa longueur pour
permettre les ajouts suivants sans réinterpréter les octets historiques.
Les neuf autres règles de carte et les six modes source de sélection de
l'option 101 ne sont pas encore portés. Le catalogue n'active pas les packs
complets et ne revendique pas le port de leurs commandes UN:P.

La règle 116 ajoute un quatorzième choix : croissance quotidienne de 4 % des
armées des 156 héros d'origine, y compris leurs groupes en réserve. La
croissance commence au deuxième jour, arrondit à l'entier inférieur et plafonne
à 100 000, sans réduire les groupes déjà supérieurs au plafond. L'expérience
totale est conservée et répartie entre les nouvelles créatures. Une transaction
validée sur les deux états du jeu applique la croissance une seule fois par
journée, y compris après rechargement. Les scénarios utilisent sept groupes
avec des quantités proches des seuils, un héros de l'IA et une héroïne en
réserve. Un groupe de 25 piquiers au rang 1 passe à 26 : son expérience
moyenne descend de 1000 à 961, son rang à 0 et sa défense effective de 6 à 5.
Le contrôle du format annonce la nouvelle capacité aux autres versions du
moteur ; les anciens catalogues et les transactions sauvegardées restent lus. Les neuf autres règles et les modes de sélection source restent
à porter ; cette étape n'active pas les profils complets.

La règle 130 construit les Graals une fois au premier jour, après le stock
initial, sans consommer le quota de construction. Elle concerne les villes
possédées, ennemies et neutres ; tout Conflux présent désactive cette règle,
quel que soit son propriétaire, et les Graals déjà construits restent intacts.
Treize parcours natifs couvrent les six choix d’héritage, les trois propriétaires
du Conflux et les formats portrait/paysage/souris. Le stock initial reste à
14 piquiers, le quota normal reste disponible et les revenus réels incluent
5000 pièces d’or par Graal possédé. Une suppression après reprise reste
respectée les jours suivants, y compris après une seconde sauvegarde/reprise.
Le quinzième choix porte une nouvelle capacité de sauvegarde ; les anciens
catalogues à 13 et 14 choix gardent leurs frontières et une ancienne partie
à 14 choix ne reçoit pas cette règle depuis les nouveaux réglages globaux.
La preuve est `scripts/era-bridge/gameplay/map-grails-native-validation.json`.
Cette règle n’admet pas le catalogue complet ni les six modes source de sélection.

La règle 123 ajoute un seizième choix : au premier jour d’un nouveau mois
(jours 29, 57, etc.), les 156 héros d’origine peuvent revisiter les dix familles
de sites couvertes par HE:V0–9. Seules leurs visites personnelles sont retirées ;
les autres sites, les découvertes des joueurs et le repérage des équipes restent
intacts. Le choix est figé dans la sauvegarde. Les parcours natifs contrôlent
les gains réels d’attaque et de défense, l’absence de répétition pendant le mois,
le jour 28, puis le passage au jour 29 et le jour 30. Deux sauvegardes/reprises
encadrent ce changement ; une ancienne sauvegarde à quinze choix ne reçoit pas
la nouvelle règle depuis la configuration globale. Cette adaptation ne porte
pas à elle seule le récepteur HE:V complet ni les modes de sélection UN:P101.
Preuve : `scripts/era-bridge/gameplay/map-monthly-visits-native-validation.json`.

L'activation du mithril est désormais enregistrée avec chaque nouvelle partie.
Changer les réglages de l'installation ne modifie plus ce choix à la reprise.
Les anciennes sauvegardes contenant des améliorations ou une graine mithril
conservent leur activation, leurs paiements et les durées restantes. Sans
choix enregistré ni trace d'utilisation, une ancienne partie reste désactivée.
Ces migrations concernent les sauvegardes natives Goonk, et non les fichiers
binaires ERA. Les résultats sont dans `outputs/era-gameplay/mithril-native-legacy.json`.

La lecture source `UN:P36/?variable` utilise le même choix enregistré que les
achats et les effets natifs du mithril. Dix parcours vérifient les six combinaisons
de choix local et global, les interfaces tactiles portrait/paysage et la souris,
un achat réel de mine, puis une reprise avec le réglage global inversé. La lecture
est répétée le lendemain après avoir remplacé les variables par des sentinelles.
`UN:P17` conserve sa valeur zéro pour le script global Potion Fountains absent.
L'ancien moteur est contrôlé séparément : son hôte source refuse bien `UN:P36`
après un achat natif réussi. Les résultats sont liés aux sources dans
`scripts/era-bridge/gameplay/mithril-source-option-native-validation.json`.
Les écritures `UN:P`, les options 149/170/171 et les profils complets restent à porter.

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

Les indices dynamiques des tableaux locaux numériques fonctionnent maintenant
dans les commandes ordinaires : indices `f` à `t`, ou première case d’une
variable locale `x`/`y`. Chaque occurrence calcule son adresse dans une variable
temporaire `y`, dans l’ordre du source ERA, puis libère ces emplacements après
la commande. Les adresses de sortie sont ainsi conservées quand un premier
résultat modifie l’indice avant la restitution du résultat suivant. Les essais
natifs vérifient ce cas après sauvegarde/rechargement dans un appel imbriqué,
en portrait et paysage tactiles et à la souris. Les 133 anciens programmes et
les sondes Advanced Classes, tableaux constants et registres rapides gardent
exactement leurs octets compilés. Le moteur et le contrat AST v4 sont inchangés.

Les indices hors plage produisent l’adresse zéro, comme le préprocesseur ERA ;
les essais couvrent uniquement cette adresse, pas son déréférencement. Les
indices dynamiques dans les initialisations, déclarations et branches `el`,
l’interpolation de valeurs dynamiques et les variables `z`/`e` restent refusés.
Les profils complets demeurent désactivés. Preuve bornée :
`scripts/era-bridge/gameplay/era3-dynamic-arrays-native-validation.json`.

La règle WoG117 ajoute douze sangliers dans le deuxième emplacement des
habitations communes compatibles, après la création des stocks initiaux. Elle
remplace uniquement cet emplacement : les archers déjà disponibles et les
autres emplacements restent intacts. Les créatures du premier niveau source,
sangliers, nomades et élémentaires d’air ou de tempête sont exclus ; les
habitations spéciales de type20 restent intactes. Les identités sans niveau
source rapproché sont conservées sans modification.

Le dix-septième réglage par partie propose Carte/Oui/Non au toucher et à la
souris. Les stocks ajoutés utilisent le recrutement natif de plusieurs groupes,
avec le curseur de quantité accessible sans clavier et le bon stock par groupe
dans les aperçus. L’application unique et les choix gelés survivent à la
sauvegarde ; une ancienne partie à seize réglages ne reçoit pas cette règle.
La variante source67, lorsqu’elle est configurée avant la partie, choisit douze
élémentaires d’air ; son exposition en lecture ne porte pas le pack Neutral Town.
Le nouveau format916 laisse aux anciens formats leurs nombres de réglages
respectifs et le moteur915 refuse les nouvelles sauvegardes. Les profils
complets restent désactivés. Preuve bornée :
`scripts/era-bridge/gameplay/map-extra-dwellings-native-validation.json`.

La règle WoG111 retire le vol naturel des créatures concernées et empêche leurs
adversaires de riposter à leurs attaques. Les machines de guerre, commandants
et quatre identités inutilisées de la source restent exclus. Une créature dont
le vol a déjà été retiré avant cette règle ne reçoit pas la capacité sans riposte.
La sélection se fait une fois dans l’état de la partie ; les bonus de vol
accordés séparément restent applicables. Les définitions partagées des créatures
ne sont pas modifiées. Le dix-huitième choix propose Carte/Oui/Non avec le
composant tactile commun. Le format917 distingue cette capacité du format916
à dix-sept choix. Les combats de contrôle couvrent le choix hérité, Oui/Non,
le vol accordé par artefact, un retrait de vol préalable, les créatures
terrestres, les vampires et les commandants exclus, après sauvegarde/reprise.
Cette étape ne suffit pas à activer les profils complets. Preuve bornée :
`scripts/era-bridge/gameplay/map-grounded-fliers-native-validation.json`.

La règle WoG112 inverse les vitesses de base en calculant d’abord la vitesse
maximale des créatures concernées, puis `maximum − vitesse + 3` pour chacune.
Les machines de guerre, commandants et identités inutilisées exclus par la
source ne participent pas au maximum. Les modifications de caractéristiques
faites avant cette étape sont prises en compte. Les lectures et écritures MA
utilisent ensuite la table vivante de la partie, distincte des bonus de héros,
de rang ou de terrain ; une écriture ultérieure remplace la valeur inversée.
L’inversion ne se rejoue pas après une sauvegarde, même si les réglages globaux
changent. Le calcul conserve le débordement entier source et le bornage final
de MA:S. Le dix-neuvième choix utilise les commandes tactiles communes ; le
format918 conserve les catalogues précédents jusqu’à dix-huit choix.
Les profils complets demeurent désactivés. Preuve bornée :
`scripts/era-bridge/gameplay/map-inverted-speeds-native-validation.json`.

Les améliorations d’habitations au mithril utilisent désormais les niveaux
initiaux MA:L audités pour comparer les créatures et calculer le prix. Le
niveau source zéro est valide. Une amélioration de niveau source3 coûte un
mithril, celle de niveau5 en coûte deux ; un groupe déjà amélioré double le
prix. Les casernes de TUM dont l’épéiste a été ramené au niveau source0 ne
peuvent plus contourner la différence avec le croisé de niveau3. Les extensions
natives sans identité source utilisent leur rang natif converti en base zéro.
Les achats modifient uniquement les types de créatures et conservent tous les
stocks, y compris après une seconde amélioration et une sauvegarde. Le format919
annonce ces critères sans ajouter de choix aux dix-neuf réglages existants.
L’information source149 est traitée séparément ci-dessous ; les mutations MA:L externes restent à porter.
Le calendrier des moulins est traité séparément par la règle171 ci-dessous. Preuve bornée :
`scripts/era-bridge/gameplay/mithril-dwelling-levels-native-validation.json`.

Le calcul d’expérience des compagnons conserve maintenant la soustraction
entière signée sur32 bits du script Enhanced Henchmen. Un dépassement positif
peut donc produire un gain négatif et déclencher la sortie prévue lorsque le
transfert de campagne est actif. Sans ce transfert, la composante racine carrée
vaut zéro et le gain signé continue vers le calcul d’expérience de créature.
Cette conversion est corroborée par18 appels aux véritables fonctions
Sqrt/Trunc64/VR:S de la DLL chargée sous Wine, à un point de chargement de plugin,
avec trois mots de contrôle x87. Le processus utilise une bibliothèque IFC20
substituée et n’atteint pas un scénario initialisé : ces observations bornées
ne valident ni Windows natif ni l’ensemble du pack. La sonde WebAssembly
recompilée vérifie les12 entrées entières de ces observations ; les NaN ne sont
pas convertis directement en entier C++.


La règle171 dispose d’un vingtième choix Carte/Oui/Non, enregistré séparément
des achats au mithril de la règle36. Chaque lundi, les jardins et moulins à
vent ont une chance sur douze de contenir du mithril. Les moulins améliorés
doublent leur stock à cette étape hebdomadaire ; un achat ne modifie plus le
stock de la semaine en cours. Les moulins à eau reviennent à leur stock normal
avant application de l’amélioration, sans doublement cumulatif. Les recherches
UN:U sont rapprochées de l’ordre diagonal documenté, surface puis souterrain,
avec les jardins traités avant les moulins à eau puis les moulins à vent.
Le format923 conserve les dix-neuf choix des formats antérieurs. Les parties
existantes gardent leur ancien comportement de moulin ; elles ne reçoivent pas
rétroactivement la nouvelle règle. Les nouvelles parties figent leur choix et
UN:P171 expose ce même état, avant l’initialisation puis après sauvegarde.
Le générateur natif est utilisé : une égalité de séquence avec le générateur
ERA n’est pas revendiquée. Le partage complet de PO:N avec des scripts externes,
les récepteurs GD/ML/WM arbitraires et les profils complets restent à porter.


La règle170 ajoute un vingt-et-unième choix Carte/Oui/Non pour placer du mithril
parmi les piles de ressources et les feux de camp au début de l’aventure.
Le passage unique suit les cases jaunes dans l’ordre z/y/x du stdlib WoG,
distinct de l’ordre UN:U de la règle171. Les compteurs des deux types d’objet
restent indépendants. Les piles admissibles contiennent2 à9 unités internes ;
pour l’or, une unité interne représente100 or. Le bois, le minerai et l’or
appliquent ensuite la division entière par2, suivie de+1. Le remplacement recrée
la pile, comme UN:O/I dans la source. Les feux de camp conservent leur composante
or et la quantité de leur ressource sélectionnée, devenue mithril.
Les compteurs wog_36 sont partagés avec la VM source ; le nettoyage wog_170
reste distinct et conserve les chaînes appariées. Le format924 conserve les
vingt choix antérieurs ; les parties923 déjà démarrées ne sont pas remplacées
rétroactivement. Les quantités natives d’or non multiples de100, qui n’ont pas
d’équivalent dans le champ d’origine, sont conservées. Les combinaisons de
récompenses natives non standard et les écritures arbitraires AR/FR restent
hors de cette validation, comme les profils complets.


La règle149 ajoute le vingt-deuxième choix Carte/Oui/Non pour consulter le
mithril disponible. L’ordre d’initialisation36,149,170,171 est conservé :36
force149 avant la capture de son indicateur d’information ;170 ne force que
la valeur finale de UN:P149, après cette capture.171 reste indépendant.
Le choix d’information est figé par partie et enregistré au format925 ; les
anciennes sauvegardes conservent leurs achats et ne reçoivent pas de nouvelle
politique d’information rétroactive. Le nombre de choix de chaque ancien
format reste contrôlé lors du chargement.

Le bouton Mithril permet la consultation au toucher et à la souris, même
quand les achats sont désactivés. Avec les améliorations, il donne accès aux
onze rubriques de tarifs, dont les exceptions du Conflux et des améliorations
successives. La liste textuelle adaptée remplace l’image fixe mithPric.pcx ;
elle défile verticalement sur mobile. L’interface native intercepte le clic
droit du bilan du royaume et propose les tarifs après confirmation. Sans149,
son aide d’origine reste disponible. Consulter ou fermer ne dépense rien.
Les réserves de ressources ordinaires restent visibles indépendamment de149.
Les contrôles portent sur le français/anglais, les interfaces native et web,
le toucher/souris, les combinaisons d’options et le rechargement après changement
des préférences globales. Cette étape ne déclare aucun profil complet jouable.
Preuve : `scripts/era-bridge/gameplay/mithril-display-native-validation.json`.


Les écritures MA:L externes sont désormais exécutées dans l’état propre à la
carte et utilisées par les offres d’amélioration des logements. Les lectures
conservent le niveau source brut ; les écritures appliquent le calcul entier
signé sur32 bits, puis la borne source[-1,6]. Deux niveaux[-1] égaux restent
admissibles et utilisent le premier tarif. Un changement de niveau invalide les
devis déjà affichés : une ancienne demande ne peut pas débiter un nouveau prix.
Le format926 conserve les vingt-deux choix et enregistre ces niveaux avec la VM.
Les parties925 sans mutations conservent leurs anciens tarifs ; une nouvelle
partie ne récupère aucun niveau de la précédente.

Les essais couvrent six logements, sept achats, une amélioration successive,
les débordements signés, les niveaux négatifs, le clic droit natif, le toucher
en portrait/paysage, la souris et les sauvegardes. Les définitions partagées de
créatures ne sont pas modifiées. Cette validation ne généralise pas MA:L aux
tiers de combat natifs, à l’expérience, aux arguments flottants ou aux écritures
pendant un combat. Le marquage mémoire de jour de l’exécutable original et ses
propagations arbitraires restent hors du contrat admis. Les profils complets
restent désactivés. Preuve :
`scripts/era-bridge/gameplay/mithril-live-levels-native-validation.json`.
