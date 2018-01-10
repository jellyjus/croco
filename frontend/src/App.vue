<template>
  <el-container>
    <el-header>
      <el-button @click="createRoom">Create room</el-button>
      Rooms:
      <span v-for="room in rooms"><a href="#" @click="joinRoom(room)">{{room}}</a> | </span>
    </el-header>
    <el-container>
      <el-main id="container">
      </el-main>
      <el-footer>
        Heroku
      </el-footer>
    </el-container>
  </el-container>
    <!--<router-view/>-->
</template>

<script>
  import Konva from 'konva';
  import Utils from './utils'

export default {
  name: 'app',
  data() {
    return {
      header: 'HEAD!',
      image: null,
      context: null,
      rooms: [],
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
    createRoom() {
      this.$socket.emit('create_room')
    },
    joinRoom(room) {
      this.$socket.emit('join_room', room)
    }
  },
  created() {
    this.initSocketEvents();
    this.parseLocationParams();
  },
  mounted() {
    const width = document.getElementById('container').clientWidth - 40;
    const stage = new Konva.Stage({
      container: 'container',
      width,
      height: 500
    });
    const layer = new Konva.Layer();
    stage.add(layer);
    const canvas = document.createElement('canvas');
    canvas.width = stage.width();
    canvas.height = stage.height();
    this.image = new Konva.Image({
      image: canvas,
      x : 0,
      y : 0,
    });
    layer.add(this.image);
    stage.draw();
    this.context = canvas.getContext('2d');
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
      if (!isPaint) {
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
        x: lastPointerPosition.x - this.image.x(),
        y: lastPointerPosition.y - this.image.y()
      };
      this.context.moveTo(startPos.x, startPos.y);
      let pos = stage.getPointerPosition();
      let endPos = {
        x: pos.x - this.image.x(),
        y: pos.y - this.image.y()
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
      this.context.moveTo(data.startPos.x - this.image.x(), data.startPos.y - this.image.y());
      this.context.lineTo(data.endPos.x - this.image.x(), data.endPos.y - this.image.y());
      this.context.closePath();
      this.context.stroke();
      layer.draw();
    })
  }
}
</script>

<style>
  .el-header, .el-footer {
    background-color: #B3C0D1;
    color: #333;
    text-align: center;
    line-height: 60px;
  }

  .el-aside {
    background-color: #D3DCE6;
    color: #333;
    text-align: center;
    line-height: 200px;
  }

  .el-main {
    background-color: #E9EEF3;
    color: #333;
    text-align: center;
    line-height: 160px;
  }

  #myVideo {
    margin-left: 10px;
  }
</style>
