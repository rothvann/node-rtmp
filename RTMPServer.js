const net = require('net');
const RTMPConnection = require('RTMPConnection');


class RTMPServer {

    constructor() {
        this.tcpServer = new net.Server();
                
        this.port = 1935;
        this.rtmpConnections = []
        
        server.listen(this.port, socket => {
            this.rtmpConnections.push(new rtmpConnection(socket));
        });
    }
}