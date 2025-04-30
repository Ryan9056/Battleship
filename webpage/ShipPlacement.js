class ShipPlacement {
    constructor(scene) {
        this.scene = scene;
        this.shipSizes = [5, 4, 3, 3, 2];
        this.currentShipIndex = 0;
        this.currentShipOrientation = "horizontal"; 
        this.playerShipCells = []; 
        this.playerGridArray = [];
        this.hoverRow = undefined;
        this.hoverCol = undefined;
        this.placementPhase = true;
        
        // Add instruction text centered at the top of the screen
        this.placementText = this.scene.add.text(
            this.scene.canvasWidth / 2, 
            50, 
            `Place your ${this.shipSizes[this.currentShipIndex]}-length ship. Press R to rotate.`, 
            {
                font: '16px Arial',
                fill: 'Black',
                align: 'center'
            }
        );
        this.placementText.setOrigin(0.5, 0.5);
        
        // Add key for rotation
        this.scene.input.keyboard.on('keydown-R', () => {
            this.currentShipOrientation = this.currentShipOrientation === "horizontal" ? "vertical" : "horizontal";
            this.updatePlacementPreview();
        });
    }
    
    createPlayerGrid() {
        const Playerarray = Array.from({ length: 10 }, () => Array(10).fill(0));

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                // Add the wave image to the scene at the correct position
                const x = this.scene.rightGridX + (col * this.scene.cellSize);
                const y = this.scene.gridsY + (row * this.scene.cellSize);
                const wave = this.scene.add.image(x, y, "ocean");
                
                wave.setScale(0.05); // Original scale
                wave.setOrigin(0);
                wave.setDepth(1); // Set depth so grid lines can appear on top
                
                // Apply ocean tint using TintManager
                wave.setTint(this.scene.tintManager.currentOceanTint);
                
                // Make cells interactive during placement phase
                wave.setInteractive()
                    .on('pointerdown', () => this.placeShip(row, col))
                    .on('pointerover', () => this.showPlacementPreview(row, col))
                    .on('pointerout', () => this.clearPlacementPreview());
                
                // Store the wave image in the grid
                Playerarray[row][col] = wave;
            }
        }
        
        this.playerGridArray = Playerarray;
    }
    
    // Preview ship placement when hovering
    showPlacementPreview(row, col) {
        this.hoverRow = row;
        this.hoverCol = col;
        this.updatePlacementPreview();
    }
    
    updatePlacementPreview() {
        // Clear previous previews
        this.clearPlacementPreview();
        
        if (this.hoverRow === undefined || this.hoverCol === undefined) return;
        
        const shipSize = this.shipSizes[this.currentShipIndex];
        const isValid = this.isValidPlacement(this.hoverRow, this.hoverCol, shipSize, this.currentShipOrientation);
        
        // Show preview
        for (let i = 0; i < shipSize; i++) {
            let row = this.hoverRow;
            let col = this.hoverCol;
            
            if (this.currentShipOrientation === "horizontal") {
                col += i;
            } else {
                row += i;
            }
            
            if (row >= 0 && row < 10 && col >= 0 && col < 10) {
                const cell = this.playerGridArray[row][col];
                
                // Track filled state for tint management
                cell.isFilled = true;
                
                if (isValid) {
                    cell.setTintFill(0x00FF00); // Green for valid
                } else {
                    cell.setTintFill(0xFF0000); // Red for invalid
                }
            }
        }
    }
    
    clearPlacementPreview() {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = this.playerGridArray[row][col];
                cell.clearTint();
                
                // Mark as not filled for tint management
                cell.isFilled = false;
                
                // Apply time-based tint based on element type using TintManager
                cell.setTint(this.scene.tintManager.getCurrentTintForType(cell.texture.key));
            }
        }
        
        // Redraw already placed ships
        this.playerShipCells.forEach(cell => {
            const { row, col } = cell;
            this.playerGridArray[row][col].setTexture('ship');
            // Apply time-based tint to ships
            this.playerGridArray[row][col].setTint(this.scene.tintManager.getCurrentTintForType('ship'));
        });
    }
    
    isValidPlacement(startRow, startCol, size, orientation) {
        for (let i = 0; i < size; i++) {
            let row = startRow;
            let col = startCol;
            
            if (orientation === "horizontal") {
                col += i;
            } else {
                row += i;
            }
            
            // Check if out of bounds
            if (row < 0 || row >= 10 || col < 0 || col >= 10) {
                return false;
            }
            
            // Check if cell already has a ship
            if (this.scene.Playerboard[row][col] === 1) {
                return false;
            }
        }
        
        return true;
    }
    
    // Place ship when player clicks
    placeShip(row, col) {
        const shipSize = this.shipSizes[this.currentShipIndex];
        if (this.isValidPlacement(row, col, shipSize, this.currentShipOrientation)) {
            // Place the ship
            for (let i = 0; i < shipSize; i++) {
                let shipRow = row;
                let shipCol = col;
                
                if (this.currentShipOrientation === "horizontal") {
                    shipCol += i;
                } else {
                    shipRow += i;
                }
                
                // Update player board
                this.scene.Playerboard[shipRow][shipCol] = 1;
                
                // Update visuals
                this.playerGridArray[shipRow][shipCol].setTexture('ship');
                // Apply ship tint using TintManager
                this.playerGridArray[shipRow][shipCol].setTint(this.scene.tintManager.currentShipTint);
                
                // Track for redrawing
                this.playerShipCells.push({ row: shipRow, col: shipCol });
            }
            
            // Move to next ship
            this.currentShipIndex++;
            
            if (this.currentShipIndex >= this.shipSizes.length) {
                // All ships placed, start game
                this.finishPlacement();
            } else {
                // Update text for next ship
                this.placementText.setText(`Place your ${this.shipSizes[this.currentShipIndex]}-length ship. Press R to rotate.`);
            }
        }
    }
    
    refreshWaveTextures(tint) {
        if (this.playerGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = this.playerGridArray[row][col];
                    // Skip cells that are being hovered over
                    if (!cell.isFilled) {
                        cell.clearTint();
                        // Apply time-based tint based on element type using TintManager
                        cell.setTint(this.scene.tintManager.getCurrentTintForType(cell.texture.key));
                    }
                }
            }
        }
    }
    
    finishPlacement() {
        this.placementPhase = false;
        this.placementText.setText("Game started! Click on CPU grid to attack.");
        
        // Signal to MainScene that placement is complete
        this.scene.startGameAfterPlacement();
    }
} 