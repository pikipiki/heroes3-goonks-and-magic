# Consignes de travail pour Heroes Goonk

À la demande du propriétaire, terminer chaque modification vérifiée par un commit et un push vers `origin/main`. La publication GitHub Pages se déclenche automatiquement sur ce push ; vérifier le résultat du workflow et signaler tout échec.

Ne pas inclure de code de diagnostic temporaire dans les versions publiées. Le propriétaire a explicitement demandé d’intégrer les données du jeu pour ce déploiement de test. Elles sont versionnées dans `game-data/` par morceaux vérifiés ; ne jamais ajouter les sauvegardes, paramètres locaux ou identifiants.

Pour les changements du moteur, suivre également `work/vcmi-wasm/AGENTS.md` et vérifier la compilation WebAssembly avec `ninja -j32 html5`.

Pour les écrans mobiles et iPad en paysage, privilégier une colonne de commandes à droite (titre et fermeture inclus) lorsqu'un en-tête réduit trop la hauteur du contenu. Garder une seule sortie visible par action ; permettre le défilement vertical des panneaux dont le contenu ne tient pas, sans désactiver ce geste sur un ancêtre.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

### Utilisation dans Heroes Goonk / WoG

- Graphify est installé avec `pipx install graphifyy` ; le CLI est `graphify` (au besoin `/Users/sevenone./.local/bin/graphify`). La compétence projet est dans `.codex/skills/graphify/SKILL.md`.
- Le cache persistant `graphify-out/` reste local et ignoré par Git. Ne pas le publier, ni le lire en entier. `.graphifyignore` exclut les données binaires, les sorties et les audits générés.
- Sur un nouveau poste seulement, initialiser avec `graphify extract . --code-only --max-workers 4`. Ici, réutiliser l’index existant ; après des modifications ou un pull, lancer `graphify update .`, sans `--force`. Les hooks Git locaux maintiennent aussi l’index après commit, checkout, merge et rebase.
- Pour le port WoG, commencer par une question précise ou un symbole : `graphify query "SourceCampaignProcessor::beginTurn"`, `graphify explain "SourceCampaignProcessor.cpp"`, puis lire les lignes utiles. Les requêtes sont bornées par `.graphifyrc`.
- L’index AST sert à naviguer, pas à prouver la conformité ERA. Les macros C++ peuvent être partiellement comprises ; les formats non pris en charge, notamment les scripts ERM et les documents non indexés, nécessitent une lecture ou recherche ciblée. En cas de réponse absente/incomplète, cette recherche ciblée est autorisée ; ne pas relancer une analyse globale du dépôt.
