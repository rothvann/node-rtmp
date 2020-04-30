const crypto = require('crypto');


const S0 = Buffer.from([0x03]);

const zero_4bytes = Buffer.from([0, 0, 0, 0]);

const S1_size = 1536;
const S2_size = 1536;


const S1_random_bytes = crypto.randomBytes(S1_size - 8);

const S1_timestamp = Buffer.from([0, 0, 0, 0]);

function validateC2() {

}

// In case rtmp verions > 3 are implemented
function generateS0(C0) {
  return S0;
}

function generateS1() {
  return Buffer.concat([S1_timestamp, zero_4bytes, S1_random_bytes]);
}

function generateS2(C1_timestamp, C1_recv_timestamp, C1_random_bytes) {

}
