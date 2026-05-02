// Generate bloom-filter fixtures for 48-byte addresses + 32-byte topics.
// Replicates isInBloom() algorithm from packages/web3-validator/src/validation/bloom.ts
//
// Run: node /tmp/gen-bloom-fixtures.mjs

import { keccak256 } from '/home/adamtkaczyk/zond-testnetv1/web3.js/node_modules/qrl-cryptography/keccak.js';

const BLOOM_BYTES = 256; // 2048 bits

function hexToBytes(hex) {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mirrors isInBloom() in bloom.ts.
// Input must be a Uint8Array. Returns the OR of (bloom | bits set for `value`).
function setBloomBits(value) {
  const hash = bytesToHex(keccak256(value)); // 64 hex chars

  const bloom = new Uint8Array(BLOOM_BYTES); // all zero

  for (let i = 0; i < 12; i += 4) {
    const high = parseInt(hash.slice(i, i + 2), 16);
    const low = parseInt(hash.slice(i + 2, i + 4), 16);
    const bitpos = ((high << 8) + low) & 2047;

    // bloom is 256 bytes. Each char in the hex repr covers 4 bits (1 nibble).
    // The algorithm in isInBloom indexes from the END of the hex string:
    //   bloom.length - 1 - Math.floor(bitpos / 4)
    // -> char at distance Math.floor(bitpos/4) from the right end.
    // Then offset = 1 << (bitpos % 4) toggles one of the 4 low bits in the nibble.
    //
    // We mirror this: byte index from right = Math.floor(bitpos/8), bit within byte = bitpos % 8.
    // But note hex<->byte: char 0 = high nibble of byte 0. From the END:
    //   hex chars index from right: 0..511 (for 256-byte bloom)
    //   byte from right = floor(charFromRight / 2)
    //   nibble within byte: charFromRight % 2 = 0 -> low nibble (last hex char), = 1 -> high nibble.
    //
    // Each nibble has 4 bits (positions 0..3). When isInBloom does
    // `1 << (bitpos % 4)` it toggles one of those nibble bits.
    //
    // To set the same bit on the byte buffer, we need to compute:
    //   nibbleIndexFromRight = floor(bitpos / 4)   // which hex char from end
    //   bitInNibble          = bitpos % 4
    //   byteIndexFromRight   = floor(nibbleIndexFromRight / 2)
    //   nibbleHighOrLow      = nibbleIndexFromRight % 2  (0 = low nibble, 1 = high nibble)
    //   byteIndexAbsolute    = (BLOOM_BYTES - 1) - byteIndexFromRight
    //   bitInByte            = bitInNibble + (nibbleHighOrLow ? 4 : 0)
    //   bloom[byteIndexAbsolute] |= 1 << bitInByte
    const nibbleIndexFromRight = Math.floor(bitpos / 4);
    const bitInNibble = bitpos % 4;
    const byteIndexFromRight = Math.floor(nibbleIndexFromRight / 2);
    const nibbleHighOrLow = nibbleIndexFromRight % 2;
    const byteIndexAbsolute = (BLOOM_BYTES - 1) - byteIndexFromRight;
    const bitInByte = bitInNibble + (nibbleHighOrLow ? 4 : 0);
    bloom[byteIndexAbsolute] |= 1 << bitInByte;
  }
  return bloom;
}

// User-address bloom: input = padLeft(addressToHex(addr), 96)
// addressToHex returns "0x" + 96-hex (48 bytes). padLeft of "0x..." 0x-stripped right pad to 96 chars then re-prefix.
// Since addressToHex already returns 0x + 96 chars, padLeft 96 is a no-op but the result has 0x prefix.
// In isInBloom, hexToUint8Array strips 0x and decodes to 48 bytes.
function bloomForUserAddress(addr96Hex) {
  const cleaned = addr96Hex.replace(/^Q/, '').toLowerCase();
  const bytes = hexToBytes(cleaned); // 48 bytes
  return '0x' + bytesToHex(setBloomBits(bytes));
}

// Contract address bloom: input = addressToHex(addr) -> "0x" + 96-hex
// hexToUint8Array strips 0x -> 48 bytes
function bloomForContractAddress(addr96Hex) {
  // Same as user-address — both feed 48-byte buffer to keccak256 in our migration.
  return bloomForUserAddress(addr96Hex);
}

// Topic bloom: input = topic hex (post-migration topic = 64 bytes per ADR-002)
function bloomForTopic(topicHex) {
  const cleaned = topicHex.replace(/^0x/, '');
  const bytes = hexToBytes(cleaned);
  return '0x' + bytesToHex(setBloomBits(bytes));
}

// === Sample addresses ===
const A0 = 'Q253c9b5f121c662bda2783a091e4e98ebdcb4ad1df8c4d41bc2b907d4e6a564e1b359f6c439c363e90fc82476e088e68'; // prefunded #0
const A1 = 'Q7c3fd0d50f654719ebb6ecbdef27bb426974ed7b36f39554cd1cb48c2180f7bac1500596fefcc79121ab91a883f292fb'; // prefunded #1
const A2 = 'Q4e60eaa4ccc7bd51fcf8da9097787077d6656808d21725decfd6773a8ebf710ace967dffce0e4bd06a2ba35b6acdc914'; // prefunded #2
const A3 = 'Qa14e7916df0a5eb3e31870d272841f055176120686743a938584233769fe6666a208e24d2e7943ace41bd5da0868b391'; // prefunded #3

const T0 = '0x0ce781a18c10c8289803c7c4cfd532d797113c4b41c9701ffad7d0a632ac555b';

console.log('// ===== validUserQRLAddressInBloomData =====');
[A0, A1, A2].forEach(a => {
  const bloom = bloomForUserAddress(a);
  console.log(`\t['${bloom}', '${a}'],`);
});

console.log('\n// ===== invalidUserQRLAddressInBloomData =====');
console.log('// (different address => bloom does NOT contain it)');
const wrongBloom = bloomForUserAddress(A0);
[A1, A2, A3].forEach(a => {
  console.log(`\t['${wrongBloom}', '${a}'],`);
});
console.log('// (malformed inputs)');
console.log(`\t['${wrongBloom}', 'QH1'],`);
console.log(`\t['${wrongBloom}', 'Q98afe7a8d28bbc88dcf41f8e06d97c74958a47dc'],  // legacy 40-hex => regex fails`);

console.log('\n// ===== validContractAddressInBloomData =====');
[A0, A1, A2].forEach(a => {
  const bloom = bloomForContractAddress(a);
  console.log(`\t['${bloom}', '${a}'],`);
});

console.log('\n// ===== validInBloomData =====');
console.log('// (same address fed as raw 0x-hex; isInBloom decodes via hexToUint8Array)');
[A0, A1, A2].forEach(a => {
  const bloom = bloomForUserAddress(a);
  const hex = '0x' + a.slice(1).toLowerCase();
  console.log(`\t['${bloom}', '${hex}'],`);
});

console.log('\n// ===== validTopicInBloomData =====');
const topicBloom = bloomForTopic(T0);
console.log(`\t['${topicBloom}', '${T0}'],`);
