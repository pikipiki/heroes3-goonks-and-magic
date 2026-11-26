import {escapeUI} from './primitives.mjs';

// Reusable markup factory for Material UI Split Button (ButtonGroup + Menu).
// Consumed by renderMarkup / NativeSplitButton in src/ui/runtime.mjs.
export function splitButtonMarkup({
  className = '',
  confirmHtml = '',
  confirmAttributes = '',
  selectAttributes = '',
  menuLabel = 'Choose option',
  options = [],
  disabled = false
} = {}) {
  const classes = ['ui-split-button', className].filter(Boolean).join(' ');
  const optionMarkup = options
    .map(
      (opt) =>
        `<option value="${escapeUI(opt.value ?? '')}" ${opt.selected ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''}>${escapeUI(opt.label ?? '')}</option>`
    )
    .join('');
  return `<div class="${escapeUI(classes)}" data-ui-split-button data-menu-label="${escapeUI(menuLabel)}"><button type="button" class="primary" ${confirmAttributes} ${disabled ? 'disabled' : ''}>${confirmHtml}</button><select ${selectAttributes}>${optionMarkup}</select></div>`;
}
