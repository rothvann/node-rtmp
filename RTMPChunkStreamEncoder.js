
class RTMPChunkStreamEncoder {
  constructor() {
    this.typeIdToChunkStreamId = {
      1: 2,
      2: 2,
      3: 2,
      4: 2,
      5: 2,
      6: 2,
      8: 6,
      9: 7,
      17: 3,
      20: 3,
      15: 4,
      18: 4,
    };
    this.streamStates = new Map();
    this.newStreamState = {
      prevTimestamp: null,
      prevTimestampDelta: null,
      prevLength: null,
      prevTypeId: null,
      prevStreamId: null,
      prevHaveExtended: false,
    };

    this.haveExtendedTimestamp = Buffer.from([0xFF, 0xFF, 0xFF]);

    this.maxChunkSize = 128;
  }

  generateTimestamp() {
    // Zero fill right shift results in a unsigned 32 bit(4 bytes) integer
    // Truncates 4 bytes off of 8 byte timestamp
    const time = Date.now() >>> 0;
    let length = 3;
    let timestamp;
    if (time >= 0xFFFFFF) {
      length = 4;
    }
    timestamp = Buffer.alloc(length);
    timestamp.writeUIntBE(time, 0, length);
    return timestamp;
  }

  encode(message) {
    let id;
    if (message.typeId <= 6) {
      id = 2;
    } else {
      switch (message.typeId) {
        case 8:
          id = 6;
          break;
        case 9:
          id = 7;
          break;
        case 17:
        case 20:
          id = 3;
          break;
        case 15:
        case 18:
          break;
        case 16:
        case 19:
          break;
      }
    }

    const messageLength = Buffer.alloc(3);
    const typeId = Buffer.alloc(1);
    const streamId = Buffer.alloc(4);

    let timestamp = this.generateTimestamp();
    let extendedTimestamp = Buffer.from([]);
    if (timestamp.length == 4) {
      extendedTimestamp = timestamp;
      timestamp = this.haveExtendedTimestamp;
    }

    messageLength.writeUIntBE(message.length, 0, 3);
    typeId.writeUIntBE(message.typeId, 0, 1);
    streamId.writeUIntBE(message.streamId, 0, 4);

    if (message.length < this.maxChunkSize) {
      // get state if exists
      const basicHeader = Buffer.alloc(1);
      let messageHeader;
      if (this.streamStates.has(id)) {
        const streamState = this.streamState.get(id);
        if (streamState.prevStreamId === message.streamId) {
          if (streamState.prevLength === message.length) {
            // format 2
            basicHeader.writeUIntBE(id | 0b10000000, 0, 1);
            return Buffer.concat([basicHeader, timestamp, extendedTimestamp, message.data]);
          }
          // format 1
          basicHeader.writeUIntBE(id | 0b01000000, 0, 1);
          return Buffer.concat([basicHeader, timestamp, messageLength, typeId, extendedTimestamp, message.data]);
        }
        // format 0
        basicHeader.writeUIntBE(id | 0b00000000, 0, 1);
        return Buffer.concat([basicHeader, timestamp, messageLength, typeId, streamId, extendedTimestamp, message.data]);
      }
      basicHeader.writeUIntBE(id | 0b00000000, 0, 1);
      return Buffer.concat([basicHeader, timestamp, messageLength, typeId, streamId, extendedTimestamp, message.data]);
    }
  }

  setMaxChunkSize(size) {
    this.maxChunkSize = size;
  }
}

module.exports = RTMPChunkStreamEncoder;
