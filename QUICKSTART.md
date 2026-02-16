# Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation Steps

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend React app on http://localhost:3000

## First Time Setup

1. Open http://localhost:3000 in your browser
2. Click "Sign Up" to create an account
3. After registration, you'll be redirected to the Dashboard
4. Go to "Add File" in the sidebar
5. Upload a CSV or Excel file (you can use the provided `sample_data.csv`)
6. Wait for processing (usually takes a few seconds)
7. Navigate to "Dashboard" to see analytics
8. Navigate to "Data Table" to view the data in table format

## Testing with Sample Data

A sample CSV file (`sample_data.csv`) is included in the root directory. You can upload this file to test the application.

## Troubleshooting

- **Port already in use**: Change the port in `server/index.js` (backend) or `client/package.json` (frontend)
- **Database errors**: Delete `server/database/app.db` and restart the server
- **File upload fails**: Check that `server/uploads/` directory exists and has write permissions

## Project Features

✅ Home page (no team member photos)
✅ Login/Register pages
✅ Dashboard with left sidebar navigation
✅ File upload with automated ETL
✅ SQL database integration
✅ Real-time analytics dashboards
✅ Data table view with pagination

