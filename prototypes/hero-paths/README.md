# POC — Voies permanentes des héros

Prototype sur la branche `prototype/hero-paths-poc`. Il n’est ni activé dans le jeu normal ni fusionné dans `main`.

À partir du niveau 5, chaque héros peut visiter un sanctuaire et choisir une seule voie :

- **Armée** : +2 Attaque du héros, définitivement.
- **Magie** : +2 Puissance magique, définitivement.
- **Économie** : 250 or immédiatement puis +250 or/jour tant que le héros appartient au joueur.

Le choix reste personnel au héros et persiste après sauvegarde/rechargement. Un second sanctuaire ne donne pas un second choix. Un autre héros peut choisir sa propre voie. Les valeurs servent à démontrer le mécanisme et ne constituent pas un équilibrage final.

## Jouer

Depuis la racine du dépôt avec le moteur et les assets déjà construits dans `dist` :

```sh
node prototypes/hero-paths/serve.mjs . 8795
```

Ouvrir `http://127.0.0.1:8795/game.html?mobile=1`, choisir **Nouvelle aventure**, puis la carte **POC Voies des héros — niveau 5**. Le premier coffre/sanctuaire est en 11,11, le second en 13,11. Le second héros est en 9,13. La carte niveau 4 sert à vérifier le verrou. Les coffres utilisent un graphisme Heroes III existant.

Si nécessaire, construire d’abord le jeu avec les commandes habituelles `npm run prepare:web`, `npm run build:web` et `npm run verify:web`. Le serveur peut utiliser une copie figée des assets avec `POC_BASE_DIST=/chemin/vers/dist`. Le serveur écoute uniquement sur 127.0.0.1 ; il ne modifie ni les fichiers de production ni leur serveur.

Le bootstrap du seul aperçu ajoute les fichiers du mod et les cartes avant le lancement du moteur, puis active ce mod dans les réglages de cette origine expérimentale. Les sauvegardes de ce prototype requièrent le mod et restent dans cette origine. Ne pas importer une sauvegarde personnelle pour ces essais.

## Vérification réalisée

```sh
GAME_ORIGIN=http://127.0.0.1:8795 CDP_URL=http://127.0.0.1:9227 \
node prototypes/hero-paths/test-native.mjs . /tmp/hero-paths-proof
```

Utiliser un navigateur CDP dédié. Le test crée et ferme seulement son propre contexte. Dépendances de test : `work/browser-tests/package.json`. `POC_CASES=army,magic,economy,level4` permet de sélectionner les cas ; les contrôles comparatifs de revenu et de sort utilisent le cas Armée comme référence.

Les quatre cas ont réussi dans le vrai moteur, au format mobile Chromium :

- Armée : attaque réelle de la troupe 4 → 6, choix indépendant du second héros, unicité et persistance.
- Magie : Flèche magique 40 dégâts contre 20 pour le contrôle, après rechargement.
- Économie : 250 or au choix, revenu quotidien 750 contre 500 pour le contrôle, après rechargement.
- Niveau 4 : récompenses bloquées, statistiques et or inchangés.

Aucune erreur JavaScript/native détectée. Les 120 avertissements de référence restent présents ; le cas Économie contient aussi un avertissement non bloquant de déplacement de l’IA déjà émis par le moteur. Le tour IA et les vérifications de revenu se sont terminés. Les journaux complets sont conservés dans `evidence`.

`ninja -j32 html5` a réussi. Le WASM réutilisé est `9b35c0b49206b3c38f10e45cf470d823e5407e839736aae5656215363512acc5`. Aucun patch C++ ni nouveau format de sauvegarde : les récompenses natives, les bonus permanents et la restriction de visite par bonus sont réutilisés.

## Limites voulues

Un seul palier ; visite manuelle dès le niveau 5, pas de fenêtre automatique lors de la montée de niveau. Pas d’arbre complet Wheel/ACM, de Maître/Grand Maître, de réinitialisation, de badge mobile spécifique ou de stratégie IA dédiée. Les tests ne couvrent pas une campagne complète ni un iPhone physique.

Le mod déclare `keepDisabled:true` et reste hors des dossiers de production `mod` et `maps`. Le build normal ne l’embarque pas. Les actifs du jeu original et les octets de sauvegarde ne sont pas copiés dans ce prototype.
