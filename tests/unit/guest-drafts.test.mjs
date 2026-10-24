import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDrafts, validateName, isFurnitureType } from '../../src/lib/guest-drafts/model.ts';

const draft = { id: 'a1111111-1111-4111-8111-111111111111', name: 'Hallway storage', furnitureType: 'cabinet', createdAt: '2026-10-21T10:00:00.000Z', updatedAt: '2026-10-21T10:00:00.000Z', version: 1 };
const encode = projects => JSON.stringify({ schemaVersion: 1, projects });

test('missing storage is a valid empty collection, but malformed data is not', () => {
  assert.deepEqual(parseDrafts(null), { status: 'ready', projects: [] });
  for (const raw of ['{bad', 'null', '[]', '{}', JSON.stringify({ schemaVersion: 1, projects: 'oops' })]) assert.equal(parseDrafts(raw).status, 'corrupt');
});

test('newer schemas are preserved as unsupported, not treated as empty drafts', () => {
  assert.equal(parseDrafts(JSON.stringify({ schemaVersion: 5, projects: [] })).status, 'newer-version');
});

test('records need supported types, valid names, unique IDs and ordered timestamps', () => {
  for (const change of [{ name: '' }, { name: ' x ' }, { name: 'x'.repeat(121) }, { id: '../../x' }, { furnitureType: 'chair' }, { updatedAt: 'invalid' }, { updatedAt: '2020-01-01T00:00:00Z' }, { version: 0 }]) {
    assert.equal(parseDrafts(encode([{ ...draft, ...change }])).status, 'corrupt');
  }
  assert.equal(parseDrafts(encode([draft, draft])).status, 'corrupt');
});

test('valid records are sorted by edit time and unknown fields are dropped', () => {
  const newer = { ...draft, id: 'b1111111-1111-4111-8111-111111111111', updatedAt: '2026-10-22T10:00:00Z', ignored: '<script>not carried through</script>' };
  const state = parseDrafts(encode([draft, newer]));
  assert.equal(state.status, 'ready');
  assert.equal(state.projects[0].id, newer.id);
  assert.equal('ignored' in state.projects[0], false);
});

test('limits prevent unbounded collections and unsupported furniture', () => {
  assert.equal(parseDrafts(encode(Array.from({ length: 101 }, () => draft))).status, 'corrupt');
  assert.equal(parseDrafts('x'.repeat(1_000_001)).status, 'corrupt');
  assert.equal(isFurnitureType('shoe_rack'), true);
  assert.equal(isFurnitureType('__proto__'), false);
  assert.equal(validateName('  '), 'Enter a project name.');
  assert.notEqual(validateName('a\nname'), null);
  assert.equal(validateName('  ঘরের আলমারি  '), null);
});

