const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const db = require('../database/db');

class ETLProcessor {
  async processFile(fileId, userId, filePath, originalFilename) {
    try {
      // Extract: Read file based on extension
      const ext = filePath.split('.').pop().toLowerCase();
      let rawData = [];

      if (ext === 'csv') {
        rawData = await this.readCSV(filePath);
      } else if (ext === 'xlsx' || ext === 'xls') {
        rawData = await this.readExcel(filePath);
      } else {
        throw new Error('Unsupported file format');
      }

      // Transform: Clean and normalize data
      const cleanedData = this.transformData(rawData);

      // Load: Save to database
      await this.loadData(fileId, userId, cleanedData);

      return cleanedData;
    } catch (error) {
      console.error('ETL Processing Error:', error);
      throw error;
    }
  }

  async readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async readExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  transformData(rawData) {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    return rawData.map((row, index) => {
      const cleanedRow = {};

      // Clean each field
      Object.keys(row).forEach(key => {
        const cleanedKey = this.cleanKey(key);
        let value = row[key];

        // Remove whitespace
        if (typeof value === 'string') {
          value = value.trim();
        }

        // Convert empty strings to null
        if (value === '' || value === 'null' || value === 'undefined') {
          value = null;
        }

        // Try to convert to number if it looks like a number
        if (value !== null && typeof value === 'string') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            value = numValue;
          }
        }

        // Convert date strings
        if (value !== null && typeof value === 'string' && this.isDateString(value)) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString();
          }
        }

        cleanedRow[cleanedKey] = value;
      });

      // Add row ID
      cleanedRow._id = index + 1;

      return cleanedRow;
    });
  }

  cleanKey(key) {
    return key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  isDateString(str) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/,
      /^\d{2}\/\d{2}\/\d{4}/,
      /^\d{2}-\d{2}-\d{4}/
    ];
    return datePatterns.some(pattern => pattern.test(str));
  }

  async loadData(fileId, userId, cleanedData) {
    return new Promise((resolve, reject) => {
      const dataJson = JSON.stringify(cleanedData);
      
      db.getDb().run(
        'INSERT INTO processed_data (file_id, user_id, data_json) VALUES (?, ?, ?)',
        [fileId, userId, dataJson],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }
}

module.exports = new ETLProcessor();

