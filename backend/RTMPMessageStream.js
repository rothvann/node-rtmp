const EventEmitter = require('events');
const RTMPMessageStreamHandler = require('./RTMPMessageStreamHandler');

class RTMPMessageStream extends EventEmitter {
  constructor() {
    super();
    this.messageStreamHandlers = new Map();
    this.onMessage = this.onMessage.bind(this);
    
    this.createStream(0);

    this.timestamp = 0;
    this.prevTimestamp = 0;
  }

  setEpoch(epoch) {
    // this.prevTimestamp = epoch;
    // apparently obs ignores specified epoch and starts at 0
  }

  emitConnectionEvent(event, data) {
    this.emit(event, data);
  }

  createStream(streamId) {
    const newStream = new RTMPMessageStreamHandler(this.emit.bind(this));
    this.messageStreamHandlers.set(streamId, newStream);
  }

  onMessage(message) {
    // get delta
    if (message.timestamp < this.prevTimestamp) {
      this.timestamp += 0xFFFFFFFF - this.prevTimestamp;
      this.timestamp += message.timestamp;
    } else {
      this.timestamp += message.timestamp - this.prevTimestamp;
    }

    
    // Adjust to real timestamp
    this.prevTimestamp = message.timestamp;
    message.realTimestamp = this.timestamp;

    if (!this.messageStreamHandlers.has(message.streamId)) {
      this.createStream(message.streamId);
    }
    this.messageStreamHandlers.get(message.streamId).onMessage(message);
  }
}

module.exports = RTMPMessageStream;
