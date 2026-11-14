/** Read-only v1 bridge. No battle execution or state mutation is implemented. */
export type EngineId = 'heroes' | 'starcraft';
export type EngineStatus = {
  engine: EngineId;
  state: 'unavailable' | 'waiting' | 'observed';
  reason: string;
  observation?: { sequence: number; mode: string; receivedAt: number };
};
export interface EngineAdapter {
  readonly id: EngineId;
  status(): EngineStatus;
  dispose(): void;
}
export type StatusRequest = {
  version: 1; session: string; id: string;
  source: EngineId; target: EngineId; type: 'engine.status';
};
export type StatusReply = {
  version: 1; session: string; replyTo: string;
  source: EngineId; target: EngineId; type: 'engine.status.reply';
  payload: EngineStatus;
};
const engineId = (value: unknown): value is EngineId => value === 'heroes' || value === 'starcraft';
const token = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
export function validateRequest(value: unknown): asserts value is StatusRequest {
  if (!value || typeof value !== 'object') throw new Error('Invalid bridge request');
  const r = value as Record<string, unknown>;
  if (r.version !== 1 || !token(r.session) || !token(r.id) || !engineId(r.source) ||
      !engineId(r.target) || r.source === r.target || r.type !== 'engine.status') {
    throw new Error('Unsupported bridge request');
  }
}
export class ReadonlyBridge {
  private adapters = new Map<EngineId, EngineAdapter>();
  constructor(readonly session: string) {
    if (!token(session)) throw new Error('Invalid session');
  }
  register(adapter: EngineAdapter): void {
    if (this.adapters.has(adapter.id)) throw new Error('Engine already registered');
    this.adapters.set(adapter.id, adapter);
  }
  request(input: unknown): StatusReply {
    validateRequest(input);
    if (input.session !== this.session) throw new Error('Stale bridge session');
    if (!this.adapters.has(input.source)) throw new Error('Unknown source');
    const adapter = this.adapters.get(input.target);
    if (!adapter) throw new Error('Unknown target');
    return { version: 1, session: this.session, replyTo: input.id, source: input.target,
      target: input.source, type: 'engine.status.reply', payload: structuredClone(adapter.status()) };
  }
  dispose(): void {
    for (const adapter of this.adapters.values()) adapter.dispose();
    this.adapters.clear();
  }
}
export class HeroesObserver implements EngineAdapter {
  readonly id = 'heroes' as const;
  private observation?: EngineStatus['observation'];
  private sequence = 0;
  private target?: Window;
  private listener = (event: Event): void => {
    const detail: unknown = (event as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== 'object') return;
    const mode = (detail as Record<string, unknown>).mode;
    if (typeof mode !== 'string' || mode.length === 0 || mode.length > 64) return;
    this.observation = {sequence: ++this.sequence, mode, receivedAt: Date.now()};
    this.onChange(this.status());
  };
  constructor(private onChange: (status: EngineStatus) => void = () => {}) {}
  attach(target: Window): void {
    this.dispose();
    this.target = target;
    target.addEventListener('goonk-state', this.listener);
  }
  status(): EngineStatus {
    return {engine: this.id, state: this.observation ? 'observed' : 'waiting',
      reason: this.observation ? 'État VCMI reçu en lecture seule.' : 'En attente du premier état VCMI.',
      ...(this.observation ? {observation: {...this.observation}} : {})};
  }
  dispose(): void {
    this.target?.removeEventListener('goonk-state', this.listener);
    this.target = undefined;
    this.observation = undefined;
    this.sequence = 0;
  }
}
export class UnavailableStarCraft implements EngineAdapter {
  readonly id = 'starcraft' as const;
  status(): EngineStatus {
    return {engine: this.id, state: 'unavailable',
      reason: 'Intégration suspendue : licence de réutilisation OpenBW non établie.'};
  }
  dispose(): void {}
}
