const amfEncoder = require('amf2json');

const fs = require('fs');
const { spawn } = require('child_process');
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
    this.rtmpConnection.registerHandler('Video', (data) => { this.onVideo(data); });
    this.rtmpConnection.registerHandler('Audio', (data) => { this.onAudio(data); });
    this.video = fs.createWriteStream('test.flv');

    this.configureTranscoder();
    
    this.configureFLVHeader();
    

    this.currentStreamId = 0;
  }
  
  configureTranscoder() {
    //create master playlist
    
    //
    const config = `-i pipe:0 
    -c:v libx264 -x264opts keyint=120:no-scenecut -s 1920x1080 -r 60 -profile:v main -preset veryfast -c:a aac -sws_flags bilinear -hls_list_size 0 1920.m3u8
    -c:v libx264 -x264opts keyint=120:no-scenecut -s 1280x720 -r 60 -profile:v main -preset veryfast -c:a aac -sws_flags bilinear -hls_list_size 0 720.m3u8
    -c:v libx264 -x264opts keyint=120:no-scenecut -s 1280x720 -r 30 -profile:v main -preset veryfast -c:a aac -sws_flags bilinear -hls_list_size 0 720r30.m3u8
    -c:v libx264 -x264opts keyint=120:no-scenecut -s 852x480 -r 30 -profile:v main -preset veryfast -c:a aac -sws_flags bilinear -hls_list_size 0 480r30.m3u8 
    `.split(' ').filter(option => option.length > 0  & option != '\n').map(option => option.trim());
    console.log(config);
    this.ffmpeg = spawn('ffmpeg.exe', config);
    this.ffmpeg.stderr.on('data', err => {
      console.log(err.toString());
    });
  }

  configureFLVHeader() {
    const flvHeader = Buffer.alloc(9);
    flvHeader.write('FLV');
    flvHeader.writeUIntBE(0x01, 3, 1);
    flvHeader.writeUIntBE(0x05, 4, 1);
    flvHeader.writeUIntBE(0x09, 5, 4);

    const tagSize = Buffer.alloc(4);
    tagSize.writeUIntBE(0, 0, 4);

    this.video.write(flvHeader);
    this.video.write(tagSize);
    
    this.transcodeToHLS(flvHeader);
    this.transcodeToHLS(tagSize);
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
  
  transcodeToHLS(data) {
    this.ffmpeg.stdin.write(data);
  }

  writeTag(tagType, message) {
    const tag = Buffer.alloc(11);
    tag.writeUIntBE(tagType, 0, 1);
    tag.writeUIntBE(message.chunkData.length, 1, 3);
    const timestamp = Buffer.alloc(4);
    timestamp.writeUIntBE(message.timestamp, 0, 4);
    tag[4] = (message.timestamp >> 16) & 0xff;
    tag[5] = (message.timestamp >> 8) & 0xff;
    tag[6] = message.timestamp & 0xff;
    tag[7] = (message.timestamp >> 24) & 0xff;
    tag.writeUIntBE(0x00, 8, 3);

    const tagSize = Buffer.alloc(4);
    tagSize.writeUIntBE(message.chunkData.length + 11, 0, 4);

    const toWrite = Buffer.concat([tag, message.chunkData, tagSize]);

    this.video.write(toWrite);
    
    this.transcodeToHLS(toWrite);
  }

  onAudio(message) {
    this.writeTag(0x08, message);
  }

  onVideo(message) {
    this.writeTag(0x09, message);
  }

  onDataMessage(message) {
    // ignore for now
  }

  onCommandMessage(message) {
    // https://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/events/NetStatusEvent.html
    const commandName = message[0];
    switch (commandName) {
      case 'connect': {
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
        break;
      case 'call':
      // Reject
        break;
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
      case 'FCUnpublish': {
        this.video.end();
        this.ffmpeg.stdin.end();
      }
    }
  }


  /*
   connect ->
   <-  _result
   releaseStream ->
   FCPublish ->
   <- onFCPublish
   <- _result
   <- Stream Begin
   Publish ->
   <- onStatus
   setDataFrame ->
   audio/vid ->
 */
}

module.exports = StreamReceiver;
