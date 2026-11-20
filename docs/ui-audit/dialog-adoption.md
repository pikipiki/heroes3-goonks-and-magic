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

Le blocage WebKit à 99 % est corrigé en 0.4.303. Le moteur fonctionnait, mais le premier rendu appelait des caches de composants encore non initialisés dans le graphe de modules asynchrones. La lecture de la langue est désormais synchrone, séparée du catalogue de traduction chargé par le réseau ; les caches de rendu s’initialisent au premier usage. La relance native WebKit valide ensuite les deux parcours Conflux complets, sans instrumentation ni contournement CSP, avec achats, ressources, menu et fermeture en portrait/paysage.

## Accès au commandant et actions de créature

- L’équipement du héros conserve un accès MUI explicite « Commandant / Commander », avec icône de secours visible jusqu’à l’arrivée de l’icône native. Les 12 compositions Chromium/WebKit, français/anglais, portrait/paysage vérifient la commande 85 unique, l’état désactivé, l’arrivée différée de l’atlas et l’absence du bouton pour un héros sans commandant.
- Le détail de créature place ses évolutions dans le rail droit en paysage. La zone défile pour plusieurs choix et conserve la hauteur du sprite. Les actions sont comparées en français/anglais sur cinq formats dans les deux navigateurs, avec les états en attente et les fiches de combat sans action.
- Le moteur réel valide aussi une évolution de trois Paingpaings en Royal Ram : bouton accessible à 390×844, 716×279 et 844×390, une seule commande 59, coût exact de 84 or et quantité conservée. Les tests permanents sont `hero-commander-access-e2e.mjs`, `creature-detail-actions-e2e.mjs` et `creature-upgrades-native-e2e.mjs`.

## Ajustements de navigation et de géométrie 0.4.304

La Tour de magie place son vrai Select MUI à droite en paysage, garde la liste et la description sur toute la hauteur gauche, et utilise seulement les libellés « Niveau N ». Le sélecteur natif et son en-tête restent les mêmes objets pendant le filtrage. La vue classique adopte le canvas original dans un conteneur MUI à gauche, puis le restitue avant reconstruction ou fermeture. Les tests vérifient le clic natif sur un sort et le retour, ainsi que 50 montages stables sans mutation et des réouvertures avec conteneur MUI neuf.

Les cartes d’évolution remplissent leurs lignes sans modifier le sprite ni la police. Le bouton de carte Échanger reste dans Plus à travers les mises à jour. Sans héros, le dock ne réserve plus de résumé vide. Au château, Construire/Retour/Plus ont une largeur égale et 48 px de hauteur ; le menu aligne icône et texte et garde un seul défilement pour atteindre la dernière action. Les icônes bois/soufre/or partagent la même colonne.

Les tests permanents correspondants sont `mage-guild-rail-e2e.mjs`, `mage-guild-rail-native-e2e.mjs`, `native-viewport-e2e.mjs`, `recruit-variants-stretch-e2e.mjs`, `map-exchange-overflow-e2e.mjs`, `map-empty-hero-e2e.mjs` et `town-actions-menu-e2e.mjs`. Ils couvrent Chromium/WebKit, français/anglais, portrait/paysage et les grands formats pour les cartes d’évolution. Les géométries réelles iPhone et Huawei ont aussi servi à identifier les corrections de dock et d’alignement des ressources.

## Carte compacte et menus 0.4.305

Les menus du pied de page utilisent l’ancrage MUI au-dessus du bouton et une hauteur limitée à l’espace disponible ; leur liste reste défilable. En paysage court, la sélection du héros utilise un bouton MUI de 48 px et un menu de choix réutilisable. Le nom, les PM et le mana ont des zones distinctes. Marcher, Fin tour et Plus ont la même hauteur de 48 px, avec icône au-dessus du texte. Le calendrier conserve une seule bordure fine ; sa date est centrée. La minimap utilise la hauteur libérée par cette sélection compacte.

Validation : Chromium et WebKit, FR/EN, 716×279 et 844×390 ; changement de héros par une seule commande native, menus ouverts vers le haut, absence de collision PM/mana/calendrier et cibles de 48 px. Les 28 cas du menu du château et les transitions carte sans héros restent vérifiés. Les optimisations moteur et leur périmètre de preuve sont documentés dans `docs/performance/battle-render-305.json` ; les sauvegardes et traces privées ne sont pas publiées.

## Ajustement des hauteurs 0.4.306

Sur la carte en paysage court, le calendrier est placé dans la même rangée de grille que la minimap, avec 4 px de respiration en haut et en bas. La ligne du héros reste à 48 px ; Marcher, Fin tour et Plus remplissent à égalité la hauteur restante de la rangée d’actions, avec un minimum de 48 px. Le composant commun replace le calendrier dans le bandeau lors du retour en portrait ou du changement d’écran. Les tests vérifient ces géométries en FR/EN sur Chromium et WebKit, ainsi que la carte sans héros et les rafraîchissements d’Échanger.

## Calendrier du château 0.4.307

En paysage court, le même calendrier MUI occupe désormais la rangée libre de la colonne du château, entre ressources et commandes. La date est centrée ; le cadre garde 4 px de respiration et n’ajoute aucune colonne. Construire, Retour et Plus conservent leurs cibles de 48 px. Le composant commun assure aussi le retour du calendrier dans le bandeau en portrait. Validation sur Huawei réel et sur Chromium/WebKit en FR/EN, avec transitions carte/château/portrait.

## Ressources et recrutement 0.4.308

