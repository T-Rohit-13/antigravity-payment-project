const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true })); // Allow all origins for mobile/Vercel
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Supabase (validates connection)
require('./config/supabase');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/hints', require('./routes/hints'));
app.use('/api/emergency', require('./routes/emergency'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RetireQuest API is running on Vercel 🚀' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Export the Express API for Vercel
module.exports = app;

// Listen locally if not running in Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 RetireQuest server running on http://localhost:${PORT}`);
  });
}
