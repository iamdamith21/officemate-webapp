# OfficeMate — Autonomous Robotic Delivery Platform

OfficeMate is a modern web application designed for campus offices and university departments. It coordinates autonomous robot dispatches to deliver papers, folders, and materials between faculty offices, lecture rooms, and departments.

## Project Structure

```
officemate-webapp/
├── package.json         # Unified dependencies & orchestration scripts
├── README.md            # Project documentation & configuration guide
├── COMMANDS_GUIDE.txt   # CLI command reference guide
├── .env                 # Application environment configuration
├── api/                 # Backend Node.js / Express API
│   ├── index.js         # Backend server entry point
│   ├── models/          # Mongoose database models (DeliveryRequest, Employee, RobotStatus)
│   ├── routes/          # API route definitions (deliveryRoutes, employeeRoutes, robotRoutes)
│   └── utils/           # Backend utilities (SMS notifications)
├── docs/                # Project documentation & technical reports
├── scripts/             # Development & maintenance scripts
│   ├── clear_db.cjs     # Script to clear database records
│   ├── mock_ros.cjs     # Mock ROSBridge WebSocket server for offline UI development
│   └── sync_locations.py # Script to sync location maps between robot and web app
├── src/                 # React frontend application source code
│   ├── components/      # Global UI components (e.g., ChatAgent AI assistant)
│   ├── config/          # Axios API configuration
│   ├── constants/       # Application constants, delivery FSM states & ROS pose maps
│   ├── context/         # AuthContext (auth state, ROS WebSocket connection, delivery state)
│   ├── features/        # Feature-based page views
│   │   ├── analytics/   # Delivery statistics & analytics dashboard
│   │   ├── auth/        # User login interface
│   │   ├── dashboard/   # Admin & User dashboards, Activity History, Live SLAM View
│   │   ├── delivery/    # Delivery request creation form
│   │   └── profile/     # User profile management
│   ├── hooks/           # Custom React hooks (useDeliveryMission, useNavGoal, useRobotStatus)
│   ├── layouts/         # Layout wrappers (DashboardLayout, AuthLayout)
│   └── utils/           # Helper utility functions
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

### Connecting to the real robot

The mock server exists so the UI can be developed without hardware. To talk to
the actual OfficeMate robot instead:

1. On the Raspberry Pi, start rosbridge and the topic adapter:

   ```bash
   ros2 launch web_bridge web_bridge.launch.py
   ```

   (One-off install: `sudo apt install ros-humble-rosbridge-suite`.)

2. Copy `.env.example` to `.env` and point it at the Pi:

   ```bash
   VITE_ROS_BRIDGE_URL=ws://192.168.1.23:9090
   ```

3. Run `npm run dev:frontend` (or `npm run dev` — the mock will just sit idle
   on port 9090 and be ignored).

#### Topic contract

The browser never sees the robot's native topics. The `api_adapter` node in the
robot's `web_bridge` package translates them into this small, stable contract,
and `scripts/mock_ros.cjs` fakes the identical four so the mock and the real
robot are interchangeable:

| Web app topic          | Type              | Units          | Robot source                          |
| ---------------------- | ----------------- | -------------- | ------------------------------------- |
| `/battery_level`       | `std_msgs/Float32`| percent 0–100  | `/battery/state` (`BatteryState`)     |
| `/nav/status`          | `std_msgs/String` | display text   | `/mission_state` (`MissionState`)     |
| `/ultrasonic/distance` | `std_msgs/Float32`| **centimetres**| `/ultrasonic/range` (`Range`, metres) |
| `/locker/status`       | `std_msgs/Bool`   | true = unlocked| `/doors/state` (`String`)             |

If you change a topic name or unit, change it in **all three** places:
`AuthContext.jsx`, `api_adapter.py`, and `mock_ros.cjs`.

> **Battery:** no power monitor (INA219) is currently fitted to the robot, so
> `/battery_level` is never published and the dashboard shows *No Sensor*. This
> is deliberate — the UI does not invent a percentage.

### Building for Production

To build the optimized frontend production assets into the `dist/` directory:

```bash
npm run build
```

To run lint checks on the codebase:

```bash
npm run lint
```
