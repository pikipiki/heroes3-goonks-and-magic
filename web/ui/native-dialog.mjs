const dialogs = new WeakMap();

// Keep the legacy dialog API and events while MUI owns modality, focus and
// backdrop. Calling the browser's showModal would create a second modal stack.
export function installNativeDialog(root, boundary) {
 if (root.tagName !== 'DIALOG') return null;
 const existing = dialogs.get(root);
 if (existing) {
  existing.boundary = boundary;
  return existing.api;
 }
 const previous = new Map(['show', 'showModal', 'close'].map(name => [name, Object.getOwnPropertyDescriptor(root, name)]));
 const record = {boundary};
 const show = () => {
  if (!root.isConnected) {
   const Exception = root.ownerDocument.defaultView.DOMException;
   throw new Exception('The dialog is not connected to a document.', 'InvalidStateError');
  }
  root.setAttribute('open', '');
  record.boundary.setOpen(true);
 };
 const close = value => {
  if (!root.open) return;
  if (value !== undefined) root.returnValue = String(value);
  root.removeAttribute('open');
  record.boundary.setOpen(false);
  // Native close listeners run after the initiating action. Preserve that
  // ordering, including cleanup listeners on dialogs removed in the meantime.
  queueMicrotask(() => root.dispatchEvent(new root.ownerDocument.defaultView.Event('close')));
 };
 for (const [name, value] of [['show', show], ['showModal', show], ['close', close]])
  Object.defineProperty(root, name, {configurable:true, writable:true, value});
 record.api = {dispose() {
  if (dialogs.get(root) !== record) return;
  for (const [name, descriptor] of previous) {
   if (descriptor) Object.defineProperty(root, name, descriptor);
   else delete root[name];
  }
  dialogs.delete(root);
 }};
 dialogs.set(root, record);
 return record.api;
}
