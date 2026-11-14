const engineId = (value) => value === 'heroes' || value === 'starcraft';
const token = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
export function validateRequest(value) {
    if (!value || typeof value !== 'object')
        throw new Error('Invalid bridge request');
    const r = value;
    if (r.version !== 1 || !token(r.session) || !token(r.id) || !engineId(r.source) ||
        !engineId(r.target) || r.source === r.target || r.type !== 'engine.status') {
        throw new Error('Unsupported bridge request');
    }
}
export class ReadonlyBridge {
    session;
    adapters = new Map();
    constructor(session) {
        this.session = session;
        if (!token(session))
            throw new Error('Invalid session');
    }
    register(adapter) {
        if (this.adapters.has(adapter.id))
            throw new Error('Engine already registered');
        this.adapters.set(adapter.id, adapter);
    }
    request(input) {
        validateRequest(input);
        if (input.session !== this.session)
            throw new Error('Stale bridge session');
        if (!this.adapters.has(input.source))
            throw new Error('Unknown source');
        const adapter = this.adapters.get(input.target);
        if (!adapter)
            throw new Error('Unknown target');
        return { version: 1, session: this.session, replyTo: input.id, source: input.target,
            target: input.source, type: 'engine.status.reply', payload: structuredClone(adapter.status()) };
    }
    dispose() {
        for (const adapter of this.adapters.values())
            adapter.dispose();
        this.adapters.clear();
    }
}
export class HeroesObserver {
    onChange;
    id = 'heroes';
    observation;
    sequence = 0;
    preparationRequested = false;
    target;
    listener = (event) => {
        const detail = event.detail;
        if (!detail || typeof detail !== 'object')
            return;
        const mode = detail.mode;
        if (typeof mode !== 'string' || mode.length === 0 || mode.length > 64)
            return;
        this.observation = { sequence: ++this.sequence, mode, receivedAt: Date.now() };
        this.onChange(this.status());
    };
    constructor(onChange = () => { }) {
        this.onChange = onChange;
    }
    attach(target) {
        this.dispose();
        this.target = target;
        target.addEventListener('goonk-state', this.listener);
    }
    prepareFromStarCraft(sample) {
        if (!Number.isSafeInteger(sample?.frame) || sample.frame < 1 || !Number.isSafeInteger(sample.checksum) ||
            sample.checksum < 0 || sample.checksum > 0xffffffff || ![0, 1, 2].includes(sample.outcome))
            throw Error('État natif StarCraft invalide.');
        if (this.preparationRequested)
            return false;
        if (this.observation?.mode !== 'menu')
            throw Error('La préparation nécessite le menu Heroes.');
        const module = this.target?.Module;
        if (!module?._vcmiMobileCommand)
            throw Error('Commande native VCMI indisponible.');
        // Existing C++ action checks the actual engine/window state before opening the lobby.
        module._vcmiMobileCommand(20, 1, 0, 0, 0, 0);
        this.preparationRequested = true;
        return true;
    }
    status() {
        return { engine: this.id, state: this.observation ? 'observed' : 'waiting',
            reason: this.observation ? 'État VCMI reçu en lecture seule.' : 'En attente du premier état VCMI.',
            ...(this.observation ? { observation: { ...this.observation } } : {}) };
    }
    dispose() {
        this.target?.removeEventListener('goonk-state', this.listener);
        this.target = undefined;
        this.preparationRequested = false;
        this.observation = undefined;
        this.sequence = 0;
    }
}
export class StarCraftObserver {
    onChange;
    id = 'starcraft';
    target;
    native;
    sequence = 0;
    receivedAt = 0;
    constructor(onChange = () => { }) {
        this.onChange = onChange;
    }
    record = (value) => {
        if (!value || typeof value !== 'object')
            return;
        const v = value;
        if (!Number.isSafeInteger(v.frame) || Number(v.frame) < 0 || !Number.isSafeInteger(v.checksum) || !Number.isSafeInteger(v.outcome) ||
            Number(v.checksum) < 0 || Number(v.checksum) > 0xffffffff || ![0, 1, 2].includes(Number(v.outcome)))
            return;
        const cohort = v.cohort;
        if (cohort && (!Number.isSafeInteger(cohort.initial) || !Number.isSafeInteger(cohort.present) || !Number.isSafeInteger(cohort.missing) ||
            cohort.initial < 0 || cohort.present < 0 || cohort.missing < 0 || cohort.present + cohort.missing !== cohort.initial ||
            !Array.isArray(cohort.missingIds) || cohort.missingIds.length !== cohort.missing || !cohort.missingIds.every(id => Number.isSafeInteger(id) && id > 0)))
            return;
        this.native = { frame: Number(v.frame), checksum: Number(v.checksum), outcome: Number(v.outcome), ...(cohort ? { cohort: structuredClone(cohort) } : {}) };
        this.sequence++;
        this.receivedAt = Date.now();
        this.onChange(this.status());
    };
    listener = (event) => {
        const detail = event.detail;
        if (detail?.version === 1)
            this.record(detail);
    };
    attach(target) {
        this.dispose();
        this.target = target;
        target.addEventListener('openbw-state', this.listener);
        if (target.openbwCrossover)
            this.record(target.openbwCrossover.sample());
    }
    forwardHeroes(observation) {
        const api = this.target?.openbwCrossover;
        if (!api)
            throw Error('StarCraft attend ses archives et son démarrage.');
        return api.receiveHeroes(observation);
    }
    status() {
        return { engine: this.id, state: this.native ? 'observed' : 'waiting',
            reason: this.native ? 'État natif OpenBW reçu.' : 'Importe les archives puis lance StarCraft.',
            ...(this.native ? { native: structuredClone(this.native), observation: { sequence: this.sequence, mode: 'running', receivedAt: this.receivedAt } } : {}) };
    }
    dispose() {
        this.target?.removeEventListener('openbw-state', this.listener);
        this.target = undefined;
        this.native = undefined;
        this.sequence = 0;
        this.receivedAt = 0;
    }
}
