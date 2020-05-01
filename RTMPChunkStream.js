const EventEmitter = require('events');
const RTMPChunkStreamHandler = require('./RTMPChunkStreamHandler');

// Receives and sends chunks to the right chunk stream handler

class RTMPChunkStream extends EventEmitter {
  constructor() {
    super();
    this.chunkStreams = new Map();
  }

  formatMessage(message) {

  }

  onData(data) {
    const basicHeader = RTMPChunkStreamHandler.parseBasicHeader(data);
    if (!this.chunkStreams.has(basicHeader.chunkStreamId)) {
      const handler = new RTMPChunkStreamHandler(this.emit.bind(this));
      this.chunkStreams.set(basicHeader.chunkStreamId, handler);
    }
    this.chunkStreams.get(basicHeader.chunkStreamId).parseChunk(basicHeader, data);
  }
}

module.exports = RTMPChunkStream;
