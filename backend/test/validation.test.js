import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateBreakdownBody,
  validateDailyPlanBody,
  validateRescheduleBody,
  validateSplitBody,
} from '../src/services/validation.js';

test('breakdown validation rejects missing, short, and oversized tasks', () => {
  assert.equal(validateBreakdownBody(null).error, 'Request body must be a JSON object');
  assert.equal(validateBreakdownBody({}).error, 'Missing or invalid task');
  assert.equal(
    validateBreakdownBody({ task: 'ab' }).error,
    'Task must contain at least 3 characters'
  );
  assert.equal(
    validateBreakdownBody({ task: 'x'.repeat(501) }).error,
    'Task must be 500 characters or fewer'
  );
});

test('breakdown validation accepts a valid task and timezone', () => {
  assert.deepEqual(
    validateBreakdownBody({ task: '  Plan the launch  ', timeZone: 'Asia/Colombo' }),
    { value: { task: 'Plan the launch' } }
  );
});

test('validation rejects invalid timezones instead of silently using UTC', () => {
  assert.equal(
    validateBreakdownBody({ task: 'Plan launch', timeZone: 'Not/AZone' }).error,
    'timeZone must be a valid IANA timezone'
  );
});

test('reschedule validation rejects invalid instructions and dates', () => {
  assert.equal(
    validateRescheduleBody({ instruction: '', currentDueDate: new Date().toISOString() }).error,
    'Missing or empty instruction'
  );
  assert.equal(
    validateRescheduleBody({ instruction: 'Move it', currentDueDate: 'not-a-date' }).error,
    'currentDueDate must be a valid ISO date string'
  );
});

test('reschedule validation returns trimmed input', () => {
  const dueDate = '2026-10-30T12:00:00.000Z';
  assert.deepEqual(
    validateRescheduleBody({ instruction: '  Move to Friday  ', currentDueDate: dueDate }),
    { value: { instruction: 'Move to Friday', currentDueDate: dueDate } }
  );
});

test('split validation enforces step and duration bounds', () => {
  assert.equal(
    validateSplitBody({ task: 'Plan launch', steps: [], totalDurationMinutes: 30 }).error,
    'steps must contain between 1 and 10 items'
  );
  assert.equal(
    validateSplitBody({
      task: 'Plan launch',
      steps: ['Draft plan'],
      totalDurationMinutes: 0,
    }).error,
    'totalDurationMinutes must be a number between 1 and 10000'
  );
});

test('daily plan validation rejects unsupported task data', () => {
  assert.equal(
    validateDailyPlanBody({ tasks: [], availableMinutes: 60 }).error,
    'tasks must contain between 1 and 20 items'
  );
  assert.equal(
    validateDailyPlanBody({
      tasks: [{
        id: 'task-1',
        title: 'Write report',
        category: 'Work',
        status: 'archived',
      }],
      availableMinutes: 60,
    }).error,
    'Each task must have a valid status'
  );
});

test('daily plan validation strips unneeded fields before prompting', () => {
  assert.deepEqual(
    validateDailyPlanBody({
      tasks: [{
        id: 'task-1',
        title: 'Write report',
        category: 'Work',
        status: 'todo',
        dueDate: '2026-10-30T12:00:00.000Z',
        sessionTime: 25,
        subtasks: [{ text: 'Outline', isDone: false }],
        unexpected: 'ignore me',
      }],
      availableMinutes: 60,
    }),
    {
      value: {
        tasks: [{
          id: 'task-1',
          title: 'Write report',
          category: 'Work',
          status: 'todo',
          dueDate: '2026-10-30T12:00:00.000Z',
          sessionTime: 25,
        }],
        availableMinutes: 60,
      },
    }
  );
});
