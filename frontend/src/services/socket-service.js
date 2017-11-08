import io from 'socket.io-client';
const SOCKET_URL = (process.env.NODE_ENV === 'development')? 'http://localhost:3001' : '';

const socket = {
  install(Vue, options) {
    Vue.prototype.$socket = io(SOCKET_URL)
  }
};

export default socket;