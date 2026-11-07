const mapSizes = new Map([[36, 'S'], [72, 'M'], [108, 'L'], [144, 'XL'], [180, 'H'], [216, 'XH'], [252, 'G']]);

export function scenarioDetails({width, height, players, castleChoices, humanSeats}, fr) {
  const details = [];
  if (width > 0 && height > 0) details.push((width === height && mapSizes.get(width)) || `${width} × ${height}`);
  if (players > 0) details.push(`${players} ${fr ? (players === 1 ? 'joueur' : 'joueurs') : (players === 1 ? 'player' : 'players')}`);
  if (Number.isInteger(castleChoices)) {
    details.push(castleChoices === 0 ? (fr ? 'Faction imposée' : 'Fixed faction') :
      castleChoices === humanSeats ? (fr ? 'Faction au choix' : 'Faction choice') :
        (fr ? `Faction au choix (${castleChoices}/${humanSeats})` : `Faction choice (${castleChoices}/${humanSeats})`));
  }
  return details.join(' · ');
}
