const express = require('express');
const fs = require('fs');
const path = require('path');
const jimp = require('jimp');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Define API endpoints before static file middleware
// GET endpoint to retrieve wins
app.get('/api/wins', (req, res) => {
    try {
        const winsPath = path.join(__dirname, 'webpage', 'wins.json');
        // Create the file with default values if it doesn't exist
        if (!fs.existsSync(winsPath)) {
            fs.writeFileSync(winsPath, JSON.stringify({ playerWins: 0, cpuWins: 0 }, null, 2));
        }
        const data = fs.readFileSync(winsPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading wins file:', error);
        res.status(500).json({ error: 'Failed to read wins' });
    }
});

// POST endpoint to update wins
app.post('/api/wins', (req, res) => {
    try {
        const winsPath = path.join(__dirname, 'webpage', 'wins.json');
        fs.writeFileSync(winsPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing wins file:', error);
        res.status(500).json({ error: 'Failed to update wins' });
    }
});

// GET endpoint to retrieve current time
app.get('/api/time', (req, res) => {
    try {
        const now = new Date();
        res.json({ 
            time: now.toISOString(),
            hour: now.getHours(),
            minute: now.getMinutes(),
            second: now.getSeconds()
        });
    } catch (error) {
        console.error('Error getting time:', error);
        res.status(500).json({ error: 'Failed to get time' });
    }
});

// GET endpoint to get wave color based on time of day
app.get('/api/wave', async (req, res) => {
    try {
        const now = new Date();
        const hour = now.getHours();
        
        // Calculate color intensity based on time (lighter from 6am-6pm, darker from 6pm-6am)
        let blueIntensity;
        
        if (hour >= 6 && hour < 18) {
            // 6am to 6pm: gradually get lighter
            const minutesSince6am = (hour - 6) * 60 + now.getMinutes();
            const totalMinutes = 12 * 60; // 12 hours in minutes
            blueIntensity = 100 + (155 * minutesSince6am / totalMinutes);
        } else {
            // 6pm to 6am: gradually get darker
            let minutesSince6pm;
            if (hour >= 18) {
                minutesSince6pm = (hour - 18) * 60 + now.getMinutes();
            } else {
                minutesSince6pm = ((hour + 24) - 18) * 60 + now.getMinutes();
            }
            const totalMinutes = 12 * 60; // 12 hours in minutes
            blueIntensity = 255 - (155 * minutesSince6pm / totalMinutes);
        }
        
        blueIntensity = Math.max(100, Math.min(255, Math.floor(blueIntensity)));
        
        // Since the original image is AVIF format and Jimp doesn't support it,
        // we'll directly send the static file instead of trying to process it
        const oceanPath = path.join(__dirname, 'webpage', 'assets', 'ocean.png');
        
        // Set a time-based tint in the HTTP headers for Phaser to use
        res.set('X-Blue-Tint', blueIntensity / 255);
        res.set('Cache-Control', 'no-cache, no-store');
        res.sendFile(oceanPath);
        
    } catch (error) {
        console.error('Error in wave API:', error);
        // Fall back to serving the original file directly
        const oceanPath = path.join(__dirname, 'webpage', 'assets', 'ocean.png');
        res.sendFile(oceanPath);
    }
});

// Serve static files AFTER API routes
app.use(express.static('webpage'));

// Define a basic route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/webpage/index.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});