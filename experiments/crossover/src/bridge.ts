import type {CrossoverWindow, NativeSample, HeroesObservation, NativeCohort} from './native-bridge.js';
/** Versioned status bridge and explicit adapters. Army and battle mutation are not implemented. */
export type EngineId = 'heroes' | 'starcraft';
export type EngineStatus = {
  engine: EngineId;
  state: 'unavailable' | 'waiting' | 'observed';
  reason: string;
  native?: NativeSample;
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
  private preparationRequested = false;
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
  prepareFromStarCraft(sample: NativeSample): boolean {
    if (!Number.isSafeInteger(sample?.frame) || sample.frame < 1 || !Number.isSafeInteger(sample.checksum) ||
        sample.checksum < 0 || sample.checksum > 0xffffffff || ![0, 1, 2].includes(sample.outcome)) throw Error('État natif StarCraft invalide.');
    if (this.preparationRequested) return false;
    if (this.observation?.mode !== 'menu') throw Error('La préparation nécessite le menu Heroes.');
    const module = (this.target as (Window & {Module?: {_vcmiMobileCommand?: (...args: number[]) => void}}) | undefined)?.Module;
    if (!module?._vcmiMobileCommand) throw Error('Commande native VCMI indisponible.');
    // Existing C++ action checks the actual engine/window state before opening the lobby.
    module._vcmiMobileCommand(20, 1, 0, 0, 0, 0);
    this.preparationRequested = true;
    return true;
  }
  status(): EngineStatus {
    return {engine: this.id, state: this.observation ? 'observed' : 'waiting',
      reason: this.observation ? 'État VCMI reçu en lecture seule.' : 'En attente du premier état VCMI.',
      ...(this.observation ? {observation: {...this.observation}} : {})};
  }
  dispose(): void {
    this.target?.removeEventListener('goonk-state', this.listener);
    this.target = undefined;
    this.preparationRequested = false;
    this.observation = undefined;
    this.sequence = 0;
  }
}
export class StarCraftObserver implements EngineAdapter {
  readonly id = 'starcraft' as const;
  private target?: CrossoverWindow;
  private native?: NativeSample;
  private sequence = 0;
  private receivedAt = 0;
  constructor(private onChange: (status: EngineStatus) => void = () => {}) {}
  private record = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    const v = value as Record<string, unknown>;
    if (!Number.isSafeInteger(v.frame) || Number(v.frame) < 0 || !Number.isSafeInteger(v.checksum) || !Number.isSafeInteger(v.outcome) ||
        Number(v.checksum) < 0 || Number(v.checksum) > 0xffffffff || ![0, 1, 2].includes(Number(v.outcome))) return;
    const cohort = v.cohort as NativeCohort | undefined;
    if (cohort && (!Number.isSafeInteger(cohort.initial) || !Number.isSafeInteger(cohort.present) || !Number.isSafeInteger(cohort.missing) ||
      cohort.initial < 0 || cohort.present < 0 || cohort.missing < 0 || cohort.present + cohort.missing !== cohort.initial ||
      !Array.isArray(cohort.missingIds) || cohort.missingIds.length !== cohort.missing || !cohort.missingIds.every(id => Number.isSafeInteger(id) && id > 0))) return;
    this.native = {frame: Number(v.frame), checksum: Number(v.checksum), outcome: Number(v.outcome), ...(cohort ? {cohort: structuredClone(cohort)} : {})};
    this.sequence++; this.receivedAt = Date.now();
    this.onChange(this.status());
  };
  private listener = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    if (detail?.version === 1) this.record(detail);
  };
  attach(target: CrossoverWindow): void {
    this.dispose(); this.target = target;
    target.addEventListener('openbw-state', this.listener);
    if (target.openbwCrossover) this.record(target.openbwCrossover.sample());
  }
  forwardHeroes(observation: HeroesObservation): NativeSample {
    const api = this.target?.openbwCrossover;
    if (!api) throw Error('StarCraft attend ses archives et son démarrage.');
    return api.receiveHeroes(observation);
  }
  status(): EngineStatus {
    return {engine: this.id, state: this.native ? 'observed' : 'waiting',
      reason: this.native ? 'État natif OpenBW reçu.' : 'Importe les archives puis lance StarCraft.',
      ...(this.native ? {native: structuredClone(this.native), observation: {sequence: this.sequence, mode: 'running', receivedAt: this.receivedAt}} : {})};
  }
  dispose(): void {
    this.target?.removeEventListener('openbw-state', this.listener);
    this.target = undefined; this.native = undefined; this.sequence = 0; this.receivedAt = 0;
  }
}
