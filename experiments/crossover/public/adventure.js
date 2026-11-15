import { LOADOUT_KEY, parseLoadout, defaultLoadout, resolveSpell, spellRef, assignSlot } from './loadout.js';
import { magicController } from './magic.js';
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
    demo.innerHTML = '<span>Démo Heroes × StarCraft</span><small>7 × 5 troupes finales · 12 StarCraft max</small>';
    demo.disabled = true;
    const realTime = doc.createElement('button');
    realTime.type = 'button';
    realTime.id = 'crossover-realtime';
    realTime.className = 'crossover-mode-button';
    realTime.textContent = '▶ Temps réel';
    realTime.disabled = true;
    realTime.title = 'Passer ce combat solo en temps réel pendant ton tour.';
    const modeStatus = doc.createElement('p');
    modeStatus.className = 'crossover-mode-status';
    modeStatus.setAttribute('role', 'status');
    let latestBattleId = -1, canSwitch = false, switchPending = false, returningToClassic = false, switchEpoch = 0;
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
    let settingsButton, latestOnline = false, latestTurn = false;
    let warmFrame, warmPromise, assetsReady = false;
    const prepareEngine = () => {
        if (warmPromise)
            return warmPromise;
        assetsReady = false;
        realTime.disabled = true;
        realTime.textContent = 'Préparation…';
        hint('Préparation de StarCraft…');
        warmFrame = doc.createElement('iframe');
        warmFrame.dataset.crossoverEngine = '';
        warmFrame.title = 'Moteur de combat';
        warmFrame.setAttribute('aria-hidden', 'true');
        warmFrame.tabIndex = -1;
        warmFrame.style.cssText = 'position:fixed;width:min(100vw,800px);height:min(100vh,500px);left:0;top:0;opacity:0;pointer-events:none;border:0;z-index:-1';
        const preparedFrame = warmFrame;
        warmPromise = new Promise((resolve, reject) => {
            preparedFrame.addEventListener('load', async () => {
                try {
                    const sc = preparedFrame.contentWindow;
                    if (!sc.openbwPrepareCrossover)
                        throw Error('Préparation du moteur StarCraft indisponible.');
                    await sc.openbwPrepareCrossover();
                    if (disposed)
                        return;
                    assetsReady = true;
                    realTime.disabled = !canSwitch || switchPending;
                    realTime.textContent = '▶ Temps réel';
                    hint('');
                    demo.disabled = latestOnline || latestMode !== 'menu' || trial;
                    menuDemo.disabled = latestOnline || checkpoint || !latestTurn;
                    configured = false;
                    resolve(sc);
                }
                catch (error) {
                    hint(String(error));
                    reject(error);
                }
            }, { once: true });
            preparedFrame.src = new URL('starcraft/index.html', base).href;
            doc.body.append(preparedFrame);
        });
        return warmPromise;
    };
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
        const combat = doc.querySelector('.battle-team-actions');
        if (combat && !combat.contains(realTime))
            combat.append(realTime);
        const topBar = doc.querySelector('.mobile-top');
        if (topBar && !topBar.contains(modeStatus))
            topBar.append(modeStatus);
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
    realTime.onclick = () => {
        if (!canSwitch || switchPending)
            return;
        const battleId = latestBattleId, epoch = ++switchEpoch;
        cancelled.delete(battleId);
        switchPending = true;
        realTime.disabled = true;
        realTime.textContent = assetsReady ? 'Activation…' : 'Préparation…';
        modeStatus.textContent = '';
        void (async () => {
            await prepareEngine();
            if (epoch !== switchEpoch)
                return;
            if (disposed || battleId !== latestBattleId || !canSwitch) {
                switchPending = false;
                realTime.disabled = !canSwitch;
                return;
            }
            command(3, battleId);
            win.setTimeout(() => { if (epoch === switchEpoch && switchPending && latestBattleId === battleId) {
                switchPending = false;
                realTime.textContent = '▶ Temps réel';
                realTime.disabled = !canSwitch;
                modeStatus.textContent = 'Ce combat ne permet pas le passage en temps réel.';
            } }, 6000);
        })().catch(error => { if (epoch !== switchEpoch)
            return; switchPending = false; realTime.disabled = !canSwitch; modeStatus.textContent = String(error); });
    };
    const closePanel = () => { returningToClassic = false; const nativeApp = doc.querySelector('#mobile-app'); if (nativeApp)
        nativeApp.inert = false; const hadEngine = !!frame; sceneDispose?.(); sceneDispose = undefined; const host = frame?.contentWindow; host?.openbwDisposeCrossover?.(); if (timer !== undefined)
        win.clearInterval(timer); timer = undefined; frame?.remove(); frame = undefined; panel?.remove(); panel = undefined; plan = undefined; sent = false; if (hadEngine) {
        assetsReady = false;
        realTime.textContent = '▶ Temps réel';
        realTime.disabled = !canSwitch;
    } };
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
        panel.innerHTML = '<div class="field"><iframe title="Moteur de combat" aria-hidden="true" tabindex="-1"></iframe><canvas id="crossover-field"></canvas></div><header class="battle-heading"><div class="heading-label"><span class="eyebrow">HEROES GOONK</span><h2>Combat en temps réel</h2></div><button id="crossover-cancel" aria-label="Continuer ce combat au tour par tour">↩ Classique</button><p id="crossover-battle-status" role="status">Préparation du combat…</p><progress aria-label="Préparation des données du combat"></progress></header><aside aria-label="Commandes du combat"><div class="command-console"><div class="precombat-actions"><button id="crossover-start" disabled>Commencer le combat</button><button id="crossover-loadout" disabled>Préparer 5 sorts</button></div><div class="battle-actions sc-command-grid"><button id="crossover-move" disabled>↗<small>Déplacer</small></button><button id="crossover-attack" aria-pressed="false" disabled>Avancer et attaquer</button><button id="crossover-stop" disabled>■<small>Arrêter</small></button><button class="quick-slot" data-quick-slot="0" disabled><kbd>1</kbd><canvas class="spell-icon" width="48" height="48"></canvas><small class="quick-name">Sort 1</small><span class="quick-cost"></span></button><button class="quick-slot" data-quick-slot="1" disabled><kbd>2</kbd><canvas class="spell-icon" width="48" height="48"></canvas><small class="quick-name">Sort 2</small><span class="quick-cost"></span></button><button class="quick-slot" data-quick-slot="2" disabled><kbd>3</kbd><canvas class="spell-icon" width="48" height="48"></canvas><small class="quick-name">Sort 3</small><span class="quick-cost"></span></button><button class="quick-slot" data-quick-slot="3" disabled><kbd>4</kbd><canvas class="spell-icon" width="48" height="48"></canvas><small class="quick-name">Sort 4</small><span class="quick-cost"></span></button><button class="quick-slot" data-quick-slot="4" disabled><kbd>5</kbd><canvas class="spell-icon" width="48" height="48"></canvas><small class="quick-name">Sort 5</small><span class="quick-cost"></span></button><button id="crossover-select-all" disabled>Tout sélectionner</button></div><div class="console-utility"><button id="crossover-spells" disabled>Tous les sorts</button><button id="crossover-sound" disabled aria-pressed="true">Son activé</button></div></div><p id="crossover-selection" class="battle-selection" role="status">Sélectionne une troupe, puis touche un ennemi pour attaquer.</p><section id="crossover-spell-picker" hidden aria-label="Choix du sort"><h3>Combat en pause</h3><p>Choisis un sort, puis sa cible sur le terrain.</p><div id="crossover-loadout-slots" hidden></div><div id="crossover-spell-options"></div><div id="crossover-friendly-targets" hidden></div><button id="crossover-spell-cancel">Annuler le sort</button></section><section aria-label="Armées"><h3>Les combattants</h3><p>Terrans, Zergs et Protoss : armes et armures 3/3, boucliers 3.</p><div id="crossover-roster"></div></section><details><summary>Comment jouer</summary><p>Choisis une troupe, puis touche le terrain pour la déplacer ou un ennemi pour l’attaquer. Touche directement un ennemi pour attaquer : aucun bouton supplémentaire. Le premier ordre démarre le combat. « Avancer et attaquer » sert uniquement à avancer vers un point en engageant les ennemis rencontrés. « Arrêter » annule ses ordres. Tes troupes restent inactives sans ordre. « Sorts » met le combat en pause : choisis un sort du héros ou d’une créature, puis touche sa cible pour le lancer et reprendre le combat. Les sorts de zone touchent aussi les alliés sensibles à la magie.</p></details></aside>';
        panel.hidden = true;
        doc.body.append(panel);
        const nativeApp = doc.querySelector('#mobile-app');
        if (nativeApp)
            nativeApp.inert = true;
        panel.querySelector('iframe').remove();
        const prepared = prepareEngine();
        frame = warmFrame;
        warmFrame = undefined;
        warmPromise = undefined;
        const activePanel = panel, activeFrame = frame, activePlan = plan, canvas = panel.querySelector('#crossover-field');
        const status = panel.querySelector('#crossover-battle-status'), start = panel.querySelector('#crossover-start'), attack = panel.querySelector('#crossover-attack'), stop = panel.querySelector('#crossover-stop'), all = panel.querySelector('#crossover-select-all'), progress = panel.querySelector('progress'), selection = panel.querySelector('#crossover-selection');
        const sound = panel.querySelector('#crossover-sound');
        const audio = () => { const api = activeFrame.contentWindow.openbwCrossover; void api?.enableAudio?.().catch(() => { sound.textContent = 'Activer le son'; selection.textContent = 'Touche « Activer le son » pour autoriser les sons du combat.'; }); };
        activePanel.addEventListener('pointerdown', audio, { capture: true });
        sound.onclick = () => { const api = activeFrame.contentWindow.openbwCrossover; api?.setMuted?.(!api.audioState?.().muted); audio(); updateSound(); };
        const updateSound = () => { const muted = activeFrame.contentWindow.openbwCrossover?.audioState?.().muted ?? false; sound.textContent = muted ? 'Son coupé' : 'Son activé'; sound.setAttribute('aria-pressed', String(!muted)); sound.setAttribute('aria-label', muted ? 'Activer les sons du combat' : 'Couper les sons du combat'); };
        const roster = panel.querySelector('#crossover-roster'), cards = new Map();
        let ready = false, chosen, returnTimer;
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
        const effectiveOwners = new Map(), enemyCards = new Map();
        const enemy = doc.createElement('div');
        enemy.className = 'army-card enemy';
        const enemyCount = doc.createElement('strong'), enemyName = doc.createElement('span');
        enemyCount.textContent = String(plan.stacks.filter(row => row.side === 1).reduce((sum, row) => sum + row.count, 0));
        enemyName.textContent = 'Ennemis · ' + [...new Set(plan.stacks.filter(row => row.side === 1).map(row => row.name))].join(', ');
        enemy.append(enemyCount, enemyName);
        roster.append(enemy);
        for (const row of activePlan.stacks.filter(s => s.side === 1)) {
            const card = doc.createElement('div');
            card.className = 'army-card enemy';
            card.dataset.enemyGroup = String(row.id);
            const count = doc.createElement('strong'), name = doc.createElement('span');
            count.textContent = String(row.count);
            name.textContent = row.name;
            card.append(count, name);
            roster.append(card);
            enemyCards.set(row.id, count);
        }
        const spellButton = panel.querySelector('#crossover-spells'), picker = panel.querySelector('#crossover-spell-picker'), options = panel.querySelector('#crossover-spell-options');
        const prep = panel.querySelector('#crossover-loadout'), move = panel.querySelector('#crossover-move'), slotOverview = panel.querySelector('#crossover-loadout-slots'), cancelSpell = panel.querySelector('#crossover-spell-cancel'), quickButtons = [...panel.querySelectorAll('[data-quick-slot]')];
        let loadout;
        try {
            loadout = parseLoadout(win.localStorage.getItem(LOADOUT_KEY));
        }
        catch { }
        let draft = [], editing = false, editingSlot;
        let choosingSpell = false, wasPaused = true, armedSpell, teleportTarget, effectUntil = 0, catalogue = activePlan.magic, lastMagicRound = 0, finalMagicSync = false, observedFinish = false;
        const bookRoot = doc.createElement('div');
        bookRoot.id = 'crossover-spellbook-root';
        bookRoot.hidden = true;
        activePanel.append(bookRoot);
        let bookPage = 0, bookSchool = -1, bookCaster = -1;
        const sharedBook = win.goonkCreateCombatSpellbook?.({ root: bookRoot, command: (op, value = 0) => { if (op === 50)
                bookPage = Math.max(0, bookPage + value); if (op === 51) {
                bookSchool = [-1, 0, 2, 1, 3][value] ?? -1;
                bookPage = 0;
            } renderBook(); }, onChoose: item => { const spell = (catalogue?.spells || []).find(s => s.id === item.id && s.caster === bookCaster); if (!spell)
                return; bookRoot.hidden = true; armedSpell = spell; teleportTarget = undefined; picker.hidden = false; options.hidden = true; slotOverview.hidden = true; activePanel.classList.add('using-shortcut'); canvas.dataset.spellMode = 'target'; canvas.dataset.spellTarget = spell.target; showFriendlyTargets(); selection.textContent = `Pause · ${spell.name} : choisis sa cible sur le terrain.`; if (spell.target === 'none')
                void launchSpell(spell, -1, 400, 250); }, onClose: () => finishChoice(false), onCaster: caster => { bookCaster = caster; bookPage = 0; renderBook(); } });
        const renderBook = () => { if (!sharedBook)
            throw Error('Livre de sorts Heroes indisponible.'); const all = catalogue?.spells || [], casters = [{ id: -1, name: 'Héros' }, ...[...new Set(all.filter(s => s.caster >= 0).map(s => s.caster))].map(id => ({ id, name: activePlan.stacks.find(s => s.id === id)?.name || 'Créature' }))]; if (!casters.some(c => c.id === bookCaster))
            bookCaster = -1; const filtered = all.filter(s => s.caster === bookCaster && (bookSchool < 0 || s.schools?.includes(bookSchool))).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)); const pages = Math.max(1, Math.ceil(filtered.length / 12)); bookPage = Math.min(bookPage, pages - 1); sharedBook.update({ mode: 'spellbook', heroId: `${activePlan.battleId}:${bookCaster}`, heroMana: catalogue?.mana ?? 0, spellbook: { mana: catalogue?.mana ?? 0, manaLimit: win.goonkMobileState?.heroManaLimit, heroSpellPower: win.goonkMobileState?.heroSpellPower, inCombat: true, combatSpells: true, school: bookSchool, page: bookPage, pages, casters, caster: bookCaster, spells: filtered.slice(bookPage * 12, bookPage * 12 + 12).map(s => ({ ...s, ...(s.caster < 0 ? { casts: undefined } : {}), target: s.target === 'ground' ? 'location' : s.target, enabled: s.enabled !== false && s.ready <= (api().frame?.() ?? 0) && (s.caster < 0 ? s.cost <= (catalogue?.mana ?? 0) : s.casts !== 0) })) } }); bookRoot.hidden = false; };
        const api = () => activeFrame.contentWindow.openbwCrossover;
        let magic;
        const friendlyTargets = panel.querySelector('#crossover-friendly-targets');
        const showFriendlyTargets = () => { friendlyTargets.replaceChildren(); friendlyTargets.hidden = !armedSpell || !['ally', 'creature', 'teleport', 'sacrifice'].includes(armedSpell.target); if (friendlyTargets.hidden)
            return; for (const row of activePlan.stacks.filter(s => s.side === 0)) {
            const button = doc.createElement('button');
            button.type = 'button';
            button.textContent = row.name;
            button.onclick = () => { const living = api().census().units.filter(u => u.stackId === row.id && u.hp > 0), point = magic.position(row.id) || { x: 400, y: 250 }; canvas.dispatchEvent(new CustomEvent('crossover-spell-target', { detail: { stack: row.id, owner: 0, hp: living.reduce((sum, u) => sum + u.hp, 0), x: point.x, y: point.y } })); };
            friendlyTargets.append(button);
        } };
        // Sound decoding is presentation work: it must never hold a combat transfer open.
        const onMagicResponse = (response) => { if (panel !== activePanel)
            return; catalogue = response.catalogue; for (const group of response.groups) {
            effectiveOwners.set(group.id, group.owner);
            const original = activePlan.stacks.find(s => s.id === group.id);
            if (group.owner === 0 && !cards.has(group.id) && group.count > 0) {
                const button = doc.createElement('button');
                button.className = 'army-card';
                button.dataset.crossoverGroup = String(group.id);
                button.type = 'button';
                const count = doc.createElement('strong'), name = doc.createElement('span');
                count.textContent = String(group.count);
                name.textContent = (group.summoned ? 'Invocation · ' : original?.side === 1 ? 'Contrôlé · ' : '') + group.name;
                button.append(count, name);
                button.onclick = () => canvas.dispatchEvent(new CustomEvent('crossover-select-group', { detail: group.id }));
                roster.insertBefore(button, enemy);
                cards.set(group.id, { button, count });
            }
            const card = cards.get(group.id);
            if (card && original?.side === 1)
                card.button.hidden = group.owner !== 0;
            const opposing = enemyCards.get(group.id);
            if (opposing)
                opposing.parentElement.hidden = group.owner === 0;
        } const sounds = win.goonkCrossoverSounds; if (sounds?.battleId === activePlan.battleId)
            void api().prepareCreatureSounds?.(sounds.rows).catch(() => { }); for (const event of response.events || []) {
            api().playCreatureSound?.(event.caster, `spell:${event.id}`);
            canvas.dispatchEvent(new CustomEvent('crossover-spell-effect', { detail: { id: event.id, caster: event.caster, targets: event.targets || [], x: event.x ?? (event.hex % 17 - 1) * 800 / 15 + 26, y: event.y ?? Math.floor(event.hex / 17) * 500 / 11 + 22 } }));
        } canvas.dispatchEvent(new CustomEvent('crossover-obstacles', { detail: response.obstacles || [] })); canvas.dispatchEvent(new Event('crossover-native-changed')); };
        let stopKeys = () => { };
        const oldDispose = sceneDispose;
        sceneDispose = () => { stopKeys(); magic?.dispose(); oldDispose?.(); };
        const available = () => (catalogue?.spells || []).filter(s => s.caster < 0 || chosen === undefined || chosen < 0 || s.caster === chosen);
        const finishChoice = (cast) => { if (panel !== activePanel || returningToClassic)
            return; choosingSpell = false; bookRoot.hidden = true; activePanel.classList.remove('choosing-spell', 'using-shortcut'); editing = false; editingSlot = undefined; slotOverview.hidden = true; options.hidden = false; cancelSpell.textContent = 'Annuler le sort'; armedSpell = undefined; teleportTarget = undefined; picker.hidden = true; friendlyTargets.hidden = true; activePanel.querySelector('aside').scrollTop = 0; delete canvas.dataset.spellMode; delete canvas.dataset.spellTarget; if (cast || !wasPaused) {
            api().start();
            start.hidden = true;
        } updateSelection(); };
        const launchSpell = async (spell, target, x, y, secondTarget) => { if (magic.busy())
            return; selection.textContent = 'Pause · lancement du sort…'; try {
            await magic.cast(spell, target, x, y, secondTarget);
            effectUntil = win.performance.now() + 1200;
            finishChoice(true);
            selection.dataset.feedback = 'confirmed';
            selection.textContent = `${spell.name} lancé · combat repris.`;
        }
        catch (error) {
            selection.textContent = 'Pause · ' + String(error instanceof Error ? error.message : error);
        } };
        const populateSpells = () => {
            options.replaceChildren();
            const search = doc.createElement('input');
            search.type = 'search';
            search.placeholder = 'Chercher un sort';
            search.setAttribute('aria-label', 'Chercher dans tous les sorts');
            options.append(search);
            const list = doc.createElement('div');
            list.className = 'spell-list';
            options.append(list);
            for (const item of editing ? (catalogue?.spells || []).filter((item, index, items) => items.findIndex(other => JSON.stringify(spellRef(other, activePlan)) === JSON.stringify(spellRef(item, activePlan))) === index) : available()) {
                const button = doc.createElement('button');
                const name = item.caster < 0 ? 'Héros' : activePlan.stacks.find(s => s.id === item.caster)?.name || 'Créature';
                button.textContent = `${name} · ${item.name} · ${item.caster < 0 ? item.cost + ' mana' : item.casts < 0 ? 'capacité' : item.casts + ' charges'}`;
                button.title = item.description + (item.reason ? ' · ' + item.reason : '');
                button.dataset.spellId = String(item.id);
                button.dataset.spellCaster = String(item.caster);
                button.disabled = !editing && (item.enabled === false || item.ready > api().frame() || (item.caster < 0 ? item.cost > (catalogue?.mana ?? 0) : item.casts === 0));
                button.onclick = () => { if (editing) {
                    draft = assignSlot(draft, editingSlot, spellRef(item, activePlan));
                    showLoadout();
                    return;
                } armedSpell = item; teleportTarget = undefined; canvas.dataset.spellMode = 'target'; canvas.dataset.spellTarget = item.target; showFriendlyTargets(); for (const child of list.querySelectorAll('button'))
                    child.setAttribute('aria-pressed', String(child === button)); selection.textContent = `Pause · ${item.name} : ${item.target === 'sacrifice' ? 'choisis une troupe tombée, puis une troupe à sacrifier.' : item.target === 'teleport' ? 'choisis la troupe à téléporter, puis sa destination.' : item.target === 'ally' ? 'touche une troupe alliée.' : item.target === 'enemy' ? 'touche une troupe ennemie.' : 'choisis la cible sur le terrain.'}`; if (item.target === 'none')
                    void launchSpell(item, -1, 400, 250); };
                list.append(button);
            }
            search.oninput = () => { const query = search.value.toLocaleLowerCase(); for (const button of list.querySelectorAll('button'))
                button.hidden = !button.textContent.toLocaleLowerCase().includes(query); };
        };
        spellButton.onclick = () => { if (!ready)
            return; editing = false; slotOverview.hidden = true; options.hidden = false; cancelSpell.textContent = 'Annuler le sort'; picker.querySelector('h3').textContent = 'Combat en pause'; picker.querySelector('p').textContent = 'Choisis un sort, puis sa cible sur le terrain.'; if (!choosingSpell)
            wasPaused = !start.hidden; api().pause(); choosingSpell = true; activePanel.classList.add('choosing-spell'); canvas.dataset.spellMode = 'choose'; picker.hidden = false; options.replaceChildren(); armedSpell = undefined; selection.textContent = 'Combat en pause · ouverture du livre de sorts…'; updateSelection(); void (async () => { while (magic.busy() && choosingSpell)
            await new Promise(resolve => win.setTimeout(resolve, 16)); if (!choosingSpell || returningToClassic || panel !== activePanel)
            return; await magic.sync(); if (!choosingSpell || returningToClassic || panel !== activePanel)
            return; renderBook(); selection.textContent = `Combat en pause · choisis un sort (${catalogue?.mana ?? 0} mana).`; })().catch(error => { selection.textContent = 'Pause · ' + String(error); }); };
        cancelSpell.onclick = () => { if (editing) {
            if (editingSlot !== undefined) {
                showLoadout();
                return;
            }
            loadout = draft.map(ref => ref ? { ...ref } : null);
            try {
                win.localStorage.setItem(LOADOUT_KEY, JSON.stringify(loadout));
            }
            catch { }
            finishChoice(false);
            selection.textContent = '5 raccourcis prêts · commence le combat quand tu veux.';
            return;
        } finishChoice(false); selection.textContent = 'Sort annulé.'; };
        const showLoadout = () => { editingSlot = undefined; options.hidden = true; slotOverview.hidden = false; slotOverview.replaceChildren(); picker.querySelector('h3').textContent = 'Préparer les 5 sorts'; picker.querySelector('p').textContent = 'Touche un emplacement pour choisir son sort. Aucun mana dépensé.'; cancelSpell.textContent = 'Valider les raccourcis'; draft.forEach((ref, index) => { const item = resolveSpell(ref, catalogue?.spells || [], activePlan); const button = doc.createElement('button'); button.dataset.editSlot = String(index); button.textContent = `${index + 1} · ${item?.name || 'Choisir un sort'}`; button.onclick = () => { editingSlot = index; slotOverview.hidden = true; options.hidden = false; picker.querySelector('h3').textContent = `Raccourci ${index + 1}`; picker.querySelector('p').textContent = 'Choisis un sort du héros ou une capacité de créature.'; cancelSpell.textContent = 'Retour aux 5 raccourcis'; populateSpells(); }; slotOverview.append(button); }); };
        const editLoadout = (index) => { if (!ready || start.hidden)
            return; wasPaused = true; api().pause(); choosingSpell = true; editing = true; draft = (loadout || defaultLoadout(catalogue?.spells || [], activePlan)).map(ref => ref ? { ...ref } : null); activePanel.classList.add('choosing-spell'); picker.hidden = false; armedSpell = undefined; canvas.dataset.spellMode = 'choose'; showLoadout(); if (index !== undefined)
            slotOverview.querySelector(`[data-edit-slot="${index}"]`).click(); selection.textContent = 'Préparation · combat en pause'; updateSelection(); };
        prep.onclick = () => editLoadout();
        const quickCast = async (index) => { if (!ready || editing)
            return; if (!start.hidden) {
            editLoadout(index);
            return;
        } if (!choosingSpell)
            wasPaused = false; api().pause(); choosingSpell = true; activePanel.classList.add('choosing-spell', 'using-shortcut'); picker.hidden = false; options.hidden = true; slotOverview.hidden = true; cancelSpell.textContent = 'Annuler le sort'; picker.querySelector('h3').textContent = 'Combat en pause'; picker.querySelector('p').textContent = 'Choisis la cible sur le terrain.'; armedSpell = undefined; canvas.dataset.spellMode = 'choose'; updateSelection(); try {
            while (magic.busy() && choosingSpell)
                await new Promise(resolve => win.setTimeout(resolve, 16));
            if (!choosingSpell || returningToClassic || panel !== activePanel)
                return;
            await magic.sync();
            if (!choosingSpell || returningToClassic || panel !== activePanel)
                return;
            const spell = resolveSpell(loadout?.[index] || null, catalogue?.spells || [], activePlan, api().frame());
            if (!spell)
                throw Error('Ce sort est indisponible.');
            armedSpell = spell;
            teleportTarget = undefined;
            canvas.dataset.spellMode = 'target';
            canvas.dataset.spellTarget = spell.target;
            showFriendlyTargets();
            selection.textContent = `Pause · ${spell.name} : ${spell.target === 'teleport' ? 'troupe puis destination' : spell.target === 'sacrifice' ? 'troupe tombée puis sacrifice' : 'choisis une cible'}.`;
            if (spell.target === 'none')
                await launchSpell(spell, -1, 400, 250);
        }
        catch (error) {
            selection.textContent = 'Pause · ' + String(error);
        } };
        quickButtons.forEach((button, index) => button.onclick = () => { void quickCast(index); });
        const hotkey = (event) => { if (activePanel.hidden)
            return; event.stopImmediatePropagation(); if (event.key === 'Escape' && choosingSpell) {
            event.preventDefault();
            if (editing)
                cancelSpell.click();
            else
                finishChoice(false);
            return;
        } if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName))
            return; const index = Number(event.key) - 1; if (index >= 0 && index < 5 && Number.isInteger(index) && !quickButtons[index].disabled) {
            event.preventDefault();
            quickButtons[index].click();
        } };
        const stopNativeKey = (event) => { if (!activePanel.hidden)
            event.stopImmediatePropagation(); };
        win.addEventListener('keydown', hotkey, true);
        win.addEventListener('keyup', stopNativeKey, true);
        stopKeys = () => { win.removeEventListener('keydown', hotkey, true); win.removeEventListener('keyup', stopNativeKey, true); };
        const updateQuickSlots = () => { if (!loadout && catalogue?.spells.length)
            loadout = defaultLoadout(catalogue.spells, activePlan); prep.disabled = !ready || choosingSpell; activePanel.querySelector('.precombat-actions').hidden = start.hidden; const frame = api()?.frame?.() || 0; quickButtons.forEach((button, index) => { const spell = resolveSpell(loadout?.[index] || null, catalogue?.spells || [], activePlan, frame); button.querySelector('.quick-name').textContent = spell?.name || 'Choisir'; const waiting = spell ? Math.max(0, spell.ready - frame) : 0; button.querySelector('.quick-cost').textContent = spell ? (waiting ? Math.ceil(waiting / 24) + 's' : spell.caster < 0 ? spell.cost + ' M' : spell.casts < 0 ? 'Capacité' : spell.casts + ' ×') : ''; button.disabled = !ready || choosingSpell || (!spell && start.hidden) || (start.hidden && !!spell && (waiting > 0 || spell.casts === 0 || (spell.caster < 0 && spell.cost > (catalogue?.mana ?? 0)))); button.title = spell ? spell.name + ' · ' + spell.description : 'Préparer ce raccourci'; button.setAttribute('aria-label', `Raccourci ${index + 1} : ${spell?.name || 'choisir un sort'}`); const icons = win.goonkCrossoverSpellIcons, icon = icons?.rows.find(row => row.id === spell?.id), paint = button.querySelector('canvas'); if (icon && icons) {
            const ctx = paint.getContext('2d');
            ctx.clearRect(0, 0, 48, 48);
            ctx.drawImage(icons.canvas, icon.x, icon.y, 48, 48, 0, 0, 48, 48);
        } }); };
        canvas.addEventListener('crossover-spell-target', event => {
            if (!choosingSpell || !armedSpell)
                return;
            const { x, y, stack, owner, hp } = event.detail;
            if (armedSpell.target === 'sacrifice') {
                if (teleportTarget === undefined) {
                    if (stack === undefined || owner !== 0 || hp > 0) {
                        selection.textContent = 'Pause · choisis une troupe alliée tombée.';
                        return;
                    }
                    teleportTarget = stack;
                    selection.textContent = 'Pause · choisis la troupe vivante à sacrifier.';
                    return;
                }
                if (stack === undefined || owner !== 0 || hp <= 0) {
                    selection.textContent = 'Pause · choisis une troupe alliée vivante à sacrifier.';
                    return;
                }
                void launchSpell(armedSpell, teleportTarget, x, y, stack);
                return;
            }
            if (armedSpell.target === 'teleport' && teleportTarget === undefined) {
                if (stack === undefined || owner !== 0) {
                    selection.textContent = 'Pause · choisis une troupe alliée à téléporter.';
                    return;
                }
                teleportTarget = stack;
                canvas.dataset.spellTarget = 'ground';
                selection.textContent = 'Pause · choisis la destination de téléportation.';
                return;
            }
            void launchSpell(armedSpell, teleportTarget ?? (armedSpell.target === 'ground' ? -1 : stack ?? -1), x, y);
        });
        const updateSelection = () => {
            updateQuickSlots();
            move.disabled = !ready || choosingSpell || chosen === undefined;
            spellButton.disabled = !ready || choosingSpell || !available().length;
            start.disabled = all.disabled = !ready || choosingSpell;
            for (const { button } of cards.values())
                if (choosingSpell)
                    button.disabled = true;
                else {
                    const g = api()?.battle()?.groups.find(g => g.id === Number(button.dataset.crossoverGroup));
                    button.disabled = !ready || !g?.survivors;
                }
            for (const [id, { button }] of cards)
                button.setAttribute('aria-pressed', String(chosen !== undefined && (chosen < 0 || chosen === id)));
            attack.disabled = stop.disabled = !ready || choosingSpell || chosen === undefined;
        };
        canvas.addEventListener('crossover-selection', event => { const data = event.detail; chosen = data.id; selection.dataset.feedback = attack.getAttribute('aria-pressed') === 'true' ? 'armed' : ''; selection.textContent = data.name + (attack.getAttribute('aria-pressed') === 'true' ? ' · choisis une cible.' : ''); updateSelection(); });
        canvas.addEventListener('crossover-order-issued', event => { attack.setAttribute('aria-pressed', 'false'); attack.textContent = 'Avancer et attaquer'; selection.dataset.feedback = 'confirmed'; const kind = canvas.dataset.orderFeedback; if (!start.hidden && (kind === 'attack' || kind === 'move')) {
            audio();
            activeFrame.contentWindow.openbwCrossover.start();
            start.hidden = true;
        } selection.textContent = event.detail; });
        move.onclick = () => { attack.setAttribute('aria-pressed', 'false'); canvas.dispatchEvent(new CustomEvent('crossover-command-mode', { detail: 'move' })); selection.textContent = 'Touche le terrain pour déplacer la sélection.'; };
        all.onclick = () => canvas.dispatchEvent(new Event('crossover-select-all'));
        attack.onclick = () => { const active = attack.getAttribute('aria-pressed') !== 'true'; attack.setAttribute('aria-pressed', String(active)); attack.textContent = active ? 'Choisir un point' : 'Avancer et attaquer'; selection.dataset.feedback = active ? 'armed' : ''; canvas.dispatchEvent(new CustomEvent('crossover-command-mode', { detail: active ? 'attack' : 'move' })); selection.textContent = active ? 'Touche un point du terrain pour avancer en attaquant. Un ennemi se cible directement.' : 'Choisis un point où déplacer la sélection.'; };
        stop.onclick = () => canvas.dispatchEvent(new Event('crossover-stop-selection'));
        start.onclick = () => { audio(); try {
            activeFrame.contentWindow.openbwCrossover.start();
            start.hidden = true;
        }
        catch (e) {
            status.textContent = String(e);
        } };
        panel.querySelector('#crossover-cancel').onclick = () => { if (returningToClassic || !ready)
            return; api().pause(); returningToClassic = true; activePanel.dataset.transferring = 'true'; status.textContent = 'Transfert des unités et des blessures vers le combat classique…'; void (async () => { while (magic.busy())
            await new Promise(resolve => win.setTimeout(resolve, 16)); if (panel !== activePanel)
            return; api().pause(); await magic.sync(); if (panel !== activePanel)
            return; command(4, activePlan.battleId); returnTimer = win.setTimeout(() => { if (panel === activePanel && returningToClassic) {
            returningToClassic = false;
            delete activePanel.dataset.transferring;
            status.textContent = 'Le transfert n’a pas été confirmé. Le combat reste en pause ; réessaie.';
        } }, 10000); })().catch(error => { if (panel !== activePanel)
            return; returningToClassic = false; delete activePanel.dataset.transferring; status.textContent = String(error); }); };
        void (async () => {
            try {
                const sc = await prepared;
                if (!sc.openbwLaunchCrossover)
                    throw Error('Chargement de StarCraft incomplet.');
                await sc.openbwLaunchCrossover(activePlan);
                magic = magicController(win, sc.openbwCrossover, activePlan, onMagicResponse);
                if (activePlan.fromClassic)
                    await magic.sync();
                const sounds = win.goonkCrossoverSounds;
                if (sounds?.battleId === activePlan.battleId && sounds.rows.length)
                    void sc.openbwCrossover.prepareCreatureSounds?.(sounds.rows).catch(() => { });
                if (disposed || panel !== activePanel || frame !== activeFrame || plan !== activePlan)
                    return;
                if (timer !== undefined)
                    win.clearInterval(timer);
                progress.hidden = true;
                status.textContent = 'Prêt · contrôle manuel';
                ready = true;
                start.disabled = all.disabled = sound.disabled = false;
                updateSound();
                for (const { button } of cards.values())
                    button.disabled = false;
                const disposeField = sharedField(win, canvas, sc.openbwCrossover, activePlan);
                if (activePlan.fromClassic) {
                    sc.openbwCrossover.start();
                    start.hidden = true;
                }
                sceneDispose = () => { if (returnTimer !== undefined)
                    win.clearTimeout(returnTimer); stopKeys(); magic.dispose(); disposeField(); };
                await new Promise(resolve => win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve())));
                if (panel !== activePanel)
                    return;
                panel.hidden = false;
                timer = win.setInterval(() => {
                    if (returningToClassic)
                        return;
                    try {
                        const native = sc.openbwCrossover?.battle();
                        if (!native)
                            return;
                        if (!native.finished && !choosingSpell && !magic.busy() && (Math.floor(native.frame / 96) > lastMagicRound || magic.needsSync())) {
                            lastMagicRound = Math.floor(native.frame / 96);
                            const paused = api().isPaused();
                            api().pause();
                            void magic.sync().then(() => { if (panel === activePanel && !returningToClassic && !paused && !choosingSpell)
                                api().start(); }).catch(error => { status.textContent = String(error); if (panel === activePanel && !returningToClassic && !paused && !choosingSpell)
                                api().start(); });
                        }
                        if (native.finished && !observedFinish) {
                            observedFinish = true;
                            effectUntil = Math.max(effectUntil, win.performance.now() + 1200);
                        }
                        start.disabled = all.disabled = native.finished;
                        ready = !native.finished;
                        updateSelection();
                        const message = choosingSpell ? 'Combat en pause · choix du sort et de la cible' : native.finished ? 'Résultat transmis à Heroes…' : native.frame === 0 ? 'Prêt · contrôle manuel' : `Combat en cours · ${Math.floor(native.frame * 0.042)} s`;
                        if (status.textContent !== message)
                            status.textContent = message;
                        let opponents = 0;
                        for (const group of native.groups) {
                            const card = cards.get(group.id);
                            if (card) {
                                if (card.count.textContent !== String(group.survivors))
                                    card.count.textContent = String(group.survivors);
                                card.button.disabled = choosingSpell || group.survivors === 0 || native.finished;
                            }
                            else if (group.side === 1) {
                                if (effectiveOwners.get(group.id) !== 0)
                                    opponents += group.survivors;
                                const count = enemyCards.get(group.id);
                                if (count && count.textContent !== String(group.survivors))
                                    count.textContent = String(group.survivors);
                            }
                        }
                        opponents = native.groups.filter(g => g.side === 1 && effectiveOwners.get(g.id) !== 0).reduce((sum, g) => sum + g.survivors, 0);
                        if (enemyCount.textContent !== String(opponents))
                            enemyCount.textContent = String(opponents);
                        if (native.finished && !sent && !finalMagicSync && !magic.busy()) {
                            finalMagicSync = true;
                            void magic.sync().catch(error => { finalMagicSync = false, observedFinish = false; status.textContent = String(error); });
                            return;
                        }
                        if (native.finished && !sent && !magic.busy() && win.performance.now() >= effectUntil) {
                            const rows = battleResult(activePlan, native).map(([id, count]) => [id, magic.persistent(id, count)]);
                            sent = true;
                            command(1, activePlan.battleId, [...rows, [2147483647, catalogue?.spent ?? 0]]);
                            win.dispatchEvent(new CustomEvent('goonk-crossover-submitted', { detail: { version: 1, plan: structuredClone(activePlan), result: structuredClone(native) } }));
                        }
                    }
                    catch (e) {
                        status.textContent = String(e);
                    }
                }, 200);
            }
            catch (e) {
                activePanel.hidden = false;
                progress.hidden = true;
                status.textContent = String(e) + ' Tu peux reprendre le combat classique.';
            }
        })();
    };
    const observe = (event) => {
        const state = event.detail;
        if (!state || disposed)
            return;
        latestMode = state.mode;
        latestBattleId = state.battleId ?? -1;
        canSwitch = !!state.canStartCrossover;
        if (state.crossover) {
            if (switchPending) {
                switchPending = false;
                ++switchEpoch;
            }
            modeStatus.textContent = '';
        }
        realTime.disabled = !canSwitch || switchPending;
        realTime.textContent = switchPending ? (assetsReady ? 'Activation…' : 'Préparation…') : '▶ Temps réel';
        if (state.mode !== 'battle')
            modeStatus.textContent = '';
        latestOnline = !!state.onlineGame;
        latestTurn = !!state.turn;
        mountControls();
        demo.disabled = !assetsReady || !!state.onlineGame || trial || state.mode !== 'menu';
        menuDemo.hidden = toggle.hidden = state.mode !== 'map';
        menuDemo.disabled = !assetsReady || !!state.onlineGame || checkpoint || !state.turn;
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
        // Keep the classic battle free of a second archive/engine allocation. Prepare
        // again only at the menu/map, or after an explicit RTS request.
        if (!frame && !warmPromise && (state.mode === 'menu' || state.mode === 'map'))
            void prepareEngine().catch(() => { });
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
        if (returningToClassic && !state.crossover && state.mode === 'battle') {
            closePanel();
            hint('Combat classique repris avec les mêmes unités et blessures.');
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
    const demoAction = () => { if (!assetsReady) {
        hint('StarCraft se prépare avant la partie…');
        return;
    } if (!latestMode || latestMode === 'menu')
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
    void prepareEngine().catch(() => { });
    return () => { disposed = true; ++switchEpoch; delete win.goonkCrossoverInstalled; doc.removeEventListener('click', click, true); win.removeEventListener('goonk-mobile-mounted', mountControls); win.removeEventListener('goonk-save-persisted', persisted); win.removeEventListener('goonk-crossover-checkpoint', checkpointReply); win.removeEventListener('goonk-crossover-demo', demoAction); win.removeEventListener('goonk-state', observe); closePanel(); warmFrame?.remove(); if (settingsButton)
        doc.querySelector('#mobile-app .mobile-top')?.prepend(settingsButton); for (const node of [demo, menuDemo, toggle, realTime, modeStatus, mainStatus, menuStatus, style])
        node.remove(); };
}
