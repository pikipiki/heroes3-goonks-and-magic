# Audit technique — 14 novembre 2026

Le propriétaire a demandé de poursuivre en supposant la réutilisation autorisée. La licence générale OpenBW reste non spécifiée ; aucune fausse licence n’est attribuée.

## Sources et compilation

Heroes réutilise VCMI 1.7.3 et ses notices GPL-2.0-or-later dans `work/vcmi-wasm/`. Cette branche modifie les deux côtés natifs de l’API de bataille et recompile le moteur avec Emscripten 4.0.23 et `ninja -j32 html5`. Son archive est distincte de l’archive classique, sélectionnée par `GOONK_ENGINE_ARCHIVE` pour le site expérimental.

OpenBW vient de `heiner/openbw`, révision `469d2037e2fd03085dac4729912f4188bc2a778b`. Le snapshot `vendor/openbw/` reste inchangé (SHA-256 de l’arbre : `4ded02c19dd23bc0507b1634ee11bc8728fa69cdb7bec16e5a6bb4b3fca96cf7`). Ses notices sont conservées. Le wrapper propre au crossover inclut l’entrée amont, initialise les armées et expose un recensement et des commandes natifs. WASI SDK 33.0 compile le vrai moteur ; son manifeste enregistre séparément les empreintes amont, wrapper et WASM.

OpenBW officiel fournit la simulation, mais pas ce port Web complet. Le fork épinglé apporte le rendu et les entrées navigateur. OpenBW/bwapi n’est pas un moteur Web autonome ; aucun bot externe n’est intégré. Stargus utilise Stratagus et n’a pas été retenu pour conserver la simulation Brood War.

## Transaction de bataille

Le site ouvre Heroes directement et installe un bouton de démonstration dans son interface. Celui-ci lance un scénario et une attaque VCMI ordinaires. Depuis une partie existante, une sauvegarde dédiée « Avant-demo-StarCraft » doit être persistée avant le passage à la démo. La configuration `GOONK_CROSSOVER=1` active le catalogue expérimental ; le mode classique par défaut n’active pas ce mod.

VCMI vérifie l’éligibilité avant de suspendre la bataille et conserve les armées initiales. Il publie leurs identités, quantités et caractéristiques. Le Marine existe sous l’identité native `heroes-starcraft:marine` ; les archers, piquiers et commandants conservent leurs identités et leurs graphismes Heroes.

OpenBW initialise une unité par créature. Pour les troupes Heroes, des définitions privées reprennent les PV et une adaptation explicite des dégâts/armure/cadence ; voir README. Les statistiques originales StarCraft ne sont pas modifiées. Les comportements temps réel restent ceux d’OpenBW, pas une réécriture JavaScript ni une reproduction exacte des règles Heroes. Les sorts et bonus conditionnels ne sont pas transposés.

Le moteur retire les installations de mêlée initiales et leurs déclencheurs de victoire liés aux bases. Les groupes suivent les identités de génération réelles. Le moteur calcule dégâts, mouvement et morts ; aucune écriture de PV ou d’issue n’est utilisée pendant le combat. Un adversaire minimal reçoit des ordres AttackMove natifs. La sélection et les ordres tactiles utilisent le décodeur natif StarCraft.

Les unités alliées reçoivent l’ordre natif `Nothing` pour leurs phases d’attente, via des définitions privées ; leurs déplacements terminés reviennent à cet ordre. Elles n’acquièrent aucune cible et ne ripostent pas sans ordre utilisateur. « Commencer » ne fait que libérer l’horloge. Les clics sur un ennemi passent par le décodeur d’ordre `AttackDefault` avec son identité native ; le mode Attaquer sur terrain utilise `AttackMove`, le déplacement utilise `Move` et Arrêter utilise `Stop`. L’IA du camp ennemi est conservée. Les tests exécutent un vrai tir ennemi sur des alliés passifs avant de donner un ordre d’attaque, sans injection de dégâts.

L’adaptateur ajoute les entrées de démo aux menus existants, sans panneau fixe au-dessus de l’accueil. Il place les commandes sous le terrain en portrait et dans une colonne défilante à droite en paysage, avec une seule sortie visible. Le lissage Canvas de haute qualité adoucit les sprites Marine isolés ; il ne fournit pas de nouveaux modèles HD.

Le champ visible unique réutilise le décor et les animations DEF fournis par VCMI. OpenBW exporte une couche RGBA transparente de ses sprites natifs et un recensement des positions/PV. Le compositeur réunit ces données, sans calcul de combat. Aucun menu StarCraft, carte Weave ou écran de téléchargement manuel n’est présenté au joueur dans ce parcours. L’iframe technique n’est ni visible ni interactive ; elle fournit le moteur. Le terrain de simulation sous-jacent reste Weave : les obstacles des deux jeux ne sont pas encore transposés. Les sprites de fiche/carte du Marine sont des poses statiques extraites des données déjà auditées ; le rendu RTS est animé.

Une fois un camp éliminé, l’adaptateur transmet les survivants au serveur VCMI. Celui-ci vérifie joueur, bataille active, identités uniques, correspondance exhaustive des groupes, quantités bornées et élimination d’un camp, puis applique les pertes et son traitement normal de fin de bataille. Un second résultat pour une bataille terminée est rejeté. L’annulation reprend le combat Heroes avec les effectifs initiaux. L’API est limitée au build Web et la configuration mobile aux parties locales ; ce protocole expérimental n’est pas destiné au multijoueur.

Les tests couvrent combat complet, sauvegarde/relecture après retour et annulation : [VALIDATION.md](./VALIDATION.md). La reprise d’un combat RTS interrompu n’est pas implémentée. Le mode d’observation des deux moteurs reste disponible indépendamment.

## Ressources et hébergement

Les trois MPQ Blizzard demandés sont distribués par morceaux vérifiés dans `game-data/starcraft/`. L’hôte ne télécharge aucune ressource tierce et ne transmet pas les archives utilisateur. Le cache IndexedDB est vérifié par SHA-256 ; les anciens caches scmJS sont supprimés. Provenance, analyses antivirus et limites : [SECURITY-REVIEW.md](./SECURITY-REVIEW.md). Les exécutables des archives sources ne sont ni publiés ni exécutés.

La carte Weave d’Alexandre Coderre-Chabot conserve sa notice CC BY 4.0. Le scénario Heroes de test est généré depuis la carte Goonk existante. Aucune sauvegarde, clé de certificat local ou donnée de compte n’est publiée.

Le site reste statique, même origine, avec CSP et isolation COOP/COEP. Le bundle séparé est `dist-heroes-starcraft`, configuré pour la branche `codex/heroes-starcraft-crossover`. Netlify n’est pas encore déployé. L’essai actuel est local, sans tunnel Cloudflare. Restent à valider WebKit et le matériel iPhone/iPad, puis la reprise RTS et une IA plus complète ; Workers/WebRTC ne sont pas activés.
