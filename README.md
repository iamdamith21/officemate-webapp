# OfficeMate — Autonomous Robotic Delivery Platform

OfficeMate is a modern web application designed for campus offices and university departments. It coordinates autonomous robot dispatches to deliver papers, folders, and materials between faculty offices, lecture rooms, and departments.

## Project Structure

```
officemate-webapp/
├── package.json         # Unified dependencies & orchestration scripts
├── README.md            # Project documentation & configuration guide
├── .env                 # Application environment settings
├── api/                 # Backend logic & Vercel Serverless Functions
│   ├── index.js         # Main backend entry point
│   ├── models/          # Mongoose database models
│   └── routes/          # API route definitions
├── scripts/             # Utility scripts (e.g., clear_db.js, mock_ros.js)
├── src/                 # React frontend application source code
├── public/              # Static frontend assets
└── vite.config.js       # Vite bundler configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (v9 or higher)

### Installation

Install all project dependencies using npm:

```bash
npm install
```

### Environment Configuration

Configure the backend database connection and mailer settings. Create or modify the `.env` file at the root directory:

```env
PORT=5000
MONGO_URI=your-mongodb-connection-string

# SMTP Configuration for Password Reset Emails (e.g. Gmail App Passwords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Running the Application Locally

To start both the backend API server, the frontend client, and the Mock ROS server concurrently, run:

```bash
npm run dev
```

This starts:
1. **Frontend client**: http://localhost:5173
2. **Backend API server**: http://localhost:5000
3. **Mock ROSBridge WebSocket server**: ws://localhost:9090 (for local testing of robot operations)

### Building for Production

To build the optimized frontend production assets into the `dist/` directory:

```bash
npm run build
```

To run lint checks on the codebase:

```bash
npm run lint
```
