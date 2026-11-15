import { RenderClock, SimulationTimeline, interpolatedPosition, attackCycle, heroAnimation } from './animation.js';
// Frame the opening armies once, so the camera stays steady during combat.
export function battleView(units, camera) {
    if (!units.length)
        return { zoom: 1, x: 0, y: 0 };
    const xs = units.map(u => u.x - camera.x), ys = units.map(u => u.y - camera.y);
    const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
    const zoom = Math.min(1.3, 640 / Math.max(1, right - left), 300 / Math.max(1, bottom - top));
    const cx = Math.max(400 / zoom, Math.min(800 - 400 / zoom, (left + right) / 2));
    const cy = Math.max(250 / zoom, Math.min(500 - 250 / zoom, (top + bottom) / 2 - 50));
    return { zoom, x: 400 - cx * zoom, y: 250 - cy * zoom };
}
// Enemy targets take precedence over overlapping allies once a troop is selected.
// The tall touch area follows the enlarged bodies rather than only their feet.
export function battlePick(units, positions, point, camera, selected) {
    const distance = (unit) => { const at = positions.get(unit.id) || unit, dx = point.x - (at.x - camera.x), dy = point.y - (at.y - camera.y); return Math.hypot(dx, Math.max(0, -dy - (unit.heroes ? 110 : 115), dy - 10)) + Math.abs(dy) * .15; };
    const candidates = units.filter(unit => unit.hp > 0 && distance(unit) < 28).sort((a, b) => distance(a) - distance(b));
    return (selected ? candidates.find(unit => unit.owner === 1) : undefined) || candidates[0];
}
// Both engines supply their original art. All positions/HP/orders come from
// OpenBW; this compositor never advances combat or invents an outcome.
export function sharedField(win, canvas, api, plan) {
    const source = win, context = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 500;
    canvas.setAttribute('aria-label', 'Champ de bataille Heroes III : unités Heroes et StarCraft en temps réel');
    const clock = new RenderClock(), timeline = new SimulationTimeline(), oldUnits = new Map(), cycles = new Map(), deaths = new Set(), hits = new Map();
    const sprites = new Map(), positions = new Map();
    const makeSprite = () => { const image = win.document.createElement('canvas'); image.width = image.height = 96; return image; };
    const heroBlend = win.document.createElement('canvas');
    heroBlend.width = heroBlend.height = 128;
    const heroContext = heroBlend.getContext('2d');
    const marineBlend = makeSprite(), marineContext = marineBlend.getContext('2d');
    let request = 0, closed = false, selected, attackMode = false, units = [], nativeFrame = -1, view;
    const revivedBodies = new Set();
    const spellEffects = [], corpses = new Map(), deathTimes = new Map(), castTimes = new Map(), damageText = new Map();
    const spellFx = (event) => { const effect = { ...event.detail, at: win.performance.now() }; spellEffects.push(effect); if (effect.caster >= 0)
        castTimes.set(effect.caster, effect.at + 800); };
    canvas.addEventListener('crossover-spell-effect', spellFx);
    let obstacles = [];
    const obstacleChange = (event) => { obstacles = event.detail; };
    canvas.addEventListener('crossover-obstacles', obstacleChange);
    const changed = () => { nativeFrame = -1; };
    canvas.addEventListener('crossover-native-changed', changed);
    let mirrorBackground = false;
    let camera = { x: 0, y: 0 }, marker;
    const draw = (now) => {
        if (closed)
            return;
        request = win.requestAnimationFrame(draw);
        if (!clock.due(now))
            return;
        // Census and expensive sprite extraction happen only on a new native tick.
        // Paused units can receive orders without advancing; they stay at their real
        // positions until simulation resumes.
        if (!api.frame || api.frame() !== nativeFrame) {
            const snapshot = api.census();
            if (snapshot.frame !== nativeFrame) {
                oldUnits.clear();
                for (const unit of units)
                    oldUnits.set(unit.id, unit);
                nativeFrame = snapshot.frame;
                timeline.receive(nativeFrame, now, api.tickDuration?.() || 42);
                units = snapshot.units.filter(unit => unit.stackId !== undefined && unit.stackId >= 0);
                camera = api.camera();
                if (!view && units.length) {
                    view = battleView(units, camera);
                    const mean = (owner) => { const rows = units.filter(u => u.owner === owner); return rows.reduce((n, u) => n + u.x, 0) / Math.max(1, rows.length); };
                    mirrorBackground = mean(0) > mean(1);
                }
                const alive = new Set(units.map(unit => unit.id));
                for (const old of oldUnits.values())
                    if (!alive.has(old.id) && !revivedBodies.has(old.id)) {
                        corpses.set(old.id, { ...old, hp: 0 });
                        if (!deathTimes.has(old.id))
                            deathTimes.set(old.id, now);
                        if (old.heroes && !deaths.has(old.id))
                            api.playCreatureSound?.(old.stackId, 'death');
                        deaths.delete(old.id);
                    }
                for (const unit of units) {
                    if (unit.hp > 0 && !oldUnits.has(unit.id)) {
                        const dead = [...corpses.values(), ...oldUnits.values()].find(u => u.stackId === unit.stackId && u.hp <= 0 && !revivedBodies.has(u.id));
                        if (dead) {
                            revivedBodies.add(dead.id);
                            corpses.delete(dead.id);
                            deathTimes.delete(dead.id);
                        }
                    }
                    if (unit.hp > 0) {
                        corpses.delete(unit.id);
                        deathTimes.delete(unit.id);
                    }
                    const old = oldUnits.get(unit.id);
                    if (unit.heroes && (unit.cooldown || 0) > (old?.cooldown || 0))
                        api.playCreatureAttack?.(unit.stackId);
                    const cycle = attackCycle(old, unit, nativeFrame, cycles.get(unit.id));
                    if (cycle)
                        cycles.set(unit.id, cycle);
                    if (old && ((unit.hp256 ?? unit.hp * 256) < (old.hp256 ?? old.hp * 256) || (unit.shields256 ?? (unit.shields ?? 0) * 256) < (old.shields256 ?? (old.shields ?? 0) * 256))) {
                        hits.set(unit.id, now + 320);
                        damageText.set(unit.id, { amount: (Math.max(0, (old.hp256 ?? old.hp * 256) - (unit.hp256 ?? unit.hp * 256)) + Math.max(0, (old.shields256 ?? (old.shields ?? 0) * 256) - (unit.shields256 ?? (unit.shields ?? 0) * 256))) / 256, at: now });
                        if (unit.hp <= 0 && !deathTimes.has(unit.id))
                            deathTimes.set(unit.id, now);
                        if (unit.heroes) {
                            api.playCreatureSound?.(unit.stackId, unit.hp > 0 ? 'hit' : 'death');
                            if (unit.hp <= 0)
                                deaths.add(unit.id);
                        }
                    }
                    if (!unit.heroes) {
                        let pair = sprites.get(unit.id);
                        if (!pair) {
                            pair = { before: makeSprite(), after: makeSprite() };
                            sprites.set(unit.id, pair);
                        }
                        else
                            [pair.before, pair.after] = [pair.after, pair.before];
                        try {
                            pair.after.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(api.sprite(unit.id)), 96, 96), 0, 0);
                        }
                        catch {
                            pair.after.getContext('2d').drawImage(pair.before, 0, 0);
                        }
                        if (!old)
                            pair.before.getContext('2d').drawImage(pair.after, 0, 0);
                    }
                }
            }
        }
        const { amount, frame: visualFrame } = timeline.sample(now);
        positions.clear();
        for (const unit of units)
            positions.set(unit.id, interpolatedPosition(oldUnits.get(unit.id), unit, amount));
        const background = source.goonkCrossoverBackground?.battleId === plan.battleId ? source.goonkCrossoverBackground.canvas : source.goonkBattlePlanes?.background;
        canvas.dataset.background = background ? 'heroes' : 'loading';
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;
        context.imageSmoothingEnabled = true;
        context.fillStyle = '#40512e';
        context.fillRect(0, 0, 800, 500);
        if (background) {
            context.save();
            if (mirrorBackground) {
                context.translate(800, 0);
                context.scale(-1, 1);
            }
            context.drawImage(background, 0, 0, 800, 500);
            context.restore();
        }
        const transform = view || { zoom: 1, x: 0, y: 0 };
        context.setTransform(transform.zoom, 0, 0, transform.zoom, transform.x, transform.y);
        context.imageSmoothingEnabled = false;
        const art = source.goonkCrossoverArt;
        for (const unit of [...corpses.values(), ...units].filter(u => !revivedBodies.has(u.id)).sort((a, b) => (positions.get(a.id) || a).y - (positions.get(b.id) || b).y)) {
            const point = positions.get(unit.id) || unit, x = point.x - camera.x, y = point.y - camera.y, old = oldUnits.get(unit.id), moving = !!old && (old.x !== unit.x || old.y !== unit.y);
            const chosen = unit.owner === 0 && selected !== undefined && (selected < 0 || selected === unit.stackId);
            context.strokeStyle = unit.owner === 0 ? '#8de6ff' : '#ff8066';
            context.lineWidth = 2;
            if (chosen) {
                context.beginPath();
                context.ellipse(x, y + 5, 23, 8, 0, 0, Math.PI * 2);
                context.stroke();
            }
            if (unit.heroes && art?.battleId === plan.battleId) {
                const row = art.rows.find(row => row.id === unit.stackId);
                if (row) {
                    let animation = heroAnimation(visualFrame, moving, unit.cooldown || 0, cycles.get(unit.id));
                    const deadAt = deathTimes.get(unit.id), hitUntil = hits.get(unit.id) || 0, castUntil = castTimes.get(unit.stackId) || 0;
                    if (deadAt !== undefined) {
                        const position = Math.min(7, (now - deadAt) / 110), index = Math.floor(position);
                        animation = { pose: 4, frame: index, next: Math.min(7, index + 1), mix: position - index };
                    }
                    else if (hitUntil > now) {
                        const position = Math.min(7, (1 - (hitUntil - now) / 320) * 8), index = Math.floor(position);
                        animation = { pose: 3, frame: index, next: Math.min(7, index + 1), mix: position - index };
                    }
                    else if (castUntil > now) {
                        const position = Math.min(7, (1 - (castUntil - now) / 800) * 8), index = Math.floor(position);
                        animation = { pose: 5, frame: index, next: Math.min(7, index + 1), mix: position - index };
                    }
                    context.save();
                    context.translate(x, y + 5);
                    if (units.some(enemy => enemy.owner !== unit.owner && enemy.x < unit.x))
                        context.scale(-1, 1);
                    heroContext.clearRect(0, 0, 128, 128);
                    heroContext.globalAlpha = 1 - animation.mix;
                    heroContext.drawImage(art.canvas, animation.frame * 128, (row.row + animation.pose) * 128, 128, 128, 0, 0, 128, 128);
                    heroContext.globalCompositeOperation = 'lighter';
                    heroContext.globalAlpha = animation.mix;
                    heroContext.drawImage(art.canvas, animation.next * 128, (row.row + animation.pose) * 128, 128, 128, 0, 0, 128, 128);
                    heroContext.globalCompositeOperation = 'source-over';
                    context.drawImage(heroBlend, -56, -112, 112, 112);
                    context.restore();
                }
            }
            else if (!unit.heroes) {
                const pair = sprites.get(unit.id);
                if (!pair)
                    continue;
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
                marineContext.clearRect(0, 0, 96, 96);
                marineContext.globalAlpha = 1 - amount;
                marineContext.drawImage(pair.before, 0, 0);
                marineContext.globalCompositeOperation = 'lighter';
                marineContext.globalAlpha = amount;
                marineContext.drawImage(pair.after, 0, 0);
                marineContext.globalCompositeOperation = 'source-over';
                const hitUntil = hits.get(unit.id) || 0, recoil = hitUntil > now ? Math.sin((1 - (hitUntil - now) / 320) * Math.PI) * 7 : 0;
                context.drawImage(marineBlend, x - 120 + recoil, y + 5 - 200, 240, 240);
                context.imageSmoothingEnabled = false;
            }
            const hitUntil = hits.get(unit.id) || 0;
            if (hitUntil > now) {
                const age = 1 - (hitUntil - now) / 320;
                context.strokeStyle = '#fff0be';
                context.globalAlpha = 1 - age;
                context.lineWidth = 2;
                for (let i = 0; i < 7; i++) {
                    const angle = i * Math.PI * 2 / 7, r = 8 + age * 27;
                    context.beginPath();
                    context.moveTo(x + Math.cos(angle) * r, y - 45 + Math.sin(angle) * r);
                    context.lineTo(x + Math.cos(angle) * (r + 7), y - 45 + Math.sin(angle) * (r + 7));
                    context.stroke();
                }
                context.globalAlpha = 1;
            }
            const damage = damageText.get(unit.id);
            if (damage && now - damage.at < 850) {
                const age = (now - damage.at) / 850;
                context.globalAlpha = 1 - age;
                context.font = 'bold 16px sans-serif';
                context.textAlign = 'center';
                context.fillStyle = '#ffe5bf';
                context.fillText('−' + Number(damage.amount.toFixed(1)).toLocaleString('fr-FR'), x, y - 95 - age * 30);
                context.globalAlpha = 1;
            }
            if (unit.hp <= 0)
                continue;
            const width = 22, barY = y - (unit.heroes ? 96 : 76), hp = Math.max(0, Math.min(1, (unit.hp256 ?? unit.hp * 256) / ((unit.maxHp || unit.hp) * 256)));
            if (unit.maxShields) {
                context.fillStyle = '#121009';
                context.fillRect(x - width / 2 - 1, barY - 8, width + 2, 6);
                context.fillStyle = '#70c9ff';
                context.fillRect(x - width / 2, barY - 7, width * Math.max(0, (unit.shields ?? 0) / unit.maxShields), 4);
            }
            context.fillStyle = '#121009';
            context.fillRect(x - width / 2 - 1, barY - 1, width + 2, 8);
            context.fillStyle = unit.owner === 0 ? '#88e460' : '#ff7665';
            context.fillRect(x - width / 2, barY, width * hp, 6);
        }
        if (marker && now - marker.at < 1000) {
            const target = marker.target === undefined ? undefined : positions.get(marker.target), mx = target ? target.x - camera.x : marker.x, my = target ? target.y - camera.y - 30 : marker.y;
            const age = (now - marker.at) / 1000, r = 14 + Math.sin(age * Math.PI * 4) * 4;
            context.globalAlpha = 1 - age * .7;
            context.strokeStyle = marker.attack ? '#ff735f' : '#9feeab';
            context.lineWidth = 3;
            context.beginPath();
            context.arc(mx, my, r, 0, Math.PI * 2);
            context.moveTo(mx - r - 8, my);
            context.lineTo(mx - 5, my);
            context.moveTo(mx + 5, my);
            context.lineTo(mx + r + 8, my);
            context.moveTo(mx, my - r - 8);
            context.lineTo(mx, my - 5);
            context.moveTo(mx, my + 5);
            context.lineTo(mx, my + r + 8);
            context.stroke();
            context.globalAlpha = 1;
        }
        const spellArt = source.goonkCrossoverSpellArt;
        const drawClip = (clip, x, y, age, size = 150) => { const position = Math.min(clip.frames - 1, Math.max(0, age / 950 * (clip.frames - 1))), index = Math.floor(position), mix = position - index; context.globalAlpha = 1 - mix; context.drawImage(clip.canvas, index * 128, 0, 128, 128, x - size / 2, y - size, size, size); if (mix > 0) {
            context.globalAlpha = mix;
            context.drawImage(clip.canvas, Math.min(clip.frames - 1, index + 1) * 128, 0, 128, 128, x - size / 2, y - size, size, size);
        } context.globalAlpha = 1; };
        for (const obstacle of obstacles) {
            const clip = spellArt?.rows.find(c => c.id === 100000 + obstacle.id && c.kind === 'obstacle');
            if (clip)
                for (const tile of obstacle.tiles)
                    drawClip(clip, tile.x, tile.y + 20, (nativeFrame * 42) % 950, 100);
        }
        while (spellEffects.length && now - spellEffects[0].at > 1200)
            spellEffects.shift();
        for (const effect of spellEffects) {
            const age = now - effect.at, actors = [...units, ...corpses.values()], caster = actors.find(u => u.stackId === effect.caster), from = caster ? { x: caster.x - camera.x, y: caster.y - camera.y - 45 } : { x: mirrorBackground ? 750 : 50, y: 280 };
            const targets = actors.filter(u => effect.targets.includes(u.stackId));
            for (const clip of spellArt?.rows.filter(c => c.id === effect.id) || []) {
                if (clip.kind === 'cast')
                    drawClip(clip, from.x, from.y, age);
                else if (clip.kind === 'projectile' && age < 350) {
                    const t = age / 350, to = targets[0] ? { x: targets[0].x - camera.x, y: targets[0].y - camera.y - 30 } : { x: effect.x, y: effect.y };
                    drawClip(clip, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, age * 2, 90);
                }
                else if (clip.kind === 'affect') {
                    for (const target of targets)
                        drawClip(clip, target.x - camera.x, target.y - camera.y + 6, age);
                }
                else if (clip.kind === 'hit')
                    drawClip(clip, effect.x, effect.y + 35, age, [21, 22, 23, 24, 25, 26].includes(effect.id) ? 280 : 170);
            }
        }
        context.setTransform(1, 0, 0, 1, 0, 0);
        canvas.dataset.heroesUnits = String(units.filter(unit => unit.heroes).length);
        canvas.dataset.starcraftUnits = String(units.filter(unit => !unit.heroes).length);
        canvas.dataset.frame = String(nativeFrame);
    };
    const pointer = (event) => {
        const box = canvas.getBoundingClientRect(), transform = view || { zoom: 1, x: 0, y: 0 }, camera = api.camera();
        const x = ((event.clientX - box.left) * 800 / box.width - transform.x) / transform.zoom, y = ((event.clientY - box.top) * 500 / box.height - transform.y) / transform.zoom;
        const targetKind = canvas.dataset.spellTarget;
        const pickUnits = canvas.dataset.spellMode && ['ally', 'teleport', 'sacrifice'].includes(targetKind || '') ? units.filter(u => u.owner === 0) : canvas.dataset.spellMode && targetKind === 'enemy' ? units.filter(u => u.owner === 1) : units;
        const nearby = battlePick(pickUnits, positions, { x, y }, camera, selected !== undefined);
        if (canvas.dataset.spellMode) {
            if (canvas.dataset.spellMode === 'target') {
                const target = nearby || [...corpses.values()].find(u => Math.hypot(x - (u.x - camera.x), y - (u.y - camera.y - 35)) < 45);
                const at = target && targetKind !== 'ground' ? (positions.get(target.id) || target) : undefined;
                canvas.dispatchEvent(new CustomEvent('crossover-spell-target', { detail: { stack: target?.stackId, owner: target?.owner, hp: target?.hp, x: at ? at.x - camera.x : x, y: at ? at.y - camera.y : y } }));
            }
            return;
        }
        if (nearby?.owner === 0) {
            select(nearby.stackId);
            return;
        }
        if (selected === undefined) {
            notifySelection();
            return;
        }
        if (nearby?.owner === 1)
            api.target(selected, nearby.id);
        else
            api.order(selected, Math.max(0, Math.min(799, x)), Math.max(0, Math.min(499, y)), attackMode);
        const attacking = nearby?.owner === 1 || attackMode;
        marker = { x, y, target: nearby?.owner === 1 ? nearby.id : undefined, attack: attacking, at: win.performance.now() };
        canvas.dataset.orderFeedback = attacking ? 'attack' : 'move';
        api.acknowledge?.(attacking ? 'attack' : 'move');
        const name = selected < 0 ? 'Toute l’armée' : plan.stacks.find(row => row.id === selected)?.name || 'Sélection';
        canvas.dispatchEvent(new CustomEvent('crossover-order-issued', { detail: attacking ? name + ' · ordre d’attaque envoyé' + (nearby?.owner === 1 ? ' sur l’ennemi.' : ' vers ce point.') : name + ' · déplacement ordonné.' }));
        attackMode = false;
        canvas.dataset.attackMode = '';
    };
    const notifySelection = () => { const name = selected === undefined ? 'Sélectionne une troupe, puis touche un ennemi pour attaquer.' : selected < 0 ? 'Toute l’armée sélectionnée' : (plan.stacks.find(row => row.id === selected)?.name || 'Troupe') + ' sélectionnés'; canvas.dataset.selection = selected === undefined ? '' : selected < 0 ? 'Toute l’armée' : plan.stacks.find(row => row.id === selected)?.name || ''; canvas.dispatchEvent(new CustomEvent('crossover-selection', { detail: { id: selected, name } })); };
    const select = (id) => { if (id >= 0 && !units.some(unit => unit.stackId === id && unit.owner === 0 && unit.hp > 0))
        return; selected = id; notifySelection(); api.acknowledge?.('select'); };
    const selectAll = () => select(-1);
    const selectGroup = (event) => { const id = event.detail; if (Number.isSafeInteger(id))
        select(id); };
    const mode = (event) => { attackMode = event.detail === 'attack'; canvas.dataset.attackMode = attackMode ? 'armed' : ''; if (attackMode)
        api.acknowledge?.('armed'); };
    const stop = () => { if (selected === undefined)
        return; api.stop(selected); attackMode = false; marker = undefined; canvas.dataset.attackMode = ''; canvas.dataset.orderFeedback = 'stop'; api.acknowledge?.('stop'); canvas.dispatchEvent(new CustomEvent('crossover-order-issued', { detail: 'Ordres annulés. La sélection reste inactive.' })); };
    canvas.addEventListener('crossover-select-all', selectAll);
    canvas.addEventListener('crossover-select-group', selectGroup);
    canvas.addEventListener('crossover-command-mode', mode);
    canvas.addEventListener('crossover-stop-selection', stop);
    canvas.addEventListener('pointerdown', pointer);
    request = win.requestAnimationFrame(draw);
    return () => { canvas.removeEventListener('crossover-obstacles', obstacleChange); canvas.removeEventListener('crossover-native-changed', changed); canvas.removeEventListener("crossover-spell-effect", spellFx); closed = true; win.cancelAnimationFrame(request); canvas.removeEventListener('pointerdown', pointer); canvas.removeEventListener('crossover-select-all', selectAll); canvas.removeEventListener('crossover-select-group', selectGroup); canvas.removeEventListener('crossover-command-mode', mode); canvas.removeEventListener('crossover-stop-selection', stop); };
}