Le contexte hebdomadaire utilise la composition partagée : tableau de créatures sur toute la hauteur à gauche en paysage, choix du château et notes à droite, une seule fermeture. Le titre reste visible. Le bandeau compact conserve trois lignes de ressources et « Recrues / 7 j », sans date, dans 68 px ; en portrait les informations déjà visibles près de Menu ne sont pas dupliquées. Les nombres utilisent le rôle typographique MUI commun `resourceValue` et affichent jusqu’à 99 999 pour les ressources et 99 999 999 pour l’or ; l’or reste aligné avec le bois et le soufre.

Le recrutement conserve ses boutons natifs dans la véritable frontière Dialog MUI, afin que le panneau ne puisse plus les recouvrir et qu’ils appartiennent au même parcours de focus. Les commandes retrouvent leur parent à la sortie. En paysage, la colonne d’animation occupe 70 % de son ancienne largeur (30 % de plus que la proposition réduite de moitié, puis un élargissement supplémentaire d’environ 8 %), libérant la description. Les caractéristiques, le coût, la quantité et les trois commandes partagent des régions explicites ; les boutons ont la même largeur et 48 px de hauteur. Le choix actif utilise le style partagé des cartes sélectionnées (fond, contour et coche). Une absence de capacités natives est indiquée explicitement. DGT dispose de la case large, vérifiée avec 45–90. Les cases de caractéristiques ont un padding interne et des libellés compacts accessibles ; elles restent toutes visibles sans défilement. Le bandeau partagé réserve une marge près de Menu et affiche Recrues / 7 j avec 4 px à droite. Le titre, la quantité et les actions ont le même alignement droit ; le dock sans séparateur vertical garde 8 px sous ses boutons. Le curseur garde une marge autour de sa poignée. Un intervalle vide 0–0 se dessine à gauche sans modifier les bornes natives ni envoyer de commande de recrutement.

Validation : Chromium et WebKit, FR/EN, six formats portrait/paysage, une ou trois évolutions ; contrôle du ciblage réel des boutons, du coût visible, de la poignée à zéro et du retour à l’inspection. Vérification réelle du paysage Huawei sans recharger la partie. Tests complémentaires du composant Slider (réapprovisionnement et clavier), du bandeau modal aux valeurs maximales et du contexte hebdomadaire.

## Grille de construction et onglets 0.4.309

Le catalogue affiche quatre cartes par rangée en paysage et trois en portrait, avec retour à la ligne des noms et résumés. Le thème commun des `MuiTabs` utilise `border-box`, une largeur maximale de 100 % et une largeur minimale nulle : les bordures sont comprises dans la largeur disponible, y compris pour les onglets verticaux. Le panneau réserve aussi un espace à droite pour sa barre de défilement. Le séparateur sous les filtres est retiré ; contrôles et groupes de bâtiments utilisent un espacement de 12 px et une marge intérieure pour aérer le catalogue. Le contrôle du Huawei a confirmé le débordement initial de 4 px et sa disparition après correction.

Validation : parcours de construction Chromium/WebKit, FR/EN, six formats portrait/paysage, dix factions et chaîne réelle de 26 dépendances. Les tests vérifient explicitement quatre colonnes en paysage et trois en portrait, les bordures contenues dans le panneau et l’absence de débordement horizontal des commandes.

## Bandeau portrait, cartes d’armée et choix du commandant 0.4.310

Lorsqu’une fenêtre d’achat s’ouvre en portrait, le bandeau commun Menu / ressources / Recrues appartient désormais au Dialog MUI actif. Le titre et la fermeture occupent la rangée suivante ; les ressources ne sont pas dupliquées dans le titre. Les mises à jour du stock conservent la géométrie et le menu restaure le focus dans le dialogue.

Les cartes d’armée réservent un bloc de caractéristiques uniforme de 76 px, ancré sous le nom complet : un Éfrit au nom court s’aligne avec une créature au nom sur plusieurs lignes. La sélection conserve son fond et son contour, sans coche. Les boutons de la carte utilisent les mêmes cadres d’illustration de 24 px pour Troupes et Villes, avec un libellé explicite sous l’icône. Huit images consécutives par transition château/carte ne montrent aucun réagencement dans les sources actuelles ; le Huawei exécutait encore un ancien module accompagné de prévisualisations temporaires.

Le commandant utilise un seul Select MUI avec icônes, partagé avec les autres sélecteurs via l’attribut d’option `data-icon`. Les mêmes illustrations sont utilisées dans le sélecteur et l’arbre. Les caractéristiques ATQ, DÉF, DGT et PV, sans icônes, réutilisent directement `creatureStatsMarkup`, également utilisé par le détail et le recrutement des monstres. L’inspection d’une compétence ne soumet aucune commande ; une sélection de montée de niveau conserve une seule commande native. En paysage, aperçu animé, description et commandes occupent trois colonnes distinctes. Le prototype approuvé est intégré : un Select filtre les capacités, les Accordion MUI affichent leurs descriptions à la demande et les Chip indiquent leur état. Le composant partagé Rating MUI, en petits losanges dorés, représente les rangs de maîtrise et les prérequis. Seule une action explicitement autorisée par le moteur prépare une sélection ; la confirmation native demeure distincte.

Validation Chromium/WebKit FR/EN : ouverture réelle de Construire en portrait avec Menu utilisable et stocks actualisés ; cartes d’armée à noms courts/longs sur quatre formats ; choix du commandant et descriptions longues en portrait/paysage ; arbre compact sur sept formats ; barre d’achat paysage et calendrier ; transitions de carte, menus et carte sans héros. Les tests correspondants incluent `portrait-purchase-header-e2e.mjs`, `hero-army-card-alignment-e2e.mjs`, `commander-selector-e2e.mjs` et `map-town-transition-e2e.mjs`.
