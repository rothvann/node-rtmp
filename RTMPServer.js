const net = require('net');
const RTMPConnection = require('RTMPConnection');


class RTMPServer {

    constructor() {
        this.tcpServer = new net.Server();
                
        this.port = 1935;
        this.rtmp_connections = []
        
        server.listen(this.port, socket => {
            this.rtmp_connections.push(new RtmpConnection(socket));            
        });
    }
}