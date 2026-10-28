import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDateContext,
  getDateKeyInTimeZone,
  normalizeTimeZone,
} from '../src/services/dateContext.js';

test('uses the local calendar date east of UTC', () => {
  const now = new Date('2026-10-28T19:00:00.000Z');

  assert.equal(getDateKeyInTimeZone(now, 'Asia/Kolkata'), '2026-10-29');
  assert.match(buildDateContext('Asia/Kolkata', now), /Today\s+: 29 Oct 2026/);
});

test('uses the local calendar date west of UTC', () => {
  const now = new Date('2026-10-28T02:00:00.000Z');

  assert.equal(
    getDateKeyInTimeZone(now, 'America/Los_Angeles'),
    '2026-10-27'
  );
  assert.match(
    buildDateContext('America/Los_Angeles', now),
    /Today\s+: 27 Oct 2026/
  );
});

test('builds correct context across daylight-saving transitions', () => {
  assert.equal(
    getDateKeyInTimeZone(
      new Date('2026-03-08T06:30:00.000Z'),
      'America/New_York'
    ),
    '2026-03-08'
  );
  assert.equal(
    getDateKeyInTimeZone(
      new Date('2026-11-01T04:30:00.000Z'),
      'America/New_York'
    ),
    '2026-11-01'
  );
});

test('falls back safely for invalid time zones', () => {
  assert.equal(normalizeTimeZone('Not/A_Zone'), 'UTC');
  assert.equal(normalizeTimeZone('x'.repeat(101)), 'UTC');
  assert.equal(normalizeTimeZone('Europe/London'), 'Europe/London');
});
