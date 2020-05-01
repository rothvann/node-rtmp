const RTMPHandshake = require('./RTMPHandshake');
const RTMPChunkStream = require('./RTMPChunkStream');
const RTMPMessageHandler = require('./RTMPMessageHandler');

class RTMPConnection {
  constructor(socket) {
    this.connectionState = {
      HANDSHAKE_0: 0,
      HANDSHAKE_1: 1,
      HANDSHAKE_2: 2,
      READY: 3,
    };


    this.socket = socket;
    this.state = this.connectionState.HANDSHAKE_0;
    this.messageHandler = new RTMPMessageHandler();
    this.chunkStream = new RTMPChunkStream(this.messageHandler);
    this.handleData = this.handleData.bind(this);
    this.data = Buffer.from([]);

    this.socket.setNoDelay(true);
    this.socket.on('data', this.handleData);
  }

  handleData(data) {
    this.data = Buffer.concat([this.data, data]);
    while (this.data.length > 0) {
      switch (this.state) {
        case this.connectionState.HANDSHAKE_0:
          // Receive C0
          this.data = this.data.slice(1);
          this.socket.write(RTMPHandshake.generateS0());
          this.socket.write(RTMPHandshake.generateS1());
          this.state = this.connectionState.HANDSHAKE_1;
          break;
        case this.connectionState.HANDSHAKE_1:
          // Receive C1
          if (this.data.length < RTMPHandshake.SIZE) {
            return;
          }
          this.socket.write(RTMPHandshake.generateS2(data));
          this.data = this.data.slice(RTMPHandshake.SIZE);
          this.state = this.connectionState.HANDSHAKE_2;
          break;
        case this.connectionState.HANDSHAKE_2:
          // Receive C2
          if (this.data.length < RTMPHandshake.SIZE) {
            return;
          }
          this.data = this.data.slice(RTMPHandshake.SIZE);
          this.state = this.connectionState.READY;
          break;
        case this.connectionState.READY:
          this.chunkStream.receive(data);
          this.data = Buffer.from([]);
      }
    }
  }
}

module.exports = RTMPConnection;
