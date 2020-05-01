
class RTMPMessageStreamHandler {
  constructor(emit) {
    this.eventTypes = {
      ACKNOWLEDGEMENT: 3,
      USER_CONTROL_MESSAGE: 4,
      WINDOW_ACKNOWLEDGEMENT_SIZE: 5,
      SET_PEER_BANDWIDTH: 6,
      AUDIO: 8,
      VIDEO: 9,
      DATA_MESSAGE_AMF3: 15,
      SHARED_OBJECT_MESSAGE_AMF3: 16,
      COMMAND_MESSAGE_AMF3: 17,
      DATA_MESSAGE_AMF0: 18,
      SHARED_OBJECT_MESSAGE_AMF0: 19,
      COMMAND_MESSAGE_AMF0: 20,
      AGGREGATE: 22,
    };

    this.emit = emit;
  }

  onMessage(message) {
    switch (message.typeId) {
      case this.eventTypes.ACKNOWLEDGEMENT:
        // Not sure if I should do anything
        break;
      case this.eventTypes.USER_CONTROL_MESSAGE:

      case this.eventTypes.WINDOW_ACKNOWLEDGEMENT_SIZE:
        const windowSize = message.chunkData.readUIntBE(0, 4);
        this.emit('Window Acknowledgement Size', windowSize);
        break;
      case this.eventTypes.SET_PEER_BANDWIDTH: {
        const bandwidth = message.chunkData.readUIntBE(0, 4);
        const limitType = message.chunkData.readUIntBE(4, 1);
        this.emit('SET PEER BANDWIDTH', bandwidth, limitType);
        break;
      }
      case this.eventTypes.AUDIO:

      case this.eventTypes.VIDEO:

      case this.eventTypes.DATA_MESSAGE_AMF3:

      case this.eventTypes.SHARED_OBJECT_MESSAGE_AMF3:

      case this.eventTypes.COMMAND_MESSAGE_AMF3:

      case this.eventTypes.DATA_MESSAGE_AMF0:

      case this.eventTypes.SHARED_OBJECT_MESSAGE_AMF0:

      case this.eventTypes.COMMAND_MESSAGE_AMF0:
    }
  }
}

module.exports = RTMPMessageStreamHandler;
