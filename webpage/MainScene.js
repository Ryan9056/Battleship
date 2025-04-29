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
        this.infoboard;
        this.CPUinfo;
        this.textStyle = {
            font: '28px Arial',
            fill: 'Black', 
            align: 'center', 
            stroke: '#000000',   
            strokeThickness: 2   
        };
        this.isOver = 0;
        this.winAmount = 0;
        this.playerWins = 0;
        this.cpuWins = 0;
        this.placementPhase = true;
    }

    preload() {
        this.load.image("ocean", "assets/ocean.png");
        this.load.image("ship", "assets/ship.png");
        this.load.image("hit", "assets/hit.png");
        this.load.image("miss", "assets/miss.png");
    }

    async create() {
        // Load initial win counts
        try {
            const response = await fetch('/api/wins');
            const data = await response.json();
            this.playerWins = data.playerWins;
            this.cpuWins = data.cpuWins;
        } catch (error) {
            console.error('Error loading win counts:', error);
        }

        // Generate CPU board
        this.CPUboard = this.generateBoards();
        
        // Cheat Sheet for CPU board
        for (let row = 0; row < this.CPUboard.length; row++) {
            let rowString = '';
            for (let col = 0; col < this.CPUboard[row].length; col++) {
                rowString += this.CPUboard[row][col] + ' ';
            }
            console.log(rowString);
        }

        // Create empty CPU grid (not interactive during placement)
        this.createCPUGrid();

        this.infoboard = this.add.text(260, 50, "Player", this.textStyle);
        this.CPUinfo = this.add.text(660, 50, "CPU", this.textStyle);
        this.infoboard.setOrigin(0.5, 0.5);
        this.CPUinfo.setOrigin(0.5, 0.5);

        // Add win count displays under each grid
        this.playerWinText = this.add.text(260, 450, `Wins: ${this.playerWins}`, this.textStyle);
        this.cpuWinText = this.add.text(660, 450, `Wins: ${this.cpuWins}`, this.textStyle);
        this.playerWinText.setOrigin(0.5, 0.5);
        this.cpuWinText.setOrigin(0.5, 0.5);

        this.infoboard.on('pointerdown', () => this.onClickInfo())
            .on('pointerover', () => this.enterButtonHoverStateInfo())
            .on('pointerout', () => this.enterButtonRestStateInfo());

        // Initialize ship placement
        this.shipPlacement = new ShipPlacement(this);
        this.shipPlacement.createPlayerGrid();
    }

    createCPUGrid() {
        const CPUarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        // Iterate over the grid and assign the wave image to each cell for CPU board
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * 32 + 100;
                const y = row * 32 + 100;

                const wave = this.add.image(x, y, "ocean");
                wave.setScale(.05);
                wave.setOrigin(0);
                
                // Store the wave image in the grid
                CPUarray[row][col] = wave;
            }
        }
        
        this.cpuGridArray = CPUarray;
    }
    
    // Called by ShipPlacement when all ships are placed
    startGameAfterPlacement() {
        this.placementPhase = false;
        
        // Make CPU grid interactive for attacks
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                this.cpuGridArray[row][col].setInteractive()
                    .on('pointerdown', () => this.onClickWave(row, col, this.cpuGridArray[row][col]))
                    .on('pointerover', () => this.enterButtonHoverState(this.cpuGridArray[row][col]))
                    .on('pointerout', () => this.enterButtonRestState(this.cpuGridArray[row][col]));
            }
        }
    }

    onClickWave(x, y, wave) {
        if (this.isOver === 0) {
            if (this.Playerattemptboard[x][y] != 1 && this.Playerattemptboard[x][y] != 2) {
                this.gameChecks(x, y, wave);
                this.CPUmove(wave);
            }
        }
        wave.disableInteractive();
        wave.clearTint();
    }

    enterButtonHoverState(wave) {
        wave.clearTint();
        wave.setTintFill("0x000000");
    }

    enterButtonRestState(wave) {
        wave.clearTint();
    }

    onClickInfo() {
        this.CPUboard = Array.from({ length: 10 }, () => Array(10).fill(0));;
        this.Playerboard = Array.from({ length: 10 }, () => Array(10).fill(0));;
        this.Playerattemptboard = Array.from({ length: 10 }, () => Array(10).fill(0));
        this.CPUattemptboard = Array.from({ length: 10 }, () => Array(10).fill(0));
        this.recentHits = 0;
        this.lastx;
        this.lasty;
        this.infoboard;
        this.CPUinfo;
        this.scene.restart();
        this.infoboard.disableInteractive();
        this.infoboard.clearTint();
    }

    enterButtonHoverStateInfo() {
        this.infoboard.clearTint();
        this.infoboard.setTintFill("Gray");
    }

    enterButtonRestStateInfo() {
        this.infoboard.clearTint();
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
            this.infoboard.setText("Miss")
        } else if (this.CPUboard[x][y] == 1) {
            this.Playerattemptboard[x][y] = 2;
            wave.setTexture('hit');
            this.infoboard.setText("Hit")
            if (this.Playerattemptboard.flat().filter(x => x === 2).length >= 17) {
                this.gameEnd(2);
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
            this.CPUinfo.setText("CPU: Miss")
            this.recentHits = this.recentHits - 2;
        } else if (this.Playerboard[x][y] == 1) {
            this.CPUattemptboard[x][y] = 2;
            this.CPUinfo.setText("CPU: Hit")
            this.recentHits = 4;
            this.lastx = x;
            this.lasty = y;
            this.isOver = 0;
            if (this.CPUattemptboard.flat().filter(x => x === 2).length >= 17) {
                this.gameEnd(1);
            }
        }
        const Playerarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * 32 + 500;
                const y = row * 32 + 100;
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

    async updateWins(outcome) {
        if (outcome === 1) {
            this.cpuWins++;
        } else if (outcome === 2) {
            this.playerWins++;
        }

        // Update the display under each grid
        this.playerWinText.setText(`Wins: ${this.playerWins}`);
        this.cpuWinText.setText(`Wins: ${this.cpuWins}`);

        // Save to API
        try {
            const response = await fetch('/api/wins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerWins: this.playerWins,
                    cpuWins: this.cpuWins
                })
            });
            if (!response.ok) {
                throw new Error('Failed to update wins');
            }
        } catch (error) {
            console.error('Error saving win counts:', error);
        }
    }

    gameEnd(outcome) {
        this.isOver = 1;
        this.updateWins(outcome);

        const CPUarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        // Iterate over the grid and assign the wave image to each cell
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = col * 32 + 100;
                const y = row * 32 + 100;
                const wave = this.add.image(x, y, "ocean");

                if (this.Playerattemptboard[row][col] === 1) {
                    wave.setTexture('miss');
                }
                if (this.Playerattemptboard[row][col] === 2) {
                    wave.setTexture('hit');
                }

                wave.disableInteractive();

                wave.setScale(.05);

                // Center the wave image in the cell
                wave.setOrigin(0);

                // Store the wave image in the grid
                CPUarray[row][col] = wave;
            }
        }

        if (outcome === 1) {
            this.infoboard.setText("You Lose! Restart?")
            this.CPUinfo.setText(" ")
            this.infoboard.setInteractive();
        } else if (outcome === 2) {
            this.infoboard.setText("You Win! Restart?")
            this.CPUinfo.setText(" ")
            this.infoboard.setInteractive();
        }
    }
}

new Phaser.Game({
    width: 1000,
    height: 500,
    backgroundColor: 0xffffff,
    scene: MainScene,
    physics: { default: 'arcade' },
    parent: 'game'
});