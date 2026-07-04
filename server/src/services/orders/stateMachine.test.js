import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTransition, canTransition, nextStatuses } from './stateMachine.js';

test('legal forward transitions are allowed', () => {
  assert.ok(canTransition('pending', 'confirmed'));
  assert.ok(canTransition('confirmed', 'design_review'));
  assert.ok(canTransition('design_review', 'approved'));
  assert.ok(canTransition('approved', 'manufacturing'));
  assert.ok(canTransition('manufacturing', 'packed'));
  assert.ok(canTransition('packed', 'shipped'));
  assert.ok(canTransition('shipped', 'delivered'));
});

test('illegal jumps are rejected', () => {
  assert.equal(canTransition('pending', 'shipped'), false);
  assert.equal(canTransition('confirmed', 'delivered'), false);
  assert.equal(checkTransition('pending', 'delivered').ok, false);
});

test('rework path: design_review -> confirmed is allowed', () => {
  assert.ok(canTransition('design_review', 'confirmed'));
});

test('cancel from non-terminal is allowed; from terminal is not', () => {
  assert.ok(checkTransition('pending', 'cancelled').ok);
  assert.equal(checkTransition('delivered', 'cancelled').ok, false);
  assert.equal(checkTransition('cancelled', 'pending').ok, false);
});

test('cancel from manufacturing/packed needs override', () => {
  assert.equal(checkTransition('manufacturing', 'cancelled').ok, false);
  assert.ok(checkTransition('manufacturing', 'cancelled', { override: true }).ok);
  assert.equal(checkTransition('packed', 'cancelled').ok, false);
  assert.ok(checkTransition('packed', 'cancelled', { override: true }).ok);
});

test('terminal states have no next', () => {
  assert.deepEqual(nextStatuses('delivered'), []);
  assert.deepEqual(nextStatuses('cancelled'), []);
});
