class TintManager {
    constructor(scene) {
        this.scene = scene;
        
        // Initialize tint variables for different element types
        this.currentOceanTint = 0xFFFFFF; // Default white
        this.currentShipTint = 0xFFFFFF;  // Default white
        this.currentHitTint = 0xFFFFFF;   // Default white
        this.currentMissTint = 0xFFFFFF;  // Default white
        
        this.updateTimer = null;
        this.currentTime = null;
    }
    
    // Initialize the tint manager
    async initialize() {
        // Initial tint update
        await this.updateOceanTint();
        
        // Set up interval to check time and update tint (every 15 seconds)
        this.updateTimer = setInterval(() => this.updateOceanTint(), 15000);
        
        return this;
    }
    
    // Update the ocean tint based on current time
    async updateOceanTint() {
        try {
            const response = await fetch('/api/time');
            const timeData = await response.json();
            
            const prevHour = this.currentTime ? this.currentTime.hour : -1;
            const prevMinute = this.currentTime ? this.currentTime.minute : -1;
            
            // Update time display in the main scene
            this.currentTime = timeData;
            if (this.scene.timeText) {
                this.scene.timeText.setText(this.scene.formatTime(timeData.hour, timeData.minute));
            }
            
            // Calculate tint based on time
            const hour = timeData.hour;
            let blueIntensity;
            
            if (hour >= 6 && hour < 18) {
                // 6am to 6pm: gradually get lighter
                const minutesSince6am = (hour - 6) * 60 + timeData.minute;
                const totalMinutes = 12 * 60; // 12 hours in minutes
                blueIntensity = 100 + (155 * minutesSince6am / totalMinutes);
            } else {
                // 6pm to 6am: gradually get darker
                let minutesSince6pm;
                if (hour >= 18) {
                    minutesSince6pm = (hour - 18) * 60 + timeData.minute;
                } else {
                    minutesSince6pm = ((hour + 24) - 18) * 60 + timeData.minute;
                }
                const totalMinutes = 12 * 60; // 12 hours in minutes
                blueIntensity = 255 - (155 * minutesSince6pm / totalMinutes);
            }
            
            blueIntensity = Math.max(100, Math.min(255, Math.floor(blueIntensity)));
            
            // Store the current tint values for different element types
            
            // Ocean - full blue tint effect
            this.currentOceanTint = Phaser.Display.Color.GetColor(255, 255, blueIntensity);
            
            // Ships - slightly bluer tint (75% of the effect)
            const shipBlue = Math.floor(255 - ((255 - blueIntensity) * 0.75));
            this.currentShipTint = Phaser.Display.Color.GetColor(255, 255, shipBlue);
            
            // Hits - reddish tint with time influence (50% of the effect)
            const hitBlue = Math.floor(255 - ((255 - blueIntensity) * 0.5));
            this.currentHitTint = Phaser.Display.Color.GetColor(255, 200, hitBlue);
            
            // Misses - whitish tint with time influence (25% of the effect)
            const missBlue = Math.floor(255 - ((255 - blueIntensity) * 0.25));
            this.currentMissTint = Phaser.Display.Color.GetColor(255, 255, missBlue);
            
            // Apply the updated tints to all game elements
            this.applyTintsToElements();
            
            // Force an immediate grid update if the time has changed significantly
            if (prevHour !== timeData.hour || Math.abs(prevMinute - timeData.minute) >= 1) {
                this.scene.updateBothGrids();
            }
            
            return true;
        } catch (error) {
            console.error('Error updating time:', error);
            // Use local time as fallback
            const now = new Date();
            if (this.scene.timeText) {
                this.scene.timeText.setText(this.scene.formatTime(now.getHours(), now.getMinutes()));
            }
            return false;
        }
    }
    
    // Apply the current tints to all elements based on their type
    applyTintsToElements() {
        // Apply to CPU grid
        if (this.scene.cpuGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    this.applyTintToElement(this.scene.cpuGridArray[row][col]);
                }
            }
        }
        
        // Apply to player grid if we're in game phase
        if (!this.scene.placementPhase && this.scene.playerGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    this.applyTintToElement(this.scene.playerGridArray[row][col]);
                }
            }
        }
        
        // Apply to the placement grid if we're in placement phase
        if (this.scene.placementPhase && this.scene.shipPlacement && this.scene.shipPlacement.playerGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    this.applyTintToElement(this.scene.shipPlacement.playerGridArray[row][col]);
                }
            }
        }
    }
    
    // Helper function to apply appropriate tint based on texture key
    applyTintToElement(element) {
        if (!element || !element.texture || element.isFilled) return;
        
        element.clearTint();
        
        switch (element.texture.key) {
            case 'ocean':
                element.setTint(this.currentOceanTint);
                break;
            case 'ship':
                element.setTint(this.currentShipTint);
                break;
            case 'hit':
                element.setTint(this.currentHitTint);
                break;
            case 'miss':
                element.setTint(this.currentMissTint);
                break;
            default:
                // Default to no tint for unknown elements
                break;
        }
    }
    
    // Get the current tint for a specific element type
    getCurrentTintForType(elementType) {
        switch (elementType) {
            case 'ocean':
                return this.currentOceanTint;
            case 'ship':
                return this.currentShipTint;
            case 'hit':
                return this.currentHitTint;
            case 'miss':
                return this.currentMissTint;
            default:
                return 0xFFFFFF; // Default white
        }
    }
    
    // Update tints for waves
    refreshWaveTextures() {
        // Update CPU grid textures
        if (this.scene.cpuGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = this.scene.cpuGridArray[row][col];
                    if (cell.texture.key === 'ocean') {
                        cell.clearTint();
                        cell.setTint(this.currentOceanTint);
                    }
                }
            }
        }
        
        // Update player grid textures - only during placement phase
        // During game phase, player grid is recreated in CPUmove
        if (this.scene.shipPlacement && this.scene.placementPhase) {
            this.scene.shipPlacement.refreshWaveTextures(this.currentOceanTint);
        }
    }
    
    // Helper method to refresh all tints
    refreshTintsForAllCells() {
        // Clear any cached tint values that might be outdated
        if (this.scene.cpuGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = this.scene.cpuGridArray[row][col];
                    if (cell && cell.customData) {
                        cell.customData.originalTint = this.getCurrentTintForType(cell.texture.key);
                    }
                }
            }
        }
        
        if (!this.scene.placementPhase && this.scene.playerGridArray) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = this.scene.playerGridArray[row][col];
                    if (cell && cell.customData) {
                        cell.customData.originalTint = this.getCurrentTintForType(cell.texture.key);
                    }
                }
            }
        }
    }
    
    // Handle hover state tinting
    enterButtonHoverState(wave) {
        // Save original tint if it's an ocean tile
        if (wave.texture.key === 'ocean') {
            // Store the original tint if not already stored
            if (!wave.customData) {
                wave.customData = { originalTint: wave.tintTopLeft };
            }
        }
        
        // Apply a dark tint overlay
        wave.setTintFill(0x000000);
    }
    
    // Handle rest state tinting
    enterButtonRestState(wave) {
        // Clear the tint fill effect
        wave.clearTint();
        
        // Restore appropriate tint based on element type
        if (wave.texture && wave.customData) {
            wave.setTint(this.getCurrentTintForType(wave.texture.key));
        }
    }
    
    // Clean up resources
    shutdown() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
} 