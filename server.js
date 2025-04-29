const express = require('express');
const fs = require('fs');
const path = require('path');
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