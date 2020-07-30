const RTMPServer = require('./RTMPServer');
const StreamServer = require('./StreamServer');
const express = require('express');
const cors = require('cors')
const http = require('http');

const server = new RTMPServer();
const streamHandlers = new Map();

const app = express();
app.use(cors());
const webServer = http.createServer(app);
webServer.listen(3476);

if(process.env.sslOn) {
  //create https server
}

server.on('connection', (connection) => {
  const handler = new StreamServer(connection);
  let uuid = handler.getUUID();
  connection.on('close', () => {
    streamHandlers.delete(uuid);
  });
  streamHandlers.set(uuid, handler);
});

app.get('/api/stream/list', function(req, res) {
  let uuids = [...streamHandlers.keys()]
  res.json({uuids: uuids});
});

