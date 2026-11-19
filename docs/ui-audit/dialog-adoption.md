# Adoption des fenêtres par MUI Dialog

Audit des fabriques natives, des contrats d’écran et des usages de `dialog`, `showModal` et `aria-modal`. Le composant attendu est le vrai `Dialog` de MUI, avec sa racine, son conteneur, son Paper portant `role="dialog"`, son backdrop et son gestionnaire de focus. Le nœud métier et ses commandes restent conservés ; une classe ressemblante ou `aria-modal` seul ne constitue pas une migration.

## Sept fabriques de dialog HTML

| Fabrique | Surface | Contrat existant | Particularités à conserver |
| --- | --- | --- | --- |
| `web/lobby-choices.mjs` | `.lobby-picker` | `scenario-picker` | `showModal`, `open`, `close`, annulation, focus sur le choix courant |
| `web/hosted-castles.mjs` | `#hosted-castle-picker.lobby-picker` | `scenario-picker` | Même protocole ; fermeture native par deux ponts actuellement présents |
| `web/hosted-match-create.mjs` | `#hosted-map-picker.lobby-picker` | `scenario-picker` | Sélection de scénario pour la partie hébergée |
| `web/game-menu.mjs` | `#game-menu` | `game-menu` | Sous-vues, retour interne et une seule sortie de fenêtre |
| `web/session-recovery.mjs` | `.session-recovery` | `session-recovery` | Fermeture conditionnée par la phase ; peut être créée avant le jeu mobile |
| `web/campaign-media.mjs` | `.campaign-media-viewer` | `campaign-media` | Événement `close` déclenchant une seule fois la libération du média |
| `web/hosted-turn-notifications.mjs` | `.hosted-delete-dialog` | `dialog` générique | Annulation empêchée pendant la requête de suppression ; focus sur le déclencheur |

Ces fabriques emploient de vrais éléments HTML `dialog`. Leur migration doit remplacer la modalité HTML native par MUI : laisser le `showModal()` du navigateur actif en parallèle recréerait deux gestionnaires de modalité. Les attributs et événements publics `open`, `cancel` annulable et `close` doivent rester compatibles.

## Huit surfaces de section explicitement modales

| Fabrique | Surface | Contrat |
| --- | --- | --- |
| `web/mobile.mjs` | `.mobile-sheet` | `sheet` ; inclut armées, construction, recrutement groupé et autres contenus de fiche |
| `web/army-upgrades.mjs` | `.progression-page.army-upgrades-page` | `progression` |
| `web/progression-choices.mjs` | `.progression-page.progression-choices` | `progression` |
| `web/troop-actions.mjs` | `.progression-page.troop-actions-page` | `progression` |
| `web/troop-equipment.mjs` | `.progression-page.troop-equipment-page` | `progression` |
| `web/troop-deployment.mjs` | `.progression-page.troop-deployment-page` | `progression` |
| `web/mithril-enhancements.mjs` | `.mithril-panel` | `mithril` |
| `web/cave-builder.mjs` | `.cave-builder > section` | `cave-builder` |

Ces surfaces déclarent déjà `role="dialog"` et `aria-modal="true"`. Avant cette adoption, elles utilisaient une section et la frontière de focus commune, pas le composant MUI Dialog.

## Fenêtres du moteur sans sémantique modale explicite

| Fabrique | Surface / contrat | Point à vérifier |
| --- | --- | --- |
| `web/dialog-presentation.mjs` | `.dialog-presentation` / `message`, `commander` | Le contrat porte `modal:true`, mais la fabrique initiale ne posait ni `role=dialog` ni `aria-modal`. Choix obligatoire : pas de fermeture inventée. |
| `web/creature-presentation.mjs` | `.creature-presentation` / `creature` | Fiche, fort et recrutement ; conserver les canvas, illustrations et quantités. |
| `web/hero-equipment.mjs` | `.hero-equipment-page` / `hero` | Canvas animés et gestion des onglets/artefacts. |
| `web/hero-exchange.mjs` | `.hero-exchange-page` / `hero-exchange` | Commandes de transfert et fermeture native. |
| `web/marketplace.mjs` | `.market-page` / `marketplace` | Sélecteurs de ressources, quantités et échange. |
| `web/spellbook.mjs` | `.mobile-spellbook` / `spellbook` | Ciblage des sorts et retour au combat. |
| `web/mage-guild.mjs` | `.mobile-mage-guild` / `mage-guild` | Sélecteur de niveau et description défilante. |
| `web/town-services.mjs` | `.town-service` / `town-service` | Plusieurs services partagent cette fabrique. |
| `web/mobile-tavern.mjs` | `.mobile-tavern` / `tavern` | Recrutement et portraits animés. |
| `web/battle-result.mjs` | `.battle-result` / `battle-result` | Confirmation obligatoire de fin de combat. |

