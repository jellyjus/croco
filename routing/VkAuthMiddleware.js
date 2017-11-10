const config = require(appRoot + '/configs');
const crypto = require('crypto');

const vkAuthMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'dev') {
    req.auth = true;
    return next()
  }
  req.auth = false;
  const vkCookies = req.cookies[`vk_app_${config.vk_appId}`];
  if (vkCookies) {
    const sig = vkCookies.split('sig=')[1];
    const tmp = ((vkCookies.split('&sig=')[0]).split('&')).join('') + config.vk_clientSecret;
    const hex = crypto.createHash('md5').update(tmp).digest("hex");
    if (sig === hex)
      req.auth = true;
  }
  next();
};

module.exports = vkAuthMiddleware;