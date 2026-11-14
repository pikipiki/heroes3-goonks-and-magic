import {getLanguage} from './i18n.mjs';

export function guardOnlineNameKeyboard(window) {
  // Register before SDL so its capture listeners cannot cancel native text input.
  const intercept = event => {
    if (window.document.activeElement?.matches('.online-login:not([hidden]) input[data-online-name], .online-lobby:not([hidden]) input[data-online-player-search], #game-menu[open] input[data-hosted-seat-code], .dialog-presentation:not([hidden]) .campaign-dialog-form input')) {
      event.stopImmediatePropagation();
    }
  };
  for (const type of ['keydown', 'keypress', 'keyup']) {
    window.addEventListener(type, intercept, {capture: true});
  }
}

export function createOnlineLogin(root, command) {
  const panel = document.createElement('section');
  panel.className = 'online-login';
  panel.hidden = true;
  panel.innerHTML = `<form><header><h2>Multijoueur sur l’appareil de l’hôte</h2><button type="button" data-close aria-label="Back">✕</button></header>
    <p>L’hôte doit garder le jeu ouvert pendant la partie.</p>
    <label><span></span><input name="player-name" data-online-name type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" aria-describedby="online-name-help" minlength="4" maxlength="20" pattern="[A-Za-z0-9]+"><small id="online-name-help"></small></label>
    <button type="submit" class="primary"></button><p role="status" aria-live="polite"></p></form>`;
  root.querySelector('.mobile-play').append(panel);
  const form = panel.querySelector('form');
  const input = form.querySelector('[data-online-name]');
  const label = panel.querySelector('label');
  const caption = label.querySelector('span');
  const help = label.querySelector('small');
  const submit = panel.querySelector('[type=submit]');
  const close = panel.querySelector('[data-close]');
  const status = panel.querySelector('[role=status]');
  let state = {}, submitting = false;

  function render() {
    const french = getLanguage() === 'fr';
    const pending = submitting || state.onlinePending;
    label.hidden = Boolean(state.onlineHasAccount);
    const labelText = french ? 'Nom de joueur' : 'Player name';
    const helpText = french ? '4 à 20 lettres (A–Z) ou chiffres, sans espaces.' : '4–20 letters (A–Z) or digits, no spaces.';
    if (caption.textContent !== labelText) caption.textContent = labelText;
    if (help.textContent !== helpText) help.textContent = helpText;
    input.toggleAttribute('required', !label.hidden);
    input.toggleAttribute('disabled', Boolean(pending));
    close.disabled = pending;
    submit.disabled = pending;
    submit.textContent = pending ? (french ? 'Connexion…' : 'Connecting…') : (french ? 'Se connecter' : 'Connect');
    submit.setAttribute('aria-busy', String(Boolean(pending)));
    status.textContent = state.onlineStatus || '';
  }
  close.addEventListener('click', () => command(76));
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
