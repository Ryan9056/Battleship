//view of the Player's grid
class PlayerView extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.playerGrid = new grid();
    }

    preload() {
        this.load.image("wave", "assets/wave.png");
    }

    create() {
        const cellSize = 32;
    
        const gridArray = playerGrid.getGrid();
    
        // Iterate over the grid and assign the wave image to each cell
        for (let row = 0; row < gridArray.length; row++) {
            for (let col = 0; col < gridArray[row].length; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * cellSize;
                const y = row * cellSize;
                const wave = this.add.image(x, y, "wave");
    
                // Center the wave image in the cell
                wave.setOrigin(0);
    
                // Store the wave image in the grid
                gridArray[row][col] = wave;
            }
        }
    
        // Update the grid in the grid class
        playerGrid.setGrid(gridArray);
    
    }

    update() {

    }

}