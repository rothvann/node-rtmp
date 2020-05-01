const crypto = require('crypto');


const S0 = Buffer.from([0x03]);

const ZERO_4_BYTES = Buffer.from([0, 0, 0, 0]);

const SIZE = 1536;


const S1_RANDOM_BYTES = crypto.randomBytes(SIZE - 8);

const S1_TIMESTAMP = Buffer.from([0, 0, 0, 0]);

const S1 = Buffer.concat([S1_TIMESTAMP, ZERO_4_BYTES, S1_RANDOM_BYTES]);

function validateC2() {

}

function generateTimestamp() {
  const timestamp = Buffer.alloc(4);
  // Zero fill right shift results in a unsigned 32 bit(4 bytes) integer
  // Truncates 4 bytes off of 8 byte timestamp
  timestamp.writeUIntBE(Date.now() >>> 0, 0, 4);
  return timestamp;
}

// In case rtmp verions > 3 are implemented
function generateS0(C0) {
  return S0;
}

function generateS1() {
  return S1;
}

function generateS2(C1) {
  const timestamp = C1.slice(0, 4);
  const receivedTimestamp = generateTimestamp();
  const randomBytes = C1.slice(8, SIZE - 8);
  return Buffer.concat([timestamp, receivedTimestamp, randomBytes]);
}


module.exports = {
  generateTimestamp, generateS0, generateS1, generateS2, SIZE,
};
