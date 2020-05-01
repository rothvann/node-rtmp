const net = require('net');
const RTMPConnection = require('./RTMPConnection');
const RTMPChunkStream = require('./RTMPChunkStream');
const RTMPMessageStream = require('./RTMPMessageStream');

class RTMPServer {
  constructor() {
    this.tcpServer = new net.Server();

    this.port = 1935;
    this.rtmpConnections = [];
    this.chunkStream = new RTMPChunkStream();
    this.messageStream = new RTMPMessageStream(this.chunkStream);


    this.tcpServer.on('connection', (socket) => {
      this.rtmpConnections.push(new RTMPConnection(socket, this.messageStream));
    });


    this.tcpServer.listen(this.port);
  }
}


module.exports = RTMPServer;
