# node-rtmp

Uses AMF library at https://github.com/SwampApe/node-amf

## Usage
```
const RTMPServer = require('./RTMPServer');
const StreamReceiver = require('./StreamReceiver');

const server = new RTMPServer();
server.on('connection', (connection) => {
  const handler = new StreamReceiver(connection);
});
```
StreamReceiver currently spawns instances of ffmpeg and transcodes the stream to HLS variants.

## TODO

- [x] Handshake
- [x] Receiving messages on chunk stream
- [x] Handling chunk stream protocol messages (ids 1, 2)
- [x] Sending acknowledgement packets (id 3)
- [x] OBS connects to sample program
- [x] Encoding and sending message on chunk stream
- [x] Handling User Control Messages (id 4)
- [x] Multiplex data to flv file
- [ ] Config for server (So no new code needs to be written for simple usage)
- [ ] Sample site (Twitch clone)
- [ ] HLS
- [ ] Add common responses / messages to RTMPMessages
- [ ] Formatting / cleanup
- [ ] Performance
- [ ] Tests

