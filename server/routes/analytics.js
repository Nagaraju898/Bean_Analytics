const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const db = require('../database/db');
const analyticsService = require('../services/analyticsService');

// Get analytics data for dashboard
router.get('/dashboard', verifyToken, (req, res) => {
  const userId = req.userId;

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
          message: 'No data available. Please upload a file first.'
        });
      }

      // Get processed data
      db.getDb().get(
        'SELECT data_json FROM processed_data WHERE file_id = ? AND user_id = ? ORDER BY processed_at DESC LIMIT 1',
        [file.id, userId],
        async (err, processedData) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching processed data' });
          }

          if (!processedData) {
            return res.json({
              hasData: false,
              message: 'Data is still being processed. Please wait.'
            });
          }

          try {
            const data = JSON.parse(processedData.data_json);
            const analytics = await analyticsService.generateAnalytics(data, file.id, userId);
            
            res.json({
              hasData: true,
              fileId: file.id,
              analytics: analytics
            });
          } catch (error) {
            res.status(500).json({ error: 'Error generating analytics', details: error.message });
          }
        }
      );
    }
  );
});

module.exports = router;

