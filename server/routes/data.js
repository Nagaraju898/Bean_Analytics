const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const db = require('../database/db');

// Get data table
router.get('/table', verifyToken, (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Get the latest file for the user
  db.getDb().get(
    'SELECT id FROM files WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1',
    [userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching file' });
      }

      if (!file) {
        return res.json({
          hasData: false,
          data: [],
          total: 0,
          page: 1,
          totalPages: 0
        });
      }

      // Get processed data
      db.getDb().get(
        'SELECT data_json FROM processed_data WHERE file_id = ? AND user_id = ? ORDER BY processed_at DESC LIMIT 1',
        [file.id, userId],
        (err, processedData) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching processed data' });
          }

          if (!processedData) {
            return res.json({
              hasData: false,
              data: [],
              total: 0,
              page: 1,
              totalPages: 0
            });
          }

          try {
            const allData = JSON.parse(processedData.data_json);
            const total = allData.length;
            const totalPages = Math.ceil(total / limit);
            const paginatedData = allData.slice(offset, offset + parseInt(limit));

            res.json({
              hasData: true,
              data: paginatedData,
              total: total,
              page: parseInt(page),
              totalPages: totalPages,
              limit: parseInt(limit)
            });
          } catch (error) {
            res.status(500).json({ error: 'Error parsing data', details: error.message });
          }
        }
      );
    }
  );
});

module.exports = router;

