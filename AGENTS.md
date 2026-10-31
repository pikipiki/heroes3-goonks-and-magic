# Consignes de travail pour Heroes Goonk

À la demande du propriétaire, terminer chaque modification vérifiée par un commit et un push vers `origin/main`. La publication GitHub Pages se déclenche automatiquement sur ce push ; vérifier le résultat du workflow et signaler tout échec.

Ne pas inclure de code de diagnostic temporaire dans les versions publiées. Le propriétaire a explicitement demandé d’intégrer les données du jeu pour ce déploiement de test. Elles sont versionnées dans `game-data/` par morceaux vérifiés ; ne jamais ajouter les sauvegardes, paramètres locaux ou identifiants.

Pour les changements du moteur, suivre également `work/vcmi-wasm/AGENTS.md` et vérifier la compilation WebAssembly avec `ninja -j32 html5`.