Ce sont des fenêtres du jeu même si leur enveloppe initiale ne déclarait pas la modalité. Une sélection limitée à `[aria-modal=true]` et `dialog` les manquerait.

## Pages à distinguer des fenêtres

Les contrats `storage`, `home`, `adventure-setup`, `campaign`, `online-login` et `online-lobby` représentent des pages ou des étapes de navigation. La préparation de partie, la campagne et les parcours en ligne ont aussi un bouton de fermeture ou de retour. Cela ne suffit pas à les rendre modaux : leur statut dépend de la présence d’un écran utilisable en arrière-plan. Les sélecteurs et confirmations ouverts par ces pages font partie des dialogues inventoriés plus haut.

La suppression d’une sauvegarde automatique utilise désormais `requestMaterialConfirmation` et son message d’échec `requestMaterialNotice`, exportés par la façade commune. Ces deux API ouvrent de vrais Dialog MUI et retournent une Promise après fermeture et restauration du focus. Les messages français/anglais et la suppression existante restent conservés ; annuler réactive le contrôle sans supprimer de fichier. Aucun `window.confirm` ni `window.alert` ne reste dans ce parcours.

## Contrats de migration et preuves

- MUI possède la pile, le backdrop, l’isolation accessible et le focus ; aucun second gestionnaire `inert` ni second piège de tabulation ne doit être superposé.
- Préserver un état `inert` posé indépendamment par l’application ; ne pas exiger que MUI utilise lui-même cet attribut.
- Conserver le nœud métier, ses références, les canvas, les gestionnaires, les valeurs des champs et une seule commande de fermeture.
- Garder le conteneur dans l’application propriétaire. L’adoption du Paper change les relations DOM directes : les sélecteurs `#mobile-app > .mobile-sheet` et `.mobile-play > .page` doivent suivre cette enveloppe commune.
- Conserver l’ascendance logique d’une fenêtre imbriquée, même après déplacement dans un portail, pour fermer ses descendants quand son parent métier disparaît.
- Les vrais Select MUI peuvent ouvrir un portail hors du Paper. Les menus natifs MUI peuvent rester dans la fenêtre. Aucun rafraîchissement métier ne doit bloquer leur saisie.
- Vérifier en français et anglais, portrait et paysage, sur Chromium et WebKit, puis sur les parcours connectés au moteur.

Le test `work/browser-tests/modal-boundary-e2e.mjs` couvre les piles de trois niveaux, fenêtres sœurs et imbriquées, fermetures hors ordre, retrait du DOM, focus clavier, clics réels, Select MUI et menus MUI. La vérification de la structure Dialog et de l’isolation assurée par MUI remplace les anciennes assertions imposant un mécanisme `inert` maison.

### Validation du pont HTMLDialog

Le pont `web/ui/native-dialog.mjs` conserve les méthodes d’instance `show`, `showModal`, `close`, l’attribut `open`, `returnValue` et l’événement `close`, sans appeler la modalité du navigateur. Les sept fabriques installent la composition commune avant leur première ouverture ; les trois fabriques hébergées le font explicitement après insertion de leur fenêtre.

