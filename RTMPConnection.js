const RTMPHandshake = require('./RTMPHandshake');

class RTMPConnection {
  constructor(socket, messageStream) {
    this.connectionState = {
      HANDSHAKE_0: 0,
      HANDSHAKE_1: 1,
      HANDSHAKE_2: 2,
      READY: 3,
    };
    this.windowSize = 2500000;
    this.bandwidth = 2500000;
    this.bandwidthLimitType = null;

    this.bytesReceived = 0;
    this.unacknowledgedBytes = 0;

    this.socket = socket;
    this.state = this.connectionState.HANDSHAKE_0;
    this.messageStream = messageStream;
    this.handleData = this.handleData.bind(this);
    this.data = Buffer.from([]);
    this.writeBuffer = Buffer.from([]);

    this.socket.on('data', this.handleData);
    this.messageStream.on('Acknowledgement', (size) => { this.unacknowledgedBytes -= size; this.attemptWrite(); });
    this.messageStream.on('Window Acknowledgement Size', (size) => { this.windowSize = size; });
    this.messageStream.on('Set Peer Bandwidth', (bandwidth, limitType) => {
      switch (limitType) {
        case 0:
          this.bandwidth = bandwidth;
          break;
        case 1:
          this.bandwidth = min(this.bandwidth, bandwidth);
          break;
        case 2:
          if (this.bandwidthLimitType === 0) {
            this.bandwidth = bandwidth;
          }
          break;
        default:
          break;
      }
      this.bandwidthLimitType = limitType;
    });
  }

  registerHandler(event, handler) {
    this.messageStream.on(event, handler);
  }

  writeMessage(message) {
    // make sure not to send messages past bandwidth limit
    const data = this.messageStream.encodeMessage(message);
    console.log(data);
    this.writeBuffer = Buffer.concat([this.writeBuffer, data]);
    this.attemptWrite();
  }

  attemptWrite() {
    if (this.state === this.connectionState.READY) {
      const maxSize = this.bandwidth - this.unacknowledgedBytes;
      if (maxSize > 0) {
        const toSend = this.writeBuffer.slice(0, maxSize);
        this.writeBuffer = this.writeBuffer.slice(maxSize);
        this.socket.write(toSend);
      }
    }
  }

  handleData(data) {
    this.bytesReceived += data.length;
    if (this.bytesReceived > this.windowSize / 2) {
      let acknowledgement = Buffer.alloc(4);
      acknowledgement.writeUIntBE(this.bytesReceived);
      acknowledgement = this.messageStream.encodeMessage(acknowledgement);
      this.socket.write(acknowledgement);
      this.bytesReceived = 0;

      // message format need to convert to chunk stream format
    }
    this.data = Buffer.concat([this.data, data]);
    while (this.data.length > 0) {
      this.attemptWrite();
      switch (this.state) {
        case this.connectionState.HANDSHAKE_0:
          // Receive C0
          this.data = this.data.slice(1);
          this.state = this.connectionState.HANDSHAKE_1;
          break;
        case this.connectionState.HANDSHAKE_1:
          // Receive C1
          if (this.data.length < RTMPHandshake.SIZE) {
            return;
          }
          const response = Buffer.concat([RTMPHandshake.generateS0(), RTMPHandshake.generateS1(), RTMPHandshake.generateS2(data)]);
          this.socket.write(response);
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
          this.messageStream.onData(this.data);
          this.data = Buffer.from([]);
          break;
        default:
          throw Error('Unknown RTMPConnection state');
      }
    }
  }
}

module.exports = RTMPConnection;
