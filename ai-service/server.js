require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Rate limiting: Max 50 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for stability during development
    message: { error: "Too many requests. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`AI Service running on port ${PORT}`);
});
