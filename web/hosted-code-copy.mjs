export function createHostedCodeCopy(fr) {
  const element = document.createElement('div');
  element.className = 'hosted-personal-code';
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.nativeClick = '';
  button.textContent = fr ? 'Copier mon code personnel' : 'Copy my personal code';

  const help = document.createElement('small');
  help.textContent = fr ? 'Pour reprendre ta place sur un autre appareil. Garde ce code pour toi.' :
    'Use this to resume your seat on another device. Keep this code private.';

  const input = document.createElement('input');
  input.type = 'text';
  input.readOnly = true;
  input.hidden = true;
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.dir = 'ltr';
  input.setAttribute('aria-label', fr ? 'Code personnel de reprise' : 'Personal resume code');

  const status = document.createElement('small');
  status.setAttribute('role', 'status');
  element.append(button, help, input, status);

  let code = '', revision = 0;
  function setCode(value = '') {
    if (value === code) return;
    code = value;
    revision++;
    status.textContent = '';
    input.value = '';
    input.hidden = true;
  }
  async function copy() {
    if (!code) return;
    const attempt = ++revision;
    try {
      await navigator.clipboard.writeText(code);
      if (attempt !== revision) return;
      input.value = '';
      input.hidden = true;
      status.textContent = fr ? 'Code personnel copié.' : 'Personal code copied.';
    } catch {
      if (attempt !== revision || !element.isConnected) return;
      input.value = code;
      input.hidden = false;
      input.focus();
      input.select();
      status.textContent = fr ? 'Copie le code sélectionné.' : 'Copy the selected code.';
    }
  }

  return {element, button, setCode, copy};
}
