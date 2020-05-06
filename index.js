const RTMPServer = require('./RTMPServer');
const StreamReceiver = require('./StreamReceiver');


const server = new RTMPServer();
server.on('connection', (connection) => {
  const handler = new StreamReceiver(connection);
});
