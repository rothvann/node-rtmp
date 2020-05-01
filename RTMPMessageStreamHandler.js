
class RTMPMessageStreamHandler {
  constructor(emit) {
    this.messageTypes = {
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

    this.userControlMessageEvents = {
      STREAM_BEGIN: 0,
      STREAM_EOF: 1,
      STREAM_DRY: 2,
      SET_BUFFER: 3,
      STREAM_IS_RECORDED: 4,
      PING_REQUEST: 6,
      PING_RESPONSE: 7,
    };

    this.emit = emit;
  }

  onMessage(message) {
    switch (message.typeId) {
      case this.messageTypes.ACKNOWLEDGEMENT: {
        const size = message.chunkData.readUIntBE(0, 4);
        this.emit('ACKNOWLEDGEMENT', size);
        break;
      }
      case this.messageTypes.USER_CONTROL_MESSAGE:
      case this.userControlMessageEvents.STREAM_BEGIN:

      case this.userControlMessageEvents.STREAM_EOF:

      case this.userControlMessageEvents.STREAM_DRY:

      case this.userControlMessageEvents.SET_BUFFER:

      case this.userControlMessageEvents.STREAM_IS_RECORDED:

      case this.userControlMessageEvents.PING_REQUEST:

      case this.userControlMessageEvents.PING_RESPONSE:


      case this.messageTypes.WINDOW_ACKNOWLEDGEMENT_SIZE:
        const windowSize = message.chunkData.readUIntBE(0, 4);
        this.emit('Window Acknowledgement Size', windowSize);
        break;
      case this.messageTypes.SET_PEER_BANDWIDTH: {
        const bandwidth = message.chunkData.readUIntBE(0, 4);
        const limitType = message.chunkData.readUIntBE(4, 1);
        this.emit('SET PEER BANDWIDTH', bandwidth, limitType);
        break;
      }
      case this.messageTypes.AUDIO:

      case this.messageTypes.VIDEO:

      case this.messageTypes.DATA_MESSAGE_AMF3:

      case this.messageTypes.SHARED_OBJECT_MESSAGE_AMF3:
      // Does not support shared objects
        break;
      case this.messageTypes.COMMAND_MESSAGE_AMF3:

      case this.messageTypes.DATA_MESSAGE_AMF0:

      case this.messageTypes.SHARED_OBJECT_MESSAGE_AMF0:
      // No support >:(
        break;
      case this.messageTypes.COMMAND_MESSAGE_AMF0:
    }
  }
}

module.exports = RTMPMessageStreamHandler;
