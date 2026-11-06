import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isVisibleScenario,savedGameTitle,scenarioTitle} from '../web/scenario-title.mjs';

test('The mobile catalogue restores a legacy Russian title shown as Latin-1', () => {
  assert.equal(scenarioTitle('Âîçðîæäåíèå íà Ýíãàðä v1.0'), 'Возрождение на Энгард v1.0');
});

test('Correctly encoded titles keep their original spelling', () => {
  for (const title of ['Adventuring Gnoll 1.01', 'L’Été à Château d’Émeraude', 'Возрождение на Энгард v1.0', '']) {
    assert.equal(scenarioTitle(title), title);
  }
});

test('The mobile scenario picker omits the three Goonk maps without matching other titles', () => {
  const maps = ['000 - Château Goonk', 'Goonks', 'Goonks Online', 'The Goonks’ Adventure'].map((name, index) => ({name, index}));
  assert.deepEqual(maps.filter(isVisibleScenario), [{name:'The Goonks’ Adventure', index:3}]);
});

test('Autosaves show their scenario and preserve the filename for identification', () => {
  assert.equal(savedGameTitle({name:'Goonk-auto', scenario:'Adventuring Gnoll 1.01'}), 'Adventuring Gnoll 1.01 · Goonk-auto');
  assert.equal(savedGameTitle({name:'Manual save'}), 'Manual save');
});
