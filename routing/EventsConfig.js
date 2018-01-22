const vkAuthMiddleware = require('./VkAuthMiddleware');
const utils = require('../utils');

class Events {
  constructor(io) {
    this.io = io;
    this.state = {
      game: false,
      hostWord: null
    }
  }

  onConnect(socket) {
    vkAuthMiddleware(socket).then(() => {
      socket.broadcast.emit('connected');
      this.initEvents(socket);
      if (Object.keys(this.io.sockets.connected).length > 1 && !this.state.game)
        this.startGame();
    });

  }

  initEvents(socket) {
    socket.on('disconnect', () => {
      console.log('user disconnected');
      if (Object.keys(this.io.sockets.connected).length < 2) {
        this.state.game = false;
        this.state.hostWord = null;
      }

    });

    socket.on('drawing', data => {
      if (this.state.game && !socket.user.host)
        return;
      socket.broadcast.emit('drawing', data);
    });

    socket.on('send_message', message => {
      message = message.toString().trim().toLowerCase();
      this.io.sockets.emit('new_message', {
        user: socket.user,
        message
      });
      if (this.state.game && this.state.hostWord) {
        if (message.indexOf(this.state.hostWord) !== -1) {
          console.log('WIN')
          this.io.sockets.emit('game_winner', socket.user);
          if (Object.keys(this.io.sockets.connected).length > 1)
            this.startGame();
        }
      }
    });

    socket.on('select_host_word', word => {
      this.state.hostWord = word.toString().trim().toLowerCase();
    });

    /*socket.on('create_room', () => {
      const roomName = utils.randStr();
      this.rooms.push(roomName);
      socket.join(roomName);
      this.io.emit('rooms', this.rooms);
    });

    socket.on('rooms', () => {
      socket.emit('rooms', this.rooms);
    });

    socket.on('join_room', room => {
      socket.join(room);
      socket.room = room;
    })*/
  }

  startGame() {
    this.state.game = true;
    const host = this.io.sockets.connected[Object.keys(this.io.sockets.connected)[utils.randInt(0, Object.keys(this.io.sockets.connected).length-1)]];
    host.user.host = true;

    console.log('GAME STARTS WITH HOST:', host.id);
    this.io.sockets.emit('game_start', host.user);
    host.emit('host', utils.randWords())

  }
}

module.exports = Events;