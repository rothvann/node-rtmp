const net = require('net');
const EventEmitter = require('events');
const RTMPConnection = require('./RTMPConnection');
const RTMPChunkStream = require('./RTMPChunkStream');
const RTMPMessageStream = require('./RTMPMessageStream');


class RTMPServer extends EventEmitter {
  constructor(url='') {
    super();
    this.tcpServer = new net.Server();

    this.port = 1935;
    
    this.tcpServer.on('connection', (socket) => {
      const chunkStream = new RTMPChunkStream();
      const messageStream = new RTMPMessageStream();
      const rtmpConnection = new RTMPConnection(socket, chunkStream, messageStream);
      this.emit('connection', rtmpConnection);
    });

    this.tcpServer.listen(this.port);
  }
}


module.exports = RTMPServer;
