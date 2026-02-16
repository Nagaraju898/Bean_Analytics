const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { verifyToken } = require('./auth');
const db = require('../database/db');
const etlProcessor = require('../services/etlProcessor');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload file and process ETL
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.filename, 'Size:', req.file.size);
    
    const userId = req.userId;
    const filePath = req.file.path;
    const originalFilename = req.file.originalname;

    // Save file info to database
    db.getDb().run(
      'INSERT INTO files (user_id, filename, original_filename, file_path) VALUES (?, ?, ?, ?)',
      [userId, req.file.filename, originalFilename, filePath],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          fs.unlinkSync(filePath); // Delete uploaded file on error
          return res.status(500).json({ error: 'Error saving file info', details: err.message });
        }

        const fileId = this.lastID;
        console.log('File saved with ID:', fileId);

        // Process ETL asynchronously
        etlProcessor.processFile(fileId, userId, filePath, originalFilename)
          .then(() => {
            console.log('ETL processing completed for file:', fileId);
            res.json({
              message: 'File uploaded and processed successfully',
              fileId: fileId,
              filename: originalFilename
            });
          })
          .catch((error) => {
            console.error('ETL processing error:', error);
            res.status(500).json({ error: 'File uploaded but processing failed', details: error.message });
          });
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get user's uploaded files
router.get('/list', verifyToken, (req, res) => {
  const userId = req.userId;

  db.getDb().all(
    'SELECT id, original_filename, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
    [userId],
    (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching files' });
      }
      res.json(files);
    }
  );
});

module.exports = router;

