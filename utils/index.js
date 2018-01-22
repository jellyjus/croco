const fs = require('fs');
const words = (fs.readFileSync('word_rus.txt', 'utf8')).split('\n');

const randStr = () => {
  let result = '';
  const words = '0123456789qwertyuiopasdfghjklzxcvbnm';
  for (let i = 0; i < 4; i++) {
    let position = Math.floor(Math.random() * (words.length - 1));
    result += words[position]
  }
  return result;
};

const randInt = (min, max) => {
  let rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
};

const randWords = (count = 3) => {
  const res = [];
  for (let i=0; i<count; i++)
    res.push(words[randInt(0, words.length-1)])
  return res;
};

module.exports = {
  randStr,
  randInt,
  randWords
};