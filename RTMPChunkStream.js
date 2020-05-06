const EventEmitter = require('events');
const RTMPChunkStreamEncoder = require('./RTMPChunkStreamEncoder');

// Receives and sends chunks to the right chunk stream handler

class RTMPChunkStream extends EventEmitter {
  constructor() {
    super();

    this.onData.bind(this);

    this.streamStates = new Map();
    this.messageStates = new Map();
    this.chunkEncoder = new RTMPChunkStreamEncoder();
    this.newStreamState = {
      timestamp: null,
      timestampDelta: null,
      length: null,
      typeId: null,
      streamId: null,
      haveExtended: false,
    };

    this.streamStates.set(2, this.newStreamState);

    this.maxChunkSize = 128;
    this.data = Buffer.from([]);
  }

  encodeMessage(message) {
    return this.chunkEncoder.encode(message);
  }

  onData(data) {
    this.data = Buffer.concat([this.data, data]);
    this.attemptParse();
  }

  attemptParse() {
    while (this.data.length > 0) {
      const basicHeader = RTMPChunkStream.parseBasicHeader(this.data);
      if (!this.streamStates.has(basicHeader.chunkStreamId)) {
        this.streamStates.set(basicHeader.chunkStreamId, this.newStreamState);
      }
      const dataRead = this.parseChunk(basicHeader, this.data);
      if (dataRead === 0) {
        break;
      }
      this.data = this.data.slice(dataRead);
    }
  }


  static parseBasicHeader(chunk) {
    const basicHeader = chunk.readUIntBE(0, 1);
    // First two bits
    const fmt = basicHeader >> 6;
    // Last 6 bits
    let chunkStreamId = basicHeader & 0b00111111;
    let size = 1;
    if (chunkStreamId === 0) {
      size = 2;
      // second byte + 64
      chunkStreamId = chunk.readUIntBE(1, 1) + 64;
    }
    if (chunkStreamId === 1) {
      size = 3;
      // (third byte * 256) + (second byte + 64)
      chunkStreamId = chunk.readUIntBE(1, 2);
    }

    return {
      size,
      fmt,
      chunkStreamId,
    };
  }

  updateChunkState(basicHeader, chunk) {
    const currentState = this.streamStates.get(basicHeader.chunkStreamId);
    const { fmt } = basicHeader;
    let chunkDataStart = 0;
    switch (fmt) {
      case 0: {
        chunkDataStart = 11;
        let timestamp = chunk.readUIntBE(0, 3);
        // if equals to 0xFFFFFF
        if (timestamp >= 16777215) {
          chunkDataStart = 15;
          // get extended
          timestamp = chunk.readUIntBE(11, 4);
          currentState.haveExtended = true;
        } else {
          currentState.haveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const typeId = chunk.readUIntBE(6, 1);
        const streamId = chunk.readUIntLE(7, 4);

        currentState.timestamp = timestamp;
        currentState.timestampDelta = 0;
        currentState.length = length;
        currentState.typeId = typeId;
        currentState.streamId = streamId;
        break;
      }
      case 1: {
        chunkDataStart = 7;
        let timestampDelta = chunk.readUIntBE(0, 3);

        if (timestampDelta >= 16777215) {
          chunkDataStart = 11;
          timestampDelta = chunk.readUIntBE(7, 4);
          currentState.haveExtended = true;
        } else {
          currentState.haveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const typeId = chunk.readUIntBE(6, 1);

        currentState.timestampDelta = timestampDelta;
        currentState.length = length;
        currentState.typeId = typeId;
        break;
      }
      case 2: {
        chunkDataStart = 3;
        let timestampDelta = chunk.readUIntBE(0, 3);

        if (timestampDelta >= 16777215) {
          chunkDataStart = 7;
          timestampDelta = chunk.readUIntBE(3, 4);
          currentState.haveExtended = true;
        } else {
          currentState.haveExtended = false;
        }

        currentState.timestampDelta = timestampDelta;
        break;
      }
      case 3: {
        chunkDataStart = 0;
        if (currentState.haveExtended) {
          chunkDataStart = 4;
          const timestampDelta = chunk.readUIntBE(0, 4);
          currentState.timestampDelta = timestampDelta;
        }
        break;
      }
    }

    const length = Math.min(currentState.length, this.maxChunkSize);

    const chunkData = chunk.slice(chunkDataStart, chunkDataStart + length);
    currentState.chunkData = chunkData;
    currentState.totalSize = chunkDataStart + length;
    return currentState;
  }

  parseChunk(basicHeader, chunk) {
    const message = this.updateChunkState(basicHeader, chunk.slice(basicHeader.size));
    // Assume typeid 3 if there is a partial message
    let partialMessage = this.messageStates.get(basicHeader.chunkStreamId);
    if (partialMessage) {
      partialMessage = Buffer.concat([this.partialMessage.chunkData, message.chunkData]);
      if (partialMessage.chunkData.length >= message.messageLength) {
        // emit messager
        this.emit('message', partialMessage);
        this.messageStates.set(basicHeader.chunkStreamId, null);
      }
    } else if (this.maxChunkSize < message.messageLength) {
      // if message not received in full
      this.messageStates.set(basicHeader.chunkStreamId, message);
    } else if (message.typeId <= 2 && basicHeader.chunkStreamId === 2 && message.streamId === 0) {
      this.parseProtocolControlMessage(message);
    } else {
      // emit full message
      this.emit('message', message);
    }
    return (basicHeader.size + message.totalSize);
  }

  parseProtocolControlMessage(message) {
    switch (message.typeId) {
      case 1: {
        // chunks can't be larger than messages and messages can't be larger than 2^24 bytes
        const size = message.chunkData.readUIntBE(0, 4);
        this.maxChunkSize = Math.min(size, 0xFFFFFF);
        this.chunkEncoder.setMaxChunkSize(this.maxChunkSize);
        break;
      }
      case 2:
        this.streamStates.get(message.chunkStreamId).partialMessage = null;
        break;
      default:
        break;
    }
  }
}

module.exports = RTMPChunkStream;
