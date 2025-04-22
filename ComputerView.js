// view of the Computer's grid
class ComputerView extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.computerGrid = new grid();
    }

    preload() {
        this.load.image("ocean", "assets/ocean.avif");


    }

    create() {
        const cellSize = 32;
    
    
        const gridArray = computerGrid.getGrid();
    
        // Iterate over the grid and assign the wave image to each cell
        for (let row = 0; row < gridArray.length; row++) {
            for (let col = 0; col < gridArray[row].length; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * cellSize;
                const y = row * cellSize;
                const wave = this.add.image(x, y, "ocean");
    
                // Center the wave image in the cell
                wave.setOrigin(0);
    
                // Store the wave image in the grid
                gridArray[row][col] = wave;
            }
        }
    
        // Update the grid in the grid class
        computerGrid.setGrid(gridArray);
    
        
    }

    update() {

    }

}