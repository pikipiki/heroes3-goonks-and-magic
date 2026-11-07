import {ROOT} from './asset-cache.mjs';
import {installAssetFile} from './lazy-assets.mjs';

function readBinary(url, size) {
 const request = new XMLHttpRequest();
 request.open('GET', url, false);
 request.overrideMimeType('text/plain; charset=x-user-defined');
 request.send();
 if (request.status !== 200 || request.responseText.length !== size)
  throw Error('Fichier du jeu indisponible ou incomplet : ' + new URL(url).pathname);
 const text = request.responseText;
 const bytes = new Uint8Array(size);
 for (let index = 0; index < size; index++) bytes[index] = text.charCodeAt(index) & 255;
 return bytes;
}

export function createTemporaryAssetReader({read = readBinary, maxBytes = 32 * 1024 * 1024} = {}) {
 const cache = new Map();
 let cachedBytes = 0;
 const source = (url, size) => {
  if (cache.has(url)) {
   const bytes = cache.get(url);
   cache.delete(url);
   cache.set(url, bytes);
   return bytes;
  }
  const bytes = read(url, size);
  if (bytes.length !== size) throw Error('Fichier du jeu incomplet.');
  if (size <= maxBytes) {
   while (cachedBytes + size > maxBytes) {
    const [oldUrl, oldBytes] = cache.entries().next().value;
    cache.delete(oldUrl);
    cachedBytes -= oldBytes.length;
   }
   cache.set(url, bytes);
   cachedBytes += size;
  }
  return bytes;
 };

 return (file, target, offset, length, position) => {
  let remaining = Math.max(0, Math.min(length, file.size - position));
  const total = remaining;
  for (const chunk of file.chunks) {
   if (!remaining) break;
   if (chunk.offset + chunk.size <= position) continue;
   if (chunk.offset > position) throw Error('Archive du jeu incomplète.');
   const bytes = source(chunk.url || file.url, chunk.packSize || (chunk.url ? chunk.size : file.size));
   const start = (chunk.packOffset ?? (chunk.url ? 0 : chunk.offset)) + position - chunk.offset;
   const count = Math.min(remaining, chunk.offset + chunk.size - position);
   if (start < 0 || start + count > bytes.length) throw Error('Archive du jeu incomplète.');
   target.set(bytes.subarray(start, start + count), offset);
   position += count;
   offset += count;
   remaining -= count;
  }
  if (remaining) throw Error('Archive du jeu incomplète.');
  return total;
 };
}

export function mountTemporaryAssets(module, files) {
 const read = createTemporaryAssetReader();
 const {FS} = module;
 for (const file of files) {
  const path = ROOT + '/' + file.path;
  FS.mkdirTree(path.slice(0, path.lastIndexOf('/')));
  installAssetFile(FS, path, file.size, (buffer, offset, length, position) => read(file, buffer, offset, length, position));
 }
 FS.mkdirTree(ROOT + '/Saves');
}
