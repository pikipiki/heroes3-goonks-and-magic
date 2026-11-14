import { RenderClock, SimulationTimeline, interpolatedPosition, attackCycle, heroAnimation } from './animation.js';
// Frame the opening armies once, so the camera stays steady during combat.
export function battleView(units, camera) {
    if (!units.length)
        return { zoom: 1, x: 0, y: 0 };
    const xs = units.map(u => u.x - camera.x), ys = units.map(u => u.y - camera.y);
    const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
    const zoom = Math.min(1.3, 640 / Math.max(1, right - left), 300 / Math.max(1, bottom - top));
    const cx = Math.max(400 / zoom, Math.min(800 - 400 / zoom, (left + right) / 2));
    const cy = Math.max(250 / zoom, Math.min(500 - 250 / zoom, (top + bottom) / 2));
    return { zoom, x: 400 - cx * zoom, y: 250 - cy * zoom };
}
// Enemy targets take precedence over overlapping allies once a troop is selected.
// The tall touch area follows the enlarged bodies rather than only their feet.
export function battlePick(units, positions, point, camera, selected) {
    const distance = (unit) => { const at = positions.get(unit.id) || unit, dx = point.x - (at.x - camera.x), dy = point.y - (at.y - camera.y); return Math.hypot(dx, Math.max(0, -dy - (unit.heroes ? 110 : 115), dy - 10)) + Math.abs(dy) * .15; };
    const candidates = units.filter(unit => distance(unit) < 28).sort((a, b) => distance(a) - distance(b));
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
    let spellEffect;
    const spellFx = (event) => { spellEffect = { ...event.detail, at: win.performance.now() }; };
    canvas.addEventListener("crossover-spell-effect", spellFx);
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
                if (!view && units.length)
                    view = battleView(units, camera);
                const alive = new Set(units.map(unit => unit.id));
                for (const old of oldUnits.values())
                    if (!alive.has(old.id)) {
                        if (old.heroes && !deaths.has(old.id))
                            api.playCreatureSound?.(old.stackId, 'death');
                        deaths.delete(old.id);
                    }
                for (const id of sprites.keys())
                    if (!alive.has(id))
                        sprites.delete(id);
                for (const unit of units) {
                    const old = oldUnits.get(unit.id);
                    if (unit.heroes && (unit.cooldown || 0) > (old?.cooldown || 0))
                        api.playCreatureAttack?.(unit.stackId);
                    const cycle = attackCycle(old, unit, nativeFrame, cycles.get(unit.id));
                    if (cycle)
                        cycles.set(unit.id, cycle);
                    if (old && unit.hp < old.hp) {
                        hits.set(unit.id, now + 220);
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
                        pair.after.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(api.sprite(unit.id)), 96, 96), 0, 0);
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
        if (background)
            context.drawImage(background, 0, 0, 800, 500);
        const transform = view || { zoom: 1, x: 0, y: 0 };
        context.setTransform(transform.zoom, 0, 0, transform.zoom, transform.x, transform.y);
        context.imageSmoothingEnabled = false;
        const art = source.goonkCrossoverArt;
        for (const unit of [...units].sort((a, b) => positions.get(a.id).y - positions.get(b.id).y)) {
            const point = positions.get(unit.id), x = point.x - camera.x, y = point.y - camera.y, old = oldUnits.get(unit.id), moving = !!old && (old.x !== unit.x || old.y !== unit.y);
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
                    const animation = heroAnimation(visualFrame, moving, unit.cooldown || 0, cycles.get(unit.id));
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
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
                marineContext.clearRect(0, 0, 96, 96);
                marineContext.globalAlpha = 1 - amount;
                marineContext.drawImage(pair.before, 0, 0);
                marineContext.globalCompositeOperation = 'lighter';
                marineContext.globalAlpha = amount;
                marineContext.drawImage(pair.after, 0, 0);
                marineContext.globalCompositeOperation = 'source-over';
                context.drawImage(marineBlend, x - 120, y + 5 - 200, 240, 240);
                context.imageSmoothingEnabled = false;
            }
            if ((hits.get(unit.id) || 0) > now) {
                context.strokeStyle = '#fff0be';
                context.lineWidth = 4;
                context.beginPath();
                context.ellipse(x, y - 42, 28, 45, 0, 0, Math.PI * 2);
                context.stroke();
            }
            const width = 22, barY = y - (unit.heroes ? 96 : 76), hp = Math.max(0, Math.min(1, unit.hp / (unit.maxHp || unit.hp)));
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
        const effect = spellEffect;
        if (effect && now - effect.at < 700) {
            const age = (now - effect.at) / 700;
            context.globalAlpha = 1 - age;
            context.fillStyle = '#ffad36';
            context.strokeStyle = '#fff0a1';
            context.lineWidth = 4;
            context.beginPath();
            context.arc(effect.x, effect.y, effect.radius * (.2 + age * .8), 0, Math.PI * 2);
            context.fill();
            context.stroke();
            context.globalAlpha = 1;
        }
        context.setTransform(1, 0, 0, 1, 0, 0);
        canvas.dataset.heroesUnits = String(units.filter(unit => unit.heroes).length);
        canvas.dataset.starcraftUnits = String(units.filter(unit => !unit.heroes).length);
        canvas.dataset.frame = String(nativeFrame);
    };
    const pointer = (event) => {
        const box = canvas.getBoundingClientRect(), transform = view || { zoom: 1, x: 0, y: 0 }, camera = api.camera();
        const x = ((event.clientX - box.left) * 800 / box.width - transform.x) / transform.zoom, y = ((event.clientY - box.top) * 500 / box.height - transform.y) / transform.zoom;
        const nearby = battlePick(units, positions, { x, y }, camera, selected !== undefined);
        if (canvas.dataset.spellMode) {
            if (canvas.dataset.spellMode === 'target') {
                const at = nearby ? (positions.get(nearby.id) || nearby) : undefined;
                canvas.dispatchEvent(new CustomEvent('crossover-spell-target', { detail: { x: at ? at.x - camera.x : x, y: at ? at.y - camera.y : y } }));
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
    const select = (id) => { if (id >= 0 && !plan.stacks.some(row => row.id === id && row.side === 0))
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
    return () => { canvas.removeEventListener("crossover-spell-effect", spellFx); closed = true; win.cancelAnimationFrame(request); canvas.removeEventListener('pointerdown', pointer); canvas.removeEventListener('crossover-select-all', selectAll); canvas.removeEventListener('crossover-select-group', selectGroup); canvas.removeEventListener('crossover-command-mode', mode); canvas.removeEventListener('crossover-stop-selection', stop); };
}
