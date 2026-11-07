const towns = new Set(['castle', 'rampart', 'tower', 'inferno', 'necropolis', 'dungeon', 'stronghold', 'fortress', 'conflux']);

export function factionArtPaths({id, key} = {}) {
  const town = key?.split(':').at(-1);
  const backdrop = town === 'goonk' || towns.has(town) ? './web/h3-theme/lobby/' + town + '.webp' : './web/h3-theme/stone.png';
  const crest = town === 'goonk' ? './web/h3-theme/lobby/goonk-castle.webp' :
    towns.has(town) ? './web/town/' + town + '/structures/castle.webp' :
      Number(id) === -1 ? './web/h3-theme/random-castle.svg' : './web/h3-theme/town-fort.png';
  return [backdrop, crest];
}

export function factionArt(faction) {
  const [backdrop, crest] = factionArtPaths(faction);
  return `<figure class="lobby-faction-art"><img src="${backdrop}" alt=""><img class="lobby-castle-symbol" src="${crest}" alt=""></figure>`;
}
