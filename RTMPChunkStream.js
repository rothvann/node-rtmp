const EventEmitter = require('events');
const RTMPChunkStreamHandler = require('./RTMPChunkStreamHandler');

// Receives and sends chunks to the right chunk stream handler

class RTMPChunkStream extends EventEmitter {
  constructor() {
    super();
    this.chunk_streams = new Map();
  }

  formatMessage(message) {

  }

  onData(data) {
    const basicHeader = RTMPChunkStreamHandler.parseBasicHeader(data);
    if (!this.chunk_streams.has(basicHeader.chunkStreamId)) {
      this.chunk_streams.set(basicHeader.chunkStreamId, new RTMPChunkStreamHandler(this.emit));
    }
    this.chunkStreams.get(basicHeader.chunkStreamId).parseChunk(basicHeader, data);
  }
}

module.exports = RTMPChunkStream;
