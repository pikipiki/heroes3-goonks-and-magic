const boundaries = new WeakMap();
// Native protocol panels retain their DOM and commands. This shared boundary
// gives them the same keyboard and background isolation as library dialogs.
export function useModalBoundary(root) {
 if (root.getAttribute('aria-modal') !== 'true') return;
 let record = boundaries.get(root);
 const open = root.isConnected && !root.hidden && !root.closest('[hidden]');
 if (!record) {
  record = {open:false, background:[], previous:null};
  boundaries.set(root, record);
  root.addEventListener('keydown', event => {
   if (event.key !== 'Tab' || !record.open) return;
   const controls = [...root.querySelectorAll('button,input,select,textarea,[tabindex="0"]')]
    .filter(node => !node.disabled && node.getClientRects().length && !node.closest('[hidden],[inert]'));
   const first = controls[0], last = controls.at(-1);
   if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
   else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
  });
 }
 if (open === record.open) return;
 record.open = open;
 if (open) {
  record.previous = document.activeElement;
  for (let current=root; current.parentElement && current.parentElement!==document.documentElement; current=current.parentElement)
   for (const sibling of current.parentElement.children) if (sibling!==current && !sibling.inert) {sibling.inert=true;record.background.push(sibling);}
  root.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
 } else {
  for (const sibling of record.background) sibling.inert=false;
  record.background=[];
  if (record.previous?.isConnected) record.previous.focus({preventScroll:true});
 }
}
