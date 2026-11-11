# Navigation privée — validation 0.4.129

Tests du vrai moteur WebAssembly sur Mac, dans de nouveaux contextes isolés, avec OPFS forcé indisponible. Paquet public servi localement ; CSP du domaine de publication contournée uniquement par le navigateur de test. Aucun outil de mesure n’est publié dans le site.

- `chromium-private-cpu2.json` : 21 phases réussies avec ralentissement CPU ×2. Nouvelle partie, carte, château, 72 sélections, animation vérifiée par images différentes, fiche de créature, héros, entrée et fin de combat automatique, construction immédiate après combat, guilde, marché, achat avec stock/or exacts, quatre réouvertures, reprise audio, quatre rotations téléphone/iPad, sauvegarde temporaire confirmée et jour suivant.
- `webkit-private.json` : lancement natif et 72 sélections réussies. Long Tasks indisponible dans WebKit : utiliser les intervalles d’images, sans interpréter les tableaux de tâches vides comme une mesure.
- `baseline-rendering-cache-fixed.json` : ancien moteur/rendu, avec seulement le correctif de cache temporaire injecté pour pouvoir lancer la comparaison. CPU sans ralentissement. Ce n’est pas une référence entièrement inchangée : l’ancienne version échouait aussi au démarrage quand un serveur ignorait Range.

Sur les 72 sélections, l’ancien rendu produit des tâches jusqu’à 151 ms ; le nouveau n’en produit aucune >50 ms, même avec CPU ×2. Les relectures WebGL passent à zéro dans le hall et les fiches animées. Les intervalles d’images maximaux sont 33,33 ms (sélection rapide), puis 16,67 ms sur les deux séries suivantes dans Chromium ; WebKit reste sous 100 ms. Le signal audio mesuré est non nul. Un intervalle de callback audio doit être comparé au tampon, passé de 21,33 à 85,33 ms ; ce n’est pas une mesure acoustique d’absence de coupure sur iPhone.

Les premiers chargements du château/hall et une rotation conservent des tâches ponctuelles >100 ms dans le parcours CPU ×2. Le test ne couvre pas toutes les campagnes, ni le verrouillage physique d’un iPhone, ni tous les navigateurs privés. Le moteur de test utilise une carte fournie, normalisée en mémoire, avec guilde et marché ajoutés pour exercer ces écrans. Les avertissements de génération de ce petit scénario et du cache audio de carte ne sont pas assimilés à un profil natif sans erreurs.

Autres validations : `npm test` (467 réussis, 22 ignorés), `ninja -j32 html5`, `build:web`, `verify:web`, scénario de recrutement UI Chromium/WebKit et fiche animée native depuis l’armée du héros.
