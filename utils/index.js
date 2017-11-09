const randStr = () => {
  let result = '';
  const words = '0123456789qwertyuiopasdfghjklzxcvbnm';
  for (let i = 0; i < 4; i++) {
    let position = Math.floor(Math.random() * (words.length - 1));
    result += words[position]
  }
  return result;
};

module.exports = {
  randStr
};