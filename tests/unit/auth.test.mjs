import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath, validEmail, validCode, profileInput, authErrorMessage } from '../../src/lib/auth/validation.ts';

test('return paths reject external URLs, encodings, queries and arbitrary routes', () => {
  for (const path of ['https://example.com', '//example.com', '/\\example.com', '/projects?next=//evil.com', '/%2f%2fevil.com', '/admin', undefined]) assert.equal(safeReturnPath(path), '/projects');
  for (const path of ['/', '/account', '/projects/new', '/projects/a51db540-a509-41cd-99a7-79e99a5e1ac2', '/projects/cloud/0123456789abcdef01234567']) assert.equal(safeReturnPath(path), path);
});
test('email and OTP input are bounded and code permits exactly six digits', () => {
  assert.equal(validEmail('customer@example.com'), true);
  for (const value of ['a@b', 'a b@example.com', 'a\r@example.com', 'x'.repeat(255)+'@example.com', null]) assert.equal(validEmail(value), false);
  assert.equal(validCode('012345'), true);
  for (const value of ['12345', '1234567', '１２３４５６', '123abc', null]) assert.equal(validCode(value), false);
});
test('profile permits only bounded contact fields, never identity or role', () => {
  assert.deepEqual(profileInput({ display_name: ' Amina ', phone: ' +880 1712-345678 ' }), { display_name: 'Amina', phone: '+880 1712-345678' });
  assert.deepEqual(profileInput({ display_name: '', phone: '' }), { display_name: '', phone: null });
  for (const value of [{ display_name: 'A', phone: '', role: 'admin' }, { id: 'other', display_name: 'A', phone: '' }, { display_name: 'a'.repeat(81), phone: '' }, { display_name: 'a\n', phone: '' }, { display_name: 'A', phone: 'bad' }]) assert.equal(profileInput(value), null);
  assert.equal(profileInput({display_name:'A',phone:'-------'}),null);
});
test('provider failures expose safe recovery guidance, never raw errors', () => {
  assert.match(authErrorMessage('otp_expired'), /expired/);
  assert.match(authErrorMessage('unknown',429), /Wait a minute/);
  assert.match(authErrorMessage('email_address_not_authorized'), /restricted/);
  assert.equal(authErrorMessage('database_internal_secret'), 'Sign-in could not be completed. Check your connection and try again.');
});
