import { battlePlan, battleResult } from './battle.js';
export function installAdventure(target, base, onExit, trial = false) {
    const win = target, doc = win.document;
    const style = doc.createElement('style');
    style.textContent = `#crossover-tools{position:fixed;right:8px;top:54px;z-index:11000;display:flex;flex-direction:column;gap:6px;max-width:155px}#crossover-tools button,#crossover-arena button{min-height:44px;padding:8px;border:1px solid #64748b;border-radius:6px;background:#172033;color:white;font:14px system-ui}#crossover-tools p{margin:0;padding:6px;background:#172033;color:white;font:12px system-ui}#crossover-arena{position:fixed;inset:0;z-index:12000;background:#080d17;display:grid;grid-template-columns:minmax(0,1fr) 150px;height:100dvh;color:white;font:14px system-ui}#crossover-arena iframe{width:100%;height:100%;border:0;min-width:0;min-height:0}#crossover-arena aside{padding:8px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}#crossover-arena h2{font-size:17px;margin:0}#crossover-arena p{margin:0}#crossover-arena[hidden]{display:none}`;
    doc.head.append(style);
    const tools = doc.createElement('section');
    tools.id = 'crossover-tools';
    tools.innerHTML = '<button id="crossover-toggle">Combats StarCraft : activés</button><button id="crossover-exit">Retour au lanceur</button><p id="crossover-hint">Attaque une armée pour combattre en temps réel.</p>';
    doc.body.append(tools);
    const toggle = tools.querySelector('#crossover-toggle'), hint = tools.querySelector('#crossover-hint');
    let enabled = true, configured = false, disposed = false, plan, frame, panel, timer, sent = false, starting = false, selected = false;
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
    const closePanel = () => { if (timer !== undefined)
        win.clearInterval(timer); timer = undefined; frame?.remove(); frame = undefined; panel?.remove(); panel = undefined; plan = undefined; sent = false; };
    const begin = (value) => {
        if (plan?.battleId === value.battleId || cancelled.has(value.battleId))
            return;
        closePanel();
        plan = battlePlan(value);
        panel = doc.createElement('section');
        panel.id = 'crossover-arena';
        panel.innerHTML = '<iframe title="Bataille StarCraft en temps réel"></iframe><aside><h2>Bataille StarCraft</h2><p id="crossover-battle-status">Chargement des armées…</p><button id="crossover-attack">Commencer le combat</button><button id="crossover-cancel">Reprendre le combat Heroes</button><p>Archer → Marine<br>Mêlée légère → Zergling<br>Mêlée lourde → Firebat</p><p id="crossover-counts"></p><p>Les pertes seront appliquées à Heroes à la fin du combat.</p></aside>';
        doc.body.append(panel);
        frame = panel.querySelector('iframe');
        frame.src = new URL('starcraft/index.html', base).href;
        const activeFrame = frame, activePlan = plan;
        const status = panel.querySelector('#crossover-battle-status'), attack = panel.querySelector('#crossover-attack');
        panel.querySelector('#crossover-counts').textContent = plan.stacks.map(row => `${row.side ? 'Ennemi' : 'Toi'} : ${row.count} ${row.name}`).join(' · ');
        attack.disabled = true;
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
                await sc.openbwLaunchCrossover(plan);
                if (disposed || !panel || frame !== activeFrame || plan !== activePlan)
                    return;
                timer = win.setInterval(() => {
                    try {
                        const native = sc.openbwCrossover?.battle();
                        if (!native)
                            return;
                        attack.disabled = native.finished;
                        status.textContent = native.finished ? 'Résultat transmis à Heroes…' : native.frame === 0 ? 'Prêt. Appuie sur « Commencer le combat ».' : `Temps réel · frame ${native.frame}`;
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
    toggle.onclick = () => { enabled = !enabled; command(0, enabled ? 1 : 0); toggle.textContent = `Combats StarCraft : ${enabled ? 'activés' : 'désactivés'}`; };
    tools.querySelector('#crossover-exit').onclick = onExit;
    win.addEventListener('goonk-state', observe);
    return () => { disposed = true; win.removeEventListener('goonk-state', observe); closePanel(); tools.remove(); style.remove(); };
}
