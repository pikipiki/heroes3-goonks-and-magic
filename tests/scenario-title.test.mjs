import assert from 'node:assert/strict';
import {test} from 'node:test';
import {scenarioTitle} from '../web/scenario-title.mjs';

test('The mobile catalogue restores a legacy Russian title shown as Latin-1', () => {
  assert.equal(scenarioTitle('Âîçðîæäåíèå íà Ýíãàðä v1.0'), 'Возрождение на Энгард v1.0');
});

test('Correctly encoded titles keep their original spelling', () => {
  for (const title of ['Adventuring Gnoll 1.01', 'L’Été à Château d’Émeraude', 'Возрождение на Энгард v1.0', '']) {
    assert.equal(scenarioTitle(title), title);
  }
});
