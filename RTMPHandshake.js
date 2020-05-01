const crypto = require('crypto');


const S0 = Buffer.from([0x03]);

const ZERO_4_BYTES = Buffer.from([0, 0, 0, 0]);

const S1_SIZE = 1536;
const S2_SIZE = 1536;


const S1_RANDOM_BYTES = crypto.randomBytes(S1_size - 8);

const S1_TIMESTAMP = Buffer.from([0, 0, 0, 0]);

const S1 = Buffer.concat([S1_TIMESTAMP, ZERO_4_BYTES, S1_RANDOM_BYTES]);

function validateC2() {

}

function generateTimestamp() {
    let timestamp = Buffer.alloc(4);
    //Zero fill right shift results in a unsigned 32 bit(4 bytes) integer
    //Truncates 4 bytes off of 8 byte timestamp
    timestamp.writeDoubleBE(Date.now() >>> 0, 4)
}

// In case rtmp verions > 3 are implemented
function generateS0(C0) {
  return S0;
}

function generateS1() {
  return S1;
}

function generateS2(timestamp, receivedTimestamp, c1RandomBytes) {
    return Buffer.concat([timestamp, receivedTimestamp, c1RandomBytes]);
}
