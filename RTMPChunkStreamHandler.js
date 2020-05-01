
// Collects chunks from each stream and emits a message to the event handler

class RTMPChunkStreamHandler {
  constructor(emit) {
    this.emit = emit;
    this.prevTimestamp;
    this.prevTimestampDelta;
    this.prevLength;
    this.prevTypeId;
    this.prevStreamId;
    this.prevHaveExtended = false;

    this.parseMessageHeader = this.parseMessageHeader.bind(this);
    this.parseChunk = this.parseChunk.bind(this);
    this.parseProtocolControlMessage = this.parseProtocolControlMessage.bind(this);

    this.max_chunk_size = 128;
    this.partialMessage = null;
  }


  static parseBasicHeader(chunk) {
    const basicHeader = chunk.read(1).readUIntBE(0, 1);
    // First two bits
    const fmt = basicHeader >> 6;
    // Last 6 bits
    let cs_id = basicHeader & 0x3F;
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
      chunkStreamId: chunkStreamId,
    };
  }

  parseMessageHeader(fmt, chunk) {
    let chunk_data_start = 0;
    switch (fmt) {
      case 0: {
        chunk_data_start = 11;
        let timestamp = chunk.readUIntBE(0, 3);
        // if equals to 0xFFFFFF
        if (timestamp >= 16777215) {
          chunk_data_start = 15;
          // get extended
          timestamp = chunk.readUIntBE(11, 4);
          this.prevHaveExtended = true;
        } else {
          this.prevHaveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const type_id = chunk.readUIntBE(6, 1);
        const stream_id = chunk.readUIntLE(7, 4);

        this.prevTimestamp = timestamp;
        this.prevTimestampDelta = 0;
        this.prevLength = length;
        this.prevTypeId = type_id;
        this.prevStreamId = stream_id;
        break;
      }
      case 1: {
        chunk_data_start = 7;
        let timestamp_delta = chunk.readUIntBE(0, 3);

        if (timestamp_delta >= 16777215) {
          chunk_data_start = 11;
          timestamp_delta = chunk.readUIntBE(7, 4);
          this.prevHaveExtended = true;
        } else {
          this.prevHaveExtended = false;
        }

        const length = chunk.readUIntBE(3, 3);
        const type_id = chunk.readUIntBE(6, 1);

        this.prevTimestampDelta = timestamp_delta;
        this.prevLength = length;
        this.prevTypeId = type_id;
        break;
      }
      case 2: {
        chunk_data_start = 3;
        let timestamp_delta = chunk.readUIntBE(0, 3);

        if (timestamp_delta >= 16777215) {
          chunk_data_start = 7;
          timestamp_delta = chunk.readUIntBE(3, 4);
          this.prevHaveExtended = true;
        } else {
          this.prevHaveExtended = false;
        }

        this.prevTimestampDelta = timestamp_delta;
        break;
      }
      case 3: {
        chunk_data_start = 0;
        if (this.prevHaveExtended) {
          chunk_data_start = 4;
          const timestamp_delta = chunk.readUIntBE(0, 4);
          this.prevTimestampDelta = timestamp_delta;
        }
        break;
      }
    }

    const length = min(this.prevLength, max_chunk_size);

    const chunk_data = chunk.slice(chunk_data_start, chunk_data_start + length);

    return {
      timestamp: this.prevTimestamp,
      timestamp_delta: this.prevTimestampDelta,
      size: length + chunk_data_start,
      type_id: this.prevTypeId,
      stream_id: this.prevStreamId,
      message_length: this.prevLength,
      chunk_data,
    };
  }

  parseChunk(basicHeader, chunk) {
    const message = this.parseMessageHeader(basicHeader.fmt, chunk.slice(basicHeader.size));

    // Assume typeid 3 if there is a partial message
    if (partialMessage) {
      this.partialMessage = Buffer.concat([this.partialMessage.chunk_data, message.chunk_data]);
      if (this.partialMessage.chunk_data.length >= message.message_length) {
        // emit message
        message.chunk_data = this.partialMessage;
        this.emit(message);
        this.partialMessage = null;
        this.partialMessage_length = 0;
      }
    } else {
      // if message not received in full
      if (this.max_chunk_size < message.chunk_data.message_length) {
        this.partialMessage = message;
      } else {
        // emit full message
        this.emit(message);
      }
    }
    if (basicHeader.chunkStreamId == 2 && message.stream_id == 0) {

    }
  }

  parseProtocolControlMessage(message) {

    // protocol control message
    /*
        1. Set Chunk Size
        2. Discard chunk stream ids  (4 bits)
        3. Acknowledgement
        5. Window Acknowledgement Size
        6. Set Peer Bandwidth
        */

  }
}

module.exports = RTMPChunkStreamHandler;
