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
    const sample = () => {
        if (closed)
            throw Error('Moteur StarCraft fermé.');
        return { frame: x.openbw_frame(), checksum: x.openbw_checksum() >>> 0, outcome: x.openbw_outcome() };
    };
    const publish = (kind, extra = {}) => {
        const state = sample();
        target.dispatchEvent(new CustomEvent('openbw-state', { detail: { version: 1, kind, ...state, ...extra } }));
        return state;
    };
    const api = {
        sample,
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
