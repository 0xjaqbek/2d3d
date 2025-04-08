// server/src/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { processImageController } = require('./controllers/imageController');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, and GIF images are allowed.'));
    }
  }
});

// Routes
app.post('/api/upload', upload.single('image'), processImageController);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Something went wrong!',
  });
});

module.exports = app;

