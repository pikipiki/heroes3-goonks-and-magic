import {ROOT} from './asset-cache.mjs';
import {installAssetFile} from './lazy-assets.mjs';

function readBinary(url, size, start, end) {
 const ranged = start !== 0 || end !== size;
 const request = (from, partial = ranged) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.overrideMimeType('text/plain; charset=x-user-defined');
  if (partial) xhr.setRequestHeader('Range', `bytes=${from}-${end - 1}`);
  xhr.send();
  return xhr;
 };
 const isPartial = (xhr, from) => xhr.status === 206 &&
  xhr.getResponseHeader('Content-Range') === `bytes ${from}-${end - 1}/${size}`;
 let from = start;
 let xhr = request(from);
 // A slice can start with a BOM, which overrides the byte-preserving charset.
 // Shift by one byte and skip the prefix if the browser decoded it as text.
 if (start && isPartial(xhr, from) && xhr.responseText.length !== end - from) {
  xhr = request(--from);
  if (isPartial(xhr, from) && xhr.responseText.length !== end - from) xhr = request(0, false);
 }
 let skip, length;
 if (xhr.status === 200) {
  skip = 0;
  length = size;
 } else if (isPartial(xhr, from)) {
  skip = start - from;
  length = end - start;
 }
 const responseLength = length === size ? size : end - from;
 if (length === undefined || xhr.responseText.length !== responseLength)
  throw Error('Fichier du jeu indisponible ou incomplet : ' + new URL(url).pathname);
 const text = xhr.responseText;
 const bytes = new Uint8Array(length);
 for (let index = 0; index < length; index++) bytes[index] = text.charCodeAt(skip + index) & 255;
 return bytes;
}

export function createTemporaryAssetReader({
 read = readBinary, maxBytes = 32 * 1024 * 1024, blockBytes = 512 * 1024,
} = {}) {
 const cache = new Map();
 let cachedBytes = 0;
 function cached(key) {
  const bytes = cache.get(key);
  if (bytes) {
   cache.delete(key);
   cache.set(key, bytes);
  }
  return bytes;
 }
 function remember(key, bytes) {
  if (bytes.length > maxBytes) return;
  while (cachedBytes + bytes.length > maxBytes) {
   const [oldKey, oldBytes] = cache.entries().next().value;
   cache.delete(oldKey);
   cachedBytes -= oldBytes.length;
  }
  cache.set(key, bytes);
  cachedBytes += bytes.length;
 }
 function source(url, size, start, end) {
  const whole = cached(url);
  if (whole) return whole.subarray(start, end);
  const key = url + '#' + start;
  const block = cached(key);
  if (block) return block;
  const bytes = read(url, size, start, end);
  if (bytes.length === size) {
   remember(url, bytes);
   return bytes.subarray(start, end);
  }
  if (bytes.length !== end - start) throw Error('Fichier du jeu incomplet.');
  remember(key, bytes);
  return bytes;
 }

 return (file, target, offset, length, position) => {
  let remaining = Math.max(0, Math.min(length, file.size - position));
  const total = remaining;
  // Archive indexes and entries are sparse. Other sources are read whole so
  // that nearby small files in the same pack continue to share one request.
  const archive = /^Data\/[^/]+\.(lod|snd)$/i.test(file.path ?? '');
  for (const chunk of file.chunks) {
   if (!remaining) break;
   if (chunk.offset + chunk.size <= position) continue;
   if (chunk.offset > position) throw Error('Archive du jeu incomplète.');
   const url = chunk.url || file.url;
   const size = chunk.packSize || (chunk.url ? chunk.size : file.size);
   const step = archive && size >= 2 * blockBytes ? blockBytes : size;
   let start = (chunk.packOffset ?? (chunk.url ? 0 : chunk.offset)) + position - chunk.offset;
   const count = Math.min(remaining, chunk.offset + chunk.size - position);
   const end = start + count;
   if (start < 0 || end > size) throw Error('Archive du jeu incomplète.');
   while (start < end) {
    const blockStart = Math.floor(start / step) * step;
    const blockEnd = Math.min(blockStart + step, size);
    const bytes = source(url, size, blockStart, blockEnd);
    const next = Math.min(end, blockEnd);
    target.set(bytes.subarray(start - blockStart, next - blockStart), offset);
    offset += next - start;
    start = next;
   }
   position += count;
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
