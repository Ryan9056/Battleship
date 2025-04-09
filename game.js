//handle game logic
var config = {
    width: 500,
    height: 800,
    backgroundColor: 0x000000,
    scene: [PlayerView, ComputerView],
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade:{
        debug: false
      }
    }
  }

  

var game = new Phaser.Game(config);
  