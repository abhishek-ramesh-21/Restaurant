const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { router: seedRouter, autoSeed } = require('./routes/seedRoutes');
const menuRouter = require('./routes/menuRoutes');
const reservationRouter = require('./routes/reservationRoutes');
const orderRouter = require('./routes/orderRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Connect Database & Run Initial Seeder
connectDB().then(() => {
  autoSeed();
});

// API Routes
app.use('/api/seed', seedRouter);
app.use('/api/menu', menuRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/orders', orderRouter);

// Fallback route to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: 'Spatial Server Internal Error',
    message: err.message
  });
});

const DEFAULT_PORT = process.env.PORT || 3005;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`  AURA Spatial Restaurant Engine active on port ${port}`);
    console.log(`  Local URL: http://localhost:${port}`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port Conflict] Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Server Error]', err);
    }
  });
};

startServer(Number(DEFAULT_PORT));

