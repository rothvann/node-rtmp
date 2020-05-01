const EventEmitter = require('events');

class RTMPMessageStream extends EventEmitter {
  constructor(messageTransport) {
    super();

    this.messageStreamHandlers = new Map();
    this.messageStreamHandlers.set(0, new MessageStreamHandler(this.emit));

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
    if (messageStreamHandlers.has(message.stream_id)) {
      this.messageStreamHandlers.get(message.stream_id).onMessage(message);
    } else {
      // log error invalid stream id
    }
  }
}

module.exports = RTMPMessageStream;
