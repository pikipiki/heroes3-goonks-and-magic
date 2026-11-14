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
    status() {
        return { engine: this.id, state: this.observation ? 'observed' : 'waiting',
            reason: this.observation ? 'État VCMI reçu en lecture seule.' : 'En attente du premier état VCMI.',
            ...(this.observation ? { observation: { ...this.observation } } : {}) };
    }
    dispose() {
        this.target?.removeEventListener('goonk-state', this.listener);
        this.target = undefined;
        this.observation = undefined;
        this.sequence = 0;
    }
}
export class UnavailableStarCraft {
    id = 'starcraft';
    status() {
        return { engine: this.id, state: 'unavailable',
            reason: 'Intégration suspendue : licence de réutilisation OpenBW non établie.' };
    }
    dispose() { }
}
