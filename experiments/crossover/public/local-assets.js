/** Player-owned MPQs stay in this browser. No network or server upload. */
export const ARCHIVES = ['stardat.mpq', 'broodat.mpq', 'patch_rt.mpq'];
const DB_NAME = 'heroes-starcraft-local-assets';
const MAX_BYTES = 256 * 1024 * 1024;
export function archiveName(name) {
    const normalized = name.toLowerCase();
    if (!ARCHIVES.includes(normalized))
        throw Error('Archive inconnue : ' + name);
    return normalized;
}
export function validateArchive(bytes) {
    if (bytes.length < 32 || bytes.length > MAX_BYTES)
        throw Error('Taille MPQ invalide.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let p = 0; p <= Math.min(bytes.length - 32, 1024 * 1024); p += 512) {
        if (view.getUint32(p, true) !== 0x1a51504d)
            continue;
        const header = view.getUint32(p + 4, true), size = view.getUint32(p + 8, true), version = view.getUint16(p + 12, true);
        if (version > 1 || header < (version === 1 ? 44 : 32) || header > size || p + size > bytes.length)
            continue;
        const hashEnd = view.getUint32(p + 16, true) + view.getUint32(p + 24, true) * 16;
        const blockEnd = view.getUint32(p + 20, true) + view.getUint32(p + 28, true) * 16;
        if (hashEnd <= size && blockEnd <= size)
            return;
    }
    throw Error('En-tête MPQ invalide ou format non pris en charge.');
}
async function digest(bytes) {
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
}
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('archives', { keyPath: 'name' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(Error('Stockage IndexedDB indisponible.'));
        request.onblocked = () => reject(Error('Ferme les autres onglets StarCraft puis réessaie.'));
    });
}
export async function importArchives(files) {
    if (!files.length || files.length > 3)
        throw Error('Choisis un à trois fichiers MPQ.');
    const names = files.map(file => archiveName(file.name));
    if (new Set(names).size !== names.length)
        throw Error('Archive sélectionnée deux fois.');
    // Validate every file before opening a write transaction; rejected imports preserve old data.
    const records = [];
    for (const [i, file] of files.entries()) {
        if (file.size < 32 || file.size > MAX_BYTES)
            throw Error('Taille MPQ invalide : ' + file.name);
        const bytes = await file.arrayBuffer();
        validateArchive(new Uint8Array(bytes));
        records.push({ name: names[i], bytes, sha256: await digest(bytes) });
    }
    const db = await openDatabase();
    try {
        await new Promise((resolve, reject) => {
            const tx = db.transaction('archives', 'readwrite');
            for (const record of records)
                tx.objectStore('archives').put(record);
            tx.oncomplete = () => resolve();
            tx.onabort = () => reject(Error('Importation non enregistrée : espace insuffisant ou stockage refusé.'));
            tx.onerror = () => { }; // The abort handler is the single error path.
        });
    }
    finally {
        db.close();
    }
}
export async function readArchives() {
    const db = await openDatabase();
    try {
        const records = await new Promise((resolve, reject) => {
            const tx = db.transaction('archives');
            const rows = [];
            ARCHIVES.forEach((name, i) => {
                const request = tx.objectStore('archives').get(name);
                request.onsuccess = () => { rows[i] = request.result; };
            });
            tx.oncomplete = () => resolve(rows);
            tx.onabort = () => reject(Error('Lecture des archives impossible.'));
            tx.onerror = () => { };
        });
        return await Promise.all(ARCHIVES.map(async (name, i) => {
            const row = records[i];
            if (!row)
                return null;
            if (row.name !== name || !(row.bytes instanceof ArrayBuffer) || await digest(row.bytes) !== row.sha256)
                throw Error('Archive altérée : ' + name + '. Réimporte ce fichier.');
            const bytes = new Uint8Array(row.bytes);
            validateArchive(bytes);
            return bytes;
        }));
    }
    finally {
        db.close();
    }
}
export async function loadArchives() {
    const rows = await readArchives();
    const missing = ARCHIVES.filter((_, i) => !rows[i]);
    if (missing.length)
        throw Error('Importe les archives manquantes : ' + missing.join(', '));
    return rows;
}
export async function installArchiveImport() {
    const input = document.querySelector('#archive-files');
    const status = document.querySelector('#archive-status');
    const start = document.querySelector('#start-game');
    const custom = document.querySelector('#map-file');
    async function refresh() {
        const rows = await readArchives();
        const missing = ARCHIVES.filter((_, i) => !rows[i]);
        start.disabled = custom.disabled = missing.length > 0;
        status.textContent = missing.length ? 'À importer : ' + missing.join(', ') : 'Trois archives vérifiées et conservées sur cet appareil.';
    }
    start.disabled = custom.disabled = true;
    try {
        await refresh();
    }
    catch (e) {
        status.textContent = String(e);
    }
    input.addEventListener('change', async () => {
        input.disabled = start.disabled = custom.disabled = true;
        status.textContent = 'Vérification et importation locale…';
        try {
            await importArchives([...input.files]);
            await refresh();
        }
        catch (e) {
            try {
                await refresh();
            }
            catch { }
            status.textContent = String(e);
        }
        finally {
            input.disabled = false;
            input.value = '';
        }
    });
}
