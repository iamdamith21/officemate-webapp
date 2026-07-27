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
