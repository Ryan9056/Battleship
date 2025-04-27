// view of the Computer's grid
class ComputerView extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.CPUboard = Array.from({ length: 10 }, () => Array(10).fill(0));;
        this.Playerborad = Array.from({ length: 10 }, () => Array(10).fill(0));;
    }

    preload() {
        this.load.image("ocean", "assets/ocean.avif");
        this.load.image("ship", "assets/ship.png");


    }

    create() {


        this.CPUboard = this.generateBoards();
        this.Playerboard = this.generateBoards();

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                console.log(this.CPUboard[row][col]);
            }
        }

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                console.log(this.Playerboard[row][col]);
            }
        }




        const cellSize = 32;


        const CPUarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        // Iterate over the grid and assign the wave image to each cell
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * cellSize;
                const y = row * cellSize;

                const wave = this.add.image(x, y, "ocean");

                if (this.CPUboard[row][col] == 1) {
                    wave.setTexture('ship');
                }

                wave.setScale(.05);

                // Center the wave image in the cell
                wave.setOrigin(0)
                    .setInteractive()
                    .on('pointerdown', () => this.getGridIndex(row, col))
                    .on('pointerover', () => this.enterButtonHoverState(wave))
                    .on('pointerout', () => this.enterButtonRestState(wave));


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

                if (this.Playerboard[row][col] == 1) {
                    wave.setTexture('ship');
                }
                wave.setScale(.05);

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

    generateBoards() {
        const board = Array(10).fill().map(() => Array(10).fill(0));

        const ships = [5, 4, 3, 3, 2];


        const placeShip = (size) => {
            let row; 
            let col; 
            let dir;
            let canPlace;

            while (!canPlace) {
                row = Math.floor(Math.random() * 10);
                col = Math.floor(Math.random() * 10);
                dir = Math.random() < 0.5 ? 0 : 1;
                canPlace = true;


                for (let i = 0; i < size; i++) {

                    if (dir === 0) {
                        if (col + i >= 10 || board[row][col + i] === 1) {
                            canPlace = false;
                        }
                    }

                    else if (dir === 1) {
                        if (row + i >= 10 || board[row + i][col] === 1) {
                            canPlace = false;
                        }
                    }
                }
            } 


            for (let i = 0; i < size; i++) {
                if (dir === 0) {
                    board[row][col + i] = 1;
                } else {
                    board[row + i][col] = 1;
                }
            }
        };


        ships.forEach(size => {
            placeShip(size);
        });

        return board;
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