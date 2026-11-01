/** A strict, portable compiler for a deliberately bounded Amethyst cfg subset.
 * This module does not load DLLs, execute ERM, or infer undocumented enum values.
 */
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const ranges = {
  Level: [0, 7], Town: [-1, 8],
  RegenerationHitPoints: [0, 2147483647], RegenerationChance: [0, 100],
  StrikeAndReturn: [0, 1],
};
const builtInEvidence = {
  Level: 'TUM Data/Creatures/*.cfg Level is zero-based; VCMI Creature_Format level is one-based.',
  Town: 'Caller-supplied ERA town-ID to VCMI faction resolver; no positional town assumption.',
  RegenerationHitPoints: 'TUM Data/Creatures/224.cfg; VCMI server/battles/BattleFlowProcessor.cpp HP_REGENERATION branch.',
  RegenerationChance: 'TUM Data/Creatures/224.cfg RegenerationChance=100; native HP_REGENERATION is unconditional.',
  StrikeAndReturn: 'TUM Data/Creatures/231.cfg StrikeAndReturn=1; VCMI BonusEnum.h RETURN_AFTER_STRIKE.',
  Hate: 'TUM Data/Creatures/202.cfg Hate0054=200; VCMI BonusEnum.h HATE uses creature subtype and damage percentage.',
};
function diagnostic(source, line, code, message, key) {
  return { source, line, code, message, ...(key === undefined ? {} : {key}) };
}
function integerValue(entry, min, max, diagnostics) {
  if (!/^[+-]?\d+$/.test(entry.rawValue)) {
    diagnostics.push(diagnostic(entry.source, entry.line, 'INVALID_INTEGER',
      `${entry.key} must be a decimal integer, received ${JSON.stringify(entry.rawValue)}`, entry.key));
    return undefined;
  }
  const value = Number(entry.rawValue);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    diagnostics.push(diagnostic(entry.source, entry.line, 'OUT_OF_RANGE',
      `${entry.key} must be between ${min} and ${max}`, entry.key));
    return undefined;
  }
  return value;
}
export class AmethystCompilationError extends Error {
  constructor(diagnostics) {
    super(diagnostics.map(d => `${d.source}:${d.line}: ${d.code}: ${d.message}`).join('\n'));
    this.name = 'AmethystCompilationError';
    this.diagnostics = structuredClone(diagnostics);
  }
}
/** Preserve every occurrence. A duplicate can never silently replace a value. */
export function parseAmethystCreature(text, {source = '<amethyst.cfg>'} = {}) {
  if (typeof text !== 'string' || typeof source !== 'string' || !source) throw new TypeError('Expected cfg text and a nonempty source name');
  const entries = [], diagnostics = [], first = new Map();
  for (const [index, original] of text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).entries()) {
    const line = index + 1, value = original.trim();
    if (!value || /^(?:;|#|\/\/)/.test(value)) continue;
    const equals = value.indexOf('=');
    if (equals < 1 || !value.slice(0, equals).trim() || !value.slice(equals + 1).trim()) {
      diagnostics.push(diagnostic(source, line, 'MALFORMED_PROPERTY', 'Expected nonempty property=value')); continue;
    }
    const key = value.slice(0, equals).trim(), rawValue = value.slice(equals + 1).trim();
    if (!/^[A-Za-z][A-Za-z0-9 _-]*$/.test(key)) {
      diagnostics.push(diagnostic(source, line, 'INVALID_PROPERTY_NAME', `Invalid property name ${JSON.stringify(key)}`, key)); continue;
    }
    const entry = {key, rawValue, source, line}; entries.push(entry);
    if (first.has(key)) diagnostics.push(diagnostic(source, line, 'DUPLICATE_PROPERTY', `${key} was already defined on line ${first.get(key)}`, key));
    else first.set(key, line);
    const range = own(ranges, key) ? ranges[key] : /^Hate\d{4}$/.test(key) ? [0, 1000] : undefined;
    if (range) integerValue(entry, ...range, diagnostics);
  }
  return {source, entries, diagnostics};
}
function jsonValue(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(jsonValue);
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(value).every(([key, child]) => !['__proto__', 'prototype', 'constructor'].includes(key) && jsonValue(child));
}
function cleanPatch(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && jsonValue(value);
}
function mergePatch(destination, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (own(destination, key) && (!destination[key] || typeof destination[key] !== 'object' || Array.isArray(destination[key]))) throw Error(`Conflicting output ${key}`);
      if (!own(destination, key)) destination[key] = {};
      mergePatch(destination[key], value);
    } else {
      if (own(destination, key)) throw Error(`Conflicting output ${key}`);
      destination[key] = structuredClone(value);
    }
  }
}
/**
 * Evidence contracts are narrow caller adapters, not a permissive ignore-list.
 * Each has {name, evidence:[source references], keys:[exact cfg keys], compile(ctx)}.
 * ctx.emit({keys, operation, definition}) consumes keys while emitting native config.
 * ctx.reject(key, message) records explicitly unsupported semantics.
 * Unclaimed keys, empty output, overlaps and unnamed/unproven contracts all fail.
 */
