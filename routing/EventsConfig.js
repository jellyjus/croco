const vkAuthMiddleware = require('./VkAuthMiddleware');

class Events {
  constructor() {}

  onConnect(socket) {
    vkAuthMiddleware(socket);
    console.log('user connected', socket.uid);
    socket.broadcast.emit('connected');
    this.initEvents(socket);
  }

  initEvents(socket) {
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('drawing', (data) => {
      socket.broadcast.to(socket.room).emit('drawing', data);
    });

    socket.on('create_room', () => {
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
    })
  }
}

module.exports = Events;