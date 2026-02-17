# MwambaPOS Desktop Application

This is an Electron-based desktop application for MwambaPOS.

## Features

- **Fixed Window Size**: Opens at 1366x768 (configurable in main.js)
- **Fullscreen Mode**: Can be toggled with F11
- **POS-optimized**: Designed for retail/POS use

## Prerequisites

1. Node.js installed (version 14 or higher)
2. The React app must be built first

## Installation

1. Install dependencies:
```bash
cd electron
npm install
```

2. Build the React app:
```bash
cd ..
npm run build
```

3. Run the Electron app:
```bash
cd electron
npm start
```

## Building the .exe

To create a portable .exe file:

```bash
cd electron
npm run build
```

The output will be in `electron/dist/MwambaPOS.exe`

## Configuration

### Window Size
Edit `main.js` to change window dimensions:
```javascript
const WINDOW_WIDTH = 1366;
const WINDOW_HEIGHT = 768;
```

### API Server
The app expects the backend API to be running at `http://localhost:8000` by default. 

To change the API URL, update the API base URL in the React app's api.js file.

## Development Mode

For development, you can run:
1. Start the React dev server: `npm start` (from project root)
2. Start Electron: `cd electron && npm start`

The Electron app will connect to localhost:3001 for the frontend and localhost:8000 for the API.
