# Composants nécessaires à la refonte Heroes III

58 modules, 185 variantes : revue des sources et des contrats de disposition. **Ce document ne certifie pas une revue visuelle de chaque variante.** Les captures natives existantes couvrent 12 écrans.

L’ancien registre contient 56 modules et 175 variantes. La revue ajoute le Bâtisseur WoG et les résultats de combat dédiés : 58 modules et 185 variantes au total. Les modules de coordination (audio, transitions, notifications et préchargement) sont rattachés aux compositions de leurs écrans, sans être comptés comme de nouveaux écrans.

Les effets de relief ajoutés aux icônes ont été abandonnés à la demande du propriétaire. Les illustrations existantes sont conservées.

## Statuts

- `available` : composition disponible dans la bibliothèque de référence ; intégration au moteur restant à vérifier par écran.
- `mui` : contrôle MUI existant, habillé par le thème commun.
- `compose` : composition réutilisable à extraire des écrans existants, en conservant leurs données et commandes.
- `engine` : rendu/interactions spécifiques au jeu à préserver ; MUI habille leurs commandes, pas les pixels de la scène.

## Bibliothèque de composants

| Composant | Statut | Écrans utilisateurs | Réutilisation / besoin |
| --- | --- | ---: | --- |
| Structure adaptative | available | 30 | ScreenShell, ActionDock |
| Panneaux et cadres | available | 0 | HeroesPanel |
| Actions et fermeture | available | 16 | HeroesButton, HeroesClose |
| Champs de formulaire | mui | 7 | TextField |
| Sélecteurs et menus | mui | 13 | Select, Menu, MenuItem |
| Cases et boutons radio | mui | 6 | Checkbox, RadioGroup |
| Onglets | mui | 6 | Tabs, Tab |
| Accordéons | available | 4 | HeroesAccordion |
| Messages et progression | mui | 29 | Alert, CircularProgress, LinearProgress |
| Confirmation | available | 16 | ConfirmDialog |
| Quantité et curseur | available | 4 | QuantityControl |
| Ressources et coûts | available | 17 | ResourceStrip, ResourceCost |
| Caractéristiques | available | 7 | StatGrid |
| Carte d’évolution | available | 0 | EvolutionCard |
| Carte de sélection | available | 19 | ChoiceTile |
| Emplacement de troupe | available | 1 | ArmySlot |
| Tableau accessible | available | 2 | HeroesDataTable |
| Stock, prix et total | available | 5 | PurchaseSummary |
| Bandeau du royaume | available | 4 | KingdomChrome |
| Recherche et filtres | available | 6 | SearchFilterBar |
| Carte et aperçu du scénario | available | 6 | ScenarioCard |
| Configuration des joueurs | available | 7 | PlayerSetup |
| Identité du héros | available | 7 | HeroIdentityCard |
| Grille des armées | available | 3 | ArmyGrid |
| Inventaire d’artefacts | available | 5 | InventoryGrid |
| Échange et scission | available | 3 | TransferPanel |
| Fiche de créature | available | 10 | CreatureDetails |
| Choix des évolutions | available | 3 | EvolutionPicker |
| Liste de recrutement | available | 4 | RecruitmentRoster |
| Projet de construction | available | 3 | BuildingProject |
| Recrutement d’un héros | available | 1 | HeroHireCard |
| Choix et détail d’un sort | available | 3 | SpellPicker |
| Arbre de compétences | available | 4 | SkillTree |
| Devis d’amélioration | available | 4 | UpgradeQuote |
| Échange de ressources | available | 1 | MarketTradePanel |
| Classement et renseignements | available | 3 | KingdomRanking |
| Commandes et inspection de combat | available | 3 | BattleHUD |
| Résultat de combat | available | 4 | BattleResult |
| Sauvegardes et reprise | available | 3 | SaveRecoveryPanel |
| Occupation du stockage | available | 6 | StorageUsage |
| Option de règle avec aide | available | 4 | RuleOptionRow |
| Code et copie | available | 4 | CopyCodeField |
| Formulaire de dialogue natif | available | 2 | NativeDialogForm |
| Illustration et vidéo | available | 2 | MediaViewer |
| Résumé des conséquences | available | 1 | ConsequenceSummary |
| Scène et zones interactives | engine | 7 | Conserver le canvas et ses coordonnées ; ne pas peindre les bâtiments en MUI |
| Animation de créature | engine | 4 | Réutiliser le lecteur natif, son cadrage et son ordonnanceur |
| Trajet et cibles tactiques | engine | 4 | Cases accessibles, trajectoire, tir, cibles des sorts et confirmation |
| Minicarte et navigation | engine | 2 | Panoramique, zoom et centrage avec conversion des coordonnées |

