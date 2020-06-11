const amfDecoder = require('amf2json');

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
      SET_BUFFER_LENGTH: 3,
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
        this.emit('Acknowledgement', size);
        break;
      }
      case this.messageTypes.USER_CONTROL_MESSAGE: {
        const eventType = message.chunkData.readUIntBE(0, 2);
        switch (eventType) {
          case this.userControlMessageEvents.STREAM_BEGIN: {
            const streamId = message.chunkData.readUIntBE(2, 4);
            this.emit('Stream Begin', streamId);
            break;
          }
          case this.userControlMessageEvents.STREAM_EOF: {
            const streamId = message.chunkData.readUIntBE(2, 4);
            this.emit('Stream EOF', streamId);
            break;
          }
          case this.userControlMessageEvents.STREAM_DRY: {
            const streamId = message.chunkData.readUIntBE(2, 4);
            this.emit('StreamDry', streamId);
            break;
          }
          case this.userControlMessageEvents.SET_BUFFER_LENGTH: {
            const streamId = message.chunkData.readUIntBE(2, 4);
            const bufferLength = message.chunkData.readUIntBE(6, 4);
            this.emit('SetBuffer Length', streamId, bufferLength);
            break;
          }
          case this.userControlMessageEvents.STREAM_IS_RECORDED: {
            const streamId = message.chunkData.readUIntBE(2, 4);
            this.emit('StreamIs Recorded', streamId);
            break;
          }
          case this.userControlMessageEvents.PING_REQUEST: {
            const timestamp = message.chunkData.readUIntBE(2, 4);
            this.emit('PingRequest', timestamp);
            break;
          }
          case this.userControlMessageEvents.PING_RESPONSE: {
            const timestamp = message.chunkData.readUIntBE(2, 4);
            this.emit('PingResponse', timestamp);
            break;
          }
          default:
          // unknown
            break;
        }
        break;
      }
      case this.messageTypes.WINDOW_ACKNOWLEDGEMENT_SIZE:
        const windowSize = message.chunkData.readUIntBE(0, 4);
        this.emit('Window Acknowledgement Size', windowSize);
        break;
      case this.messageTypes.SET_PEER_BANDWIDTH: {
        const bandwidth = message.chunkData.readUIntBE(0, 4);
        const limitType = message.chunkData.readUIntBE(4, 1);
        this.emit('Set Peer Bandwidth', bandwidth, limitType);
        break;
      }
      case this.messageTypes.AUDIO:
        this.emit('Audio', message);
        break;
      case this.messageTypes.VIDEO:
        this.emit('Video', message);
        break;
      case this.messageTypes.DATA_MESSAGE_AMF3:
      // prepend 0x11 if not there
      case this.messageTypes.DATA_MESSAGE_AMF0: {
        const amfMessage = amfDecoder.decode(message.chunkData);
        this.emit('Data Message', amfMessage);
        break;
      }
      case this.messageTypes.SHARED_OBJECT_MESSAGE_AMF3:
      // Does not support shared objects
      case this.messageTypes.SHARED_OBJECT_MESSAGE_AMF0:
      // No support >:(
        break;
      case this.messageTypes.COMMAND_MESSAGE_AMF3:
      // prepend 0x11 if not there
      case this.messageTypes.COMMAND_MESSAGE_AMF0:
        const amfMessage = amfDecoder.decode(message.chunkData);
        this.emit('Command Message', amfMessage);
        break;
      case this.messageTypes.AGGREGATE:
      // not yet either >:(
    }
  }
}

module.exports = RTMPMessageStreamHandler;
