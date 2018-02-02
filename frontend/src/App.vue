<template>
  <div>
    <el-container>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="18"><div class="grid-content bg-purple" id="container"></div></el-col>
          <el-col :span="6">
            <div class="chat bg-purple" id="chat">
              <div class="chat-item" v-for="message in messages">
                <img :src="message.user.photo_50" class="chat-item-avatar">
                {{message.user.first_name}}: <br>
                {{message.message}}
              </div>
            </div>
            <form @submit.prevent="sendMessage">
              <el-input placeholder="Message" v-model="message" suffix-icon=""></el-input>
            </form>
          </el-col>
        </el-row>
      </el-main>
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
  import Konva from 'konva';
  import Utils from './utils'
  let chat;

export default {
  name: 'app',
  data() {
    return {
      canvas: null,
      context: null,
      message: null,
      messages: [],
      game: false,
      host: false,
      hostDialog: false,
      hostWords: []
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
        this.context.clearRect(0, 0, 1000, 1000);
        this.context.beginPath();
        this.context.closePath();
        this.game = true;
      });

      this.$socket.on('host', data => {
        this.host = true;
        this.hostWords = data;
        this.hostDialog = true;
      });
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
    const width = document.getElementById('container').clientWidth - 40;
    const stage = new Konva.Stage({
      container: 'container',
      width,
      height: 600
    });
    const layer = new Konva.Layer();
    stage.add(layer);
    this.canvas = document.createElement('canvas');
    this.canvas.width = stage.width();
    this.canvas.height = stage.height();
    const image = new Konva.Image({
      image: this.canvas,
      x : 0,
      y : 0,
    });
    layer.add(image);
    stage.draw();
    this.context = this.canvas.getContext('2d');
    this.context.strokeStyle = "#df4b26";
    this.context.lineJoin = "round";
    this.context.lineWidth = 5;

    let isPaint = false;
    let lastPointerPosition;
    let mode = 'brush';

    stage.on('contentMousedown.proto', () => {
      isPaint = true;
      lastPointerPosition = stage.getPointerPosition();
    });
    stage.on('contentMouseup.proto', () => {
      isPaint = false;
    });
    stage.on('contentMousemove.proto', () => {
      if (!isPaint || (this.game && !this.host)) {
        return;
      }
      if (mode === 'brush') {
        this.context.globalCompositeOperation = 'source-over';
      }
      if (mode === 'eraser') {
        this.context.globalCompositeOperation = 'destination-out';
      }
      this.context.beginPath();
      let startPos = {
        x: lastPointerPosition.x - image.x(),
        y: lastPointerPosition.y - image.y()
      };
      this.context.moveTo(startPos.x, startPos.y);
      let pos = stage.getPointerPosition();
      let endPos = {
        x: pos.x - image.x(),
        y: pos.y - image.y()
      };
      this.context.lineTo(endPos.x, endPos.y);
      this.context.closePath();
      this.context.stroke();
      layer.draw();

      this.$socket.emit('drawing', {
        startPos: {x: lastPointerPosition.x, y: lastPointerPosition.y},
        endPos: {x: pos.x, y: pos.y}
      });

      lastPointerPosition = pos;
    });

    this.$socket.on('drawing', (data) => {
      this.context.beginPath();
      this.context.moveTo(data.startPos.x - image.x(), data.startPos.y - image.y());
      this.context.lineTo(data.endPos.x - image.x(), data.endPos.y - image.y());
      this.context.closePath();
      this.context.stroke();
      layer.draw();
    })
  }
}
</script>

<style>
  .bg-purple {
    background: #e5e9f2;
  }

  .chat {
    height: 600px;
    margin-bottom: 10px;
    overflow-y: auto;
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
</style>
