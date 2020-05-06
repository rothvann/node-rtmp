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

    this.currentStreamId = 0;
  }

  configureStream() {
    // set peer bandwidth, window ack size, stream begin, set chunk size
    this.rtmpConnection.writeMessage(RTMPMessages.generateWindowAcknowledgementSize(2500000));
    this.rtmpConnection.writeMessage(RTMPMessages.generateSetPeerBandwidth(2500000, 2));
    const streamIdBuffer = Buffer.alloc(4);
    streamIdBuffer.writeUIntBE(this.currentStreamId, 0, 4);
    this.currentStreamId += 1;
    const streamBegin = RTMPMessages.generateUserControlMessage(0, streamIdBuffer);
    this.rtmpConnection.writeMessage(streamBegin);
    this.rtmpConnection.writeMessage(RTMPMessages.generateSetChunkSize(4096));
  }

  onDataMessage(message) {
    // ignore for now
  }

  onCommandMessage(message) {
    // https://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/events/NetStatusEvent.html
    const commandName = message[0];
    switch (commandName) {
      case 'connect': {
        console.log('connected');
        this.configureStream();
        const CONNECT_SUCCESS = RTMPMessages.generateMessage(20, 0, amfEncoder.encodeAMF0([
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
          },
        ]));
        this.rtmpConnection.writeMessage(CONNECT_SUCCESS);


        break;
      }
      case 'close':
      // NetConnection.Connect.Closed;
      case 'call':
      // Reject
      case 'createStream': {
      /*
        String _result
        Number transaction id of command
        Null
        Number streamId
      */
        const result = RTMPMessages.generateMessage(20, 0, amfEncoder.encodeAMF0([
          '_result',
          message[1],
          null,
          this.currentStreamId,
        ]));

        this.rtmpConnection.writeMessage(result);
        const streamIdBuffer = Buffer.alloc(4);
        streamIdBuffer.writeUIntBE(this.currentStreamId, 0, 4);
        this.currentStreamId += 1;
        const streamBegin = RTMPMessages.generateUserControlMessage(0, streamIdBuffer);
        this.rtmpConnection.writeMessage(streamBegin);
        break;
      }
      case 'releaseStream': {
        break;
      }
      case 'FCPublish': {
        const onFCPublish = RTMPMessages.generateMessage(20, 0, amfEncoder.encodeAMF0([
          '_result',
          message[1],
          null,
          {
            level: 'status',
            code: 'NetStream.Publish.Start',
            description: `FCPublish to stream ${message[3]}`,
          },
        ]));
        this.rtmpConnection.writeMessage(onFCPublish);
        break;
      }
      case 'publish': {
        // onStatus
        const onStatus = RTMPMessages.generateMessage(20, 1, amfEncoder.encodeAMF0([
          'onStatus',
          message[1],
          null,
          {
            level: 'status',
            code: 'NetStream.Publish.Start',
            description: `Publishing ${message[3]}`,
          },
        ]));
        this.rtmpConnection.writeMessage(onStatus);
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

module.exports = StreamReceiver;
