const EventEmitter = require('events');
const RTMPMessageStreamHandler = require('./RTMPMessageStreamHandler');

class RTMPMessageStream extends EventEmitter {
  constructor(messageTransport) {
    super();

    this.messageStreamHandlers = new Map();
    this.messageStreamHandlers.set(0, new RTMPMessageStreamHandler(this.emit));

    this.onMessage = this.onMessage.bind(this);
    this.messageTransport = messageTransport;
    this.messageTransport.on('message', this.onMessage);
  }

  formatMessage(message) {
    return this.messageTransport.formatMessage(message);
  }

  onData(data) {
    this.messageTransport.onData(data);
  }

  onMessage(message) {
    if (messageStreamHandlers.has(message.streamId)) {
      this.messageStreamHandlers.get(message.streamId).onMessage(message);
    } else {
      // log error invalid stream id
    }
  }
}

module.exports = RTMPMessageStream;
