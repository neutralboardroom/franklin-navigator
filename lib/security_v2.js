'use strict';

const crypto = require('node:crypto');

const base64url = (value) => Buffer.from(value).toString('base64url');
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
const constantEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

function requireSecret(name, minimum = 32) {
  const value = String(process.env[name] || '').trim();
  if (value.length < minimum) throw new Error(`${name}_must_be_at_least_${minimum}_characters`);
  return value;
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('valid_business_email_required');
  }
  return email;
}

function validatePassword(value) {
  const password = String(value || '');
  if (password.length < 12 || password.length > 256) throw new Error('password_length_must_be_12_to_256');
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('password_requires_upper_lower_and_number');
  }
  return password;
}

function scryptAsync(password, salt, keyLength = 64) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

async function hashPassword(value) {
  const password = validatePassword(value);
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$32768$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function verifyPassword(value, encoded) {
  try {
    const [scheme, n, r, p, saltRaw, keyRaw] = String(encoded || '').split('$');
    if (scheme !== 'scrypt' || Number(n) !== 32768 || Number(r) !== 8 || Number(p) !== 1) return false;
    const salt = Buffer.from(saltRaw, 'base64url');
    const expected = Buffer.from(keyRaw, 'base64url');
    const actual = await scryptAsync(String(value || ''), salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function parseCookies(header) {
  const result = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  return parts.join('; ');
}

function verifyTimestampedSignature({ secret, rawBody, timestamp, signature, toleranceSeconds = 300 }) {
  const now = Math.floor(Date.now() / 1000);
  const parsed = Number(timestamp);
  if (!Number.isInteger(parsed) || Math.abs(now - parsed) > toleranceSeconds) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${parsed}.`).update(rawBody).digest('hex');
  return constantEqual(expected, signature);
}

function verifyStripeSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  const pieces = {};
  for (const item of String(signatureHeader || '').split(',')) {
    const [key, value] = item.split('=', 2);
    if (!key || !value) continue;
    (pieces[key] ||= []).push(value);
  }
  const timestamp = Number(pieces.t?.[0]);
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > toleranceSeconds) {
    throw new Error('stripe_signature_timestamp_invalid');
  }
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
  if (!(pieces.v1 || []).some((value) => constantEqual(value, expected))) throw new Error('stripe_signature_invalid');
  return timestamp;
}

function signAssertion(payload, secret) {
  const encoded = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

function verifyAssertion(token, secret) {
  const [encoded, signature] = String(token || '').split('.', 2);
  if (!encoded || !signature) throw new Error('invalid_assertion');
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
  if (!constantEqual(signature, expected)) throw new Error('invalid_assertion_signature');
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('assertion_expired');
  return payload;
}

module.exports = {
  sha256,
  randomToken,
  constantEqual,
  requireSecret,
  normalizeEmail,
  validatePassword,
  hashPassword,
  verifyPassword,
  parseCookies,
  cookie,
  verifyTimestampedSignature,
  verifyStripeSignature,
  signAssertion,
  verifyAssertion,
};
