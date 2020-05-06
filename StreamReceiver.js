const amfEncoder = require('amf2json');

const RTMPMessages = require('./RTMPMessages');


class StreamReceiver {
  constructor(rtmpConnection) {
    this.states = {
      WAITING: 0,
      CONNECTED: 1,
      RECEIVING: 2,
    };
    this.state = this.states.WAITING;
    this.rtmpConnection = rtmpConnection;

    this.rtmpConnection.registerHandler('Command Message', (message) => { this.onCommandMessage(message); });
    this.rtmpConnection.registerHandler('Data Message', (message) => { this.onDataMessage(message); });
  }

  configureStream() {
    // set peer bandwidth, window ack size, stream begin, set chunk size

  }

  onDataMessage(message) {

  }

  onCommandMessage(message) {
    // https://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/events/NetStatusEvent.html
    const commandName = message[0];
    switch (commandName) {
      case 'connect': {
        if (this.state === this.states.WAITING) {
          const CONNECT_SUCCESS = RTMPMessages.generateMessage(20, 0,
            amfEncoder.encodeAMF0([
              '_result',
              1,
              {
                fmsVer: 'FMS/3,5,7,7009',
                capabilities: 31.0,
                mode: 1,
              },
              {
                level: 'status',
                code: 'NetConnection.Connect.Success',
                description: 'Connection accepted',
                data: { string: '3,5,7,7009' },
                objectEncoding: 0,
              }]));
        } else {
          // err
        }

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
      case 'releaseStream':

      case 'FCPublish': {
        const onFCPublish = RTMPMessages.generateMessage(20, 0,
          amfEncoder.encodeAMF0([
            '_result',
            message[1],
            null,
            {
              level: 'status',
              code: 'NetStream.Publish.Start',
              description: `FCPublish to stream ${message[3]}`,
            }]));
        this.rtmpConnection.writeMessage(onFCPublish);
        break;
      }
      case 'publish': {
        break;
      }
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
