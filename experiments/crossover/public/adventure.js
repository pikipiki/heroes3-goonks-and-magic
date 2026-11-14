import { sharedField } from './shared-field.js';
import { battlePlan, battleResult } from './battle.js';
export function installAdventure(target, base, onExit, trial = false) {
    const win = target, doc = win.document;
    if (win.goonkCrossoverInstalled) {
        if (trial)
            win.dispatchEvent(new Event('goonk-crossover-demo'));
        return () => { };
    }
    win.goonkCrossoverInstalled = true;
    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('adventure.css', base).href;
    doc.head.append(style);
    const makeButton = (id, label, action) => { const button = doc.createElement('button'); button.id = id; button.type = 'button'; button.textContent = label; button.dataset.crossoverAction = action; button.setAttribute('translate', 'no'); return button; };
    const demo = makeButton('crossover-demo', 'Démo Heroes × StarCraft', 'demo');
    demo.innerHTML = '<span>Démo Heroes × StarCraft</span><small>Archers, piquiers et Marines</small>';
    demo.disabled = true;
    const menuDemo = makeButton('crossover-demo-menu', 'Démo Heroes × StarCraft', 'demo');
    const toggle = makeButton('crossover-toggle', 'Combats en temps réel : activés', 'toggle');
    toggle.setAttribute('aria-pressed', 'true');
    const mainStatus = doc.createElement('p'), menuStatus = doc.createElement('p');
    for (const status of [mainStatus, menuStatus]) {
        status.className = 'crossover-menu-status';
        status.setAttribute('translate', 'no');
        status.setAttribute('role', 'status');
    }
    const hint = (text) => { for (const status of [mainStatus, menuStatus])
        status.textContent = text; };
    const closeMenu = () => { doc.querySelector('#game-menu')?.close(); };
    let enabled = true, configured = false, disposed = false, plan, frame, panel, timer, sent = false, starting = false, selected = false, autoAttack = false, isDemo = trial, latestMode = '', checkpoint = false, sceneDispose;
    let settingsButton;
    const cancelled = new Set();
    const mountControls = () => {
        const home = doc.querySelector('#mobile-app .mobile-menu[data-kind="menu"]');
        if (home && !home.contains(demo)) {
            const first = home.querySelector('[data-action="20"]');
            if (first)
                first.after(demo);
            else
                home.append(demo);
            home.append(mainStatus);
        }
        settingsButton ||= doc.querySelector('#game-menu-toggle') || undefined;
        const top = doc.querySelector('#mobile-app .mobile-top');
        if (settingsButton) {
            if (latestMode === 'menu' && home && !home.contains(settingsButton)) {
                home.append(settingsButton);
                settingsButton.textContent = 'Options';
                settingsButton.setAttribute('aria-label', 'Options du jeu');
            }
            else if (latestMode !== 'menu' && top && !top.contains(settingsButton)) {
                top.prepend(settingsButton);
                settingsButton.textContent = '☰';
                settingsButton.setAttribute('aria-label', 'Menu du jeu');
            }
        }
        const nav = doc.querySelector('#game-menu nav');
        if (nav && !nav.contains(menuDemo)) {
            nav.append(menuDemo, toggle, menuStatus);
        }
    };
    const command = (op, id, rows = []) => {
        const m = win.Module;
        if (!m?._vcmiCrossoverCommand)
            throw Error('Moteur Heroes sans passerelle de combat.');
        const bytes = new Int32Array(rows.flat()), pointer = rows.length ? m._malloc(bytes.byteLength) : 0;
        try {
            if (rows.length)
                m.HEAPU8.set(new Uint8Array(bytes.buffer), pointer);
            m._vcmiCrossoverCommand(op, id, pointer, rows.length);
        }
        finally {
            if (pointer)
                m._free(pointer);
        }
    };
    const closePanel = () => { sceneDispose?.(); sceneDispose = undefined; if (timer !== undefined)
        win.clearInterval(timer); timer = undefined; frame?.remove(); frame = undefined; panel?.remove(); panel = undefined; plan = undefined; sent = false; };
    const begin = (value) => {
        if (plan?.battleId === value.battleId || cancelled.has(value.battleId))
            return;
        closePanel();
        closeMenu();
        plan = battlePlan(value);
        panel = doc.createElement('section');
        panel.id = 'crossover-arena';
        panel.setAttribute('translate', 'no');
        panel.setAttribute('aria-label', 'Combat Heroes × StarCraft');
        panel.innerHTML = '<div class="field"><iframe title="Moteur de combat" aria-hidden="true" tabindex="-1"></iframe><canvas id="crossover-field"></canvas></div><header class="battle-heading"><div class="heading-label"><span class="eyebrow">HEROES GOONK</span><h2>Combat en temps réel</h2></div><button id="crossover-cancel" aria-label="Reprendre le combat Heroes classique">↩ Classique</button><p id="crossover-battle-status" role="status">Préparation du combat…</p><progress aria-label="Préparation des données du combat"></progress></header><aside aria-label="Commandes du combat"><div class="battle-actions"><button id="crossover-start" disabled>Commencer le combat</button><button id="crossover-attack" aria-pressed="false" disabled>Attaquer</button><button id="crossover-stop" disabled>Arrêter</button><button id="crossover-select-all" disabled>Tout sélectionner</button></div><p id="crossover-selection" class="battle-selection" role="status">Sélectionne une troupe pour lui donner un ordre.</p><section aria-label="Armées"><h3>Les combattants</h3><div id="crossover-roster"></div></section><details><summary>Comment jouer</summary><p>Choisis une troupe, puis touche le terrain pour la déplacer ou un ennemi pour l’attaquer. « Attaquer » prépare une attaque vers le prochain point choisi. « Arrêter » annule ses ordres. Tes troupes restent inactives sans ordre.</p></details></aside>';
        doc.body.append(panel);
        frame = panel.querySelector('iframe');
        frame.src = new URL('starcraft/index.html', base).href;
        const activePanel = panel, activeFrame = frame, activePlan = plan, canvas = panel.querySelector('#crossover-field');
        const status = panel.querySelector('#crossover-battle-status'), start = panel.querySelector('#crossover-start'), attack = panel.querySelector('#crossover-attack'), stop = panel.querySelector('#crossover-stop'), all = panel.querySelector('#crossover-select-all'), progress = panel.querySelector('progress'), selection = panel.querySelector('#crossover-selection');
        const roster = panel.querySelector('#crossover-roster'), cards = new Map();
        let ready = false, chosen;
        for (const row of plan.stacks.filter(row => row.side === 0)) {
            const button = doc.createElement('button');
            button.className = 'army-card';
            button.dataset.crossoverGroup = String(row.id);
            button.type = 'button';
            button.disabled = true;
            button.setAttribute('aria-pressed', 'false');
            const count = doc.createElement('strong'), name = doc.createElement('span');
            count.textContent = String(row.count);
            name.textContent = row.name;
            button.append(count, name);
            roster.append(button);
            cards.set(row.id, { button, count });
            button.onclick = () => canvas.dispatchEvent(new CustomEvent('crossover-select-group', { detail: row.id }));
        }
        const enemy = doc.createElement('div');
        enemy.className = 'army-card enemy';
        const enemyCount = doc.createElement('strong'), enemyName = doc.createElement('span');
        enemyCount.textContent = String(plan.stacks.filter(row => row.side === 1).reduce((sum, row) => sum + row.count, 0));
        enemyName.textContent = 'Ennemis · ' + [...new Set(plan.stacks.filter(row => row.side === 1).map(row => row.name))].join(', ');
        enemy.append(enemyCount, enemyName);
        roster.append(enemy);
        const updateSelection = () => { for (const [id, { button }] of cards)
            button.setAttribute('aria-pressed', String(chosen !== undefined && (chosen < 0 || chosen === id))); attack.disabled = stop.disabled = !ready || chosen === undefined; };
        canvas.addEventListener('crossover-selection', event => { const data = event.detail; chosen = data.id; selection.textContent = data.name; updateSelection(); });
        canvas.addEventListener('crossover-order-issued', event => { attack.setAttribute('aria-pressed', 'false'); selection.textContent = event.detail; });
        all.onclick = () => canvas.dispatchEvent(new Event('crossover-select-all'));
        attack.onclick = () => { const active = attack.getAttribute('aria-pressed') !== 'true'; attack.setAttribute('aria-pressed', String(active)); canvas.dispatchEvent(new CustomEvent('crossover-command-mode', { detail: active ? 'attack' : 'move' })); selection.textContent = active ? 'Choisis un ennemi ou un point à attaquer.' : 'Choisis un point où déplacer la sélection.'; };
        stop.onclick = () => canvas.dispatchEvent(new Event('crossover-stop-selection'));
        start.onclick = () => { try {
            frame.contentWindow.openbwCrossover.start();
            start.hidden = true;
        }
        catch (e) {
            status.textContent = String(e);
        } };
        panel.querySelector('#crossover-cancel').onclick = () => { cancelled.add(activePlan.battleId); command(2, activePlan.battleId); closePanel(); hint('Combat repris dans Heroes, sans appliquer les pertes du test annulé.'); };
        frame.addEventListener('load', async () => {
            try {
                const sc = activeFrame.contentWindow;
                if (!sc.openbwLaunchCrossover)
                    throw Error('Chargement de StarCraft incomplet.');
                timer = win.setInterval(() => { const text = sc.document.querySelector('#archive-status')?.textContent || ''; const percent = text.match(/(\d+)\s*%/); if (percent) {
                    progress.max = 100;
                    progress.value = Number(percent[1]);
                    status.textContent = 'Téléchargement des données : ' + percent[1] + ' %';
                } }, 200);
                await sc.openbwLaunchCrossover(activePlan);
                if (disposed || panel !== activePanel || frame !== activeFrame || plan !== activePlan)
                    return;
                if (timer !== undefined)
                    win.clearInterval(timer);
                progress.hidden = true;
                status.textContent = 'Prêt · contrôle manuel';
                ready = true;
                start.disabled = all.disabled = false;
                for (const { button } of cards.values())
                    button.disabled = false;
                sceneDispose = sharedField(win, canvas, sc.openbwCrossover, activePlan);
                timer = win.setInterval(() => {
                    try {
                        const native = sc.openbwCrossover?.battle();
                        if (!native)
                            return;
                        start.disabled = all.disabled = native.finished;
                        ready = !native.finished;
                        updateSelection();
                        const message = native.finished ? 'Résultat transmis à Heroes…' : native.frame === 0 ? 'Prêt · contrôle manuel' : `Combat en cours · ${Math.floor(native.frame * 0.042)} s`;
                        if (status.textContent !== message)
                            status.textContent = message;
                        let opponents = 0;
                        for (const group of native.groups) {
                            const card = cards.get(group.id);
                            if (card) {
                                if (card.count.textContent !== String(group.survivors))
                                    card.count.textContent = String(group.survivors);
                                card.button.disabled = group.survivors === 0 || native.finished;
                            }
                            else if (group.side === 1)
                                opponents += group.survivors;
                        }
                        if (enemyCount.textContent !== String(opponents))
                            enemyCount.textContent = String(opponents);
                        if (native.finished && !sent) {
                            const rows = battleResult(activePlan, native);
                            sent = true;
                            command(1, activePlan.battleId, rows);
                            win.dispatchEvent(new CustomEvent('goonk-crossover-submitted', { detail: { version: 1, plan: structuredClone(activePlan), result: structuredClone(native) } }));
                        }
                    }
                    catch (e) {
                        status.textContent = String(e);
                    }
                }, 200);
            }
            catch (e) {
                progress.hidden = true;
                status.textContent = String(e) + ' Tu peux reprendre le combat classique.';
            }
        });
    };
    const observe = (event) => {
        const state = event.detail;
        if (!state || disposed)
            return;
        latestMode = state.mode;
        mountControls();
        demo.disabled = !!state.onlineGame || trial || state.mode !== 'menu';
        menuDemo.hidden = toggle.hidden = state.mode !== 'map';
        menuDemo.disabled = !!state.onlineGame || checkpoint || !state.turn;
        toggle.disabled = !!state.onlineGame || !state.turn;
        menuDemo.textContent = isDemo ? 'Rejouer la démo' : 'Démo Heroes × StarCraft';
        if (state.mode === 'menu') {
            configured = false;
            cancelled.clear();
            if (!trial)
                isDemo = false;
        }
        if (state.mode === 'load')
            isDemo = false;
        if (trial && state.mode === 'menu' && !starting) {
            starting = true;
            win.Module?._vcmiMobileCommand?.(20, 1, 0, 0, 0, 0);
        }
        if (trial && state.mode === 'lobby' && state.lobbyReady && !selected) {
            selected = true;
            win.setTimeout(() => { if (!disposed)
                win.Module?._vcmiMobileCommand?.(111, 0, 0, 0, 0, 0); }, 0);
        }
        if (trial && selected && state.mode === 'lobby' && state.selectedMap === 'Crossover - duel StarCraft' && state.lobbyReady) {
            selected = false;
            trial = false;
            autoAttack = true;
            win.Module?._vcmiMobileCommand?.(22, 0, 0, 0, 0, 0);
        }
        if (state.mode === 'map' && state.turn && !configured) {
            try {
                command(0, enabled ? 1 : 0);
                configured = true;
            }
            catch (e) {
                hint(String(e));
            }
        }
        if (autoAttack && state.mode === 'map' && state.turn && state.crossoverEnabled) {
            autoAttack = false;
            win.Module?._vcmiMobileCommand?.(112, 0, 0, 0, 0, 0);
        }
        if (state.crossover) {
            try {
                begin(state.crossover);
            }
            catch (e) {
                hint(String(e));
            }
        }
        else if (plan && (state.dialogKind === 'battle-result' || state.mode === 'map' || state.mode === 'dialog')) {
            if (sent)
                hint('Bilan du combat reçu. Confirme-le pour reprendre l’aventure.');
            closePanel();
        }
    };
    const startDemo = () => { closeMenu(); trial = true; isDemo = true; starting = false; selected = false; hint('Ouverture de la démo…'); };
    const persisted = (event) => { const detail = event.detail; if (!checkpoint || !String(detail?.path).toLowerCase().endsWith('/avant-demo-starcraft.vsgm1'))
        return; checkpoint = false; if (detail.ok) {
        startDemo();
        win.Module?._vcmiMobileCommand?.(71, 0, 0, 0, 0, 0);
    }
    else
        hint('Sauvegarde impossible : ton aventure reste ouverte.'); };
    const checkpointReply = (event) => { if (checkpoint && !event.detail.accepted) {
        checkpoint = false;
        hint('Attends la fin du déplacement, puis relance la démo.');
    } };
    const demoAction = () => { if (!latestMode || latestMode === 'menu')
        startDemo();
    else if (latestMode === 'map' && !checkpoint) {
        if (isDemo) {
            startDemo();
            win.Module?._vcmiMobileCommand?.(71, 0, 0, 0, 0, 0);
        }
        else {
            checkpoint = true;
            hint('Sauvegarde de ton aventure avant la démo…');
            win.Module?._vcmiMobileCommand?.(113, 0, 0, 0, 0, 0);
        }
    } };
    const click = (event) => { const button = event.target.closest?.('button[data-crossover-action]'); if (!button || button.disabled)
        return; event.preventDefault(); event.stopImmediatePropagation(); if (button.dataset.crossoverAction === 'demo')
        demoAction();
    else {
        enabled = !enabled;
        command(0, enabled ? 1 : 0);
        toggle.textContent = `Combats en temps réel : ${enabled ? 'activés' : 'désactivés'}`;
        toggle.setAttribute('aria-pressed', String(enabled));
    } };
    doc.addEventListener('click', click, true);
    win.addEventListener('goonk-mobile-mounted', mountControls);
    win.addEventListener('goonk-save-persisted', persisted);
    win.addEventListener('goonk-crossover-checkpoint', checkpointReply);
    win.addEventListener('goonk-crossover-demo', demoAction);
    win.addEventListener('goonk-state', observe);
    mountControls();
    return () => { disposed = true; delete win.goonkCrossoverInstalled; doc.removeEventListener('click', click, true); win.removeEventListener('goonk-mobile-mounted', mountControls); win.removeEventListener('goonk-save-persisted', persisted); win.removeEventListener('goonk-crossover-checkpoint', checkpointReply); win.removeEventListener('goonk-crossover-demo', demoAction); win.removeEventListener('goonk-state', observe); closePanel(); if (settingsButton)
        doc.querySelector('#mobile-app .mobile-top')?.prepend(settingsButton); for (const node of [demo, menuDemo, toggle, mainStatus, menuStatus, style])
        node.remove(); };
}
