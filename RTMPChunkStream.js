const RTMPChunkStreamHandler = require('./RTMPChunkStreamHandler');

// Receives and sends chunks to the right chunk stream handler

class RTMPChunkStream {
  constructor(messageHandler) {
    this.chunk_streams = new Map();
    this.messageHandler = messageHandler;
  }

  registerNewChunkStreamHandler(chunkStreamId) {
    this.chunkStreams.set(chunkStreamId, new RTMPChunkStreamHandler());
    this.chunkStreams.get(chunkStreamId).on('message', this.messageHandler.receive);
  }

  receive(data) {
    const basicHeader = RTMPChunkStreamHandler.parseBasicHeader(chunk);
    this.chunkStreams.get(basicHeader.chunkStreamId).parseChunk(basicHeader, data);
  }
}

module.exports = RTMPChunkStream;
