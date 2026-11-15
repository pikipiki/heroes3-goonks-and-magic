export const LOADOUT_KEY = 'heroes-starcraft.spell-loadout.v1';
export function spellRef(spell, plan) {
    return spell.caster < 0 ? { id: spell.id } : { id: spell.id, creature: plan.stacks.find(s => s.id === spell.caster)?.creature };
}
export function resolveSpell(ref, spells, plan, frame = 0) {
    if (!ref)
        return;
    const matches = spells.filter(s => s.id === ref.id && (ref.creature ? plan.stacks.some(row => row.id === s.caster && row.creature === ref.creature) : s.caster < 0));
    return matches.find(s => s.casts !== 0 && s.ready <= frame) || matches.find(s => s.casts !== 0) || matches[0];
}
export function parseLoadout(text) {
    if (!text)
        return;
    try {
        const value = JSON.parse(text);
        if (!Array.isArray(value) || value.length !== 5)
            return;
        const result = [];
        for (const item of value) {
            if (item === null) {
                result.push(null);
                continue;
            }
            if (!item || typeof item !== 'object' || !Number.isSafeInteger(item.id) || item.id < 0 || item.id > 10000 || (item.creature !== undefined && (typeof item.creature !== 'string' || !/^[a-zA-Z0-9_.:-]{1,128}$/.test(item.creature))))
                return;
            result.push({ id: item.id, ...(item.creature ? { creature: item.creature } : {}) });
        }
        return result;
    }
    catch {
        return;
    }
}
export function defaultLoadout(spells, plan) {
    const preferred = [17, 21, 37, 38, 53].map(id => spells.find(s => s.caster < 0 && s.id === id)).filter((s) => !!s);
    const chosen = [];
    for (const spell of [...preferred, ...spells]) {
        const ref = spellRef(spell, plan);
        if (!chosen.some(s => sameSpellRef(s, ref)))
            chosen.push(ref);
        if (chosen.length === 5)
            break;
    }
    return Array.from({ length: 5 }, (_, i) => chosen[i] || null);
}
export function sameSpellRef(a, b) { return !!a && !!b && a.id === b.id && a.creature === b.creature; }
export function assignSlot(loadout, index, ref) {
    if (!Number.isInteger(index) || index < 0 || index > 4)
        throw Error('Emplacement de sort invalide.');
    const result = loadout.map(s => s ? { ...s } : null);
    const duplicate = result.findIndex(s => sameSpellRef(s, ref));
    if (duplicate >= 0 && duplicate !== index)
        result[duplicate] = result[index];
    result[index] = { ...ref };
    return result;
}
