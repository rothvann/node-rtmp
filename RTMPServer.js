const net = require('net');
const RTMPConnection = require('./RTMPConnection');
const RTMPChunkStream = require('./RTMPChunkStream');
const RTMPMessageStream = require('./RTMPMessageStream');

class RTMPServer {
  constructor() {
    this.tcpServer = new net.Server();

    this.port = 1935;
    this.rtmpConnections = [];
    this.chunkStreams = [];
    this.messageStreams = [];

    this.onCommandMessage = this.onCommandMessage.bind(this);

    this.tcpServer.on('connection', (socket) => {
      const chunkStream = new RTMPChunkStream();
      const messageStream = new RTMPMessageStream(chunkStream);
      const rtmpConnection = new RTMPConnection(socket, messageStream);
      this.messageStreams.push(messageStream);
      this.rtmpConnections.push(rtmpConnection);
      messageStream.on('Command Message', this.onCommandMessage);
    });


    this.tcpServer.listen(this.port);
  }

  onCommandMessage(message) {
    /*
    connect
    call
    close
    createStream
    */
    // https://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/events/NetStatusEvent.html
    const commandName = message[0];
    switch (commandName) {
      case 'connect': {
        const commandObj = message[2];

        break;
      }
      case 'close':
      // NetConnection.Connect.Closed;
      case 'call':
      // Reject
      case 'createStream':
      /*
        String _result
        Number transaction id of command
        Null
        Number streamId
      */
      case 'publish':
    }
  }
  // connect ->
  // <-  _result
  // releaseStream ->
  // FCPublish ->
  // <- onFCPublish
  // <- _result
  // <- Stream Begin
  // Publish ->
  // <- onStatus
  // setDataFrame ->
  // audio/vid ->
}


module.exports = RTMPServer;
