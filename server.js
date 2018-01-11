const http = require('http');
const express = require('express');
const forceSsl = require('force-ssl-heroku');
const io = require('socket.io');
const bodyParser = require('body-parser');
const EventsConfig = require('./routing/EventsConfig');
global.appRoot = __dirname;

const utils = require(`${appRoot}/utils`);

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
    this.app.use(forceSsl);

    this.initEnv();
    this.createServer();
    this.initSockets();

    this.rooms = []
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
    const cookieParser = require('socket.io-cookie-parser');
    const eventsConfig = new EventsConfig();
    this.io = io(this.server);
    this.io.use(cookieParser());

    this.io.on('connection', eventsConfig.onConnect.bind(eventsConfig));
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