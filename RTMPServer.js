const net = require('net');
const EventEmitter = require('events');
const StreamReceiver = require('StreamReceiver');
const RTMPConnection = require('./RTMPConnection');
const RTMPChunkStream = require('./RTMPChunkStream');
const RTMPMessageStream = require('./RTMPMessageStream');


class RTMPServer extends EventEmitter {
  constructor() {
    super();
    this.tcpServer = new net.Server();

    this.port = 1935;

    this.onCommandMessage = this.onCommandMessage.bind(this);

    this.tcpServer.on('connection', (socket) => {
      const chunkStream = new RTMPChunkStream();
      const messageStream = new RTMPMessageStream(chunkStream);
      const rtmpConnection = new RTMPConnection(socket, messageStream);
      this.emit('connection', rtmpConnection);
    });


    this.tcpServer.listen(this.port);
  }
}


module.exports = RTMPServer;
