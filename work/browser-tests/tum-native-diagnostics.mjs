/** Native schema/identity/asset failures must not disappear behind successful gameplay. */
export const isTumNativeError=text=>/\]\s*(?:ERROR|FATAL)\b|(unresolved|unknown identifier|Failed to resolve identifier|Identifier.*does not exist|invalid.*(?:policy|bonus)|fatal error|schema.*error|requested resource.*sound|(?:cannot|failed|missing|not found).*sound|sound.*(?:not found|missing))/i.test(text);

/** Continuation lines inherit their logger entry's severity, including schema Error: details under WARN. */
export function parseTumNativeLog(text){
 const entries=[];
 for(const line of String(text).split(/\r?\n/)){
  const match=/^\[[^\]]+\]\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\b/.exec(line);
  if(match)entries.push({level:match[1],text:line});
  else if(entries.length)entries.at(-1).text+='\n'+line;
  else if(line.trim())entries.push({level:'UNSCOPED',text:line});
 }
 return entries;
}
