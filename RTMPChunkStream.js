const RTMPChunkStreamHandler = require('./RTMPChunkStreamHandler');

// Receives and sends chunks to the right chunk stream handler

class RTMPChunkStream {
  constructor(event_handler) {
    this.chunk_streams = new Map();
    this.event_handler = event_handler;
  }

  registerNewChunkStreamHandler(cs_id) {
  
  }

  recv(packet) {

  }
}
