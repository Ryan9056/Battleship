// view of the Computer's grid
class MainScene extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.CPUboard = Array.from({ length: 10 }, () => Array(10).fill(0));;
        this.Playerboard = Array.from({ length: 10 }, () => Array(10).fill(0));;
        this.Playerattemptboard = Array.from({ length: 10 }, () => Array(10).fill(0));
        this.CPUattemptboard = Array.from({ length: 10 }, () => Array(10).fill(0));
    }

    preload() {
        this.load.image("ocean", "assets/ocean.png");
        this.load.image("ship", "assets/ship.png");


    }

    create() {


        this.CPUboard = this.generateBoards();
        this.Playerboard = this.generateBoards();


        // remove when complete
        for (let row = 0; row < this.CPUboard.length; row++) {
            let rowString = '';
            for (let col = 0; col < this.CPUboard[row].length; col++) {
                rowString += this.CPUboard[row][col] + ' '; 
            }
            console.log(rowString); 
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

                // remove when complete
                if (this.CPUboard[row][col] == 1) {
                    wave.setTexture('ship');
                }

                wave.setScale(.05);

                // Center the wave image in the cell
                wave.setOrigin(0)
                    .setInteractive()
                    .on('pointerdown', () => this.onClick(row, col))
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

    onClick(x, y) {
        console.log(x + " " + y);
        if (this.Playerattemptboard[x][y] != 1 && this.Playerattemptboard[x][y] != 2) {
            this.gameChecks(x, y);
            this.CPUmove();
        } else {
            //can't choose option
            console.log("can't choose option");
        }

    }

    enterButtonHoverState(wave) {
        wave.clearTint();
        wave.setTintFill("0x000000");
    }

    enterButtonRestState(wave) {
        wave.clearTint();
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

    gameChecks(x, y) {
        if (this.CPUboard[x][y] == 0) {
            this.Playerattemptboard[x][y] = 1;
            console.log("miss");
        } else if (this.CPUboard[x][y] == 1)
        {
            this.Playerattemptboard[x][y] = 2;
            console.log("hit");
            if(this.Playerattemptboard.flat().filter(x => x ===2).length >= 17) {
                //win 
                console.log("win");
            }
        } 

        

        

    }



    CPUmove() {
        let x = Math.floor(Math.random() * 10);
        let y = Math.floor(Math.random() * 10);

        while (this.CPUattemptboard[x][y] === 1 || this.CPUattemptboard[x][y] === 2) {
            x = Math.floor(Math.random() * 10);
            y = Math.floor(Math.random() * 10);
        }

        if (this.Playerboard[x][y] == 0) {
            this.CPUattemptboard[x][y] = 1;
            console.log("CPU miss");
        } else if (this.Playerboard[x][y] == 1)
        {
            this.CPUattemptboard[x][y] = 2;
            console.log("CPU hit");
            if(this.CPUattemptboard.flat().filter(x => x ===2).length >= 17) {
                //lose
                console.log("lose");
            }
        } 
        console.log(x + " " + y);

    }
}










new Phaser.Game({
    width: 400,
    height: 720,
    backgroundColor: 0xffffff,
    scene: MainScene,
    physics: { default: 'arcade' },
    parent: 'game'
});