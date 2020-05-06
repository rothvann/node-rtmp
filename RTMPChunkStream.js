const EventEmitter = require('events');
const RTMPChunkStreamEncoder = require('./RTMPChunkStreamEncoder');

// Receives and sends chunks to the right chunk stream handler

class RTMPChunkStream extends EventEmitter {
  constructor() {
    super();
    this.chunkStreamStates = new Map();
    this.messageStates = new Map();
    // this.chunkEncoder = new RTMPChunkStreamEncoder();
    this.newChunkState = {
      prevTimestamp: null,
      prevTimestampDelta: null,
      prevLength: null,
      prevTypeId: null,
      prevStreamId: null,
      prevHaveExtended: false,
      partialMessage: null,
    };

    this.chunkStreamStates.set(2, this.newChunkState);

    this.maxChunkSize = 128;
  }

  encodeMessage(message) {
    // this.chunkEncoder.encode(message);
  }

  onData(data) {
    const basicHeader = RTMPChunkStreamHandler.parseBasicHeader(data);
    if (!this.chunkStreamStates.has(basicHeader.chunkStreamId)) {
      this.chunkStreamStates.set(basicHeader.chunkStreamId, this.newChunkState);
    }
    this.parseChunk(basicHeader, data);
  }


  parseBasicHeader(chunk) {
    const basicHeader = chunk.read(1).readUIntBE(0, 1);
    // First two bits
    const fmt = basicHeader >> 6;
    // Last 6 bits
    let chunkStreamId = basicHeader & 0x3F;
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

  updateChunkState(fmt, chunk) {
    const currentState = this.chunkStreamStates.get(fmt.chunkStreamId);
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
          currentState.prevHaveExtended = true;
        } else {
          currentState.prevHaveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const typeId = chunk.readUIntBE(6, 1);
        const streamId = chunk.readUIntLE(7, 4);

        currentState.prevTimestamp = timestamp;
        currentState.prevTimestampDelta = 0;
        currentState.prevLength = length;
        currentState.prevTypeId = typeId;
        currentState.prevStreamId = streamId;
        break;
      }
      case 1: {
        chunkDataStart = 7;
        let timestampDelta = chunk.readUIntBE(0, 3);

        if (timestampDelta >= 16777215) {
          chunkDataStart = 11;
          timestampDelta = chunk.readUIntBE(7, 4);
          currentState.prevHaveExtended = true;
        } else {
          currentState.prevHaveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const typeId = chunk.readUIntBE(6, 1);

        currentState.prevTimestampDelta = timestampDelta;
        currentState.prevLength = length;
        currentState.prevTypeId = typeId;
        break;
      }
      case 2: {
        chunkDataStart = 3;
        let timestampDelta = chunk.readUIntBE(0, 3);

        if (timestampDelta >= 16777215) {
          chunkDataStart = 7;
          timestampDelta = chunk.readUIntBE(3, 4);
          currentState.prevHaveExtended = true;
        } else {
          currentState.prevHaveExtended = false;
        }

        currentState.prevTimestampDelta = timestampDelta;
        break;
      }
      case 3: {
        chunkDataStart = 0;
        if (currentState.prevHaveExtended) {
          chunkDataStart = 4;
          const timestampDelta = chunk.readUIntBE(0, 4);
          currentState.prevTimestampDelta = timestampDelta;
        }
        break;
      }
    }

    const length = min(currentState.prevLength, this.maxChunkSize);

    const chunkData = chunk.slice(chunkDataStart, chunkDataStart + length);
    currentState.chunkDate = chunkData;

    return currentState;
  }

  parseChunk(basicHeader, chunk) {
    const message = this.parseMessageHeader(basicHeader.fmt, chunk.slice(basicHeader.size));

    // Assume typeid 3 if there is a partial message
    let partialMessage = this.messageState.get(fmt.chunkStreamId);
    if (partialMessage) {
      partialMessage = Buffer.concat([this.partialMessage.chunkData, message.chunkData]);
      if (partialMessage.chunkData.length >= message.messageLength) {
        // emit messager
        this.emit(partialMessage);
        this.messageState.set(basicHeader.chunkStreamId, null);
      }
    } else if (this.maxChunkSize < message.chunkData.messageLength) {
      // if message not received in full
      this.messageState.set(basicHeader.chunkStreamId, message);
    } else if (message.typeId <= 2 && basicHeader.chunkStreamId === 2 && message.streamId === 0) {
      this.parseProtocolControlMessage(message);
    } else {
      // emit full message
      this.emit(message);
    }
  }

  parseProtocolControlMessage(message) {
    switch (message.typeId) {
      case 1: {
        // chunks can't be larger than messages and messages can't be larger than 2^24 bytes
        const size = message.chunkData.readIntBE(0, 4);
        this.maxChunkSize = min(size, 0xFFFFFF);
        break;
      }
      case 2:
        this.chunkStreamStates.get(message.chunkStreamId).partialMessage = null;
        break;
      default:
        break;
    }
  }
}

module.exports = RTMPChunkStream;
