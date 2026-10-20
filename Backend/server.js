const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initPostgres } = require('./config/postgres');

// Load environment variables
dotenv.config();

// Connect to PostgreSQL database engine
initPostgres().catch(err => {
  console.error('Failed to initialize PostgreSQL:', err);
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Blogksolve API - Version 5 (Complete PostgreSQL Architecture)',
    database: 'PostgreSQL',
    features: [
      'PostgreSQL Relational Schema',
      'JWT Authentication & Role Authorization',
      'Admin Review & Story Approval Workflow',
      'Dynamic Blog Tags System with Filter Queries',
      'Two-Level Threaded Nested Reply Comments',
      'Resource Ownership Authorization (Edit/Delete Own Stories)'
    ],
    status: 'online',
    version: '5.0.0'
  });
});

// PostgreSQL API Routes
app.use('/api/auth', require('./routes/postgresAuthRoutes'));
app.use('/api/blogs', require('./routes/postgresBlogRoutes'));
app.use('/api/comments', require('./routes/postgresCommentRoutes'));
app.use('/api/admin', require('./routes/postgresAdminRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Blogksolve Backend Server running on http://localhost:${PORT} (PostgreSQL Engine Active)`);
});