## Couverture des écrans

| Source | Variantes | Composants nécessaires |
| --- | ---: | --- |
| [mobile](../../web/mobile.mjs) | 15 | Structure adaptative, Actions et fermeture, Bandeau du royaume, Carte de sélection, Recherche et filtres, Carte et aperçu du scénario, Configuration des joueurs, Identité du héros, Liste de recrutement, Scène et zones interactives, Minicarte et navigation, Commandes et inspection de combat, Trajet et cibles tactiques, Fiche de créature, Résultat de combat |
| [game-menu](../../web/game-menu.mjs) | 7 | Structure adaptative, Actions et fermeture, Champs de formulaire, Sélecteurs et menus, Cases et boutons radio, Accordéons, Option de règle avec aide, Messages et progression, Sauvegardes et reprise, Occupation du stockage, Confirmation |
| [hosted-match-create](../../web/hosted-match-create.mjs) | 4 | Structure adaptative, Champs de formulaire, Sélecteurs et menus, Cases et boutons radio, Carte et aperçu du scénario, Configuration des joueurs, Recherche et filtres, Code et copie, Messages et progression |
| [online-lobby](../../web/online-lobby.mjs) | 5 | Structure adaptative, Actions et fermeture, Configuration des joueurs, Carte et aperçu du scénario, Champs de formulaire, Code et copie, Messages et progression |
| [online-login](../../web/online-login.mjs) | 3 | Structure adaptative, Champs de formulaire, Actions et fermeture, Messages et progression |
| [lobby-choices](../../web/lobby-choices.mjs) | 4 | Structure adaptative, Carte et aperçu du scénario, Recherche et filtres, Carte de sélection, Configuration des joueurs, Cases et boutons radio |
| [campaign-setup](../../web/campaign-setup.mjs) | 4 | Structure adaptative, Carte et aperçu du scénario, Carte de sélection, Illustration et vidéo, Scène et zones interactives, Sélecteurs et menus, Messages et progression |
| [hero-equipment](../../web/hero-equipment.mjs) | 6 | Structure adaptative, Identité du héros, Caractéristiques, Onglets, Grille des armées, Inventaire d’artefacts, Arbre de compétences, Choix et détail d’un sort, Devis d’amélioration, Fiche de créature, Échange et scission |
| [hero-exchange](../../web/hero-exchange.mjs) | 3 | Structure adaptative, Identité du héros, Onglets, Grille des armées, Inventaire d’artefacts, Échange et scission, Quantité et curseur, Confirmation |
| [creature-presentation](../../web/creature-presentation.mjs) | 4 | Structure adaptative, Fiche de créature, Animation de créature, Caractéristiques, Choix des évolutions, Stock, prix et total, Ressources et coûts, Actions et fermeture |
| [town-services](../../web/town-services.mjs) | 2 | Structure adaptative, Carte de sélection, Ressources et coûts, Stock, prix et total, Classement et renseignements, Actions et fermeture |
| [thieves-guild-view](../../web/thieves-guild-view.mjs) | 5 | Classement et renseignements, Onglets, Sélecteurs et menus, Tableau accessible, Identité du héros, Messages et progression |
| [town-building-menu](../../web/town-building-menu.mjs) | 3 | Structure adaptative, Projet de construction, Carte de sélection, Ressources et coûts, Recherche et filtres, Onglets, Confirmation, Messages et progression |
| [army-upgrades](../../web/army-upgrades.mjs) | 5 | Structure adaptative, Devis d’amélioration, Ressources et coûts, Confirmation, Messages et progression |
| [army-panel](../../web/army-panel.mjs) | 4 | Grille des armées, Emplacement de troupe, Échange et scission, Devis d’amélioration |
| [troop-actions](../../web/troop-actions.mjs) | 3 | Structure adaptative, Fiche de créature, Carte de sélection, Confirmation, Messages et progression |
| [troop-deployment](../../web/troop-deployment.mjs) | 2 | Structure adaptative, Quantité et curseur, Sélecteurs et menus, Carte de sélection, Confirmation, Messages et progression |
| [troop-equipment](../../web/troop-equipment.mjs) | 3 | Structure adaptative, Fiche de créature, Inventaire d’artefacts, Caractéristiques, Sélecteurs et menus, Confirmation |
| [mithril-enhancements](../../web/mithril-enhancements.mjs) | 1 | Structure adaptative, Devis d’amélioration, Carte de sélection, Ressources et coûts, Sélecteurs et menus, Messages et progression, Accordéons |
| [dialog-presentation](../../web/dialog-presentation.mjs) | 6 | Structure adaptative, Formulaire de dialogue natif, Confirmation, Carte de sélection, Ressources et coûts, Identité du héros, Arbre de compétences, Résultat de combat |
| [progression-choices](../../web/progression-choices.mjs) | 3 | Structure adaptative, Carte de sélection, Choix des évolutions, Inventaire d’artefacts, Ressources et coûts, Sélecteurs et menus, Confirmation |
| [commander-tree](../../web/commander-tree.mjs) | 3 | Arbre de compétences, Caractéristiques, Carte de sélection, Messages et progression |
| [spellbook](../../web/spellbook.mjs) | 6 | Structure adaptative, Choix et détail d’un sort, Onglets, Recherche et filtres, Ressources et coûts, Carte de sélection, Confirmation, Messages et progression |
| [mage-guild](../../web/mage-guild.mjs) | 4 | Structure adaptative, Choix et détail d’un sort, Onglets, Carte de sélection, Messages et progression |
| [marketplace](../../web/marketplace.mjs) | 3 | Structure adaptative, Échange de ressources, Ressources et coûts, Quantité et curseur, Carte de sélection, Confirmation, Messages et progression |
| [mobile-tavern](../../web/mobile-tavern.mjs) | 4 | Structure adaptative, Recrutement d’un héros, Identité du héros, Ressources et coûts, Fiche de créature, Messages et progression |
| [town-portrait](../../web/town-portrait.mjs) | 4 | Scène et zones interactives, Projet de construction, Bandeau du royaume, Actions et fermeture |
| [town-recruitment](../../web/town-recruitment.mjs) | 1 | Scène et zones interactives, Liste de recrutement, Stock, prix et total, Ressources et coûts, Fiche de créature |
| [recruitment-families](../../web/recruitment-families.mjs) | 3 | Structure adaptative, Liste de recrutement, Choix des évolutions, Animation de créature, Caractéristiques, Stock, prix et total, Fiche de créature, Ressources et coûts |
| [weekly-recruits](../../web/weekly-recruits.mjs) | 1 | Liste de recrutement, Tableau accessible, Sélecteurs et menus, Bandeau du royaume, Ressources et coûts |
| [storage-page](../../web/storage-page.mjs) | 5 | Structure adaptative, Occupation du stockage, Messages et progression, Actions et fermeture, Confirmation |
| [session-recovery](../../web/session-recovery.mjs) | 4 | Structure adaptative, Sauvegardes et reprise, Messages et progression, Actions et fermeture |
| [boot-screen](../../web/boot-screen.mjs) | 3 | Messages et progression, Occupation du stockage, Actions et fermeture |
| [loading](../../web/loading.mjs) | 2 | Messages et progression, Occupation du stockage, Actions et fermeture |
| [campaign-media](../../web/campaign-media.mjs) | 2 | Structure adaptative, Illustration et vidéo, Actions et fermeture |
| [game-calendar](../../web/game-calendar.mjs) | 3 | Bandeau du royaume, Ressources et coûts |
| [hosted-turn-notifications](../../web/hosted-turn-notifications.mjs) | 2 | Structure adaptative, Sauvegardes et reprise, Code et copie, Confirmation, Messages et progression |
| [wog-options](../../web/wog-options.mjs) | 1 | Option de règle avec aide, Accordéons, Cases et boutons radio, Messages et progression |
| [lobby-options](../../web/lobby-options.mjs) | 1 | Option de règle avec aide, Configuration des joueurs, Champs de formulaire, Cases et boutons radio, Sélecteurs et menus |
| [scenario-filters](../../web/scenario-filters.mjs) | 2 | Recherche et filtres, Sélecteurs et menus, Accordéons, Messages et progression |
| [hosted-castles](../../web/hosted-castles.mjs) | 1 | Carte de sélection, Configuration des joueurs, Sélecteurs et menus |
| [hosted-code-copy](../../web/hosted-code-copy.mjs) | 2 | Code et copie, Messages et progression |
| [material-select](../../web/material-select.mjs) | 4 | Sélecteurs et menus |
| [campaign-dialog-form](../../web/campaign-dialog-form.mjs) | 4 | Formulaire de dialogue natif, Champs de formulaire, Cases et boutons radio, Carte de sélection, Confirmation |
| [battle-dual-view](../../web/battle-dual-view.mjs) | 2 | Scène et zones interactives, Commandes et inspection de combat, Trajet et cibles tactiques, Minicarte et navigation |
| [battle-controls](../../web/battle-controls.mjs) | 1 | Trajet et cibles tactiques, Actions et fermeture |
| [battle-vertical](../../web/battle-vertical.mjs) | 1 | Scène et zones interactives, Animation de créature, Trajet et cibles tactiques |
| [image-outline](../../web/image-outline.mjs) | 1 | Scène et zones interactives |
| [resources](../../web/resources.mjs) | 1 | Ressources et coûts |
| [henchman-sheet](../../web/henchman-sheet.mjs) | 2 | Identité du héros, Caractéristiques, Inventaire d’artefacts, Arbre de compétences, Carte de sélection, Actions et fermeture |
| [battle-inspection](../../web/battle-inspection.mjs) | 1 | Commandes et inspection de combat, Fiche de créature, Carte de sélection, Caractéristiques |
| [high-score-presentation](../../web/high-score-presentation.mjs) | 3 | Résultat de combat, Classement et renseignements, Champs de formulaire, Confirmation |
| [scenario-details](../../web/scenario-details.mjs) | 1 | Carte et aperçu du scénario, Configuration des joueurs, Messages et progression |
| [recruitment-summary](../../web/recruitment-summary.mjs) | 1 | Stock, prix et total, Ressources et coûts, Quantité et curseur, Messages et progression |
| [hosting-index](../../web/hosting-index.html) | 2 | Messages et progression, Occupation du stockage |
| [storage](../../web/storage.html) | 2 | Occupation du stockage, Messages et progression, Actions et fermeture |
| [battle-result](../../web/battle-result.mjs) | 4 | Structure adaptative, Résultat de combat, Fiche de créature, Animation de créature, Actions et fermeture |
| [cave-builder](../../web/cave-builder.mjs) | 6 | Structure adaptative, Projet de construction, Carte de sélection, Ressources et coûts, Option de règle avec aide, Résumé des conséquences, Confirmation, Messages et progression |

## Contraintes transversales

- Portrait : titre et croix en haut, commandes globales en bas ; paysage : titre et commandes dans la colonne droite. Une sortie visible.
- Ordre, taille et emplacement des zones stables entre langues, états disponible/verrouillé et rotations.
- Traductions FR/EN, mots non coupés, noms entiers, coûts à icônes et or en chiffres complets groupés.
- États vide, chargement, erreur, désactivé, sélectionné, survol, focus, appui et succès.
- Transitions et ripple MUI préservés ; réduction des mouvements respectée.
- Cas limites : 1–4 évolutions, sept troupes, huit joueurs, descriptions longues, une seule perte, ressources élevées.
- Aucune double modale ; coordonnées tactiles cohérentes après rotation ; scènes et animations natives préservées.

## Validation à réaliser pendant la migration

Pour chaque variante : même état réel avant/après, Chromium et WebKit, français/anglais, 320×568 et 360×640 en portrait, 568×280 et 640×360 en paysage. Vérifier les actions fixes et le défilement des panneaux longs. Les états déduits des sources ne sont pas des captures de jeu.
