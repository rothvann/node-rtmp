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
    this.bytesReceived = 0;

    this.socket = socket;
    this.state = this.connectionState.HANDSHAKE_0;
    this.messageStream = messageStream;
    this.handleData = this.handleData.bind(this);
    this.changeWindowSize = this.changeWindowSize.bind(this);
    this.data = Buffer.from([]);

    this.socket.on('data', this.handleData);
    this.messageStream.on('windowSize', this.changeWindowSize);
  }

  changeWindowSize(size) {
    this.windowSize = size;
  }

  handleData(data) {
    this.bytesReceived += data.length;
    if (this.bytesReceived > this.windowSize) {
      const acknowledgement = Buffer.alloc(4);
      acknowledgement.writeUIntBE(this.bytesReceived);
      acknowledgement = this.messageStream.formatMessage(acknowledgement);
      this.socket.write(acknowledgement);
      this.bytesReceived = 0;

      // message format need to convert to chunk stream format
    }
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
          this.messageStream.receive(data);
          this.data = Buffer.from([]);
          break;
        default:
          throw Error('Unknown RTMPConnection state');
      }
    }
  }
}

module.exports = RTMPConnection;
