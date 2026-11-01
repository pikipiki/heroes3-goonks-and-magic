/** Native schema/identity/asset failures must not disappear behind successful gameplay. */
export const isTumNativeError=text=>/(unresolved|unknown identifier|Failed to resolve identifier|Identifier.*does not exist|invalid.*(?:policy|bonus)|fatal error|schema.*error|requested resource.*sound|(?:cannot|failed|missing|not found).*sound|sound.*(?:not found|missing))/i.test(text);
