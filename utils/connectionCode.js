// Section 14: unique connection codes like "MB-BOSS-82K7".
const crypto = require('crypto');

function generateConnectionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[crypto.randomInt(0, chars.length)];
  }
  return `MB-BOSS-${suffix}`;
}

module.exports = { generateConnectionCode };

