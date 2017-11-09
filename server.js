const http = require('http');
const express = require('express');
const io = require('socket.io');
const bodyParser = require('body-parser');
global.appRoot = __dirname;

class Server {
  constructor() {
    this.app = express();
    this.init();
  }

  init() {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}));
    this.app.use(express.static('frontend/static'));
    this.app.use(express.static('frontend/dist'));
    this.app.use('/.well-known', express.static('.well-known'));

    this.initEnv();
    this.createServer();
    this.initSockets();
  }

  initEnv() {
    try {
      process.env.NODE_ENV = process.env.NODE_ENV? process.env.NODE_ENV : 'dev';
      console.log('Init env:', process.env.NODE_ENV);
    } catch (err) {
      console.log("Error when initialized env", {err});
      process.exit();
    }
  }

  initSockets() {
    this.io = io(this.server);

    this.io.on('connection', (socket) => {
      console.log('user connected');
      socket.broadcast.emit('connected');

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });

      socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
      })
    });
  }

  createServer() {
    const port = process.env.PORT || 3001;
    this.server = http.createServer(this.app);
    this.server.listen(port, () => {
      console.log(`Start listening on localhost:${port}`)
    });
  }

}

module.exports = new Server;