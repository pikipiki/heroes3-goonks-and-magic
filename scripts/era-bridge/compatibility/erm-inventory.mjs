import crypto from 'node:crypto';

export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

/** Inventory only: never executes ERM. Positions distinguish repeated triggers.
 * Commands start a line or immediately follow another command. Caret strings
 * may contain semicolons, newlines and fake commands; comments are not code.
 */
export function inventoryErm(text, file) {
  const bytes = Buffer.isBuffer(text) ? text : Buffer.from(text);
  // ERM packs mix UTF-8 and legacy encodings. Scan byte-for-byte so an invalid
  // UTF-8 character cannot make two different source blocks hash identically.
  text = bytes.toString('latin1');
  const rawHash = value => sha256(Buffer.from(value,'latin1'));
  const display = value => Buffer.from(value,'latin1').toString('utf8');
  const tokens = [], diagnostics = [];
  let offset = 0, line = 1, eligible = true;
  if(bytes.subarray(0,3).equals(Buffer.from([0xef,0xbb,0xbf]))) offset=3;
  while (offset < text.length) {
    const c = text[offset];
    if (c === '\n') { line++; offset++; eligible = true; continue; }
    if (eligible && /[\t\r \uFEFF]/.test(c)) { offset++; continue; }
    if (!eligible || !/^![!?#$]/.test(text.slice(offset, offset + 2))) {
      eligible = false; offset++; continue;
    }
    const start = offset, startLine = line, kind = text[offset + 1];
    let quoted = false, terminated = false;
    offset += 2;
    while (offset < text.length) {
      const ch = text[offset++];
      if (ch === '\n') line++;
      if (ch === '^') quoted = !quoted;
      if (ch === ';' && !quoted) { terminated = true; break; }
    }
    const statement = text.slice(start, offset);
    if (!terminated) diagnostics.push({file, line:startLine, code:'unterminated-command'});
    tokens.push({kind, line:startLine, endLine:line, offset:start, endOffset:offset,
      statement, sha256:rawHash(statement)});
    eligible = terminated;
  }
  const triggers = tokens.filter(t => t.kind === '?' || t.kind === '$');
  const sections = [];
  if (!triggers.length || tokens.some(t => t.offset < triggers[0].offset)) {
    sections.push({line:1, offset:0, statement:'<initialization>', kind:'initialization'});
  }
  sections.push(...triggers.map(t => ({...t, kind:t.kind === '$' ? 'post-trigger' : 'trigger'})));
  const events = sections.map((trigger, i) => {
    const endOffset = sections[i + 1]?.offset ?? text.length;
    const own = tokens.filter(t => t.offset >= trigger.offset && t.offset < endOffset);
    const commands = own.filter(t => t.kind !== '?' && t.kind !== '$');
    const receivers = {};
    for (const command of commands) {
      const receiver = command.statement.slice(2).match(/^[A-Za-z]{2}/)?.[0] ?? '?';
      receivers[receiver] = (receivers[receiver] ?? 0) + 1;
    }
    const code = own.map(t => t.statement).join('\n');
    const maskedCode = own.map(t => t.statement.replace(/\^[^^]*\^/gs,'<string>')).join('\n');
    const calls = [...new Set(commands.flatMap(t => [...t.statement.replace(/\^[^^]*\^/gs,'<string>').matchAll(/!!FU\(([^)]+)\)/g)].map(m => m[1])))].sort();
    return {id:`erm:${file}:${trigger.kind}:${trigger.line}`, source:{file, line:trigger.line,
      endLine:sections[i + 1] ? sections[i + 1].line - 1 : text.split('\n').length,
      trigger:display(trigger.statement), triggerSha256:rawHash(trigger.statement),
      codeSha256:rawHash(code), blockSha256:rawHash(text.slice(trigger.offset, endOffset))},
      kind:trigger.kind, commandCount:commands.length, receivers, calls,
      platformDependencies:[...(/!!UN[^;]*:C/.test(maskedCode)?['windows-memory']:[]),
        ...(/!!SN[^;]*:[EK]/.test(maskedCode)?['native-call-or-memory-copy']:[])]};
  });
  return {file, sha256:sha256(bytes), triggerCount:triggers.filter(t=>t.kind==='?').length, postTriggerCount:triggers.filter(t=>t.kind==='$').length,
    tokenCount:tokens.length, events, diagnostics};
}

/** Evidence must bind exact source code, not a function-name coincidence. */
export function bindEvents(events, bindings, resolveFile) {
  const rows = events.map(event => ({...event, status:'unassessed', bindings:[]}));
  for (const binding of bindings) {
    const row = rows.find(e => e.source.file === binding.file && e.source.line === binding.line);
    if (!row || row.source.codeSha256 !== binding.codeSha256)
      throw Error(`Stale source binding: ${binding.id}`);
    if (!['partial','implemented-unverified','validated'].includes(binding.status))
      throw Error(`Invalid coverage status: ${binding.id}`);
    if (!binding.scope || !binding.implementation?.length)
      throw Error(`Missing implementation scope: ${binding.id}`);
    const implementation = binding.implementation.map(resolveFile);
    const evidence = (binding.evidence ?? []).map(resolveFile);
    if (binding.status === 'validated' && (!evidence.length || !binding.wholeEventReviewed))
      throw Error(`Whole-event validation missing: ${binding.id}`);
    row.bindings.push({...binding, implementation, evidence});
    // Two partial mappings do not establish complete event coverage.
    if (binding.status === 'validated' || row.status === 'unassessed') row.status = binding.status;
  }
  return rows;
}
