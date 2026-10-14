const express = require('express');
const cors = require('cors');
require('dotenv').config();

const analyzeRoutes = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', analyzeRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.json({ message: "URL Scanner API Server is running successfully." });
});

app.listen(PORT, () => {
    console.log(`[+] Server backend active on: http://localhost:${PORT}`);
});