const boundaries = new WeakMap();
const managers = new WeakMap();
const visible = root => root.isConnected && !root.hidden && !root.closest('[hidden]')
 && (!root.getClientRects || root.getClientRects().length > 0)
 && root.ownerDocument.defaultView.getComputedStyle(root).visibility !== 'hidden';
const available = node => node?.isConnected && !node.disabled && !node.closest('[hidden],[inert]')
 && (!node.getClientRects || node.getClientRects().length > 0);
function controls(root) {
 return [...root.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(available);
}
function reconcile(manager) {
 const previous = manager.top;
 const count = manager.stack.length;
 manager.stack = manager.stack.filter(record => {
  if (record.root.getAttribute('aria-modal') === 'true' && visible(record.root)) return true;
  record.open = false;
  return false;
 });
 const top = manager.stack.at(-1);
 manager.top = top;
 // MUI selects can open their own portal while the native dialog stays open.
 // Leave those temporary overlays to MUI until our dialog stack changes.
 if (previous === top && count === manager.stack.length) return;
 const desired = new Map();
 if (top) {
  // Keep the entire path to the top dialog usable. For a nested dialog this
  // includes its parent dialog, whose other content is isolated separately.
  for (let current = top.root; current; current = current.parentElement) {
   desired.set(current, false);
   if (current.parentElement)
    for (const sibling of current.parentElement.children)
     if (sibling !== current) desired.set(sibling, true);
  }
 }
 for (const [node, original] of manager.background) if (!desired.has(node)) {
  if (node.inert !== original) node.inert = original;
  manager.background.delete(node);
 }
 for (const [node, inert] of desired) {
  if (!manager.background.has(node)) manager.background.set(node, node.inert);
  if (node.inert !== inert) node.inert = inert;
 }
 if (previous !== top) {
  const restore = top && previous?.previous && top.root.contains(previous.previous) ? previous.previous : null;
  const target = top ? (available(restore) ? restore : controls(top.root)[0]) : manager.previous;
  if (available(target)) target.focus({preventScroll:true});
  if (!top) manager.previous = null;
 }
}
// Native protocol panels retain their DOM and commands. All boundaries share
// one stack so sibling or nested dialogs cannot make one another inert.
export function useModalBoundary(root) {
 let record = boundaries.get(root);
 if (root.getAttribute('aria-modal') !== 'true' && !record) return;
 const doc = root.ownerDocument;
 let manager = managers.get(doc);
 if (!manager) {
  manager = {stack:[], background:new Map(), top:null, previous:null};
  managers.set(doc, manager);
 }
 if (!record) {
  record = {root, open:false, previous:null};
  boundaries.set(root, record);
  root.addEventListener('keydown', event => {
   if (event.key !== 'Tab' || manager.top !== record) return;
   const items = controls(root), first = items[0], last = items.at(-1);
   if (!first) {event.preventDefault();return;}
   if (event.shiftKey && (doc.activeElement === first || !root.contains(doc.activeElement))) {
    event.preventDefault();last.focus();
   } else if (!event.shiftKey && (doc.activeElement === last || !root.contains(doc.activeElement))) {
    event.preventDefault();first.focus();
   }
  });
 }
 const open = root.getAttribute('aria-modal') === 'true' && visible(root);
 if (open && !record.open) {
  if (!manager.stack.length) manager.previous = doc.activeElement;
  record.previous = doc.activeElement;
  record.open = true;
  manager.stack.push(record);
 } else if (!open) record.open = false;
 reconcile(manager);
}
