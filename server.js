const express = require('express');
const app = express();
const port = 3000;

// Serve static files (e.g., your HTML, JS, and assets)
app.use(express.static('public'));

// Define a basic route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // Serve your HTML file
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});