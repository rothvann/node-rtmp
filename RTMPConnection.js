const RTMPHandshake = require('RTMPHandshake');
const RTMPChunkStream = require('RTMPChunkStream');
const RTMPMessageHandler = require('RTMPMessageHandler');

class RTMPConnection {
    
    const connectionState = {
        HANDSHAKE_0: 0,
        HANDSHAKE_1: 1,
        HANDSHAKE_2: 2,        
        READY: 3,        
    }
    
    constructor(socket) {
        this.socket = socket;
        this.state = this.connectionState.HANDSHAKE_0;
        this.messageHandler = new RTMPMessageHandler();
        this.chunkStream = new RTMPChunkStream(this.messageHandler);
        
        this.socket.on('data', handleData);
    }
    
    handleData(data) {
        switch(this.state) {
            case this.connectionState.HANDSHAKE_0:
                this.state = this.connectionState.HANDSHAKE_1;
                break;
            case this.connectionState.HANDSHAKE_1:
                this.socket.write(RTMPHandshake.generateS0());
                this.socket.write(RTMPHandshake.generateS1());
                let timestamp = data.slice(0, 4);
                let receivedTimestamp = RTMPHandshake.generateTimestamp();
                let randomBytes = data.slice(8);
                this.socket.write(RTMPHandshake.generateS2(timestamp, receivedTimestamp, randomBytes));
                this.state = this.connectionState.HANDSHAKE_2;
                break;
            case this.connectionState.HANDSHAKE_2:
                this.state = this.connectionState.READY;
                break;            
            case this.connectionState.READY:
                this.chunkStream.receive(data);
        }
    }
}
