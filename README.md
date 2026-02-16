# ProjectC Commerce

A comprehensive analytics platform with automated ETL processing and real-time data visualization.

## Features

- **User Authentication**: Secure login and registration
- **File Upload**: Upload CSV and Excel files for data processing
- **Automated ETL**: Automatic data extraction, transformation, and loading
- **SQL Database**: SQLite database for data storage
- **Analytics Dashboard**: Real-time charts and graphs powered by actual data
- **Data Table View**: Paginated table view of processed data

## Project Structure

```
project1/
├── client/          # React frontend
├── server/          # Node.js/Express backend
└── package.json     # Root package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm run install-all
```

This will install dependencies for root, server, and client.

### 2. Start Development Servers

```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend React app (port 3000).

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

1. **Register/Login**: Create an account or login
2. **Upload File**: Go to "Add File" and upload a CSV or Excel file
3. **View Analytics**: Check the Dashboard for charts and visualizations
4. **View Data Table**: Go to "Data Table" to see the processed data in table format

## Technology Stack

### Frontend
- React 18
- React Router
- Recharts (for charts)
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- SQLite3
- Multer (file uploads)
- CSV Parser & XLSX (file processing)
- JWT (authentication)
- Bcrypt (password hashing)

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/files/upload` - Upload data file
- `GET /api/analytics/dashboard` - Get analytics data
- `GET /api/data/table` - Get paginated data table

## Database

The application uses SQLite database located at `server/database/app.db`. The database is automatically created on first run.

## ETL Process

The ETL (Extract, Transform, Load) process:
1. **Extract**: Reads CSV or Excel files
2. **Transform**: Cleans data (removes whitespace, converts types, handles nulls)
3. **Load**: Stores cleaned data in SQL database

## Notes

- Uploaded files are stored in `server/uploads/`
- Data is automatically processed after upload
- Analytics are generated based on the uploaded data
- All charts use real data from the database

