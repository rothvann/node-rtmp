
class ChunkStreamEncoder {
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


    this.maxChunkSize = 128;
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
    // generate list of chunks
    const chunks = [];
    if (message.length > this.maxChunkSize) {
      // get state if exists
      if (this.streamStates.has(id)) {

      } else {
        // format 0
      }
    }
  }

  setMaxChunkSize(size) {
    this.maxChunkSize = 128;
  }
}
