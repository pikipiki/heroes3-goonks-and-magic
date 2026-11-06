const cyrillicDecoder = new TextDecoder('windows-1251');

export function scenarioTitle(title = '') {
  // Some legacy maps store Russian titles in Windows-1251 without marking
  // the encoding. The engine exposes those bytes as Latin-1 characters.
  if (/[\u0400-\u04ff]/.test(title) || !/[\u00c0-\u00ff]{5}/.test(title)) return title;
  return title.replace(/[\u00c0-\u00ff]+/g, word =>
    cyrillicDecoder.decode(Uint8Array.from(word, letter => letter.charCodeAt(0))));
}
