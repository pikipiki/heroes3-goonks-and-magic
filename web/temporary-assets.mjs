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

async function fetchBinary(url, size, start, end) {
 const ranged = start !== 0 || end !== size;
 const response = await fetch(url, ranged ? {headers: {Range: `bytes=${start}-${end - 1}`}} : {});
 const bytes = new Uint8Array(await response.arrayBuffer());
 if (response.status === 200 && bytes.length === size) return bytes;
 if (response.status === 206 && bytes.length === end - start &&
  response.headers.get('Content-Range') === `bytes ${start}-${end - 1}/${size}`) return bytes;
 throw Error('Fichier du jeu indisponible ou incomplet : ' + new URL(url, location.href).pathname);
}

export function createTemporaryAssetReader({
 read = readBinary, fetchBlock = fetchBinary, maxBytes = 448 * 1024 * 1024, blockBytes = 512 * 1024, onFetch = () => {},
} = {}) {
 const cache = new Map(), downloads = new Map();
 let cachedBytes = 0;
 function cached(key) {
  const bytes = cache.get(key);
  if (bytes) {
   cache.delete(key);
   cache.set(key, bytes);
  }
  return bytes;
 }
 function remember(key, bytes, reserveBytes = null) {
  if (bytes.length > maxBytes) return false;
  // Speculative gameplay downloads must not evict assets the engine is using.
  // Recheck after fetch: demand reads may have filled the cache in the meantime,
  // and a host ignoring Range may have returned a much larger whole archive.
  if(reserveBytes!==null){
   let replaced=cache.get(key)?.length||0;
   if(!key.includes('#'))for(const [part,value]of cache)if(part.startsWith(key+'#'))replaced+=value.length;
   if(cachedBytes-replaced+bytes.length>Math.max(0,maxBytes-reserveBytes))return false;
  }
  // Concurrent prefetches and Range fallbacks can return the same whole pack.
  // Replacing it must not charge its bytes twice or evict unrelated hot data.
  const previous=cache.get(key);
  if(previous){cachedBytes-=previous.length;cache.delete(key);}
  if(!key.includes('#'))for(const [part,value] of cache)if(part.startsWith(key+'#')){cachedBytes-=value.length;cache.delete(part);}
  while (cachedBytes + bytes.length > maxBytes) {
   const [oldKey, oldBytes] = cache.entries().next().value;
   cache.delete(oldKey);
   cachedBytes -= oldBytes.length;
  }
  cache.set(key, bytes);
  cachedBytes += bytes.length;
  return true;
 }
 function source(url, size, start, end) {
  const whole = cached(url);
  if (whole) return whole.subarray(start, end);
  const key = url + '#' + start;
  const block = cached(key);
  if (block) return block;
  const bytes = read(url, size, start, end);
  onFetch(bytes.length);
  if (bytes.length === size) {
   remember(url, bytes);
   return bytes.subarray(start, end);
  }
  if (bytes.length !== end - start) throw Error('Fichier du jeu incomplet.');
  remember(key, bytes);
  return bytes;
 }

 function locate(file, position) {
  const chunk = file.chunks.find(chunk => chunk.offset <= position && position < chunk.offset + chunk.size);
  if (!chunk) throw Error('Archive du jeu incomplète.');
  // Archive indexes and entries are sparse. Other sources are read whole so
  // that nearby small files in the same pack continue to share one request.
  const archive = /^Data\/[^/]+\.(lod|snd)$/i.test(file.path ?? '');
  const url = chunk.url || file.url;
  const size = chunk.packSize || (chunk.url ? chunk.size : file.size);
  const step = archive && size >= 2 * blockBytes ? blockBytes : size;
  const start = (chunk.packOffset ?? (chunk.url ? 0 : chunk.offset)) + position - chunk.offset;
  const count = chunk.offset + chunk.size - position;
  if (start < 0 || start + count > size) throw Error('Archive du jeu incomplète.');
  const blockStart = Math.floor(start / step) * step;
  return {url, size, start, count, blockStart, blockEnd: Math.min(blockStart + step, size), step};
 }

 const reader = (file, target, offset, length, position) => {
  let remaining = Math.max(0, Math.min(length, file.size - position));
  const total = remaining;
  while (remaining) {
   let {url, size, start, count, step} = locate(file, position);
   count = Math.min(remaining, count);
   const end = start + count;
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
  return total;
 };

 // Downloads known startup blocks asynchronously, so the page can repaint and
 // several requests overlap, instead of one synchronous request per block.
 reader.prefetch = async (entries, files, {
  concurrency = 6, reserveBytes = 8 * 1024 * 1024, trackProgress = true, onPlan = () => {},
 } = {}) => {
  const byPath = new Map(files.map(file => [file.path, file]));
  const plan = new Map();
  let planned = 0;
  const budget = Math.max(0, maxBytes - cachedBytes - reserveBytes);
  for (const [path, position] of entries) {
   const file = byPath.get(path);
   if (!file || position >= file.size) continue;
   const block = locate(file, position);
   const length = block.blockEnd - block.blockStart;
   const key = block.url + '#' + block.blockStart;
   if (plan.has(key) || plan.has(block.url) || cache.has(block.url) || cache.has(key)) continue;
   if (planned + length > budget) continue;
   plan.set(length === block.size ? block.url : key, block);
   planned += length;
  }
  onPlan(planned);
  const queue = [...plan.values()];
  let cursor=0;const skipped=new Set();
  const worker = async () => {
   while(cursor<queue.length){
    const block=queue[cursor++];
    const key = block.url + '#' + block.blockStart;
    if (skipped.has(block.url)||cache.has(block.url) || cache.has(key)) continue;
    if (!trackProgress && cachedBytes + (block.blockEnd - block.blockStart) > maxBytes - reserveBytes) break;
    try {
     // Serialize reads from one archive. Hosts that ignore Range return the
     // whole pack, satisfying every queued block without duplicate downloads.
     const previous=downloads.get(block.url)||Promise.resolve();
     const task=previous.catch(()=>{}).then(async()=>{
      if(skipped.has(block.url)||cache.has(block.url)||cache.has(key))return;
      const bytes = await fetchBlock(block.url, block.size, block.blockStart, block.blockEnd);
      if (trackProgress) onFetch(bytes.length);
      if (bytes.length === block.size){
       if(!remember(block.url,bytes,trackProgress?null:reserveBytes))skipped.add(block.url);
      }else if(bytes.length===block.blockEnd-block.blockStart){
       if(!remember(key,bytes,trackProgress?null:reserveBytes))skipped.add(block.url);
      }
     });
     downloads.set(block.url,task);
     try{await task;}finally{if(downloads.get(block.url)===task)downloads.delete(block.url);}
    } catch (error) {
     if (trackProgress) throw error;
    }
   }
  };
  await Promise.all(Array.from({length: Math.min(concurrency, queue.length)}, worker));
 };
 return reader;
}

export function mountTemporaryAssets(module, files, {onFetch} = {}) {
 const read = createTemporaryAssetReader({onFetch});
 const {FS} = module;
 for (const file of files) {
  const path = ROOT + '/' + file.path;
  FS.mkdirTree(path.slice(0, path.lastIndexOf('/')));
  installAssetFile(FS, path, file.size, (buffer, offset, length, position) => read(file, buffer, offset, length, position));
 }
 FS.mkdirTree(ROOT + '/Saves');
 return {prefetch: (entries, options) => read.prefetch(entries, files, options)};
}
