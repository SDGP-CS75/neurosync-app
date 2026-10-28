import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeRatio,
  dedupeCalibrationEntries,
} from '../src/services/aiCalibration.js';

test('calibration entries keep the latest sample for each task', () => {
  const entries = [
    { taskId: 'task-1', estimated: 10, actual: 30 },
    { taskId: 'task-1', estimated: 10, actual: 20 },
    { taskId: 'task-2', estimated: 0, actual: 20 },
    { taskId: 'task-3', estimated: 20, actual: 20 },
  ];

  assert.deepEqual(dedupeCalibrationEntries(entries), [
    entries[1],
    entries[3],
  ]);
});

test('calibration ratio ignores invalid rows in its denominator', () => {
  const entries = [
    { taskId: 'task-1', estimated: 10, actual: 20 },
    { taskId: 'task-2', estimated: 20, actual: 20 },
    { taskId: 'task-3', estimated: 0, actual: 20 },
  ];

  assert.equal(computeRatio(entries), 1.5);
});

test('calibration requires two distinct valid task samples', () => {
  assert.equal(
    computeRatio([{ taskId: 'task-1', estimated: 10, actual: 20 }]),
    null
  );
  assert.equal(computeRatio([]), null);
});
