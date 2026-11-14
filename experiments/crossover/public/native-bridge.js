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
