# Compositions MUI du jeu

Les 27 compositions sont exportées par `src/ui/game-components.mjs`. Elles emploient les composants réels de `src/ui/components.mjs` et les adaptations Heroes de `heroes-kit.mjs`. Aucun contrôle n’est fabriqué en HTML, ni simulé avec `Box component="button"`. Les images, surfaces SVG et médias sont des contenus rendus dans `Box` ; les commandes vidéo sont des boutons et curseurs MUI.

```jsx
<ThemeProvider theme={heroesReferenceTheme}>
  <Box className="hk-root">
  <GameUIProvider language="fr">
    <ArmyGrid
      title={hero.name}
      slots={nativeArmy}
      selected={selectedSlot}
      onSelect={selectSlot}
      onUpgrade={requestNativeUpgrade}
      upgradeDisabled={!nativeQuote.canUpgrade}
      upgradeReason={nativeQuote.reason}
    />
  </GameUIProvider>
  </Box>
</ThemeProvider>
```

Les données et callbacks sont fournis par l’adaptateur du moteur. Un callback absent désactive son action. Les contrôles sont pilotés par les props : la composition ne dépense pas de ressources, ne déplace pas de troupes, ne recalcule pas les prérequis et ne change pas de sauvegarde. Les confirmations s’ouvrent avant d’appeler le callback correspondant. Une réponse du moteur reste l’autorité sur le résultat de l’opération.

Les libellés propres aux contrôles sont fournis par `GameUIProvider`. Les noms, descriptions, motifs de refus et options de données doivent arriver dans la langue active. Les légendes étroites utilisent `FittedText`, une adaptation de `Typography` qui réduit la police seulement si un mot entier déborde, sans points de suspension ni coupure de mot. Les espacements MUI 9 passent par `sx`, pour ne pas dépendre d’anciens raccourcis de propriétés système. Les cadres, palettes et animations restent partagés dans le thème. L’effet de relief ajouté aux icônes n’est pas réintroduit.

| Composition | Données principales | Événements |
| --- | --- | --- |
| `KingdomChrome` | `resources`, `date`, `recruitLabel`, `modalOpen` | `onRecruits` ; bloqué pendant une modale |
| `SearchFilterBar` | `query`, `filters`, `count`, `busy` | `onQuery`, `onReset`, `filters[].onChange` |
| `ScenarioCard` | `scenario` : minicarte réelle, nom, taille, joueurs, faction | `onSelect(id)` |
| `PlayerSetup` | `players`, `factions`, `teams`, `readOnly` | `onChange(playerId, patch)` |
| `HeroIdentityCard` | `hero` : portrait, classe, niveau, caractéristiques, mana, expérience | Lecture seule |
| `ArmyGrid` | Sept `slots`, `selected`, état et motif d’amélioration | `onSelect(index)`, `onUpgrade()` après confirmation |
| `InventoryGrid` | `slots`, compatibilité, motif, `selected` | `onSelect(id)` |
| `TransferPanel` | `left`, `right`, `selected`, `route`, `quantity`, `split`, `canTransfer` | `onSelect`, `onQuantity`, `onSplit`, `onTransfer({selection, route, quantity, split})`, `onTransferAll` |
| `CreatureDetails` | `creature`, `art`, `stats`, `abilities`, `count` | Lecture seule ; capacités complètes |
| `EvolutionPicker` | `evolutions`, `selected` | `onSelect(id)` ; la troisième carte occupe la largeur restante |
| `RecruitmentRoster` | `families` avec créatures/coûts/stocks, `height`, `selected` | `onSelect(id)` ; deux rangées et défilement local |
| `BuildingProject` | `building` avec prérequis, coût et `canBuild` | `onSelect(id)`, `onBuild(id)` |
| `HeroHireCard` | `hero`, `cost`, `previews`, `canRecruit` | `onInspect('skills')`, `onRecruit(id)` après confirmation ; aperçu initial Compétences |
| `SpellPicker` | `spells`, `schools`, `selected`, `school`, `oneClick`, `readOnly`, `lastSpell` | `onSchool`, `onSelect(id)`, `onChoose(spell)`, `onReuse(spell)` |
| `SkillTree` | `nodes` avec `parentId`, niveaux et prérequis | `onSelect(id)` ; nœuds désactivés visibles |
| `UpgradeQuote` | `rows` avant/après, `totalCost`, `canUpgrade`, `reason` | `onConfirm()` après confirmation |
| `MarketTradePanel` | `resources`, `value`, devis natif `quote`, `max`, `busy` | `onChange(value)`, `onTrade(value)` après confirmation |
| `KingdomRanking` | `players`, `metrics`, `details`, sélections | `onMetric(id)`, `onPlayer(id)` ; huit joueurs et valeurs inconnues |
| `BattleHUD` | Créature `active`, `stats`, `effects`, `initiative`, `actions` | `onAction(id)`, `onInspect()` |
| `BattleResult` | `won`, `description`, `experience`, `sides[].losses`, `score` | `onConfirm()` ; zéro ou une perte restent des lignes compactes |
| `SaveRecoveryPanel` | `saves`, `busy`, `error` | `onResume`, `onExport`, `onDelete` après confirmation, `onImport(file)` |
| `StorageUsage` | `used`, `total`, `downloadProgress`, `offlineReady`, `busy`, `error` | `onDownload`, `onRepair` |
| `RuleOptionRow` | `label`, `description`, `checked` ou `options/value`, `reason` | `onChange(value)` |
| `CopyCodeField` | `code` | `onCopy(code)` facultatif ; sinon presse-papiers du navigateur ; repli par sélection manuelle |
| `NativeDialogForm` | `fields`, `values`, `busy` | `onChange(values)`, `onSubmit(values)`, `onCancel` facultatif ; choix requis et bornes validés |
| `MediaViewer` | `src`, `kind`, `title`, `caption` | `onClose` ; image ou lecteur vidéo à commandes MUI, erreur explicite |
| `ConsequenceSummary` | `items`, `cost`, `recovered`, `warning`, `acknowledged` | `onAcknowledge`, `onConfirm` ; confirmation bloquée tant que l’accusé requis manque |

