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
// Both engines supply their original art. All positions/HP/orders come from
// OpenBW; this compositor never advances combat or invents an outcome.
export function sharedField(win, canvas, api, plan) {
    const source = win, context = canvas.getContext('2d'), sprite = win.document.createElement('canvas');
    sprite.width = sprite.height = 96;
    canvas.width = 800;
    canvas.height = 500;
    canvas.setAttribute('aria-label', 'Champ de bataille Heroes III : unités Heroes et StarCraft en temps réel');
    const sc = sprite.getContext('2d'), previous = new Map();
    let request = 0, closed = false, last = 0, selected, attackMode = false, units = [], view;
    const draw = (now) => {
        if (closed)
            return;
        request = win.requestAnimationFrame(draw);
        if (now - last < 50)
            return;
        last = now;
        const snapshot = api.census(), camera = api.camera();
        units = snapshot.units.filter(u => u.stackId !== undefined && u.stackId >= 0);
        if (!view && units.length)
            view = battleView(units, camera);
        const background = source.goonkCrossoverBackground?.battleId === plan.battleId ? source.goonkCrossoverBackground.canvas : source.goonkBattlePlanes?.background;
        canvas.dataset.background = background ? "heroes" : "loading";
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.imageSmoothingEnabled = true;
        context.fillStyle = '#40512e';
        context.fillRect(0, 0, 800, 500);
        if (background)
            context.drawImage(background, 0, 0, 800, 500);
        const transform = view || { zoom: 1, x: 0, y: 0 };
        context.setTransform(transform.zoom, 0, 0, transform.zoom, transform.x, transform.y);
        context.imageSmoothingEnabled = false;
        const art = source.goonkCrossoverArt;
        for (const u of [...units].sort((a, b) => a.y - b.y)) {
            const x = u.x - camera.x, y = u.y - camera.y, old = previous.get(u.id), moving = !!old && (old.x !== u.x || old.y !== u.y);
            const chosen = u.owner === 0 && selected !== undefined && (selected < 0 || selected === u.stackId);
            context.strokeStyle = u.owner === 0 ? '#8de6ff' : '#ff8066';
            context.lineWidth = 2;
            if (chosen) {
                context.beginPath();
                context.ellipse(x, y + 5, 23, 8, 0, 0, Math.PI * 2);
                context.stroke();
            }
            if (u.heroes && art?.battleId === plan.battleId) {
                const row = art.rows.find(row => row.id === u.stackId);
                if (row) {
                    const pose = moving ? 1 : (u.cooldown || 0) > 0 ? 2 : 0, frame = Math.floor(snapshot.frame / 3) % 8;
                    context.save();
                    context.translate(x, y + 5);
                    if (units.some(enemy => enemy.owner !== u.owner && enemy.x < u.x))
                        context.scale(-1, 1);
                    context.drawImage(art.canvas, frame * 128, (row.row + pose) * 128, 128, 128, -56, -112, 112, 112);
                    context.restore();
                }
            }
            else if (!u.heroes) {
                // Render one isolated native sprite: enlarging a shared bitmap would also
                // copy and overlap its neighbours. Feet remain on the real unit position.
                sc.putImageData(new ImageData(new Uint8ClampedArray(api.sprite(u.id)), 96, 96), 0, 0);
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
                context.drawImage(sprite, x - 120, y + 5 - 200, 240, 240);
                context.imageSmoothingEnabled = false;
            }
            previous.set(u.id, { x: u.x, y: u.y, moving });
            const width = 22, barY = y - (u.heroes ? 96 : 76), hp = Math.max(0, Math.min(1, u.hp / (u.maxHp || u.hp)));
            context.fillStyle = '#121009';
            context.fillRect(x - width / 2 - 1, barY - 1, width + 2, 8);
            context.fillStyle = u.owner === 0 ? '#88e460' : '#ff7665';
            context.fillRect(x - width / 2, barY, width * hp, 6);
        }
        context.setTransform(1, 0, 0, 1, 0, 0);
        canvas.dataset.heroesUnits = String(units.filter(u => u.heroes).length);
        canvas.dataset.starcraftUnits = String(units.filter(u => !u.heroes).length);
        canvas.dataset.frame = String(snapshot.frame);
    };
    const pointer = (event) => {
        const box = canvas.getBoundingClientRect(), transform = view || { zoom: 1, x: 0, y: 0 }, camera = api.camera();
        const x = ((event.clientX - box.left) * 800 / box.width - transform.x) / transform.zoom, y = ((event.clientY - box.top) * 500 / box.height - transform.y) / transform.zoom;
        // Include the larger visible body above its ground anchor in touch picking.
        const distance = (u) => { const dx = x - (u.x - camera.x), dy = y - (u.y - camera.y); return Math.hypot(dx, Math.max(0, -dy - (u.heroes ? 90 : 65), dy - 10)) + Math.abs(dy) * 0.15; };
        const nearby = units.filter(u => distance(u) < 28).sort((a, b) => distance(a) - distance(b))[0];
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
        canvas.dispatchEvent(new CustomEvent('crossover-order-issued', { detail: nearby?.owner === 1 || attackMode ? 'Ordre d’attaque donné.' : 'Déplacement ordonné.' }));
        attackMode = false;
    };
    const notifySelection = () => { const name = selected === undefined ? 'Sélectionne une troupe pour lui donner un ordre.' : selected < 0 ? 'Toute l’armée sélectionnée' : (plan.stacks.find(row => row.id === selected)?.name || 'Troupe') + ' sélectionnés'; canvas.dataset.selection = selected === undefined ? '' : selected < 0 ? 'Toute l’armée' : plan.stacks.find(row => row.id === selected)?.name || ''; canvas.dispatchEvent(new CustomEvent('crossover-selection', { detail: { id: selected, name } })); };
    const select = (id) => { if (id >= 0 && !plan.stacks.some(row => row.id === id && row.side === 0))
        return; selected = id; notifySelection(); };
    const selectAll = () => select(-1);
    const selectGroup = (event) => { const id = event.detail; if (Number.isSafeInteger(id))
        select(id); };
    const mode = (event) => { attackMode = event.detail === 'attack'; };
    const stop = () => { if (selected === undefined)
        return; api.stop(selected); attackMode = false; canvas.dispatchEvent(new CustomEvent('crossover-order-issued', { detail: 'Ordres annulés. La sélection reste inactive.' })); };
    canvas.addEventListener('crossover-select-all', selectAll);
    canvas.addEventListener('crossover-select-group', selectGroup);
    canvas.addEventListener('crossover-command-mode', mode);
    canvas.addEventListener('crossover-stop-selection', stop);
    canvas.addEventListener('pointerdown', pointer);
    request = win.requestAnimationFrame(draw);
    return () => { closed = true; win.cancelAnimationFrame(request); canvas.removeEventListener('pointerdown', pointer); canvas.removeEventListener('crossover-select-all', selectAll); canvas.removeEventListener('crossover-select-group', selectGroup); canvas.removeEventListener('crossover-command-mode', mode); canvas.removeEventListener('crossover-stop-selection', stop); };
}
