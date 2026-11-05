import {getLanguage} from './i18n.mjs';

export function createOnlineLogin(root, command) {
  const panel = document.createElement('section');
  panel.className = 'online-login';
  panel.hidden = true;
  panel.innerHTML = `<form><header><h2>Online</h2><button type="button" data-close aria-label="Back">✕</button></header>
    <label><span></span><input name="nickname" type="text" autocomplete="nickname" minlength="4" maxlength="20" pattern="[A-Za-z0-9]+"></label>
    <button type="submit" class="primary"></button><p role="status" aria-live="polite"></p></form>`;
  root.querySelector('.mobile-play').append(panel);
  const form = panel.querySelector('form');
  const input = form.elements.nickname;
  const label = panel.querySelector('label');
  const submit = panel.querySelector('[type=submit]');
  const close = panel.querySelector('[data-close]');
  const status = panel.querySelector('[role=status]');
  let state = {}, submitting = false;

  function render() {
    const french = getLanguage() === 'fr';
    const pending = submitting || state.onlinePending;
    label.hidden = Boolean(state.onlineHasAccount);
    label.querySelector('span').textContent = french ? 'Nom de joueur' : 'Player name';
    input.required = !label.hidden;
    input.disabled = pending;
    close.disabled = pending;
    submit.disabled = pending;
    submit.textContent = pending ? (french ? 'Connexion…' : 'Connecting…') : (french ? 'Se connecter' : 'Connect');
    submit.setAttribute('aria-busy', String(Boolean(pending)));
    status.textContent = state.onlineStatus || '';
  }
  close.addEventListener('click', () => command(76));
  form.addEventListener('keydown', event => event.stopPropagation());
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (panel.hidden || submitting || state.onlinePending) return;
    const name = state.onlineHasAccount ? '' : input.value.trim();
    if (!state.onlineHasAccount && !/^[A-Za-z0-9]{4,20}$/u.test(name)) return;
    const bytes = new TextEncoder().encode(name);
    const module = window.Module;
    if (bytes.length > 80 || !module?._vcmiOnlineLogin) return;
    const pointer = module._malloc(bytes.length + 1);
    if (!pointer) return;
    submitting = true;
    try {
      module.HEAPU8.set(bytes, pointer);
      module._vcmiOnlineLogin(pointer, bytes.length);
    } finally {
      module._free(pointer);
    }
    render();
    setTimeout(() => {
      submitting = false;
      if (!panel.hidden) render();
    }, 1200);
  });
  window.addEventListener('goonk-language', () => {if (!panel.hidden) render();});
  return {
    get active() { return !panel.hidden; },
    update(next) {
      if (next.mode !== 'online-login') submitting = false;
      state = next;
      panel.hidden = state.mode !== 'online-login';
      if (!panel.hidden) render();
    },
  };
}
