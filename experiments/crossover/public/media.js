export function waitForBattleArt(win, battleId, signal, onProgress = () => { }) {
    return new Promise((resolve, reject) => {
        let timer;
        const cleanup = () => { if (timer !== undefined)
            win.clearTimeout(timer); win.removeEventListener('goonk-crossover-art', check); signal.removeEventListener('abort', abort); };
        const abort = () => { cleanup(); reject(Error('Préparation du combat annulée.')); };
        const check = () => { const art = win.goonkCrossoverArt; if (art?.battleId !== battleId)
            return; onProgress(art.rows.length, art.expected); if (art.ready) {
            cleanup();
            resolve();
        } };
        if (signal.aborted) {
            abort();
            return;
        }
        win.addEventListener('goonk-crossover-art', check);
        signal.addEventListener('abort', abort, { once: true });
        timer = win.setTimeout(() => { cleanup(); reject(Error('Les animations du combat ne sont pas prêtes. Reviens en classique pour réessayer.')); }, 30000);
        check();
    });
}
