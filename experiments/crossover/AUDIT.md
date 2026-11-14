# Audit technique — 14 novembre 2026

Le propriétaire a demandé de poursuivre en supposant la réutilisation autorisée. La licence générale OpenBW reste non spécifiée ; aucune fausse licence n’est attribuée.

## Sources et compilation

Heroes réutilise VCMI 1.7.3 et ses notices GPL-2.0-or-later dans `work/vcmi-wasm/`. Cette branche modifie les deux côtés natifs de l’API de bataille et recompile le moteur avec Emscripten 4.0.23 et `ninja -j32 html5`. Son archive est distincte de l’archive classique, sélectionnée par `GOONK_ENGINE_ARCHIVE` pour le site expérimental.

OpenBW vient de `heiner/openbw`, révision `469d2037e2fd03085dac4729912f4188bc2a778b`. Le snapshot `vendor/openbw/` reste inchangé (SHA-256 de l’arbre : `4ded02c19dd23bc0507b1634ee11bc8728fa69cdb7bec16e5a6bb4b3fca96cf7`). Ses notices sont conservées. Le wrapper propre au crossover inclut l’entrée amont, initialise les armées et expose un recensement et des commandes natifs. WASI SDK 33.0 compile le vrai moteur ; son manifeste enregistre séparément les empreintes amont, wrapper et WASM.

OpenBW officiel fournit la simulation, mais pas ce port Web complet. Le fork épinglé apporte le rendu et les entrées navigateur. OpenBW/bwapi n’est pas un moteur Web autonome ; aucun bot externe n’est intégré. Stargus utilise Stratagus et n’a pas été retenu pour conserver la simulation Brood War.

## Transaction de bataille

Le mode aventure écoute `goonk-state` et active explicitement la délégation pour une partie solo. VCMI vérifie l’éligibilité avant de suspendre une bataille ; les armées initiales restent intactes. Il publie leurs identités et quantités. L’adaptateur initialise autant d’unités StarCraft que de créatures : tireur → Marine ; mêlée avec au moins 35 PV → Firebat ; autre mêlée → Zergling. Les commandants et machines sont inclus. Les statistiques Heroes et sorts ne sont pas transposés.

OpenBW retire l’installation de mêlée initiale, désactive les déclencheurs de victoire liés aux bases et crée les unités du scénario avec ses fonctions natives. Chaque groupe conserve les identités de génération de ses unités. Le moteur calcule lui-même dégâts, mouvements et morts ; aucune écriture de PV ou d’issue n’est utilisée pendant le combat. Un adversaire minimal reçoit des ordres AttackMove par le flux de commandes natif. Le joueur commence explicitement le combat et peut contrôler son armée.

Une fois un camp éliminé, l’adaptateur transmet les survivants au serveur VCMI. Celui-ci vérifie joueur, bataille active, identités uniques, correspondance exhaustive des groupes, quantités bornées et élimination d’un camp, puis applique les pertes et son traitement normal de fin de bataille. Un second résultat pour une bataille terminée est rejeté. L’annulation reprend le combat Heroes avec les effectifs initiaux. L’API est limitée au build Web et la configuration mobile aux parties locales ; ce protocole expérimental n’est pas destiné au multijoueur.

Les tests couvrent combat complet, sauvegarde/relecture après retour et annulation : [VALIDATION.md](./VALIDATION.md). La reprise d’un combat RTS interrompu n’est pas implémentée. Le mode d’observation des deux moteurs reste disponible indépendamment.

## Ressources et hébergement

Les trois MPQ Blizzard demandés sont distribués par morceaux vérifiés dans `game-data/starcraft/`. L’hôte ne télécharge aucune ressource tierce et ne transmet pas les archives utilisateur. Le cache IndexedDB est vérifié par SHA-256 ; les anciens caches scmJS sont supprimés. Provenance, analyses antivirus et limites : [SECURITY-REVIEW.md](./SECURITY-REVIEW.md). Les exécutables des archives sources ne sont ni publiés ni exécutés.

La carte Weave d’Alexandre Coderre-Chabot conserve sa notice CC BY 4.0. Le scénario Heroes de test est généré depuis la carte Goonk existante. Aucune sauvegarde, clé de certificat local ou donnée de compte n’est publiée.

Le site reste statique, même origine, avec CSP et isolation COOP/COEP. Le bundle séparé est `dist-heroes-starcraft`, configuré pour la branche `codex/heroes-starcraft-crossover`. Netlify n’est pas encore déployé. L’essai actuel est local, sans tunnel Cloudflare. Restent à valider WebKit et le matériel iPhone/iPad, puis la reprise RTS et une IA plus complète ; Workers/WebRTC ne sont pas activés.
