require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`AI Service running on port ${PORT}`);
});
