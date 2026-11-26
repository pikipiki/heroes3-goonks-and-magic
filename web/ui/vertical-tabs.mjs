import {escapeUI} from './primitives.mjs';

// Reusable markup factory for Material UI vertical tabs with side indicator.
// Consumed by renderMarkup / NativeTabs in src/ui/runtime.mjs.
export function verticalTabsMarkup({
  className = '',
  label = '',
  items = [],
  landscapeOnly = false,
  indicatorSide = 'left'
} = {}) {
  const classes = ['ui-vertical-tabs', className].filter(Boolean).join(' ');
  const modeAttr = landscapeOnly ? 'data-ui-tabs-landscape' : 'data-ui-tabs-vertical';
  const buttons = items
    .map(
      (item) =>
        `<button type="button" ${item.attributes || ''} aria-pressed="${Boolean(item.selected)}">${item.html ?? escapeUI(item.label ?? '')}</button>`
    )
    .join('');
  return `<nav class="${escapeUI(classes)}" data-ui-tabs ${modeAttr} data-indicator-side="${escapeUI(indicatorSide)}" aria-label="${escapeUI(label)}">${buttons}</nav>`;
}
