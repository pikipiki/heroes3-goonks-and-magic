import{renderMarkup}from'./render.mjs';
import{escapeUI}from'./primitives.mjs';
// The display:contents host retains React event ownership while the Accordion
// itself participates in the surrounding game layout.
export function createAccordion({parent,className='',markup='',open=false}){
 const host=document.createElement('div');host.className='ui-accordion-host';host.style.display='contents';
 renderMarkup(host,`<details data-ui-accordion class="${escapeUI(className)}" ${open?'open':''}>${markup}</details>`);
 parent.append(host);return host.firstElementChild;
}
