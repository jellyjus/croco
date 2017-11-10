const config = require('../configs');
const crypto = require('crypto');

const vkAuthMiddleware = (socket, next) => {
  /*if (process.env.NODE_ENV === 'dev')
    return socket.uid = '0?000';*/

  socket.uid = false;
  const cookies = socket.request.cookies;
  if (cookies.auth_key && cookies.viewer_id) {
    const tmp = `${config.vk_appId}_${cookies.viewer_id}_${config.vk_clientSecret}`;
    const hex = crypto.createHash('md5').update(tmp).digest("hex");
    if (cookies.auth_key === hex) {
      socket.uid = cookies.viewer_id;
    }

  }
};

module.exports = vkAuthMiddleware;