Le test `work/browser-tests/native-dialog-interop-e2e.mjs`, utilisant le vrai runtime servi et les sept signatures de racines, a été exécuté sur Chromium et WebKit. Chaque fenêtre possède une racine Dialog MUI, son Paper et son focus ; aucune ne correspond à `:modal`. Le test piège `HTMLDialogElement.prototype.showModal` : aucun appel natif n’a lieu. Les contrôles vérifient aussi le veto de `cancel`, Escape, `returnValue` et un seul événement `close` par fermeture, y compris après un second appel à `close`. Ces contrôles valident le pont et les signatures de fenêtres ; ils ne simulent pas les opérations du serveur hébergé.

Le parcours réel `work/browser-tests/game-menu-dialog-native-e2e.mjs` a également passé sur le build servi, en français et anglais sous Chromium : carte en 360 × 740 et château en 716 × 279. Il ouvre les réglages, vérifie le Select accessible, ferme d’abord son menu avec Escape puis la fenêtre par sa croix ou Escape, et contrôle le retour du focus au bouton Menu. La sauvegarde est effectuée uniquement dans cette partie de test. Un contexte neuf réutilise ses propres octets pour ouvrir le chargement : le premier appui ouvre une confirmation MUI stable, un appui supplémentaire ne la duplique pas, et Annuler conserve le fichier. Aucun dialogue du navigateur ni aucune commande d’achat n’a été émis. Les captures et rapports restent dans `/tmp`.

## Validation de l’adoption

- Inventaire runtime : **208 cas validés**, soit 26 sources × français/anglais × portrait/paysage × Chromium/WebKit. Les sources sont initialisées avant leur insertion dans le DOM. La racine et le conteneur MUI Dialog, le Paper portant `role=dialog`, le backdrop et l’appartenance à l’application propriétaire sont vérifiés. Aucun `dialog` HTML ne reste dans la top layer native. Les nœuds métier, canvas, champs, valeurs et boutons conservent leur identité ; chaque sortie déclenche une seule commande.
- Piles et protocoles : **16 compositions et 816 assertions validées**, avec trois niveaux, fenêtres sœurs/imbriquées, fermetures hors ordre, retrait du DOM, focus MUI, Select et menus portallés. La réconciliation asynchrone standard de FocusTrap est attendue pour les fermetures hors ordre, sans gestionnaire de focus supplémentaire. La compatibilité `showModal`, `cancel` annulable, `close` et `returnValue` ainsi que les choix obligatoires sont couverts.
- Bandeau d’achat : **32 cas validés** dans `purchase-context-stack-e2e.mjs` : le contexte suit la fenêtre active, les mutations natives et les fermetures, dans les deux langues et orientations sur les deux moteurs.
- Moteur réel : **deux recrutements groupés Conflux validés dans Chromium**, en portrait 360×740 et paysage 716×279. Les stocks et budgets sont conservés, la confirmation et le résumé restent cliquables et la fermeture restitue une fiche de recrutement utilisable.

Ces preuves portent sur l’adoption, les interactions et les parcours indiqués. L’inventaire runtime fixe volontairement la géométrie pour isoler le contrat d’adoption ; il ne remplace pas les comparaisons visuelles des vraies dispositions d’écran.

Artefacts locaux : `/tmp/goonk-modal-inventory/result.json`, `/tmp/goonk-modal-boundary/result.json`, `/tmp/mui-active-paper-purchase.log`, `/tmp/goonk-mui-dialog-native-conflux/report.json`. Ces fichiers de preuve ne sont pas intégrés au jeu publié.

## Chrome des fenêtres en paysage

`modal-rail-chrome-e2e.mjs` vérifie le bandeau à l’intérieur du Paper MUI : Menu, huit ressources et fermeture dans les 56 px déjà réservés, réouvertures et rotations, mises à jour sans déplacement, tabulation visible, fermeture unique et état désactivé sans boucle de mise à jour. Les huit compositions français/anglais à 716×279 et 844×390 passent dans Chromium et WebKit. Le parcours Conflux avec le moteur Chromium vérifie aussi les ressources et la croix par hit-test avant et après le récapitulatif, puis ferme réellement le hall.

La tentative du parcours moteur complet dans WebKit headless reste non validée : le moteur demeure sur son écran de démarrage à 99 %, avant le menu et avant le montage des dialogues mobiles. La cause de cette initialisation inachevée n’est pas établie ; les tests des composants et protocoles MUI WebKit passent indépendamment.
