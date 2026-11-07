const mapSizes = new Map([[36, 'S'], [72, 'M'], [108, 'L'], [144, 'XL'], [180, 'H'], [216, 'XH'], [252, 'G']]);

export function scenarioSize({width, height}) {
  if (!(width > 0 && height > 0)) return '';
  return (width === height && mapSizes.get(width)) || `${width} × ${height}`;
}

export function playerBreakdown(humans, computers, fr) {
  return fr
    ? `${humans} humain${humans === 1 ? '' : 's'} · ${computers} ordinateur${computers === 1 ? '' : 's'}`
    : `${humans} human${humans === 1 ? '' : 's'} · ${computers} computer${computers === 1 ? '' : 's'}`;
}

export function scenarioDetails({width, height, players, castleChoices, humanSeats, humans}, fr) {
  const details = [];
  const size = scenarioSize({width, height});
  if (size) details.push(size);
  if (players > 0) details.push(`${players} ${fr ? (players === 1 ? 'joueur' : 'joueurs') : (players === 1 ? 'player' : 'players')}`);
  if (Number.isInteger(humans) && players >= humans)
    details.push(playerBreakdown(humans, players - humans, fr));
  if (Number.isInteger(castleChoices)) {
    details.push(castleChoices === 0 ? (fr ? 'Faction imposée' : 'Fixed faction') :
      castleChoices === humanSeats ? (fr ? 'Faction au choix' : 'Faction choice') :
        (fr ? `Faction au choix (${castleChoices}/${humanSeats})` : `Faction choice (${castleChoices}/${humanSeats})`));
  }
  return details.join(' · ');
}
