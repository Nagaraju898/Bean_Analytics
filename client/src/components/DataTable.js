import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataTable.css';

const DataTable = ({ refreshTrigger = 0 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasData, setHasData] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/data/table?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('API Response:', response.data);

        if (response.data.hasData && response.data.data && response.data.data.length > 0) {
          setData(response.data.data);
          setTotalPages(response.data.totalPages || 1);
          setTotalRecords(response.data.total || response.data.data.length);
          setHasData(true);
          setError('');
        } else {
          setHasData(false);
          setData([]);
          setError(response.data.message || 'No data available');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load data');
        setHasData(false);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit, refreshTrigger]);

  if (loading) {
    return (
      <div className="data-table-container">
        <div className="loading">Loading data...</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="data-table-container">
        <div className="no-data">
          <h2>No Data Available</h2>
          <p>{error || 'Please upload a file to view data'}</p>
          <p className="hint">Go to "Add File" to upload your data</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="data-table-container">
        <div className="no-data">
          <h2>No Data Available</h2>
          <p>No data found in the current page</p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {}).filter(key => key !== '_id');

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>Data Table</h2>
        <div className="table-info">
          Page {page} of {totalPages} | Total Records: {totalRecords}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>{(page - 1) * limit + rowIndex + 1}</td>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {row[col] !== null && row[col] !== undefined 
                      ? String(row[col]).substring(0, 100)
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn btn-secondary"
        >
          Previous
        </button>
        <span className="page-info">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;