export function compileAmethystCreature(input, {
  source = '<amethyst.cfg>', resolveTown, resolveCreature, contracts = [],
} = {}) {
  const parsed = typeof input === 'string' ? parseAmethystCreature(input, {source}) : structuredClone(input);
  if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.diagnostics)) throw new TypeError('Expected parsed Amethyst cfg or text');
  const diagnostics = structuredClone(parsed.diagnostics), definition = {}, provenance = [];
  const entries = new Map(), consumed = new Set();
  for (const entry of parsed.entries) {
    if (!entry || typeof entry.key !== 'string' || typeof entry.rawValue !== 'string' || !Number.isInteger(entry.line) || entry.line < 1 || typeof entry.source !== 'string') throw new TypeError('Invalid parsed cfg entry');
    if (entries.has(entry.key) && !diagnostics.some(d => d.code === 'DUPLICATE_PROPERTY' && d.key === entry.key)) diagnostics.push(diagnostic(entry.source, entry.line, 'DUPLICATE_PROPERTY', `Duplicate ${entry.key}`, entry.key));
    else entries.set(entry.key, entry);
    const range = own(ranges, entry.key) ? ranges[entry.key] : /^Hate\d{4}$/.test(entry.key) ? [0, 1000] : undefined;
    if (range && !diagnostics.some(d => d.key === entry.key && d.line === entry.line)) integerValue(entry, ...range, diagnostics);
  }
  if (diagnostics.length) throw new AmethystCompilationError(diagnostics);
  const error = (key, code, message) => {
    const entry = entries.get(key);
    diagnostics.push(diagnostic(entry?.source || parsed.source || source, entry?.line || 1, code, message, key));
  };
  const record = (keys, contract, evidence, operation, patch) => {
    if (!keys.length || keys.some(key => !entries.has(key) || consumed.has(key))) throw Error('A mapping must consume present, unclaimed properties');
    if (typeof operation !== 'string' || !operation.trim()) throw Error('A mapping requires a named operation');
    if (!cleanPatch(patch) || !Object.keys(patch).length) throw Error('A mapping must emit a nonempty native definition');
    const next = structuredClone(definition); mergePatch(next, patch);
    for (const key of Object.keys(definition)) delete definition[key]; Object.assign(definition, next);
    for (const key of keys) {
      consumed.add(key); provenance.push({...entries.get(key), contract, operation, evidence: [...evidence]});
    }
  };
  const number = (key, min, max) => integerValue(entries.get(key), min, max, diagnostics);
  const builtIn = (keys, operation, patch) => record(keys, 'amethyst.native-v1', keys.map(key => builtInEvidence[key] || builtInEvidence.Hate), operation, patch);
  const resolved = (key, resolver, value) => {
    if (typeof resolver !== 'function') { error(key, 'MISSING_RESOLVER', `Explicit resolver required for ${key}`); return; }
    try {
      const result = resolver(value);
      if (typeof result !== 'string' || !result.trim()) { error(key, 'UNRESOLVED_IDENTIFIER', `No VCMI identifier for ${key}=${value}`); return; }
      return result;
    } catch (cause) { error(key, 'RESOLVER_FAILED', `${key}: ${cause.message}`); }
  };
  for (const [key] of entries) {
    if (key === 'Level') builtIn([key], 'creature.level = zeroBasedLevel + 1', {level: number(key, 0, 7) + 1});
    else if (key === 'Town') {
      const faction = resolved(key, resolveTown, number(key, -1, 8));
      if (faction) builtIn([key], 'creature.faction = resolved ERA town', {faction});
    } else if (/^Hate\d{4}$/.test(key)) {
      const subtype = resolved(key, resolveCreature, Number(key.slice(4)));
      if (subtype) builtIn([key], 'HATE damage bonus against resolved creature', {abilities:{['amethyst_'+key]:{type:'HATE', subtype, val:number(key, 0, 1000)}}});
    } else if (key === 'StrikeAndReturn') {
      if (number(key, 0, 1) === 1) builtIn([key], 'RETURN_AFTER_STRIKE enabled', {abilities:{amethystStrikeAndReturn:{type:'RETURN_AFTER_STRIKE'}}});
      else error(key, 'UNSUPPORTED_SEMANTICS', 'StrikeAndReturn=0 requires an explicit base-ability removal contract');
    }
  }
  if (entries.has('RegenerationHitPoints') || entries.has('RegenerationChance')) {
    if (!entries.has('RegenerationHitPoints') || !entries.has('RegenerationChance')) error(entries.has('RegenerationChance') ? 'RegenerationChance' : 'RegenerationHitPoints', 'INCOMPLETE_REGENERATION', 'Both RegenerationHitPoints and RegenerationChance are required');
    else if (number('RegenerationChance', 0, 100) !== 100) error('RegenerationChance', 'UNSUPPORTED_SEMANTICS', 'Native HP_REGENERATION has no probability gate; this chance requires a runtime adapter');
    else builtIn(['RegenerationHitPoints','RegenerationChance'], 'HP_REGENERATION with explicitly unconditional 100% chance', {abilities:{amethystRegeneration:{type:'HP_REGENERATION',val:number('RegenerationHitPoints',0,2147483647)}}});
  }
  if (!Array.isArray(contracts)) throw new TypeError('Evidence contracts must be an array');
  const names = new Set();
  for (const contract of contracts) {
    if (!contract || typeof contract.name !== 'string' || !contract.name.trim() || names.has(contract.name) || !Array.isArray(contract.evidence) || !contract.evidence.length || contract.evidence.some(s => typeof s !== 'string' || !s.trim()) || !Array.isArray(contract.keys) || !contract.keys.length || new Set(contract.keys).size !== contract.keys.length || contract.keys.some(s => typeof s !== 'string' || !s) || typeof contract.compile !== 'function') {
      diagnostics.push(diagnostic(parsed.source || source, 1, 'INVALID_EVIDENCE_CONTRACT', 'Adapters require a unique name, evidence references, exact unique keys and compile function')); continue;
    }
    names.add(contract.name);
    const present = contract.keys.filter(key => entries.has(key)); if (!present.length) continue;
    if (present.some(key => consumed.has(key))) { error(present.find(key => consumed.has(key)), 'OVERLAPPING_CONTRACT', `${contract.name} overlaps a previously compiled property`); continue; }
    const allowed = new Set(contract.keys), properties = Object.freeze(Object.fromEntries(present.map(key => [key, entries.get(key).rawValue])));
    let active = true;
    const requireKey = key => {if (!active) throw Error('Evidence adapters must compile synchronously'); if (!allowed.has(key) || !entries.has(key)) throw Error(`${contract.name} did not declare present key ${key}`);};
    try {
      const outcome = contract.compile(Object.freeze({properties,
        integer(key, {min=-2147483648,max=2147483647} = {}) { requireKey(key); if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) throw Error('Invalid integer bounds'); return number(key,min,max); },
        reject(key, message) { requireKey(key); if (typeof message !== 'string' || !message.trim()) throw Error('Unsupported semantics require an explanation'); error(key, 'UNSUPPORTED_SEMANTICS', `${contract.name}: ${message}`); },
        emit({keys, operation, definition: patch}) {
          if (!Array.isArray(keys) || !keys.length || new Set(keys).size !== keys.length) throw Error('emit requires unique input keys');
          for (const key of keys) requireKey(key);
          record(keys, contract.name, contract.evidence, operation, patch);
        },
      }));
      if (outcome && typeof outcome.then === 'function') {Promise.resolve(outcome).catch(()=>{}); throw Error('Evidence adapters must compile synchronously');}
    } catch (cause) { error(present[0], 'ADAPTER_FAILED', `${contract.name}: ${cause.message}`); } finally { active = false; }
  }
  for (const [key] of entries) if (!consumed.has(key) && !diagnostics.some(d=>d.key===key)) error(key, 'UNSUPPORTED_PROPERTY', `No verified native mapping or evidence contract for ${key}`);
  if (diagnostics.length) throw new AmethystCompilationError(diagnostics);
  return {definition, provenance};
}
