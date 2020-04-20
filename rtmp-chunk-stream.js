const RtmpChunkStreamHandler = require('./rtmp-chunk-stream-handler');

//Receives and sends chunks to the right chunk stream handler

class RtmpChunkStream {
    
    constructor(event_handler) {
        this.chunk_streams = new Map();
        this.event_handler = event_handler;
    }
    
    registerNewChunkStreamHandler(cs_id) {
        
    }
    
    recv(packet) {
        
    }
    
}