import { STARCRAFT_UNITS } from './battle.js';
let nextMagicSequence = 0;
export function magicController(win, api, plan, onEffects) {
    let pending, closed = false;
    let hits = [];
    let lastGroups = [];
    const opening = api.census().units.filter(u => u.stackId !== undefined && u.stackId >= 0), mean = (owner) => { const rows = opening.filter(u => u.owner === owner); return rows.reduce((sum, u) => sum + u.x, 0) / Math.max(1, rows.length); }, mirrored = mean(0) > mean(1);
    const toField = (x) => mirrored ? 799 - x : x;
    const positions = new Map();
    let reconciling = false;
    const receive = (event) => {
        const response = event.detail;
        if (!pending || response.sequence !== pending.sequence)
            return;
        const request = pending;
        win.clearTimeout(request.timer);
        if (!response.ok) {
            pending = undefined;
            request.reject(Error(response.error || 'Sort refusé.'));
            return;
        }
        try {
            for (const group of response.groups)
                group.x = toField(group.x);
            for (const obstacle of response.obstacles || [])
                for (const tile of obstacle.tiles)
                    tile.x = toField(tile.x);
            for (const event of response.events || [])
                event.x = toField(event.x ?? (event.hex % 17 - 1) * 800 / 15 + 26);
            api.applyMagic(response.groups, response.damageRules);
            lastGroups = response.groups;
            api.obstacles(response.obstacles || []);
            for (const group of response.groups) {
                let row = plan.stacks.find(r => r.id === group.id);
                if (!row) {
                    row = { id: group.id, side: group.side, count: group.count, name: group.name, creature: group.creature, temporary: true, heroes: !group.creature.startsWith('heroes-starcraft:'), unit: group.creature.startsWith('heroes-starcraft:') ? (STARCRAFT_UNITS[group.creature.split(':')[1]] ?? -1) : group.shooter ? 0 : 37, health: group.maxHp, shooter: group.shooter };
                    plan.stacks.push(row);
                }
                positions.set(group.id, { x: group.x, y: group.y });
            }
            const actual = api.census().units;
            const differs = response.groups.some(g => actual.filter(u => u.stackId === g.id && u.hp > 0).length !== g.count);
            void Promise.resolve(onEffects(response)).then(async () => { if (pending === request)
                pending = undefined; if (differs && !reconciling) {
                reconciling = true;
                try {
                    await send(undefined);
                }
                finally {
                    reconciling = false;
                }
            } request.resolve(response); }).catch(error => { if (pending === request)
                pending = undefined; request.reject(error); });
        }
        catch (e) {
            if (pending === request)
                pending = undefined;
            request.reject(e instanceof Error ? e : Error(String(e)));
        }
    };
    win.addEventListener('goonk-crossover-magic', receive);
    const send = (spell, target = -1, x = 400, y = 250, secondTarget = -1) => {
        if (closed || pending)
            return Promise.reject(Error('Un sort est déjà en préparation.'));
        const module = win.Module;
        if (!module?._vcmiCrossoverMagic)
            return Promise.reject(Error('Moteur de sorts indisponible.'));
        const census = api.census(), camera = api.camera();
        const groups = api.battle().groups.map(group => { const units = census.units.filter(u => u.stackId === group.id && u.hp > 0); const point = units[0] ? { x: units.reduce((n, u) => n + u.x, 0) / units.length - camera.x, y: units.reduce((n, u) => n + u.y, 0) / units.length - camera.y } : positions.get(group.id) || { x: 400, y: 250 }; positions.set(group.id, point); return { id: group.id, count: units.length, hp: units.reduce((n, u) => n + u.hp, 0), maxShields: units[0]?.maxShields ?? 0, firstHp: units.length ? Math.min(...units.map(u => u.hp)) : 0, x: Math.round(toField(point.x)), y: Math.round(point.y) }; });
        const current = ++nextMagicSequence, bytes = new TextEncoder().encode(JSON.stringify({ sequence: current, battleId: plan.battleId, frame: census.frame, groups, hits, caster: spell?.caster ?? -1, spell: spell?.id ?? -1, sync: !spell, target, secondTarget, x: Math.round(toField(x)), y: Math.round(y) }));
        hits = [];
        return new Promise((resolve, reject) => { const timer = win.setTimeout(() => { if (pending?.sequence === current)
            pending = undefined; reject(Error('Le moteur de sorts ne répond pas.')); }, 15000); pending = { sequence: current, resolve, reject, timer }; const pointer = module._malloc(bytes.length); try {
            module.HEAPU8.set(bytes, pointer);
            module._vcmiCrossoverMagic(pointer, bytes.length);
        }
        catch (e) {
            pending = undefined;
            win.clearTimeout(timer);
            reject(e);
        }
        finally {
            module._free(pointer);
        } });
    };
    return { cast: (spell, target, x, y, secondTarget) => send(spell, target, x, y, secondTarget), sync: () => send(undefined), busy: () => !!pending, position: id => positions.get(id), persistent(id, survivors) { const group = lastGroups.find(g => g.id === id); return group ? Math.max(0, survivors - Math.max(0, group.count - (group.persistentCount ?? group.count))) : survivors; }, needsSync() { const contacts = api.contacts(); for (const hit of contacts)
            if (hit.obstacle !== undefined || (plan.magic?.spells || []).some(s => s.caster === hit.source && s.passive) || lastGroups.find(g => g.id === hit.target)?.disabled)
                hits.push(hit); return hits.length > 0; }, dispose() { closed = true; win.removeEventListener('goonk-crossover-magic', receive); if (pending) {
            win.clearTimeout(pending.timer);
            pending.reject(Error('Combat fermé.'));
            pending = undefined;
        } } };
}
