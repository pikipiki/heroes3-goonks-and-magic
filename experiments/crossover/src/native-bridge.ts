/** Stable product API over the real OpenBW exports, installed only after native init. */
export type NativeSample = {frame: number; checksum: number; outcome: number};
export type HeroesObservation = {version: 1; session: string; sequence: number; mode: string};
export type NativeBridge = {
  sample(): NativeSample;
  receiveHeroes(observation: HeroesObservation): NativeSample;
  close(): void;
};
export type CrossoverWindow = Window & {openbwCrossover?: NativeBridge};
type NativeExports = {
  openbw_frame(): number; openbw_checksum(): number; openbw_outcome(): number;
  openbw_in_ptr(length: number): number; openbw_post_message(length: number): void;
};
export function validateHeroes(value: unknown): asserts value is HeroesObservation {
  if (!value || typeof value !== 'object') throw Error('Événement Heroes invalide.');
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || typeof v.session !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(v.session) ||
      !Number.isSafeInteger(v.sequence) || Number(v.sequence) < 1 || typeof v.mode !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(v.mode)) {
    throw Error('Événement Heroes invalide.');
  }
}
export function installNativeBridge(x: NativeExports, memory: WebAssembly.Memory, target: CrossoverWindow = window): NativeBridge {
  let closed = false, session: string | undefined, lastSequence = 0;
  target.openbwCrossover?.close();
  const sample = (): NativeSample => {
    if (closed) throw Error('Moteur StarCraft fermé.');
    return {frame: x.openbw_frame(), checksum: x.openbw_checksum() >>> 0, outcome: x.openbw_outcome()};
  };
  const publish = (kind: string, extra: Record<string, unknown> = {}): NativeSample => {
    const state = sample();
    target.dispatchEvent(new CustomEvent('openbw-state', {detail: {version: 1, kind, ...state, ...extra}}));
    return state;
  };
  const api: NativeBridge = {
    sample,
    receiveHeroes(input) {
      validateHeroes(input);
      if (closed) throw Error('Moteur StarCraft fermé.');
      if (session !== undefined && input.session !== session) throw Error('Session Heroes différente : relance le crossover.');
      if (input.sequence <= lastSequence) throw Error('Événement Heroes déjà reçu ou périmé.');
      const bytes = new TextEncoder().encode('Heroes: ' + input.mode + ' (#' + input.sequence + ')');
      const pointer = x.openbw_in_ptr(bytes.length);
      new Uint8Array(memory.buffer, pointer, bytes.length).set(bytes);
      x.openbw_post_message(bytes.length); // Existing C++ UI log; no simulated battle result.
      session = input.session; lastSequence = input.sequence;
      return publish('heroes.received', {session, heroesSequence: lastSequence});
    },
    close() {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      if (target.openbwCrossover === api) delete target.openbwCrossover;
      target.removeEventListener('pagehide', api.close);
    }
  };
  const timer = setInterval(() => publish('snapshot'), 1000);
  target.openbwCrossover = api;
  target.addEventListener('pagehide', api.close);
  publish('ready');
  return api;
}
