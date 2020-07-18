const RTMPServer = require('./RTMPServer');
const StreamServer = require('./StreamServer');
const express = require('express');
const http = require('http');

const server = new RTMPServer();
const streamHandlers = [];

const app = express();
const webServer = http.createServer(app);
webServer.listen(80);

if(process.env.sslOn) {
  //create https server
}

server.on('connection', (connection) => {
  const handler = new StreamServer(connection);
  streamHandlers.push(handler);
});

app.get('/api/stream/list', function(req, res) {
  streamHandlers.map(handler => {
    //get stream thumbnails and urls from each
  });
});

