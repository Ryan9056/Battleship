// view of the Computer's grid
class ComputerView extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.gameBoard = [];
    }

    preload() {
        this.load.image("ocean", "assets/ocean.avif");


    }

    create() {
        const cellSize = 32;
    
    
        const CPUarray = Array.from({ length: 10 }, () => Array(10).fill(0));
    
        // Iterate over the grid and assign the wave image to each cell
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * cellSize;
                const y = row * cellSize;
                const wave = this.add.image(x, y, "ocean");
    
                // Center the wave image in the cell
                wave.setOrigin(0)
                    .setInteractive()
                    .on('pointerdown', () => this.getGridIndex(row, col) )
                    .on('pointerover', () => this.enterButtonHoverState(wave) )
                    .on('pointerout', () => this.enterButtonRestState(wave) );
                
    
                // Store the wave image in the grid
                CPUarray[row][col] = wave;
            }
        }


        const Playerarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * cellSize;
                const y = row * cellSize + 400;
                const wave = this.add.image(x, y, "ocean");
    
                // Center the wave image in the cell
                wave.setOrigin(0);
    
                // Store the wave image in the grid
                Playerarray[row][col] = wave;
            }
        }
    
        
    }

    update() {

    }

    getGridIndex(x, y) {
        console.log(x + " " + y)
    }

    enterButtonHoverState(wave) {
        wave.clearTint()
        wave.setTintFill("#8d8e8f")
    }

    enterButtonRestState(wave) {
        wave.clearTint()
    }



}

new Phaser.Game({
    width: 500,
    height: 800,
    backgroundColor: 0x000000,
    scene: ComputerView,
    physics: { default: 'arcade' }, 
    parent: 'game'
  });