// MainScene handles the main gameplay for Battleship, including the CPU's board, player interactions,
// and game state management. It coordinates the ship placement phase and battle phase.
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
        this.smallTextStyle = {
            font: '18px Arial',
            fill: 'Black', 
            align: 'center'
        };
        this.isOver = 0;
        this.winAmount = 0;
        this.playerWins = 0;
        this.cpuWins = 0;
        this.placementPhase = true;
        this.timeText = null;
        this.updateTimer = 0;
        
        this.tintManager = null;
        
        this.gridSize = 10;
        this.cellSize = 32; 
        this.gridWidth = this.gridSize * this.cellSize;
        this.gridSpacing = 100;
    }

    // Preload all game assets including ships, hits, misses, and ocean textures
    preload() {
        this.load.image("ship", "assets/ship.png");
        this.load.image("hit", "assets/hit.png");
        this.load.image("miss", "assets/miss.png");
        this.load.image("ocean", "assets/ocean.png");
    }

    // Initialize the game scene, set up grids, UI elements, and game state
    async create() {
        this.canvasWidth = this.sys.game.config.width;
        this.canvasHeight = this.sys.game.config.height;
        
        const totalGridsWidth = (this.gridWidth * 2) + this.gridSpacing;
        
        this.leftGridX = (this.canvasWidth - totalGridsWidth) / 2;
        this.rightGridX = this.leftGridX + this.gridWidth + this.gridSpacing;
        
        const headerFooterSpace = 160;
        const availableHeight = this.canvasHeight - headerFooterSpace;
        this.gridsY = (this.canvasHeight - this.gridWidth) / 2;
        
        if (this.gridsY + this.gridWidth > this.canvasHeight - 60) {
            this.gridsY = this.canvasHeight - this.gridWidth - 60;
        }
        
        this.tintManager = new TintManager(this);
        await this.tintManager.initialize();
        
        try {
            const response = await fetch('/api/wins');
            const data = await response.json();
            this.playerWins = data.playerWins;
            this.cpuWins = data.cpuWins;
        } catch (error) {
            console.error('Error loading win counts:', error);
        }

        try {
            const timeResponse = await fetch('/api/time');
            const timeData = await timeResponse.json();
            this.currentTime = timeData;
        } catch (error) {
            console.error('Error loading time:', error);
            this.currentTime = { hour: 0, minute: 0, second: 0 };
        }

        this.CPUboard = this.generateBoards();
        
        for (let row = 0; row < this.CPUboard.length; row++) {
            let rowString = '';
            for (let col = 0; col < this.CPUboard[row].length; col++) {
                rowString += this.CPUboard[row][col] + ' ';
            }
            console.log(rowString);
        }

        this.createCPUGrid();

        this.infoboard = this.add.text(
            this.leftGridX + (this.gridWidth / 2), 
            this.gridsY - 50, 
            "Player", 
            this.textStyle
        );
        this.CPUinfo = this.add.text(
            this.rightGridX + (this.gridWidth / 2), 
            this.gridsY - 50, 
            "CPU", 
            this.textStyle
        );
        this.infoboard.setOrigin(0.5, 0.5);
        this.CPUinfo.setOrigin(0.5, 0.5);

        this.timeText = this.add.text(
            this.canvasWidth / 2,
            20, 
            this.formatTime(this.currentTime.hour, this.currentTime.minute), 
            this.textStyle
        );
        this.timeText.setOrigin(0.5, 0.5);

        this.playerWinText = this.add.text(
            this.leftGridX + (this.gridWidth / 2), 
            this.gridsY + this.gridWidth + 50, 
            `Wins: ${this.playerWins}`, 
            this.textStyle
        );
        this.cpuWinText = this.add.text(
            this.rightGridX + (this.gridWidth / 2), 
            this.gridsY + this.gridWidth + 50, 
            `Wins: ${this.cpuWins}`, 
            this.textStyle
        );
        this.playerWinText.setOrigin(0.5, 0.5);
        this.cpuWinText.setOrigin(0.5, 0.5);

        this.infoboard.on('pointerdown', () => this.onClickInfo())
            .on('pointerover', () => this.enterButtonHoverStateInfo())
            .on('pointerout', () => this.enterButtonRestStateInfo());

        this.shipPlacement = new ShipPlacement(this);
        this.shipPlacement.createPlayerGrid();
        
        this.time.addEvent({
            delay: 2000,
            callback: this.updateBothGrids,
            callbackScope: this,
            loop: true
        });
    }

    // Format the hour and minute into a 12-hour time format with AM/PM
    formatTime(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMinute = minute.toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    }

    // Create the CPU's grid with ocean cells and apply initial tints
    createCPUGrid() {
        const CPUarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const x = this.leftGridX + (col * this.cellSize);
                const y = this.gridsY + (row * this.cellSize);

                const wave = this.add.image(x, y, "ocean");
                wave.setScale(0.05);
                wave.setOrigin(0);
                wave.setDepth(1);
                
                wave.setTint(this.tintManager.currentOceanTint);
                
                CPUarray[row][col] = wave;
            }
        }
        
        this.cpuGridArray = CPUarray;
        
        this.drawGridLines();
    }
    
    // Draw grid lines for both the player and CPU grids for better visibility
    drawGridLines() {
        if (this.gridLines) {
            this.gridLines.clear();
            this.gridLines.destroy();
        }
        
        this.gridLines = this.add.graphics();
        this.gridLines.setDepth(10);
        this.gridLines.lineStyle(1, 0xFFFFFF, 1);
        
        for (let i = 0; i <= 10; i++) {
            const y = this.gridsY + (i * this.cellSize);
            this.gridLines.moveTo(this.leftGridX, y);
            this.gridLines.lineTo(this.leftGridX + (10 * this.cellSize), y);
            
            const x = this.leftGridX + (i * this.cellSize);
            this.gridLines.moveTo(x, this.gridsY);
            this.gridLines.lineTo(x, this.gridsY + (10 * this.cellSize));
        }
        
        for (let i = 0; i <= 10; i++) {
            const y = this.gridsY + (i * this.cellSize);
            this.gridLines.moveTo(this.rightGridX, y);
            this.gridLines.lineTo(this.rightGridX + (10 * this.cellSize), y);
            
            const x = this.rightGridX + (i * this.cellSize);
            this.gridLines.moveTo(x, this.gridsY);
            this.gridLines.lineTo(x, this.gridsY + (10 * this.cellSize));
        }
        
        this.gridLines.strokePath();
    }
    
    // Transition from ship placement phase to game phase and make CPU grid interactive
    startGameAfterPlacement() {
        this.placementPhase = false;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                this.cpuGridArray[row][col].setInteractive()
                    .on('pointerdown', () => this.onClickWave(row, col, this.cpuGridArray[row][col]))
                    .on('pointerover', () => {
                        this.enterButtonHoverState(this.cpuGridArray[row][col]);
                        this.cpuGridArray[row][col].isFilled = true;
                    })
                    .on('pointerout', () => {
                        this.enterButtonRestState(this.cpuGridArray[row][col]);
                        this.cpuGridArray[row][col].isFilled = false;
                    });
            }
        }
    }

    // Handle player clicks on the CPU grid to make attacks
    onClickWave(x, y, wave) {
        if (this.isOver === 0) {
            if (this.Playerattemptboard[x][y] != 1 && this.Playerattemptboard[x][y] != 2) {
                wave.clearTint();
                wave.isFilled = false;
                
                this.gameChecks(x, y, wave);
                this.CPUmove(wave);
            }
        }
        wave.disableInteractive();
    }

    // Apply hover effect when mouse is over a grid cell
    enterButtonHoverState(wave) {
        this.tintManager.enterButtonHoverState(wave);
    }

    // Remove hover effect when mouse leaves a grid cell
    enterButtonRestState(wave) {
        this.tintManager.enterButtonRestState(wave);
    }

    // Handle game restart when clicking the info board at game end
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

    // Apply hover effect to info board
    enterButtonHoverStateInfo() {
        this.infoboard.clearTint();
        this.infoboard.setTintFill("Gray");
    }

    // Remove hover effect from info board
    enterButtonRestStateInfo() {
        this.infoboard.clearTint();
    }

    // Generate random ship placements for the CPU board
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

    // Check if a player's attack hits or misses and update the game state
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

    // Handle the CPU's turn to attack the player's board
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

                if (ran === 0) {
                    x++;
                } else if (ran == 1) {
                    x--;
                } else if (ran === 2) {
                    y++;
                } else if (ran === 3) {
                    y--;
                }

                if (!(x < 0 || x >= this.CPUattemptboard.length || y < 0 || y >= this.CPUattemptboard[x].length || this.CPUattemptboard[x][y] === 1 || this.CPUattemptboard[x][y] === 2)) {
                    smartpick = 1;
                    console.log("CPU Smartpick")
                    loop = false;
                    break;
                }

                this.recentHits--;
                if (this.recentHits <= 0) {
                    smartpick = 0;
                    loop = false;
                    break;
                }

                
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
            this.CPUinfo.setText("CPU: Hit");
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
                const x = this.rightGridX + (col * this.cellSize);
                const y = this.gridsY + (row * this.cellSize);
                const wave = this.add.image(x, y, "ocean");

                if (this.Playerboard[row][col] == 1 && this.CPUattemptboard[row][col] != 2) {
                    wave.setTexture('ship');
                    wave.setTint(this.tintManager.currentShipTint);
                } else if (this.CPUattemptboard[row][col] === 1) {
                    wave.setTexture('miss');
                    wave.setTint(this.tintManager.currentMissTint);
                } else if (this.CPUattemptboard[row][col] === 2) {
                    wave.setTexture('hit');
                    wave.setTint(this.tintManager.currentHitTint);
                } else {
                    wave.setTint(this.tintManager.currentOceanTint);
                }
                
                wave.setScale(0.05);
                wave.setOrigin(0);
                wave.setDepth(1);

                Playerarray[row][col] = wave;
            }
        }
        
        this.playerGridArray = Playerarray;
        
        this.drawGridLines();
    }

    // Update the win counts in the UI and save to the server
    async updateWins(outcome) {
        if (outcome === 1) {
            this.cpuWins++;
        } else if (outcome === 2) {
            this.playerWins++;
        }

        this.playerWinText.setText(`Wins: ${this.playerWins}`);
        this.cpuWinText.setText(`Wins: ${this.cpuWins}`);

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

    // Handle the end of the game, display winner and enable restart
    gameEnd(outcome) {
        this.isOver = 1;
        this.updateWins(outcome);
        
        const CPUarray = Array.from({ length: 10 }, () => Array(10).fill(0));
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const x = this.leftGridX + (col * this.cellSize);
                const y = this.gridsY + (row * this.cellSize);
                const wave = this.add.image(x, y, "ocean");
                
                if (this.Playerattemptboard[row][col] === 1) {
                    wave.setTexture('miss');
                    wave.setTint(this.tintManager.currentMissTint);
                } else if (this.Playerattemptboard[row][col] === 2) {
                    wave.setTexture('hit');
                    wave.setTint(this.tintManager.currentHitTint);
                } else {
                    wave.setTint(this.tintManager.currentOceanTint);
                }
                
                wave.disableInteractive();
                wave.setScale(0.05);
                wave.setOrigin(0);
                wave.setDepth(1);
                
                CPUarray[row][col] = wave;
            }
        }
        
        this.cpuGridArray = CPUarray;
        
        this.drawGridLines();
        
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

    // Clean up resources when scene is shut down
    shutdown() {
        if (this.tintManager) {
            this.tintManager.shutdown();
        }
    }
    
    // Handle additional cleanup when scene is destroyed
    destroy() {
        this.shutdown();
        super.destroy();
    }

    // Regularly update the tints on both player and CPU grids
    updateBothGrids() {
        this.tintManager.refreshTintsForAllCells();
        
        if (this.cpuGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = this.cpuGridArray[row][col];
                    if (cell && cell.texture) {
                        if (!cell.isFilled) {
                            cell.clearTint();
                            cell.setTint(this.tintManager.getCurrentTintForType(cell.texture.key));
                            
                            if (!cell.customData) {
                                cell.customData = {};
                            }
                            cell.customData.originalTint = this.tintManager.getCurrentTintForType(cell.texture.key);
                        }
                    }
                }
            }
        }
        
        if (!this.placementPhase && this.playerGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = this.playerGridArray[row][col];
                    if (cell && cell.texture) {
                        if (!cell.isFilled) {
                            cell.clearTint();
                            cell.setTint(this.tintManager.getCurrentTintForType(cell.texture.key));
                            
                            if (!cell.customData) {
                                cell.customData = {};
                            }
                            cell.customData.originalTint = this.tintManager.getCurrentTintForType(cell.texture.key);
                        }
                    }
                }
            }
        }
        
        if (this.placementPhase && this.shipPlacement && this.shipPlacement.playerGridArray) {
            this.shipPlacement.refreshWaveTextures(this.tintManager.currentOceanTint);
        }
    }
}

// Initialize the Phaser game instance with the main scene
new Phaser.Game({
    width: 950,
    height: 550,
    backgroundColor: 0xffffff,
    scene: MainScene,
    physics: { default: 'arcade' },
    parent: 'game-container'
});