const net = require('net');
const crypto = require('crypto');
const RTMPServer = require('../RTMPServer');

beforeAll(() => {
  new RTMPServer();
});

describe('Connect', () => {
  test('Handshake', () => new Promise((resolve) => {
    const C0 = Buffer.from([0x03]);

    const C1_SIZE = 1536;
    const ZERO_4_BYTES = Buffer.from([0, 0, 0, 0]);
    const C1_RANDOM_BYTES = crypto.randomBytes(C1_SIZE - 8);
    const C1_TIMESTAMP = Buffer.from([0, 0, 0, 0]);

    const C1 = Buffer.concat([C1_TIMESTAMP, ZERO_4_BYTES, C1_RANDOM_BYTES]);

    const client = new net.Socket();

    client.connect(1935, '127.0.0.1');

    client.on('data', (data) => {
      console.log(data);
      resolve();
    });

    client.write(C0);
    client.write(C1);
  }));
});

describe('Core', () => {

});
