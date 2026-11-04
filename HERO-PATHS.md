# Voies permanentes des héros

Dès le niveau 5, visitez le **Sanctuaire des voies** près de votre ville de départ. Chaque héros choisit définitivement une voie :

- **Armée** : +2 Attaque du héros, appliqués à ses troupes.
- **Magie** : +2 Puissance magique du héros.
- **Économie** : 250 or immédiatement puis 250 or par jour tant que le héros vous appartient.

Vous pouvez fermer la fenêtre sans choisir et revenir plus tard. Un second sanctuaire ne permet pas un second choix. Chaque héros fait son propre choix ; il le conserve lors des sauvegardes et rechargements.

Les sanctuaires sont disponibles dans les **nouvelles parties** des deux cartes fournies : Château Goonk (11,11 et 27,31) et Goonks (22,24 et 121,119). La carte duel conserve deux emplacements symétriques, accessibles pour les deux camps. Le dessin réutilise un coffre natif Heroes III ; son nom et sa fenêtre indiquent le sanctuaire. La règle est la même pour toutes les factions disponibles.

Une ancienne sauvegarde garde les objets de sa carte : elle ne reçoit pas ces sanctuaires rétroactivement. Les cartes importées et les campagnes ne sont pas réécrites. Il n’y a pas de fenêtre automatique à la montée de niveau, d’arbre Wheel complet, de nouvelle compétence secondaire ni de réinitialisation des voies. Les valeurs constituent un premier équilibrage et pourront être ajustées séparément.

## Maintenance

Le mod `mod/hero-paths` repose sur les récompenses natives VCMI : `visitMode: bonus`, marqueur permanent par type d’objet, statistiques primaires et `GENERATE_RESOURCE`. Aucun nouveau format de sauvegarde ni patch du moteur. Les changements de propriétaire suivent les règles natives des bonus du héros. Le bootstrap normal active le mod dans le preset courant sans effacer les autres mods ou les sauvegardes.

`scripts/hero_paths_maps.py` ajoute les sanctuaires aux cartes fournies de façon idempotente, vérifie les emplacements et déclare la dépendance de carte. Le générateur `scripts/build-goonks-map.py` réserve leurs approches et réutilise ce module. Le build normalise aussi les identifiants internes des objets et leurs références dans les cartes publiées, sans réécrire les cartes sources ou les sauvegardes. Il omet aussi la chaîne de propriétaire `neutral`, invalide pour ce champ : l’absence du champ conserve le propriétaire neutre natif. Les tests vérifient les accès, l’absence de collision des sanctuaires, la symétrie des ressources et l’unicité des marqueurs.

```sh
node --test tests/hero-paths.test.mjs tests/goonks-map.test.mjs
npm test
npm run prepare:web
npm run build:web
npm run verify:web
```

Le test natif `work/browser-tests/hero-paths-e2e.mjs` utilise les fixtures de `outputs/native-fixtures/hero-paths`, le mod de production et un navigateur CDP dédié. Pour reproduire, copier les deux fixtures dans `maps` dans une copie de travail jetable, construire avec `GOONK_TEST_ORIGIN=http://127.0.0.1:8796`, puis lancer le serveur statique sur ce port. Les fixtures ne doivent pas être publiées dans `maps`.

```sh
PORT=8796 node work/browser-tests/static-server.mjs
GAME_ORIGIN=http://127.0.0.1:8796 CDP_URL=http://127.0.0.1:9227 \
node work/browser-tests/hero-paths-e2e.mjs . /tmp/hero-paths-proof
```

Le test crée et ferme uniquement son propre contexte. Il vérifie les trois effets dans de vrais combats/tours, le verrou au niveau 4, deux héros indépendants, deux sanctuaires, la sauvegarde et le rechargement. Lire `outputs/native-evidence/hero-paths/report.json` pour les résultats et avertissements. Un iPhone physique et une campagne complète ne sont pas couverts.

Les cartes Goonk préexistantes peuvent encore journaliser le repli du recrutement natif (aucune classe de héros propre à la faction Goonk) et, sur la carte de découverte, un bonus de départ artefact sans héros dans le camp bleu. Le test de cartes conserve ces diagnostics connus et échoue sur toute autre erreur native ; ils ne doivent pas être présentés comme un journal sans erreur. Les quatre tests des voies ne rencontrent aucune erreur native.
