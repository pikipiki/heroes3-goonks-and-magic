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
    const style = doc.createElement('style');
    style.textContent = `#crossover-tools{position:fixed;right:8px;top:54px;z-index:11000;display:flex;flex-direction:column;gap:6px;max-width:155px}#crossover-tools button,#crossover-arena button{min-height:44px;padding:8px;border:1px solid #64748b;border-radius:6px;background:#392b1b;color:#f1dda5;font:14px system-ui}#crossover-tools p{margin:0;padding:6px;background:#392b1b;color:#f1dda5;font:12px system-ui}#crossover-arena{position:fixed;inset:0;z-index:12000;background:#241b12;display:grid;grid-template-columns:minmax(0,1fr) 150px;height:100dvh;color:white;font:14px system-ui}#crossover-arena .field{position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;background:#17130e}#crossover-arena canvas{position:relative;width:min(100%,160dvh);height:auto;max-height:100%;aspect-ratio:8/5;object-fit:contain;touch-action:none}#crossover-arena iframe{position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;border:0}#crossover-arena aside{padding:8px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}#crossover-arena h2{font-size:17px;margin:0}#crossover-arena p{margin:0}#crossover-arena[hidden]{display:none}`;
    doc.head.append(style);
    const tools = doc.createElement('section');
    tools.id = 'crossover-tools';
    tools.setAttribute('translate', 'no');
    tools.innerHTML = '<button id="crossover-demo">Démo : Heroes × StarCraft</button><button id="crossover-toggle">Combats en temps réel : activés</button><p id="crossover-hint">Archers et piquiers contre Marines, dans Heroes.</p>';
    doc.body.append(tools);
    const toggle = tools.querySelector('#crossover-toggle'), hint = tools.querySelector('#crossover-hint');
    let enabled = true, configured = false, disposed = false, plan, frame, panel, timer, sent = false, starting = false, selected = false, autoAttack = false, isDemo = trial, latestMode = "", checkpoint = false, sceneDispose;
    const cancelled = new Set();
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
        plan = battlePlan(value);
        panel = doc.createElement('section');
        panel.id = 'crossover-arena';
        panel.setAttribute('translate', 'no');
        panel.innerHTML = '<div class="field"><iframe title="Moteur de combat" aria-hidden="true" tabindex="-1"></iframe><canvas id="crossover-field"></canvas></div><aside><h2>Heroes III</h2><p>Combat mixte · temps réel</p><p id="crossover-battle-status">Préparation du combat…</p><button id="crossover-attack">Commencer le combat</button><button id="crossover-select-all">Toute l’armée</button><button id="crossover-cancel">Reprendre le combat classique</button><p>Touche une troupe pour la sélectionner, puis le terrain pour déplacer ou un ennemi pour attaquer.</p><p id="crossover-counts"></p><p>Les survivants restent dans ton armée.</p></aside>';
        doc.body.append(panel);
        frame = panel.querySelector('iframe');
        frame.src = new URL('starcraft/index.html', base).href;
        const activeFrame = frame, activePlan = plan;
        const status = panel.querySelector('#crossover-battle-status'), attack = panel.querySelector('#crossover-attack');
        panel.querySelector('#crossover-counts').textContent = plan.stacks.map(row => `${row.side ? 'Ennemi' : 'Toi'} : ${row.count} ${row.name}`).join(' · ');
        attack.disabled = true;
        panel.querySelector('#crossover-select-all').onclick = () => panel?.querySelector('canvas')?.dispatchEvent(new Event('crossover-select-all'));
        attack.onclick = () => { try {
            const api = frame.contentWindow.openbwCrossover;
            api.start();
            api.attack();
            attack.textContent = 'Attaquer avec l’armée';
        }
        catch (e) {
            status.textContent = String(e);
        } };
        panel.querySelector('#crossover-cancel').onclick = () => { cancelled.add(plan.battleId); command(2, plan.battleId); closePanel(); hint.textContent = 'Combat repris dans Heroes, sans appliquer les pertes du test annulé.'; };
        frame.addEventListener('load', async () => {
            try {
                const sc = frame.contentWindow;
                if (!sc.openbwLaunchCrossover)
                    throw Error('Chargement de StarCraft incomplet.');
                await sc.openbwLaunchCrossover(activePlan);
                if (disposed || !panel || frame !== activeFrame || plan !== activePlan)
                    return;
                sceneDispose = sharedField(win, panel.querySelector('#crossover-field'), sc.openbwCrossover, activePlan);
                timer = win.setInterval(() => {
                    try {
                        const native = sc.openbwCrossover?.battle();
                        if (!native)
                            return;
                        attack.disabled = native.finished;
                        status.textContent = native.finished ? 'Résultat transmis à Heroes…' : native.frame === 0 ? 'Prêt. Appuie sur « Commencer le combat ».' : `Combat en cours · ${Math.floor(native.frame * 0.042)} s`;
                        if (native.finished && !sent) {
                            const rows = battleResult(plan, native);
                            sent = true;
                            command(1, plan.battleId, rows);
                            win.dispatchEvent(new CustomEvent('goonk-crossover-submitted', { detail: { version: 1, plan: structuredClone(plan), result: structuredClone(native) } }));
                        }
                    }
                    catch (e) {
                        status.textContent = String(e);
                    }
                }, 200);
            }
            catch (e) {
                status.textContent = String(e) + ' Tu peux reprendre le combat Heroes.';
            }
        });
    };
    const observe = (event) => {
        const state = event.detail;
        if (!state || disposed)
            return;
        latestMode = state.mode;
        const demo = tools.querySelector('#crossover-demo');
        demo.disabled = !!state.onlineGame || checkpoint || (state.mode !== 'menu' && !(state.mode === 'map' && state.turn));
        if (state.mode === 'menu') {
            configured = false;
            cancelled.clear();
        }
        if (trial && state.mode === 'menu' && !starting) {
            starting = true;
            win.Module?._vcmiMobileCommand?.(20, 1, 0, 0, 0, 0);
        }
        // Run after the normal lobby listener has selected its default scenario.
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
                hint.textContent = String(e);
            }
        }
        if (autoAttack && state.mode === 'map' && state.turn && state.crossoverEnabled) {
            autoAttack = false;
            win.Module?._vcmiMobileCommand?.(112, 0, 0, 0, 0, 0);
        }
        toggle.disabled = state.mode !== 'map' || !state.turn;
        if (state.crossover) {
            try {
                begin(state.crossover);
            }
            catch (e) {
                hint.textContent = String(e);
            }
        }
        else if (plan && (state.dialogKind === 'battle-result' || state.mode === 'map' || state.mode === 'dialog')) {
            if (sent)
                hint.textContent = 'Résultat StarCraft reçu par Heroes. Confirme le bilan pour reprendre l’aventure.';
            closePanel();
        }
    };
    toggle.onclick = () => { enabled = !enabled; command(0, enabled ? 1 : 0); toggle.textContent = `Combats en temps réel : ${enabled ? 'activés' : 'désactivés'}`; };
    const startDemo = () => { trial = true; isDemo = true; starting = false; selected = false; };
    const persisted = (event) => { const detail = event.detail; if (!checkpoint || !String(detail?.path).toLowerCase().endsWith('/avant-demo-starcraft.vsgm1'))
        return; checkpoint = false; if (detail.ok) {
        startDemo();
        win.Module?._vcmiMobileCommand?.(71, 0, 0, 0, 0, 0);
    }
    else
        hint.textContent = 'Sauvegarde impossible : ton aventure reste ouverte.'; };
    const checkpointReply = (event) => { if (checkpoint && !event.detail.accepted) {
        checkpoint = false;
        hint.textContent = 'Attends la fin du déplacement, puis relance la démo.';
    } };
    const demoAction = () => {
        if (latestMode === 'menu')
            startDemo();
        else if (latestMode === 'map' && !checkpoint) {
            if (isDemo)
                win.Module?._vcmiMobileCommand?.(112, 0, 0, 0, 0, 0);
            else {
                checkpoint = true;
                hint.textContent = 'Sauvegarde de ton aventure avant la démo…';
                win.Module?._vcmiMobileCommand?.(113, 0, 0, 0, 0, 0);
            }
        }
    };
    win.addEventListener('goonk-save-persisted', persisted);
    win.addEventListener('goonk-crossover-checkpoint', checkpointReply);
    tools.querySelector('#crossover-demo').onclick = demoAction;
    win.addEventListener('goonk-crossover-demo', demoAction);
    win.addEventListener('goonk-state', observe);
    return () => { disposed = true; delete win.goonkCrossoverInstalled; win.removeEventListener('goonk-save-persisted', persisted); win.removeEventListener('goonk-crossover-checkpoint', checkpointReply); win.removeEventListener('goonk-crossover-demo', demoAction); win.removeEventListener('goonk-state', observe); closePanel(); tools.remove(); style.remove(); };
}
