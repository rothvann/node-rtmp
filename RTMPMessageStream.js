const EventEmitter = require('events');

class RTMPMessageStream extends EventEmitter {
  constructor(messageEmitter) {
    super();

    this.messageStreamHandlers = new Map();
    this.messageStreamHandlers.set(0, new MessageStreamHandler(this.emit));

    this.onMessage = this.onMessage.bind(this);
    this.messageEmitter = messageEmitter;
    this.messageEmitter.on('message', this.onMessage);
  }

  onData(data) {
    this.messageEmitter.onData(data);
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
