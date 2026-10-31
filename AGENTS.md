# Consignes de travail pour Heroes Goonk

À la demande du propriétaire, terminer chaque modification vérifiée par un commit et un push vers `origin/main`. La publication GitHub Pages se déclenche automatiquement sur ce push ; vérifier le résultat du workflow et signaler tout échec.

Ne pas inclure de code de diagnostic temporaire dans les versions publiées. Les données originales Heroes III restent exclues du dépôt public et des déploiements publics par défaut.

Pour les changements du moteur, suivre également `work/vcmi-wasm/AGENTS.md` et vérifier la compilation WebAssembly avec `ninja -j32 html5`.
