/** Audited MPQs download from this site and stay in this browser. No upload. */
export const ARCHIVES = ['stardat.mpq', 'broodat.mpq', 'patch_rt.mpq'];
// Never reuse the previous scmJS-era browser cache.
const DB_NAME = 'heroes-starcraft-audited-assets-v2';
const MAX_BYTES = 256 * 1024 * 1024;
const MANIFEST_URL = new URL('./starcraft/data/manifest.json', import.meta.url);
let manifestPromise;
export function hostedManifest() {
    return manifestPromise ??= (async () => {
        const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
        if (response.status === 404)
            return null; // Source-only development checkout.
        if (!response.ok)
            throw Error('Manifeste StarCraft indisponible.');
        const body = await response.json();
        if (body.version !== 1 || !Array.isArray(body.archives) || body.archives.length !== 3)
            throw Error('Manifeste StarCraft invalide.');
        const rows = body.archives;
        for (const [i, row] of rows.entries()) {
            if (row.name !== ARCHIVES[i] || !Number.isSafeInteger(row.size) || row.size < 32 || row.size > MAX_BYTES || !/^[a-f0-9]{64}$/.test(row.sha256) || !Array.isArray(row.chunks) || !row.chunks.length)
                throw Error('Archive publiée invalide.');
            let size = 0;
            for (const chunk of row.chunks) {
                if (!/^chunks\/[a-f0-9]{64}\.bin$/.test(chunk.url) || !/^[a-f0-9]{64}$/.test(chunk.sha256) || !Number.isSafeInteger(chunk.size) || chunk.size < 1 || chunk.size > 4 * 1024 * 1024)
                    throw Error('Morceau publié invalide.');
                size += chunk.size;
            }
            if (size !== row.size)
                throw Error('Taille publiée incohérente.');
        }
        return rows;
    })();
}
export async function downloadArchives(progress) {
    const manifest = await hostedManifest();
    if (!manifest)
        return;
    const cached = await readArchives();
    const files = [];
    for (const [i, row] of manifest.entries()) {
        if (cached[i])
            continue;
        const bytes = new Uint8Array(row.size);
        let offset = 0;
        for (const chunk of row.chunks) {
            progress('Téléchargement de ' + row.name + ' : ' + Math.round(offset / row.size * 100) + ' %');
            const response = await fetch(new URL(chunk.url, MANIFEST_URL), { credentials: 'omit' });
            if (!response.ok)
                throw Error('Téléchargement interrompu : ' + row.name + '. Recharge pour réessayer.');
            const part = await response.arrayBuffer();
            if (part.byteLength !== chunk.size || await digest(part) !== chunk.sha256)
                throw Error('Morceau altéré : ' + row.name);
            bytes.set(new Uint8Array(part), offset);
            offset += part.byteLength;
        }
        if (await digest(bytes.buffer) !== row.sha256)
            throw Error('Archive téléchargée altérée : ' + row.name);
        files.push(new File([bytes], row.name));
    }
    if (files.length)
        await importArchives(files);
}
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
    // App-owned legacy database only; do not touch Heroes saves or other browser data.
    indexedDB.deleteDatabase('heroes-starcraft-local-assets');
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
    const manifest = await hostedManifest();
    for (const [i, file] of files.entries()) {
        if (file.size < 32 || file.size > MAX_BYTES)
            throw Error('Taille MPQ invalide : ' + file.name);
        const bytes = await file.arrayBuffer();
        validateArchive(new Uint8Array(bytes));
        const sha256 = await digest(bytes);
        const expected = manifest?.find(row => row.name === names[i]);
        if (expected && (expected.size !== bytes.byteLength || expected.sha256 !== sha256))
            throw Error('Ce fichier ne correspond pas à la source vérifiée : ' + names[i]);
        records.push({ name: names[i], bytes, sha256 });
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
    const manifest = await hostedManifest();
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
            if (!(row.bytes instanceof ArrayBuffer))
                throw Error('Stockage MPQ invalide : ' + name);
            const expected = manifest?.[i];
            if (expected && (row.sha256 !== expected.sha256 || row.bytes.byteLength !== expected.size))
                return null;
            if (row.name !== name || await digest(row.bytes) !== row.sha256)
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
        throw Error('Données manquantes : ' + missing.join(', ') + '. Recharge pour télécharger les archives vérifiées.');
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
        if (await hostedManifest()) {
            input.hidden = true;
            document.querySelector('label[for="archive-files"]').textContent = 'Données StarCraft vérifiées — téléchargement automatique';
            await downloadArchives(text => { status.textContent = text; });
        }
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
