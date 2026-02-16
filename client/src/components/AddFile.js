import React, { useState } from 'react';
import axios from 'axios';
import './AddFile.css';

const AddFile = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (
      allowedTypes.includes(selectedFile.type) ||
      selectedFile.name.endsWith('.csv') ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls')
    ) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a CSV or Excel file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Authentication token not found. Please login again.');
      setUploading(false);
      return;
    }
    
    try {
      // Upload file with auth token
      // IMPORTANT: Don't set Content-Type for FormData - browser will set it with boundary
      await axios.post('/api/files/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage('File uploaded and processed successfully!');
      setFile(null);
      document.getElementById('file-input').value = '';
      
      // Call parent callback to refresh data instead of reloading page
      if (onUploadSuccess) {
        setTimeout(() => {
          onUploadSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Upload error details:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      
      const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Upload failed. Please try again.';
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="add-file-container">
      <div className="add-file-card">
        <h2>Upload Data File</h2>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <div className="upload-area">
          <label htmlFor="file-input" className="file-label">
            <span className="upload-icon">📤</span>
            <div>
              <span className="upload-text">Click to upload your data file</span>
              <span className="upload-hint">CSV or Excel (.xlsx, .xls)</span>
            </div>
          </label>
          <input
            type="file"
            id="file-input"
            className="file-input"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="file-info">
            <p><strong>Selected File:</strong> <span className="file-name">{file.name}</span></p>
            <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          onClick={handleUpload} 
          disabled={!file || uploading}
        >
          {uploading ? '⏳ Uploading...' : '✓ Upload & Process'}
        </button>
      </div>
    </div>
  );
};

export default AddFile;
