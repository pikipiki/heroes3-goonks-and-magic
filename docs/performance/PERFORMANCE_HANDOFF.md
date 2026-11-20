# Reprise performance du combat mobile

Le combat en attente sur le Huawei P30 Pro recalculait la portée pour chaque case, alors que ce résultat existait déjà pour la publication de l'état.

## Mesure

Capture CPU du rendu de la page visible uniquement, moteur `d6578ac4c9dce80526b1fb08351810dad75157d466f93776cff6fcbb7a75890c`, combat affiché, unité active Diablotin, 6 secondes, 5248 échantillons, 6479 ms. Les workers n'ont pas été échantillonnés.

Temps inclusif principal :

| Opération | ms |
| --- | ---: |
| `publishMobileState` | 1739 |
| `mobileActionForHex` | 1292 |
| `actionIsLegal` | 1129 |
| `battleGetAvailableHexes` | 1068 |
| `getReachability` | 868 |
| `makeBFS` | 570 |
| `publishMobileBattleAtlas` | 798 |
| `texSubImage2D` | 334 |

`publishMobileState` appelle déjà `battleGetAvailableHexes(active, false)`. Le libellé de chaque case rappelait `toWhichHexMove` ou `battleCanAttackHex`, et ces fonctions relançaient le parcours.

Les rapports `huawei-light-313.json` et `huawei-attacks-312.json` placent le coût sur le fil principal du rendu, autour de 42 images/s en combat. La copie GPU de la carte d'aventure reste une petite part. Un test mobile muet sur Mac, à 60 images/s, ne reproduit pas le saccadé du téléphone et ne remplace pas cette capture.

## Correctif

Les libellés réutilisent le tableau de cases atteignables déjà calculé. `performMobileAction` conserve un calcul frais au moment de confirmer. Les actions légales, les animations et l'affichage ne changent pas.

## Vérification

Même combat de test, navigateur mobile 390×844 en français, audio coupé, dans Docker. 165 cases, unité active Grand Arbalétrier.

Les libellés sont identiques avant et après : 62 déplacements, 2 tirs, 101 cases sans action.

Profil de 4 secondes, temps inclusif :

| Opération | avant | après |
| --- | ---: | ---: |
| `publishMobileState` | 254 ms | 86 ms |
| `mobileActionForHex` | 141 ms | 24 ms |
| `makeBFS` | 35 ms | absent de l'échantillon |

Le binaire vérifié est `cea58c14f3e6302fd99dff21a95c21020fa8caed5f505bc4ddc3b2b0b74bddec`. Le téléphone affiche encore l'ancien moteur tant que la page publiée n'a pas été rechargée.

## Reste mesuré, non modifié

L'export de l'atlas (environ 798 ms sur 6 s) et la copie GPU de l'écran (environ 334 ms) restent sur le téléphone. Le parcours des obstacles dans les contrôles d'attaque n'est pas repris par ce correctif. Une nouvelle capture Huawei, page visible seulement, confirmera le gain réel après publication.
