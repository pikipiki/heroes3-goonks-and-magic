/** Stable product API over the real OpenBW exports, installed only after native init. */
import {validateBattlePlan, type BattlePlan, type BattleState} from './battle.js';
export type NativeUnit = {id: number; type: number; owner: number; completed: boolean; hp: number; x: number; y: number};
export type NativeCensus = {frame: number; view: {x: number; y: number; width: number; height: number}; units: NativeUnit[]};
export type NativeCohort = {initial: number; present: number; missing: number; missingIds: number[]};
export type NativeSample = {frame: number; checksum: number; outcome: number; cohort?: NativeCohort};
export type HeroesObservation = {version: 1; session: string; sequence: number; mode: string};
export type NativeBridge = {
  sample(): NativeSample;
  census(): NativeCensus;
  receiveHeroes(observation: HeroesObservation): NativeSample;
  close(): void;
  battle(): BattleState | null;
  attack(): void;
  start(): void;
};
export type CrossoverWindow = Window & {openbwCrossover?: NativeBridge};
type NativeExports = {
  openbw_crossover_setup?(battle: number, count: number): number;
  openbw_crossover_battle_state?(): number;
  openbw_crossover_attack?(): void;
  openbw_crossover_census?(): number;
  openbw_frame(): number; openbw_checksum(): number; openbw_outcome(): number;
  openbw_in_ptr(length: number): number; openbw_post_message(length: number): void;
};
export function setupNativeBattle(x: NativeExports,memory: WebAssembly.Memory,plan: BattlePlan): void {
 validateBattlePlan(plan);
 if(!x.openbw_crossover_setup)throw Error('Passerelle native de combat absente.');
 const rows=new Int32Array(plan.stacks.flatMap(row=>[row.id,row.side,row.unit,row.count]));
 const pointer=x.openbw_in_ptr(rows.byteLength);
 new Uint8Array(memory.buffer,pointer,rows.byteLength).set(new Uint8Array(rows.buffer));
 if(x.openbw_crossover_setup(plan.battleId,plan.stacks.length)!==1)throw Error('Placement des armées StarCraft impossible. Reprends le combat Heroes.');
}
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
  const census = (): NativeCensus => {
  if (closed || !x.openbw_crossover_census) throw Error('Recensement natif indisponible.');
  const pointer = x.openbw_crossover_census(), bytes = new Uint8Array(memory.buffer);
  let end = pointer;
  while (end < bytes.length && end - pointer < 2 * 1024 * 1024 && bytes[end]) end++;
  if (end === bytes.length || bytes[end] !== 0) throw Error('Recensement natif invalide.');
  const value = JSON.parse(new TextDecoder().decode(bytes.subarray(pointer, end))) as NativeCensus | null;
  if (!value || !Number.isSafeInteger(value.frame) || value.frame < 0 || !value.view ||
      !['x', 'y', 'width', 'height'].every(key => Number.isSafeInteger(value.view[key as keyof NativeCensus['view']])) || value.view.width < 1 || value.view.height < 1 ||
      !Array.isArray(value.units) || value.units.length > 10000 || value.units.some(unit =>
        !unit || !['id', 'type', 'owner', 'hp', 'x', 'y'].every(key => Number.isSafeInteger(unit[key as keyof NativeUnit])) ||
        typeof unit.completed !== 'boolean' || unit.id < 1 || unit.owner < 0 || unit.owner > 7)) throw Error('Recensement natif invalide.');
  return value;
};
  const initialCohort = x.openbw_crossover_census ? new Set(census().units.filter(unit => unit.hp > 0).map(unit => unit.id)) : undefined;
  const sample = (): NativeSample => {
    if (closed) throw Error('Moteur StarCraft fermé.');
    const state: NativeSample = {frame: x.openbw_frame(), checksum: x.openbw_checksum() >>> 0, outcome: x.openbw_outcome()};
    if (initialCohort) {
      const presentIds = new Set(census().units.filter(unit => unit.hp > 0).map(unit => unit.id));
      const missingIds = [...initialCohort].filter(id => !presentIds.has(id));
      state.cohort = {initial: initialCohort.size, present: initialCohort.size - missingIds.length, missing: missingIds.length, missingIds};
    }
    return state;
  };
  const publish = (kind: string, extra: Record<string, unknown> = {}): NativeSample => {
    const state = sample();
    target.dispatchEvent(new CustomEvent('openbw-state', {detail: {version: 1, kind, ...state, ...extra}}));
    return state;
  };
  const api: NativeBridge = {
    start() { if(closed)throw Error('Moteur StarCraft fermé.'); },
    battle() {
      if(closed || !x.openbw_crossover_battle_state)return null;
      const pointer=x.openbw_crossover_battle_state(),bytes=new Uint8Array(memory.buffer);let end=pointer;
      while(end<bytes.length&&end-pointer<65536&&bytes[end])end++;
      if(end===bytes.length||bytes[end]!==0)throw Error('Résultat natif invalide.');
      return JSON.parse(new TextDecoder().decode(bytes.subarray(pointer,end))) as BattleState|null;
    },
    attack() { if(closed || !x.openbw_crossover_attack)throw Error('Combat StarCraft indisponible.');x.openbw_crossover_attack(); },
    sample,
    census,
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
