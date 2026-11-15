export const STARCRAFT_UNITS = { marine: 0, firebat: 32, zergling: 37, hydralisk: 38, zealot: 65, dragoon: 66 };
export function battlePlan(value) {
    const plan = { version: 1, battleId: value.battleId, magic: value.magic, fromClassic: value.fromClassic, stacks: value.stacks.map(row => ({ ...row, heroes: !row.creature.startsWith("heroes-starcraft:"), unit: row.creature.startsWith('heroes-starcraft:') ? (STARCRAFT_UNITS[row.creature.split(':')[1]] ?? -1) : row.shooter ? 0 : 37 })) };
    validateBattlePlan(plan);
    return plan;
}
export function validateBattlePlan(value) {
    if (value.version !== 1 || !Number.isSafeInteger(value.battleId) || value.battleId < 0 || !Array.isArray(value.stacks) || value.stacks.length < 2 || value.stacks.length > 32)
        throw Error('Combat Heroes invalide.');
    const ids = new Set(), totals = [0, 0];
    for (const row of value.stacks) {
        if (!Number.isSafeInteger(row.id) || row.id < 0 || ids.has(row.id) || ![0, 1].includes(row.side) || !Number.isSafeInteger(row.count) || row.count < 0 || row.count > 128 || !Object.values(STARCRAFT_UNITS).includes(row.unit))
            throw Error('Troupe Heroes invalide.');
        if (row.firstHp !== undefined && (!Number.isSafeInteger(row.firstHp) || row.firstHp < 0 || row.firstHp > row.health))
            throw Error('Blessure de troupe invalide.');
        if (row.maxCount !== undefined && (!Number.isSafeInteger(row.maxCount) || row.maxCount < row.count || row.maxCount > 128))
            throw Error('Effectif initial invalide.');
        if (row.heroes && (!Number.isSafeInteger(row.health) || row.health < 1 || row.health > 10000))
            throw Error('Points de vie Heroes invalides.');
        if ((row.x !== undefined && (!Number.isSafeInteger(row.x) || row.x < 0 || row.x > 799)) || (row.y !== undefined && (!Number.isSafeInteger(row.y) || row.y < 0 || row.y > 499)))
            throw Error('Position de troupe invalide.');
        ids.add(row.id);
        totals[row.side] += row.count;
    }
    if (totals.some(total => total < 1 || total > 128))
        throw Error('Ce test accepte de 1 à 128 créatures par armée.');
}
export function battleResult(plan, state) {
    if (!Array.isArray(state.groups) || state.groups.some(g => !plan.stacks.some(s => s.id === g.id)))
        throw Error('Troupes inconnues dans le résultat.');
    const originalStacks = plan.stacks.filter(s => !s.temporary);
    state = { ...state, groups: state.groups.filter(g => originalStacks.some(s => s.id === g.id)) };
    if (state.battleId !== plan.battleId || !state.finished || !Number.isSafeInteger(state.frame) || state.frame < 1 || !Array.isArray(state.groups) || state.groups.length !== originalStacks.length)
        throw Error('Résultat StarCraft incomplet ou périmé.');
    const seen = new Set(), totals = [0, 0];
    const result = state.groups.map(row => {
        const original = plan.stacks.find(stack => stack.id === row.id);
        if (!original || seen.has(row.id) || row.side !== original.side || row.initial !== original.count || !Number.isSafeInteger(row.survivors) || row.survivors < 0 || row.survivors > (original.maxCount ?? row.initial))
            throw Error('Pertes StarCraft incohérentes.');
        seen.add(row.id);
        totals[row.side] += row.survivors;
        return [row.id, row.survivors];
    });
    if (totals.every(total => total > 0))
        throw Error('La bataille StarCraft continue.');
    return result;
}
