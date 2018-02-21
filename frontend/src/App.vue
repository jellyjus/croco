<template>
  <div>
    <el-container>

      <div class="canvas-container bg-purple">
        <canvas id="canvas" height="600px" width="600"></canvas>
        <div class="bar">
          <img class="bar-item" :class="{'bar-item--active': currentColor === color}" v-for="color in colors" :src="`/static/${color}.png`" @click="() => currentColor = color">
          <div class="bar-sizeitem">
            <div class="bar-size-picker"
                 :class="{'bar-size-picker--active': currentSize === size.size}"
                 :style="{width: `${size.radius}px`, height: `${size.radius}px`, top: size.position}"
                 v-for="size of sizes"
                @click="() => currentSize = size.size"></div>
          </div>
        </div>
      </div>

      <div class="chat-container bg-purple">
        <div class="chat" id="chat">
          <div class="chat-item" v-for="message in messages">
            <img :src="message.user.photo_50" class="chat-item-avatar">
            {{message.user.first_name}}: <br>
            {{message.message}}
          </div>
        </div>
        <form @submit.prevent="sendMessage">
          <el-input placeholder="Message" v-model="message" suffix-icon=""></el-input>
        </form>
      </div>

    </el-container>

    <el-dialog
        title="Ты хост!"
        :visible.sync="hostDialog"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        width="30%"
        center>
      <span>Выбери слово</span>
      <div>
        <el-button @click="selectHostWord(word)" v-for="word in hostWords" key="word">{{word}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import paper from 'paper'
  import Utils from './utils'
  let chat;

export default {
  name: 'app',
  data() {
    return {
      colors: ['black', 'red', 'green', 'blue', 'white'],
      sizes: [
        {position: '0px', size: 40, radius: 23},
        {position: '6px', size: 20, radius: 18},
        {position: '12px', size: 10, radius: 10},
        {position: '20px', size: 2, radius: 10}
      ],
      currentColor: 'black',
      currentSize: 2,
      message: null,
      messages: [],
      game: false,
      host: false,
      hostDialog: false,
      hostWords: [],
      path: null
    }
  },
  methods: {
    initSocketEvents() {
      this.$socket.on('rooms', data => {
        this.rooms = data;
      });

      this.$socket.on('connected', () => {
        console.log('user connected!')
      });

      this.$socket.on('new_message', data => {
        this.newMessage(data)
      });

      this.$socket.on('game_winner', user => {
        this.newMessage({
          user: {
            photo_50:'https://pp.userapi.com/c621515/v621515165/5a34e/rMBv7HGfD68.jpg',
            first_name: 'Console'
          },
          message: `Winner: ${user.first_name}`
        });
        this.host = false;
        this.game = false;
      });

      this.$socket.on('game_start', (user) => {
        this.newMessage({
          user: {
            photo_50:'https://pp.userapi.com/c621515/v621515165/5a34e/rMBv7HGfD68.jpg',
            first_name: 'Console'
          },
          message: `Game starts with host: ${user.first_name}`
        });
        this.game = true;
      });

      this.$socket.on('host', data => {
        this.host = true;
        this.hostWords = data;
        this.hostDialog = true;
      });

      this.$socket.on('draw-new_path', data => {
        this.path = new paper.Path({
          segments: [new paper.Point(data.point[1], data.point[2])],
          strokeColor: data.color,
          strokeWidth: data.size
        });
      });

      this.$socket.on('draw', point => {
        this.path.add(new paper.Point(point[1], point[2]));
      })
    },
    newMessage(data) {
      this.messages.push(data);
      setTimeout(() => {
        chat.scrollTop = chat.scrollHeight + 100;
      })

    },
    parseLocationParams() {
      const vkProps = {};
      const tmp = window.location.search.split('&');
      for (let key of tmp) {
        const prop = key.split('=');
        vkProps[prop[0]] = prop[1]
      }
      Utils.setCookie(['auth_key', 'viewer_id'], [vkProps['auth_key'], vkProps['viewer_id']])
    },
    sendMessage() {
      if (!this.message)
        return;
      this.$socket.emit('send_message', this.message);
      this.message = null;
    },
    selectHostWord(word) {
      this.hostDialog = false;
      this.$socket.emit('select_host_word', word)
    }
  },
  created() {
    this.initSocketEvents();
    this.parseLocationParams();
  },
  mounted() {
    chat = document.getElementById('chat');

    const canvas = document.getElementById('canvas');
    const tool = new paper.Tool();
    paper.setup(canvas);

    tool.onMouseDown = (event) => {
      this.path = new paper.Path({
        segments: [event.point],
        strokeColor: this.currentColor,
        strokeWidth: this.currentSize * 0.5
      });
      this.$socket.emit('draw-new_path',{
        point:  event.point,
        color: this.currentColor,
        size: this.currentSize * 0.5
      })
    };

    let counter = 0;
    tool.onMouseDrag = (event) => {
      counter++;
      if (counter === 5) {
        counter = 0;
        this.$socket.emit('draw', event.point)
      }
      this.path.add(event.point);
    };

    tool.onMouseUp = (event) => {
      this.path.simplify();
    };
  }
}
</script>

<style>
  body {
    margin: 0;
    padding: 0;
  }

  #canvas {
    background-color: white;
  }

  .bg-purple {
    background: #edeef0;
    display: inline-block;
    padding: 10px;
  }

  .chat {
    width: 210px;
    height: 600px;
    margin-bottom: 10px;
    overflow-y: auto;
    background-color: white;
  }

  .chat-item {
    padding: 5px;
    display: flex;
    align-items: center;
    word-break: break-word;
  }

  .chat-item-avatar {
    width: 35px;
    height: auto;
    border-radius: 50%;
    margin-right: 5px;
    align-self: flex-start;
  }

  .bar {
    background-color: rgba(0, 0, 0, 0.1);
    height: 100px;
    margin-top: -4px;
    display: flex;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .bar img, .bar-sizeitem {
    height: 90px
  }

  .bar-item {
    position: relative;
    top: -10px;
    transition: .1s;
  }

  .bar-item:hover, .bar-item--active{
    cursor: pointer;
    top: -2px
  }

  .bar-item:active{
    top: 0
  }

  .bar-sizeitem {
    width: 50px;
    background: url(/static/size.png) 100% 100% no-repeat;
    background-size: cover;
  }

  .bar-size-picker {
    border-radius: 50%;
    position: relative;
    left: 14px;
  }

  .bar-size-picker--active:before {
    content: "";
    display: block;
    width: 13px;
    height: 2px;
    background-color: black;
    position: relative;
    top: calc(50% - 1px);
    left: -14px;
  }
 </style>
