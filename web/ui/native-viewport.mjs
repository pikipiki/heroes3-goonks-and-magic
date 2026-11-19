import {createUIElement} from './material-components.mjs';

// Keep the native canvas, its listeners and coordinate mapping together while a
// Material dialog owns its viewport. Restore it before replacing that dialog.
export function createNativeViewport(native, {className = ''} = {}) {
  let element, anchor;
  return {
    get element() { return element; },
    mount(parent) {
      if (!native || !parent) return;
      if (!anchor) {
        anchor = document.createComment('native-viewport-origin');
        native.before(anchor);
      }
      if (!element || (!element.isConnected && parent.isConnected)) {
        element = createUIElement('div');
        element.classList.add(...className.split(/\s+/).filter(Boolean));
      }
      if (element.parentNode !== parent) parent.append(element);
      if (native.parentNode !== element) element.append(native);
    },
    restore() {
      if (!anchor) return;
      anchor.replaceWith(native);
      anchor = undefined;
      element?.remove();
      element = undefined;
    },
  };
}
