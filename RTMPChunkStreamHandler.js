
// Collects chunks from each stream and emits a message to the event handler

class RTMPChunkStreamHandler {
  constructor(emit) {
    this.emit = emit;
    this.prevTimestamp = null;
    this.prevTimestampDelta = null;
    this.prevLength = null;
    this.prevTypeId = null;
    this.prevStreamId = null;
    this.prevHaveExtended = false;

    this.parseMessageHeader = this.parseMessageHeader.bind(this);
    this.parseChunk = this.parseChunk.bind(this);
    this.parseProtocolControlMessage = this.parseProtocolControlMessage.bind(this);

    this.maxChunkSize = 128;
    this.partialMessage = null;
  }


  static parseBasicHeader(chunk) {
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

  parseMessageHeader(fmt, chunk) {
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
          this.prevHaveExtended = true;
        } else {
          this.prevHaveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const typeId = chunk.readUIntBE(6, 1);
        const streamId = chunk.readUIntLE(7, 4);

        this.prevTimestamp = timestamp;
        this.prevTimestampDelta = 0;
        this.prevLength = length;
        this.prevTypeId = typeId;
        this.prevStreamId = streamId;
        break;
      }
      case 1: {
        chunkDataStart = 7;
        let timestampDelta = chunk.readUIntBE(0, 3);

        if (timestampDelta >= 16777215) {
          chunkDataStart = 11;
          timestampDelta = chunk.readUIntBE(7, 4);
          this.prevHaveExtended = true;
        } else {
          this.prevHaveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const typeId = chunk.readUIntBE(6, 1);

        this.prevTimestampDelta = timestampDelta;
        this.prevLength = length;
        this.prevTypeId = typeId;
        break;
      }
      case 2: {
        chunkDataStart = 3;
        let timestampDelta = chunk.readUIntBE(0, 3);

        if (timestampDelta >= 16777215) {
          chunkDataStart = 7;
          timestampDelta = chunk.readUIntBE(3, 4);
          this.prevHaveExtended = true;
        } else {
          this.prevHaveExtended = false;
        }

        this.prevTimestampDelta = timestampDelta;
        break;
      }
      case 3: {
        chunkDataStart = 0;
        if (this.prevHaveExtended) {
          chunkDataStart = 4;
          const timestampDelta = chunk.readUIntBE(0, 4);
          this.prevTimestampDelta = timestampDelta;
        }
        break;
      }
    }

    const length = min(this.prevLength, this.maxChunkSize);

    const chunkData = chunk.slice(chunkDataStart, chunkDataStart + length);

    return {
      timestamp: this.prevTimestamp,
      timestampDelta: this.prevTimestampDelta,
      size: length + chunkDataStart,
      typeId: this.prevTypeId,
      streamId: this.prevStreamId,
      messageLength: this.prevLength,
      chunkData,
    };
  }

  parseChunk(basicHeader, chunk) {
    const message = this.parseMessageHeader(basicHeader.fmt, chunk.slice(basicHeader.size));

    // Assume typeid 3 if there is a partial message
    if (partialMessage) {
      this.partialMessage = Buffer.concat([this.partialMessage.chunkData, message.chunkData]);
      if (this.partialMessage.chunkData.length >= message.messageLength) {
        // emit message
        message.chunkData = this.partialMessage;
        this.emit(message);
        this.partialMessage = null;
      }
    } else if (this.maxChunkSize < message.chunkData.messageLength) {
      // if message not received in full
      this.partialMessage = message;
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
        this.partialMessage = null;
        break;
      default:
        break;
    }
  }
}

module.exports = RTMPChunkStreamHandler;
