# CodeCraftHub

## Project Overview
CodeCraftHub is a personal learning goal tracker built with Node.js and Express.
It includes a REST API backend and a plain HTML/JavaScript frontend that runs in the browser via Live Server.

Course data is stored in a local JSON file (`courses.json`) that is created automatically when the server starts.
No database or authentication is required.

## Features
- Simple Express server running on port `5000`
- CORS enabled so the frontend can communicate with the API from any port
- File-based storage using `courses.json` (no database required)
- Full CRUD support for courses via REST API
- Course statistics endpoint for progress overview
- Input validation and clear error responses
- Automatic course ID generation (starting from `1`)
- Automatic `created_at` timestamp for new records
- Browser-based frontend (`index.html`) with add, edit, and delete support

## Project Structure
```
CodeCraftHub/
├── app.js          # Express server — all API routes and logic
├── index.html      # Frontend UI — connect via Live Server
├── courses.json    # Auto-created JSON data store
├── package.json    # Project metadata and dependencies
├── .gitignore      # Ignores node_modules, logs, .env
└── README.md       # This file
```

## Installation Instructions
### Prerequisites
- Node.js (v18+ recommended)
- npm

### Install dependencies
```bash
npm install
```

## How To Run The Application
### 1. Start the API server
```bash
npm start
```

If successful, the console shows:
```text
CodeCraftHub API server running on http://localhost:5000
```

### 2. Open the frontend
Open `index.html` with **Live Server** in VS Code (right-click → Open with Live Server).
The UI connects to the API at `http://localhost:5000` automatically.

Make sure the API server is running before opening the frontend.

## API Endpoint Documentation
Base URL:
```text
http://localhost:5000/api/courses
```

### Course Model
Each course has:
- `id` (number, auto-generated)
- `name` (string, required)
- `description` (string, required)
- `target_date` (string, required, `YYYY-MM-DD`)
- `status` (string, required: `Not Started`, `In Progress`, `Completed`)
- `created_at` (string, auto-generated timestamp)

### 1. Create Course
**POST** `/api/courses`

Example request body:
```json
{
  "name": "Node.js Basics",
  "description": "Learn Express and build REST APIs",
  "target_date": "2026-05-15",
  "status": "Not Started"
}
```

Example success response (`201`):
```json
{
  "message": "Course created successfully.",
  "data": {
    "id": 1,
    "name": "Node.js Basics",
    "description": "Learn Express and build REST APIs",
    "target_date": "2026-05-15",
    "status": "Not Started",
    "created_at": "2026-04-13T12:00:00.000Z"
  }
}
```

### 2. Get All Courses
**GET** `/api/courses`

Example success response (`200`):
```json
{
  "message": "Courses fetched successfully.",
  "count": 1,
  "data": [
    {
      "id": 1,
      "name": "Node.js Basics",
      "description": "Learn Express and build REST APIs",
      "target_date": "2026-05-15",
      "status": "Not Started",
      "created_at": "2026-04-13T12:00:00.000Z"
    }
  ]
}
```

### 3. Get Course Statistics
**GET** `/api/courses/stats`

Example success response (`200`):
```json
{
  "message": "Course statistics fetched successfully.",
  "data": {
    "total_courses": 3,
    "by_status": {
      "Not Started": 1,
      "In Progress": 1,
      "Completed": 1
    }
  }
}
```

### 4. Get Course By ID
**GET** `/api/courses/:id`

Example:
```text
GET /api/courses/1
```

Success response (`200`) returns one course.
If not found, response is `404`:
```json
{
  "message": "Course not found."
}
```

### 5. Update Course
**PUT** `/api/courses/:id`

Example request body:
```json
{
  "name": "Node.js Basics",
  "description": "Build complete CRUD APIs",
  "target_date": "2026-05-20",
  "status": "In Progress"
}
```

Success response (`200`) returns updated course.

### 6. Delete Course
**DELETE** `/api/courses/:id`

Example:
```text
DELETE /api/courses/1
```

Success response (`200`) includes deleted course data.

## Error Handling
The API returns clear errors for common cases:
- `400 Bad Request`
  - Missing required fields
  - Invalid `target_date` format
  - Invalid `status` value
  - Invalid ID format
- `404 Not Found`
  - Course does not exist
- `500 Internal Server Error`
  - File read/write failures or unexpected server errors

## Troubleshooting
### 1. `Cannot find module 'express'` or `Cannot find module 'cors'`
Run:
```bash
npm install
```

### 2. `npm start` fails
Make sure you are in the project folder containing `package.json`, then run:
```bash
npm start
```

### 3. Port `5000` already in use
- Stop the process using port `5000`
- Or temporarily change `PORT` in `app.js`

### 6. Frontend not loading courses (CORS error in browser console)
- Make sure the API server is running (`npm start`)
- CORS is already enabled in `app.js` — if you see a CORS error, confirm the server started without errors
- Open browser DevTools → Network tab to inspect the failed request

### 4. `courses.json` issues
- The app creates `courses.json` automatically if it does not exist
- If the file is corrupted, replace its content with:
```json
[]
```

### 5. Validation errors on create/update
Check that:
- `name`, `description`, `target_date`, `status` are present
- `target_date` format is `YYYY-MM-DD`
- `status` is exactly one of:
  - `Not Started`
  - `In Progress`
  - `Completed`
