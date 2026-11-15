/** Stable product API over the real OpenBW exports, installed only after native init. */
import { STARCRAFT_UNITS, validateBattlePlan } from './battle.js';
export function setupNativeBattle(x, memory, plan) {
    validateBattlePlan(plan);
    if (!x.openbw_crossover_setup)
        throw Error('Passerelle native de combat absente.');
    const rows = new Int32Array(plan.stacks.flatMap(row => [row.id, row.side, row.unit, row.count, row.heroes ? 1 : 0, row.health || 40, row.damageMin ?? 6, row.damageMax ?? 6, row.defense ?? 0, row.speed || 5, row.shooter ? 1 : 0, row.attack ?? 0, row.firstHp ?? row.health ?? 40, row.maxCount ?? row.count]));
    const pointer = x.openbw_in_ptr(rows.byteLength);
    new Uint8Array(memory.buffer, pointer, rows.byteLength).set(new Uint8Array(rows.buffer));
    if (x.openbw_crossover_setup(plan.battleId, plan.stacks.length) !== 1)
        throw Error('Placement des armées StarCraft impossible. Reprends le combat Heroes.');
    for (const row of plan.stacks.filter(r => r.side === 0))
        for (const spell of row.spells || []) {
            const data = new Int32Array(plan.stacks.flatMap(target => { const table = spell.targets.find(t => t.id === target.id); if (!table || table.damage.length !== row.count + 1)
                throw Error('Dégâts du sort incomplets.'); return [target.id, table.resistance, ...table.damage]; }));
            const ptr = x.openbw_in_ptr(data.byteLength);
            new Int32Array(memory.buffer, ptr, data.length).set(data);
            if (x.openbw_crossover_spell_setup?.(row.id, spell.id, spell.casts, spell.radius) !== 1)
                throw Error('Sort natif indisponible.');
        }
}
export function validateHeroes(value) {
    if (!value || typeof value !== 'object')
        throw Error('Événement Heroes invalide.');
    const v = value;
    if (v.version !== 1 || typeof v.session !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(v.session) ||
        !Number.isSafeInteger(v.sequence) || Number(v.sequence) < 1 || typeof v.mode !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(v.mode)) {
        throw Error('Événement Heroes invalide.');
    }
}
export function installNativeBridge(x, memory, target = window) {
    let closed = false, session, lastSequence = 0;
    target.openbwCrossover?.close();
    const census = () => {
        if (closed || !x.openbw_crossover_census)
            throw Error('Recensement natif indisponible.');
        const pointer = x.openbw_crossover_census(), bytes = new Uint8Array(memory.buffer);
        let end = pointer;
        while (end < bytes.length && end - pointer < 2 * 1024 * 1024 && bytes[end])
            end++;
        if (end === bytes.length || bytes[end] !== 0)
            throw Error('Recensement natif invalide.');
        const value = JSON.parse(new TextDecoder().decode(bytes.subarray(pointer, end)));
        if (!value || !Number.isSafeInteger(value.frame) || value.frame < 0 || !value.view ||
            !['x', 'y', 'width', 'height'].every(key => Number.isSafeInteger(value.view[key])) || value.view.width < 1 || value.view.height < 1 ||
            !Array.isArray(value.units) || value.units.length > 10000 || value.units.some(unit => !unit || !['id', 'type', 'owner', 'hp', 'x', 'y'].every(key => Number.isSafeInteger(unit[key])) ||
            typeof unit.completed !== 'boolean' || unit.id < 1 || unit.owner < 0 || unit.owner > 7))
            throw Error('Recensement natif invalide.');
        return value;
    };
    const initialCohort = x.openbw_crossover_census ? new Set(census().units.filter(unit => unit.hp > 0).map(unit => unit.id)) : undefined;
    const sample = () => {
        if (closed)
            throw Error('Moteur StarCraft fermé.');
        const state = { frame: x.openbw_frame(), checksum: x.openbw_checksum() >>> 0, outcome: x.openbw_outcome() };
        if (initialCohort) {
            const presentIds = new Set(census().units.filter(unit => unit.hp > 0).map(unit => unit.id));
            const missingIds = [...initialCohort].filter(id => !presentIds.has(id));
            state.cohort = { initial: initialCohort.size, present: initialCohort.size - missingIds.length, missing: missingIds.length, missingIds };
        }
        return state;
    };
    const publish = (kind, extra = {}) => {
        const state = sample();
        target.dispatchEvent(new CustomEvent('openbw-state', { detail: { version: 1, kind, ...state, ...extra } }));
        return state;
    };
    const api = {
        frame() { if (closed)
            throw Error('Moteur StarCraft fermé.'); return x.openbw_frame(); },
        stop(stack) { if (closed || !x.openbw_crossover_stop)
            throw Error('Arrêt indisponible.'); x.openbw_crossover_stop(stack); },
        target(stack, id) { if (closed || !x.openbw_crossover_target || !Number.isSafeInteger(id) || id < 1 || id > 65535)
            throw Error('Cible indisponible.'); x.openbw_crossover_target(stack, id); },
        camera() { if (closed || !x.openbw_crossover_camera_x || !x.openbw_crossover_camera_y)
            throw Error('Caméra indisponible.'); return { x: x.openbw_crossover_camera_x(), y: x.openbw_crossover_camera_y() }; },
        sprite(id) {
            if (closed || !x.openbw_crossover_sprite || !Number.isSafeInteger(id) || id < 1 || id > 65535)
                throw Error('Sprite indisponible.');
            const pointer = x.openbw_crossover_sprite(id);
            if (!pointer)
                throw Error('Unité indisponible.');
            return new Uint8ClampedArray(memory.buffer, pointer, 96 * 96 * 4).slice();
        },
        layer() {
            if (closed || !x.openbw_crossover_layer)
                throw Error('Rendu partagé indisponible.');
            const pointer = x.openbw_crossover_layer();
            if (!pointer)
                throw Error('Bataille non initialisée.');
            return { pixels: new Uint8ClampedArray(memory.buffer, pointer, 800 * 500 * 4).slice(), x: x.openbw_crossover_camera_x(), y: x.openbw_crossover_camera_y(), width: 800, height: 500 };
        },
        order(stack, px, py, attack) { if (closed || !x.openbw_crossover_order)
            throw Error('Ordre indisponible.'); x.openbw_crossover_order(stack, Math.round(px), Math.round(py), attack ? 1 : 0); },
        obstacles(rows) { const data = new Int32Array(rows.flatMap(r => r.tiles.flatMap(p => [r.id, p.x, p.y, r.blocks ? 1 : 0, r.stops ? 1 : 0, r.triggers ? 1 : 0]))); const pointer = x.openbw_in_ptr(data.byteLength); new Int32Array(memory.buffer, pointer, data.length).set(data); if (x.openbw_crossover_obstacles?.(data.length / 6) !== 1)
            throw Error('Obstacles magiques indisponibles.'); },
        contacts() { if (closed || !x.openbw_crossover_contacts)
            return []; const ptr = x.openbw_crossover_contacts(), bytes = new Uint8Array(memory.buffer); let end = ptr; while (end < bytes.length && end - ptr < 65536 && bytes[end])
            end++; return JSON.parse(new TextDecoder().decode(bytes.subarray(ptr, end))); },
        applyMagic(groups, rules = []) {
            if (closed || !x.openbw_crossover_apply_magic)
                throw Error('Passerelle de magie absente.');
            const data = new Int32Array(groups.flatMap(r => [r.id, r.owner, r.count, r.hp, r.maxHp, r.attack, r.defense, r.damageMin, r.damageMax, r.speed, r.shooter ? 1 : 0, r.x, r.y, (r.disabled ? 1 : 0) | (r.berserk ? 2 : 0) | (r.cloned ? 4 : 0), r.moved ? 1 : 0, r.meleeReduction, r.rangedReduction, r.fireShield, r.healthDelta, r.revived, r.removed ? 1 : 0, r.creature.startsWith('heroes-starcraft:') ? (STARCRAFT_UNITS[r.creature.split(':')[1]] ?? -1) : r.shooter ? 0 : 37, r.creature.startsWith('heroes-starcraft:') ? 0 : 1, r.luck, r.morale, r.retaliations, r.movementScale ?? 1000]));
            const pointer = x.openbw_in_ptr(data.byteLength);
            new Int32Array(memory.buffer, pointer, data.length).set(data);
            if (x.openbw_crossover_apply_magic(groups.length) !== 1)
                throw Error('Effets magiques refusés par le moteur RTS.');
            const table = new Int32Array(rules.flatMap(r => [r.source, r.target, r.melee, r.ranged]));
            const location = x.openbw_in_ptr(table.byteLength);
            new Int32Array(memory.buffer, location, table.length).set(table);
            if (x.openbw_crossover_damage_rules?.(rules.length) !== 1)
                throw Error('Règles de dégâts magiques indisponibles.');
        },
        pause() { throw Error("Pause indisponible."); },
        isPaused() { return true; },
        cast(stack, spell, px, py) { return !closed && x.openbw_crossover_cast?.(stack, spell, Math.round(px), Math.round(py)) === 1; },
        start() { if (closed)
            throw Error('Moteur StarCraft fermé.'); },
        battle() {
            if (closed || !x.openbw_crossover_battle_state)
                return null;
            const pointer = x.openbw_crossover_battle_state(), bytes = new Uint8Array(memory.buffer);
            let end = pointer;
            while (end < bytes.length && end - pointer < 65536 && bytes[end])
                end++;
            if (end === bytes.length || bytes[end] !== 0)
                throw Error('Résultat natif invalide.');
            return JSON.parse(new TextDecoder().decode(bytes.subarray(pointer, end)));
        },
        attack() { if (closed || !x.openbw_crossover_attack)
            throw Error('Combat StarCraft indisponible.'); x.openbw_crossover_attack(); },
        sample,
        census,
        receiveHeroes(input) {
            validateHeroes(input);
            if (closed)
                throw Error('Moteur StarCraft fermé.');
            if (session !== undefined && input.session !== session)
                throw Error('Session Heroes différente : relance le crossover.');
            if (input.sequence <= lastSequence)
                throw Error('Événement Heroes déjà reçu ou périmé.');
            const bytes = new TextEncoder().encode('Heroes: ' + input.mode + ' (#' + input.sequence + ')');
            const pointer = x.openbw_in_ptr(bytes.length);
            new Uint8Array(memory.buffer, pointer, bytes.length).set(bytes);
            x.openbw_post_message(bytes.length); // Existing C++ UI log; no simulated battle result.
            session = input.session;
            lastSequence = input.sequence;
            return publish('heroes.received', { session, heroesSequence: lastSequence });
        },
        close() {
            if (closed)
                return;
            closed = true;
            clearInterval(timer);
            if (target.openbwCrossover === api)
                delete target.openbwCrossover;
            target.removeEventListener('pagehide', api.close);
        }
    };
    const timer = setInterval(() => publish('snapshot'), 1000);
    target.openbwCrossover = api;
    target.addEventListener('pagehide', api.close);
    publish('ready');
    return api;
}
