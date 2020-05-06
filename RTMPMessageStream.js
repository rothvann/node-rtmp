const EventEmitter = require('events');
const RTMPMessageStreamHandler = require('./RTMPMessageStreamHandler');

class RTMPMessageStream extends EventEmitter {
  constructor(messageTransport) {
    super();
    this.onMessage.bind(this);
    this.messageStreamHandlers = new Map();

    this.createStream(0);

    this.onMessage = this.onMessage.bind(this);
    this.messageTransport = messageTransport;
    this.messageTransport.on('message', this.onMessage);
  }

  emitConnectionEvent(event, data) {
    this.emit(event, data);
  }

  createStream(streamId) {
    const newStream = new RTMPMessageStreamHandler(this.emit.bind(this));
    this.messageStreamHandlers.set(streamId, newStream);
  }

  encodeMessage(message) {
    return this.messageTransport.encodeMessage(message);
  }

  onData(data) {
    this.messageTransport.onData(data);
  }

  onMessage(message) {
    if (!this.messageStreamHandlers.has(message.streamId)) {
      this.createStream(message.streamId);
    }
    this.messageStreamHandlers.get(message.streamId).onMessage(message);
  }
}

module.exports = RTMPMessageStream;
