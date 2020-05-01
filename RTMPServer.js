const net = require('net');
const RTMPConnection = require('./RTMPConnection');


class RTMPServer {
  constructor() {
    this.tcpServer = new net.Server();

    this.port = 1935;
    this.rtmpConnections = [];

    this.tcpServer.listen(this.port);

    this.tcpServer.on('connection', (socket) => {
      this.rtmpConnections.push(new RTMPConnection(socket));
    });
  }
}


module.exports = RTMPServer;