Les tableaux d’objets attendent des identifiants stables. Les coûts sont des objets `{gold: 140}` ; `iconURL(key)` doit résoudre les icônes préchargées du registre natif, y compris les ressources additionnelles. Les champs numériques, prix et stocks n’utilisent pas une abréviation de l’or. Les valeurs nulles ne sont pas déduites d’un état fictif : elles doivent être fournies ou explicitement absentes.

Pour `TransferPanel`, le contrôleur conserve l’origine et la destination dans `route`; il calcule `canTransfer` avec les règles du jeu. Pour `SpellPicker`, le premier clic sélectionne et décrit le sort. Seul **Choisir la cible** appelle `onChoose`, sauf si l’option `oneClick` est activée. Le mode `readOnly` masque les actions de lancement et interdit aussi l’activation en un clic ; il permet la consultation du grimoire d’un héros à recruter. `enabled` et `reason` viennent du moteur ; afficher un sort indisponible reste possible sans le lancer.

`NativeDialogForm` accepte `text`, `number`, `select`, `radio`, `multiple` et `checkbox`. Les valeurs numériques sont envoyées en nombres et les identifiants d’options gardent leur type. Les options invalides/désactivées et les valeurs hors bornes ne permettent pas de valider. L’absence de `onCancel` représente un choix obligatoire sans fausse fermeture.

## Catalogue et validation

Lancer `node scripts/serve-design-system.mjs`, puis ouvrir `http://127.0.0.1:8942/design-system.html?view=compositions`. Les 27 exemples sont des instances réelles de la bibliothèque. Leurs callbacks restent locaux au catalogue ; ils ne simulent pas une partie active. Les valeurs de créatures viennent de la configuration Goonk ; les ressources et listes de revue sont identifiées comme des exemples.

Le portrait de Sylvia est décodé sans recadrage depuis `H3bitmap.lod / HPL003KN.PCX` (58×64 ; SHA-256 décompressé `33060a697b0562667bf9e1f568bc0f3ad43945e0aa413727c45d0c05ff282576`). La minicarte est l’aperçu préchargé réel `MAPS/003-GOONKS-WOG`. Les illustrations Goonk et les icônes viennent des assets déjà présents.

`node work/browser-tests/game-components-e2e.mjs` couvre les 27 compositions en français/anglais sur Chromium et WebKit, aux formats 320×568, 360×640, 568×280 et 640×360, puis les états vide, indisponible et description longue. Les captures sont conservées dans `/tmp/heroes-game-components`. Les contrats de confirmation, sélection de sort, validation, transfert, copie, suppression et huit joueurs sont vérifiés en interaction. `node work/browser-tests/game-components-boundaries-e2e.mjs` ajoute les une à quatre évolutions, choix d’identifiant numérique zéro, choix multiples requis, cycles de données, erreur vidéo et ressources nulles. Ses fichiers temporaires sont compilés sous `/tmp` et exclus du jeu public.

Le hook commun interdit les éléments HTML d’interface dans la bibliothèque et ses exemples, ainsi que le contournement par `Box component="button"`. Les surfaces sémantiques et les contenus `img`/`svg`/`video` passent par MUI. Cette vérification statique accompagne les tests du navigateur ; elle ne transforme pas les quatre moteurs de rendu natifs en contrôles MUI.

La bibliothèque est implémentée. L’adaptation de chaque ancien écran à ces nouvelles compositions, avec ses données et commandes natives, reste une migration distincte à valider dans une vraie partie.
