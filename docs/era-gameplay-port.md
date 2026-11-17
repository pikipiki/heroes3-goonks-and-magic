# Portage des systèmes de gameplay ERA

Demande : porter les Henchmen, les packs de progression et les règles WoG
étendues, puis les activer après portage complet. Le propriétaire a choisi des
profils séparés pour Advanced Classes et Reborn.

## État réel

**Le portage complet n'est pas terminé. Aucun nouveau système n'est activé.**
Le premier jalon est une bibliothèque native de règles arithmétiques Enhanced
Henchmen 1.2 et des références sources figées. Cette bibliothèque n'est pas
raccordée aux héros ou aux combats ; ses tests ne constituent pas une partie
native avec Henchmen.

Les profils cibles sont WoG, ERA Scripts, Advanced Classes et Reborn. Ils sont
définis séparément dans `scripts/era-bridge/gameplay/profiles.mjs`. Le contrôle
d'admission distingue les sources disponibles des preuves de fonctionnement
natif. Aucun profil ne possède actuellement ces preuves complètes.

## Références récupérées

Distribution officielle :
[ERA-Projects/era-project-eng](https://github.com/ERA-Projects/era-project-eng/tree/233993be3eea4646b5c9f351e74f0bb51101adf6),
commit `233993be3eea4646b5c9f351e74f0bb51101adf6`.
Les empreintes des 366 fichiers des cinq packs sont conservées dans
`scripts/era-bridge/gameplay/reference-lock.json`. La copie intégrale sous
`work/era-gameplay-reference/` reste locale et exclue de Git et de Graphify.

| Pack | Fichiers | Sources ERM |
|---|---:|---:|
| Enhanced Henchmen | 10 | 2 |
| Era Erm Framework | 9 | 4 |
| WoG Scripts | 171 | 92 |
| ERA Scripts | 133 | 87 |
| Advanced Classes Mod | 43 | 6 |

Les fichiers ERS, configurations, archives et plugins sont recensés séparément
des programmes ERM. Les répertoires `disabled` restent identifiés comme tels ;
leur présence ne constitue pas une demande d'activation. Les empreintes de DLL
ne prouvent pas que leurs comportements ont été reproduits.

La [page officielle de TUM Reborn](https://www.h3wog.com/thread-78163-1-1.html),
consultée le 17 novembre 2026, annonce **1.7.3, datée du 9 mai 2025**.
Le lien de l'auteur mène à Baidu. L'ouverture du téléchargement a été refusée
par la politique de sécurité du navigateur. L'archive n'a pas été récupérée ;
aucune identité binaire ou source de ce pack n'est donc attestée. Une archive
officielle disponible localement est nécessaire pour poursuivre ce profil.

## Premier jalon Henchmen

`work/vcmi-wasm/lib/era/EraHenchmanRules.h` porte les opérations entières
utilisées par les règles suivantes :

- normalisation des réglages, bonus quotidiens et liés au niveau du héros ;
- progression et statistiques supplémentaires ;
- branche classique du coût d'expérience par niveau ;
- coût de résurrection et perte d'expérience lors d'un remplacement ;
- calcul entier de récompense avec entrées aléatoires/flottantes explicites ;
- expérience de troupe, plafonds, bannière d'expérience et difficulté de l'IA ;
- éligibilité de l'armée, priorité des candidats de l'IA et position proposée ;
- bonus de dégâts magiques et nombre de sorts supplémentaires.

Les entiers sont ramenés à 32 bits après chaque opération, sans débordement
indéfini en C++. Les treize blocs source liés, leurs lignes et leurs empreintes
figurent dans `scripts/era-bridge/gameplay/henchmen.json`. Le script original et
les réglages originaux sont conservés en fixtures, avec la licence amont.

Deux points empêchent encore de présenter ces calculs comme un système complet :

1. Le profil officiel utilise par défaut la branche alternative du coût par
   niveau. L'appel ERA `Pow`, sa précision flottante et sa conversion en entier
   restent à rapprocher. Seule la branche entière classique est actuellement
   portée.
2. Le script de récompense lit `i^battleExpAIPct^`, tandis que son réglage définit
   `i^hench_battleExpAIPct^`. Aucune définition du premier nom n'a été trouvée dans
   les cinq packs récupérés. Le port ne remplace pas silencieusement l'un par
   l'autre ; le multiplicateur runtime reste une entrée explicite.

## Raccordements restant nécessaires

- État propre à chaque héros, sérialisation, réseau et transferts de campagne.
- Choix et remplacement du compagnon, retrait/retour de créature et inventaires.
- Résurrection avec paiement et vérification du propriétaire.
- Création de l'acteur en combat, placement, bonus, sorts, mort et fin du combat.
- Bannière, gardes des Santa Gremlins et interactions avec les autres règles.
- Interface tactile et comportement IA sur les parcours réels.
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
la bibliothèque sous UBSan ; ils ne déclarent aucune validation des combats,
des sauvegardes ou de l'interface Henchmen.
