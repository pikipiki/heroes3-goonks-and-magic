# Audit technique actualisé — 14 novembre 2026

Le propriétaire a demandé de poursuivre en supposant la réutilisation autorisée. Le précédent arrêt sur la licence est donc levé pour le développement de cette branche. Ce choix est enregistré dans `UPSTREAM.json` ; la licence générale OpenBW reste non spécifiée, sans attribution d’une fausse licence.

## Sources réutilisées

Heroes est basé sur `062afb00750ff3833b8251b467718f31dcc04413` (0.4.168), avec VCMI 1.7.3 / Emscripten 4.0.23. Les sources et notices moteur GPL-2.0-or-later restent dans `work/vcmi-wasm/`. Le packaging, les données, l’OPFS et les commandes natives existantes sont réutilisés. Le moteur Heroes n’est pas modifié dans ce lot ; sa recompilation complète avec `ninja -j32 html5` n’est pas exécutée. Les artefacts précompilés sont préparés et leur ABI vérifiée par les scripts du dépôt.

OpenBW vient du fork `https://github.com/heiner/openbw.git`, révision `469d2037e2fd03085dac4729912f4188bc2a778b`. Un snapshot original de 4,9 Mo est conservé dans `vendor/openbw/`, avec une empreinte de tout l’arbre source. Il contient le véritable moteur (`bwgame.h`, `actions.h`, etc.), ses dépendances de compilation et le port Web original. Les notices existantes, dont Boost Software License pour Asio, sont conservées.

Les adaptations d’hôte sont générées par `scripts/generate-host.mjs`. Les fichiers C++ originaux restent inchangés. Le build WASI-SDK 33.0/Clang 22.1.0 emploie C++17 parce que le port contient déjà des initialisations `if` de cette version du langage. Il produit un module de 1 379 622 octets, compilé et instancié sans données de jeu. Les avertissements amont de dépréciation et de `memcpy` restent présents ; ils ne sont pas masqués. Deux builds locaux ont produit exactement la même empreinte.

## Comparaison des moteurs inspectés

| Candidat | Décision et limites |
| --- | --- |
| [OpenBW officiel](https://github.com/OpenBW/openbw) | Cœur C++ de simulation, combat, actions, chargement et replay. Licence générale non trouvée ; [question #17](https://github.com/OpenBW/openbw/issues/17) connue. La poursuite actuelle relève de l’hypothèse explicitement demandée. |
| Fork heiner/OpenBW épinglé | Réutilisé : rendu canvas, clavier/souris/tactile, commandes déterministes et simulation WASM. Version navigateur assemblée, compilation vérifiée ; partie interactive non exécutée faute de MPQ. |
| [OpenBW/bwapi](https://github.com/OpenBW/bwapi) | Interface de contrôle et support bots ; pas un moteur Web autonome. Les modules bots ne sont pas inclus ni activés dans cette étape. |
| [Stargus](https://github.com/Wargus/stargus) | Écarté pour cet objectif : utilise Stratagus et ne conserve pas la simulation originale Brood War. Aucun code copié. |

L’inspection ne constitue pas un recensement exhaustif de tous les ports. La priorité est donnée au port existant du moteur plutôt qu’à une réimplémentation.

## Intégration actuelle

Heroes normal et OpenBW indépendant ont chacun leur page. Le mode Crossover affiche deux iframes de même origine. Leurs adaptateurs TypeScript ne partagent pas de structures C++.

Le bridge écoute les événements natifs VCMI. Une transition de mode devient un message dans le journal natif OpenBW via ses exports existants, après validation de la version, session et séquence. Le retour échantillonne `openbw_frame`, `openbw_checksum` et `openbw_outcome`. Le bridge de statuts possède des enveloppes versionnées et des réponses corrélées ; aucun résultat de combat n’est fabriqué. Les mécanismes sont testés sur des fixtures de contrat ; leur exécution entre deux simulations reste à valider avec les MPQ.

VCMI expose déjà les modes et unités via `MobileBridge.cpp`, mais pas l’autorité nécessaire pour suspendre une bataille, valider un résultat externe et l’appliquer atomiquement. Écrire seulement dans le JSON de présentation ne serait pas une application de résultat. Cette API native reste à réaliser et devra être compilée avec les contrôles WASM du dépôt.

## Ressources, stockage et hébergement

Les téléchargements Internet Archive, cartes distantes et icônes propriétaires du port original sont retirés de l’hôte généré. Le joueur importe ses trois MPQ localement. Les en-têtes et bornes sont contrôlés, l’écriture IndexedDB est transactionnelle, les empreintes SHA-256 sont vérifiées à la relecture. Les archives sont retenues après un rechargement, sans envoi au serveur. Une erreur d’import ne remplace pas les anciennes données. Aucun MPQ n’est ajouté au dépôt ni au site.

Seule la carte Weave d’Alexandre Coderre-Chabot est fournie, avec sa notice CC BY 4.0 et sa provenance conservées. Les données Heroes distribuées par le projet préexistant ne sont pas modifiées par ce lot.

Le site reste statique. Le packaging ajoute `/crossover/` et une politique de scripts/WASM de même origine. Les tests d’import ne font aucune requête vers un tiers. Les mécanismes de cache hors ligne Heroes restent distincts ; l’installation hors ligne du nouveau moteur n’est pas validée. L’hôte OpenBW dépend du DOM/canvas ; le déplacement vers un Worker n’est pas présumé compatible.

## Étapes suivantes

1. Fournir les trois MPQ locaux et exécuter `tests/real-game-browser.mjs` : partie réelle, commandes, frames, replay et aller-retour d’événements.
2. Vérifier les interactions sur les trois races et une vraie bataille, puis sélectionner/épingler un adversaire IA et ses sources. Le bac à sable actuel ne contient aucun adversaire IA.
3. Ajouter une API VCMI autoritaire de bataille externe et des mappings de créatures explicites : checkpoint initial, pertes bornées par les effectifs, résultat idempotent et restauration après interruption.
4. Tester sauvegarde/reprise de la simulation, interruptions, versions incompatibles, WebKit et chargement hébergé.
5. Étudier ensuite Worker, carte commune, synchronisation simultanée et WebRTC, sans remplacer les règles des moteurs.
