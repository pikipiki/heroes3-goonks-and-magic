import {factionArt, factionArtPaths} from './faction-art.mjs';

export function mountHostedCastles(root, fr, onRosterChange) {
  const t = (en, french) => fr ? french : en;
  const colors = fr ? ['Rouge', 'Bleu', 'Beige', 'Vert', 'Orange', 'Violet', 'Turquoise', 'Rose'] :
    ['Red', 'Blue', 'Tan', 'Green', 'Orange', 'Purple', 'Teal', 'Pink'];
  const random = {id: -1, name: t('Random castle', 'Château aléatoire')};
  const list = document.createElement('div');
  list.className = 'hosted-castle-list';
  const picker = document.createElement('dialog');
  picker.id = 'hosted-castle-picker';
  picker.className = 'lobby-picker';
  picker.dataset.kind = 'castle';
  picker.setAttribute('aria-labelledby', 'hosted-castle-title');
  picker.innerHTML = '<header><h2 id="hosted-castle-title" tabindex="-1" autofocus></h2><button type="button" data-castle-close data-native-click>✕</button></header><div class="lobby-picker-content"><div class="lobby-picker-grid" role="group" aria-labelledby="hosted-castle-title"></div></div><footer><button type="button" data-castle-close data-native-click></button></footer>';
  picker.querySelector('header button').setAttribute('aria-label', t('Close castle picker', 'Fermer le choix du château'));
  picker.querySelector('footer button').textContent = t('← Back', '← Retour');
  root.replaceChildren(list, picker);
  let records = [], activeSeat;
  const artwork = new Map();

  function warm(faction) {
    for (const url of factionArtPaths(faction)) {
      if (artwork.has(url)) continue;
      const image = new Image();
      image.src = url;
      artwork.set(url, image);
      void image.decode().catch(() => {});
    }
  }

  function setRole(group, value) {
    group.dataset.role = value;
    for (const button of group.children) {
      button.setAttribute('aria-pressed', String(button.dataset.castleRole === value));
    }
  }

  function renderCard(record) {
    const selected = record.choices.length ? record.choices.find(item => item.id === record.value) ?? random :
      record.fixed ?? {name: t('Map faction', 'Faction de la carte')};
    const faction = selected.id === -1 ? random : selected;
    record.card.innerHTML = factionArt(faction) + '<span><small></small><strong></strong><em></em></span>';
    record.card.querySelector('small').textContent = t('Starting faction', 'Faction de départ');
    record.card.querySelector('strong').textContent = faction.name;
    record.card.querySelector('em').textContent = record.choices.length ?
      t('Choose castle ›', 'Choisir le château ›') : t('🔒 Fixed by the map', '🔒 Imposée par la carte');
    warm(faction);
  }

  function open(seat) {
    const record = records[seat];
    if (!record?.choices.length || record.card.disabled) return;
    activeSeat = seat;
    picker.querySelector('h2').textContent = t('Choose castle', 'Choisir le château') + ' · ' + colors[record.color];
    const buttons = [random, ...record.choices].map(faction => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.castleChoice = faction.id === -1 ? '' : faction.id;
      button.dataset.nativeClick = '';
      const selected = record.value === (faction.id === -1 ? null : faction.id);
      button.setAttribute('aria-pressed', String(selected));
      button.innerHTML = factionArt(faction) + '<span class="lobby-choice-name"></span><span class="lobby-choice-check" aria-hidden="true"></span>';
      button.querySelector('.lobby-choice-name').textContent = faction.name;
      if (selected) button.querySelector('.lobby-choice-check').textContent = '✓';
      return button;
    });
    picker.querySelector('.lobby-picker-grid').replaceChildren(...buttons);
    picker.showModal();
    picker.querySelector('.lobby-picker-content').scrollTop = 0;
  }
  picker.addEventListener('close', () => {
    const card = records[activeSeat]?.card;
    if (card?.isConnected) card.focus({preventScroll: true});
  });

  return {
    update(scenario) {
      if (picker.open) picker.close();
      activeSeat = undefined;
      records = (scenario?.castles ?? []).map((choices, seat) => {
        const slot = scenario.seats?.[seat];
        const colorId = slot?.color ?? seat;
        const container = document.createElement('section');
        const header = document.createElement('div');
        header.className = 'hosted-castle-heading';
        const heading = document.createElement('h3');
        const color = document.createElement('i');
        color.className = 'lobby-player-colour';
        color.dataset.playerColour = colorId;
        color.setAttribute('aria-hidden', 'true');
        heading.append(color, colors[colorId]);
        header.append(heading);
        let role;
        if (slot?.human && slot.computer && colorId !== 0) {
          role = document.createElement('div');
          role.className = 'hosted-role-toggle';
          role.setAttribute('role', 'group');
          role.setAttribute('aria-label', t('Player type', 'Type de joueur') + ' · ' + colors[colorId]);
          for (const [value, label] of [['human', t('Human', 'Humain')], ['computer', t('Computer', 'Ordinateur')]]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.castleRole = value;
            button.dataset.nativeClick = '';
            const check = document.createElement('span');
            check.setAttribute('aria-hidden', 'true');
            check.textContent = '✓';
            button.append(check, label);
            role.append(button);
          }
          setRole(role, 'human');
          header.append(role);
        } else {
          const label = document.createElement('small');
          label.textContent = colorId === 0 ? t('Host', 'Hôte') : slot?.human === false ? t('Computer', 'Ordinateur') : t('Human', 'Humain');
          header.append(label);
        }
        const card = document.createElement(choices?.length ? 'button' : 'div');
        card.className = 'lobby-choice-card';
        if (choices?.length) {
          card.type = 'button';
          card.dataset.castleSeat = seat;
          card.dataset.nativeClick = '';
          card.setAttribute('aria-haspopup', 'dialog');
          card.setAttribute('aria-controls', picker.id);
        }
        container.append(header, card);
        const record = {container, card, color: colorId, role, canBeHuman: slot?.human !== false,
          choices: choices ?? [], fixed: scenario.fixedCastles?.[seat], value: null};
        for (const faction of record.choices) warm(faction);
        renderCard(record);
        return record;
      });
      list.replaceChildren(...records.map(record => record.container));
    },
    setPending(pending) {
      for (const record of records) {
        if (record.role) for (const button of record.role.children) button.disabled = pending;
        if (record.choices.length) record.card.disabled = pending;
      }
    },
    setHumanCount(count) {
      if (this.humanSeats.length === count) return;
      let remaining = count - records.filter(record => record.canBeHuman && !record.role).length;
      for (const record of records) {
        if (!record.role) continue;
        setRole(record.role, remaining > 0 ? 'human' : 'computer');
        remaining--;
      }
    },
    get humanSeats() {
      return records.filter(record => record.canBeHuman && record.role?.dataset.role !== 'computer').map(record => record.color);
    },
    get factions() { return records.map(record => record.value); },
    activate(button) {
      if (button.hasAttribute('data-castle-role')) {
        const group = button.parentElement;
        if (!button.disabled && group.dataset.role !== button.dataset.castleRole) {
          setRole(group, button.dataset.castleRole);
          onRosterChange();
        }
        return true;
      }
      if (button.hasAttribute('data-castle-seat')) { open(Number(button.dataset.castleSeat)); return true; }
      if (button.hasAttribute('data-castle-close')) { picker.close(); return true; }
      if (!button.hasAttribute('data-castle-choice') || !picker.open) return false;
      const record = records[activeSeat];
      const value = button.dataset.castleChoice === '' ? null : Number(button.dataset.castleChoice);
      if (value !== null && !record.choices.some(choice => choice.id === value)) return true;
      record.value = value;
      renderCard(record);
      picker.close();
      return true;
    },
  };
}
