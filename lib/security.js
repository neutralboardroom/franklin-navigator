'use strict';
const crypto = require('node:crypto');
const {promisify} = require('node:util');
const scrypt = promisify(crypto.scrypt);
const b64url = buffer => Buffer.from(buffer).toString('base64url');
const sha256 = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken = (bytes = 32) => b64url(crypto.randomBytes(bytes));
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left)); const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
async function hashPassword(password) {
  const raw = String(password || '');
  if (raw.length < 12 || raw.length > 256) throw new Error('password_length_invalid');
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(raw, salt, 64, {N: 16384, r: 8, p: 1});
  return `scrypt$16384$8$1$${b64url(salt)}$${b64url(derived)}`;
}
async function verifyPassword(password, encoded) {
  try {
    const [kind, n, r, p, salt, expected] = String(encoded || '').split('$');
    if (kind !== 'scrypt') return false;
    const derived = await scrypt(String(password || ''), Buffer.from(salt, 'base64url'), Buffer.from(expected, 'base64url').length, {N:Number(n), r:Number(r), p:Number(p)});
    return safeEqual(b64url(derived), expected);
  } catch { return false; }
}
function signHmac(secret, timestamp, body) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}
function verifySignedRequest({secret, timestamp, signature, body, toleranceSeconds = 300}) {
  const ts = Number(timestamp);
  if (!secret || !Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;
  return safeEqual(signHmac(secret, ts, body), signature);
}
function verifyStripeSignature({secret, header, rawBody, toleranceSeconds = 300}) {
  const parts = {};
  for (const piece of String(header || '').split(',')) {
    const [key, value] = piece.split('=', 2); if (key && value) (parts[key] ||= []).push(value);
  }
  const ts = Number(parts.t?.[0]);
  if (!secret || !Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.`).update(rawBody).digest('hex');
  return (parts.v1 || []).some(value => safeEqual(expected, value));
}
function signAssertion(secret, payload) {
  const encoded = b64url(JSON.stringify(payload));
  return `${encoded}.${crypto.createHmac('sha256', secret).update(encoded).digest('hex')}`;
}
module.exports = {sha256, randomToken, hashPassword, verifyPassword, signHmac, verifySignedRequest, verifyStripeSignature, signAssertion, safeEqual};
