// view of the Computer's grid
class MainScene extends Phaser.Scene {
    constructor() {
        super("playGame");
        this.CPUboard = Array.from({ length: 10 }, () => Array(10).fill(0));;
        this.Playerboard = Array.from({ length: 10 }, () => Array(10).fill(0));;
        this.Playerattemptboard = Array.from({ length: 10 }, () => Array(10).fill(0));
        this.CPUattemptboard = Array.from({ length: 10 }, () => Array(10).fill(0));
        this.recentHits = 0;
        this.lastx;
        this.lasty;
    }

    preload() {
        this.load.image("ocean", "assets/ocean.png");
        this.load.image("ship", "assets/ship.png");
        this.load.image("hit", "assets/hit.png");
        this.load.image("miss", "assets/miss.png");


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







        const CPUarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        // Iterate over the grid and assign the wave image to each cell
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * 32;
                const y = row * 32;

                const wave = this.add.image(x, y, "ocean");


                wave.setScale(.05);

                // Center the wave image in the cell
                wave.setOrigin(0)
                    .setInteractive()
                    .on('pointerdown', () => this.onClick(row, col, wave))
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
                const x = col * 32;
                const y = row * 32 + 400;
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

    onClick(x, y, wave) {
        if (this.Playerattemptboard[x][y] != 1 && this.Playerattemptboard[x][y] != 2) {
            this.gameChecks(x, y, wave);
            this.CPUmove(wave);
        }
        wave.disableInteractive(false);
        wave.clearTint();

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

    gameChecks(x, y, wave) {
        if (this.CPUboard[x][y] == 0) {
            this.Playerattemptboard[x][y] = 1;
            wave.setTexture('miss');
            console.log("miss");
        } else if (this.CPUboard[x][y] == 1) {
            this.Playerattemptboard[x][y] = 2;
            wave.setTexture('hit');
            console.log("hit");
            if (this.Playerattemptboard.flat().filter(x => x === 2).length >= 17) {
                //win 
                console.log("win");
            }
        }

    }









    CPUmove() {
        let x;
        let y;
        let ran;
        let smartpick = 0;

        if (this.recentHits > 0) {
            x = this.lastx;
            y = this.lasty;
            let loop = true;

            while (x < 0 || x >= this.CPUattemptboard.length || y < 0 || y >= this.CPUattemptboard[x].length || this.CPUattemptboard[x][y] === 1 || this.CPUattemptboard[x][y] === 2 || loop === true) {
                x = this.lastx;
                y = this.lasty;

                ran = Math.floor(Math.random() * 4);
                console.log("random number" + ran);

                if (ran === 0) {
                    x++;
                    console.log("x++")
                } else if (ran == 1) {
                    x--;
                    console.log("x--")
                } else if (ran === 2) {
                    y++;
                    console.log("y++")
                } else if (ran === 3) {
                    y--;
                    console.log("y--")
                }

                if (!(x < 0 || x >= this.CPUattemptboard.length || y < 0 || y >= this.CPUattemptboard[x].length || this.CPUattemptboard[x][y] === 1 || this.CPUattemptboard[x][y] === 2)) {
                    smartpick = 1;
                    loop = false;
                    break;
                }

                this.recentHits--;
                if (this.recentHits <= 0) {
                    smartpick = 0;
                    loop = false;
                    break;
                }


                console.log(this.recentHits);

            }

        }
        if (smartpick != 1) {
            x = Math.floor(Math.random() * 10);
            y = Math.floor(Math.random() * 10);

            while (this.CPUattemptboard[x][y] === 1 || this.CPUattemptboard[x][y] === 2) {
                x = Math.floor(Math.random() * 10);
                y = Math.floor(Math.random() * 10);
            }
        }

        if (this.Playerboard[x][y] == 0) {
            this.CPUattemptboard[x][y] = 1;
            console.log("CPU miss");
            this.recentHits = this.recentHits - 2;
        } else if (this.Playerboard[x][y] == 1) {
            this.CPUattemptboard[x][y] = 2;
            console.log("CPU hit");
            this.recentHits = 4;
            this.lastx = x;
            this.lasty = y;
            if (this.CPUattemptboard.flat().filter(x => x === 2).length >= 17) {
                //lose
                console.log("lose");
            }
        }
        const Playerarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * 32;
                const y = row * 32 + 400;
                const wave = this.add.image(x, y, "ocean");

                if (this.Playerboard[row][col] == 1) {
                    wave.setTexture('ship');
                }
                if (this.CPUattemptboard[row][col] === 1) {
                    wave.setTexture('miss');
                }
                if (this.CPUattemptboard[row][col] === 2) {
                    wave.setTexture('hit');
                }
                wave.setScale(.05);

                // Center the wave image in the cell
                wave.setOrigin(0);

                // Store the wave image in the grid
                Playerarray[row][col] = wave;
            }
        }


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