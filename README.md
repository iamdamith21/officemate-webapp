# OfficeMate — Autonomous Robotic Delivery Platform

OfficeMate is a modern web application designed for campus offices and university departments. It coordinates autonomous robot dispatches to deliver papers, folders, and materials between faculty offices, lecture rooms, and departments.

## Project Structure

```
officemate-webapp/
├── package.json         # Root package configuration & orchestration scripts
├── README.md            # Project documentation & configuration guide
├── backend/             # Express.js backend server with MongoDB integration
│   ├── .env             # Backend environment settings
│   ├── server.js        # Main entry point
│   ├── models/          # Mongoose database models
│   └── routes/          # API route definitions
└── frontend/            # React + Vite frontend application
    ├── index.html       # Single-page template
    ├── package.json     # Frontend dependencies & build commands
    ├── tailwind.config.js
    └── src/             # Frontend source code
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (v9 or higher)

### Installation

Install all workspace dependencies (root, backend, and frontend) using the helper script:

```bash
npm run install:all
```

### Environment Configuration

Configure the backend database connection and mailer settings. Create/modify the `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your-mongodb-connection-string

# SMTP Configuration for Password Reset Emails (e.g. Gmail App Passwords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Running the Application

To start both the backend server and the frontend client concurrently, run:

```bash
npm run dev
```

This starts:
1. **Frontend client**: http://localhost:5173
2. **Backend API server**: http://localhost:5000
3. **Mock ROSBridge WebSocket server**: ws://localhost:9090 (for local testing of robot operations)

### Building for Production

To build the optimized frontend production assets:

```bash
npm run build:frontend
```

To run lint checks on the frontend:

```bash
npm run lint:frontend
```
