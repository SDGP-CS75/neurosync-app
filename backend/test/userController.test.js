import test from 'node:test';
import assert from 'node:assert/strict';

import { createUserController } from '../src/controllers/userController.js';

function createDb({
  existing = false,
  existingData = {},
  getError,
  setError,
} = {}) {
  const writes = [];
  const db = {
    collection(name) {
      assert.equal(name, 'users');
      return {
        doc(uid) {
          return {
            async get() {
              if (getError) throw getError;
              return {
                exists: existing,
                data: () => existingData,
              };
            },
            async set(data) {
              if (setError) throw setError;
              writes.push({ uid, data });
            },
          };
        },
      };
    },
  };

  return { db, writes };
}

function mockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

const silentLogger = { error() {} };

test('profile creation rejects missing, malformed, and oversized names', async () => {
  const { db } = createDb();
  const { createUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const invalidBodies = [
    {},
    { firstName: 'Ada' },
    { firstName: '   ', lastName: 'Lovelace' },
    { firstName: 42, lastName: 'Lovelace' },
    { firstName: 'Ada', lastName: 'x'.repeat(101) },
    { firstName: 'Ada\nGrace', lastName: 'Lovelace' },
  ];

  for (const body of invalidBodies) {
    const res = mockResponse();
    await createUserProfile(
      { user: { uid: 'user-1' }, body },
      res
    );

    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /firstName and lastName/);
  }
});

test('profile creation trims valid names without mangling punctuation', async () => {
  const { db, writes } = createDb();
  const { createUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const res = mockResponse();

  await createUserProfile(
    {
      user: { uid: 'user-1', email: 'ada@example.com' },
      body: { firstName: "  Ada O'Connor  ", lastName: '  Byron & Sons  ' },
    },
    res
  );

  assert.equal(res.statusCode, 201);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].uid, 'user-1');
  assert.equal(writes[0].data.firstName, "Ada O'Connor");
  assert.equal(writes[0].data.lastName, 'Byron & Sons');
});

test('profile creation prefers the verified token email over request input', async () => {
  const { db, writes } = createDb();
  const { createUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const res = mockResponse();

  await createUserProfile(
    {
      user: { uid: 'user-1', email: 'verified@example.com' },
      body: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'attacker@example.com',
      },
    },
    res
  );

  assert.equal(res.statusCode, 201);
  assert.equal(writes[0].data.email, 'verified@example.com');
});

test('profile creation validates an email fallback when the token has none', async () => {
  const { db } = createDb();
  const { createUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const res = mockResponse();

  await createUserProfile(
    {
      user: { uid: 'user-1' },
      body: { firstName: 'Ada', lastName: 'Lovelace', email: 'not-an-email' },
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'email must be a valid address' });
});

test('profile creation rejects duplicates without writing again', async () => {
  const { db, writes } = createDb({ existing: true });
  const { createUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const res = mockResponse();

  await createUserProfile(
    {
      user: { uid: 'user-1' },
      body: { firstName: 'Ada', lastName: 'Lovelace' },
    },
    res
  );

  assert.equal(res.statusCode, 409);
  assert.equal(writes.length, 0);
});

test('profile lookup returns data for the authenticated owner', async () => {
  const profile = { firstName: 'Ada', lastName: 'Lovelace' };
  const { db } = createDb({ existing: true, existingData: profile });
  const { getUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const res = mockResponse();

  await getUserProfile({ user: { uid: 'user-1' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, profile);
});

test('profile lookup does not expose internal database errors', async () => {
  const { db } = createDb({
    getError: new Error('permission denied for internal collection'),
  });
  const { getUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const res = mockResponse();

  await getUserProfile({ user: { uid: 'user-1' } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Failed to load user profile' });
});

test('profile creation does not expose internal database errors', async () => {
  const { db } = createDb({
    setError: new Error('database connection string leaked'),
  });
  const { createUserProfile } = createUserController({
    getDb: () => db,
    logger: silentLogger,
  });
  const res = mockResponse();

  await createUserProfile(
    {
      user: { uid: 'user-1' },
      body: { firstName: 'Ada', lastName: 'Lovelace' },
    },
    res
  );

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Failed to create user profile' });
});
