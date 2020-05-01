const EventEmitter = require('events');

class RTMPMessageStream extends EventEmitter {
  constructor(messageEmitter) {
    super();

    this.onMessage = this.onMessage.bind(this);
    this.messageEmitter = messageEmitter;
    this.messageEmitter.on('message', this.onMessage);
  }

  onData(data) {
    this.messageEmitter.onData(data);
  }

  onMessage(message) {
    switch (message.type_id) {

    }
  }
}

module.exports = RTMPMessageStream;
