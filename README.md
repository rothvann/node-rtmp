# node-rtmp


## TODO

- [x] Handshake
- [x] Receiving messages on chunk stream
- [x] Handling chunk stream protocol messages (ids 1, 2)
- [x] Sending acknowledgement packets (id 3)
- [x] OBS connects to sample program
- [x] Encoding and sending message on chunk stream
- [ ] Handling User Control Messages (id 4)
- [ ] Add common responses / messages to RTMPMessages
- [ ] ChunkStream needs to assume data received is a byte stream / chunks don't always come in packet sizes
- [ ] Multiplex data from OBS
- [ ] Formatting / cleanup
- [ ] Tests
- [ ] Performance (Preallocate buffers and use as circular queues). Must check flame graphs first. 

