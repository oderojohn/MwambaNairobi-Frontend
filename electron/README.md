# MwambaPOS Desktop Application

This is an Electron-based desktop application for MwambaPOS that can be built as a standalone Windows executable without requiring any additional installations on the target computer.

## Features

- **Standalone .exe**: Runs on Windows without requiring Python, Node.js, or any runtime installation
- **Fixed Window Size**: Opens at 1500x800 (configurable in main.js)
- **Fullscreen Mode**: Can be toggled with F11
- **POS-optimized**: Designed for retail/POS use
- **Bundled Backend**: Django backend is included in the executable

## Quick Start - Building the Standalone .exe

### Option 1: Using the Automated Build Script (Recommended)

The easiest way to build the standalone executable:

```bash
cd pos/electron
python build_standalone.py
```

This script will:
1. Build the React frontend
2. Download and set up portable Python
3. Install all Python dependencies
4. Create the bundled Windows executable

The final executable will be at: `pos/electron/dist/MwambaPOS.exe`

### Option 2: Manual Build

If you prefer to build manually:

#### Prerequisites (for building only)

1. **Node.js** (version 14 or higher) - for building the app
2. **Python 3.11+** - for building the bundled Python
3. **npm** - comes with Node.js

#### Build Steps

1. **Install Node.js dependencies**:
```bash
cd pos
npm install
```

2. **Install Electron dependencies**:
```bash
cd electron
npm install
```

3. **Build the portable executable**:
```bash
npm run build:portable
```

The output will be in `electron/dist/MwambaPOS.exe`

## Running the Built Application

Once built, simply copy the `MwambaPOS.exe` file to any Windows computer and double-click it. The application will:

1. Start automatically
2. Launch the bundled Django backend server
3. Open the POS interface

No installation or additional software is required!

## Development Mode

For development:

1. **Start the Django backend**:
```bash
cd POS-BACKEND
python manage.py runserver 0.0.0.0:8001
```

2. **Start the React dev server**:
```bash
cd pos
npm start
```

3. **Start Electron**:
```bash
cd electron
npm start
```

The Electron app will connect to localhost:3001 for the frontend and localhost:8000 for the API.

## Configuration

### Window Size
Edit `main.js` to change window dimensions:
```javascript
const WINDOW_WIDTH = 1500;
const WINDOW_HEIGHT = 800;
```

### API Server (Development)
The app expects the backend API to be running at `http://localhost:8000` by default. 

To change the API URL, update the API base URL in the React app's configuration files.

## Troubleshooting

### Issue: Python not found in production
The app will try these locations for Python:
1. `./python/python.exe` (relative to electron folder)
2. System Python (fallback)

### Issue: Port 8001 already in use
The Django backend runs on port 8001. If this port is busy, you can modify `main.js` to use a different port.

### Issue: Database not found
The SQLite database should be in the POS-BACKEND folder. Make sure `db.sqlite3` is present before building.

## Build Output

After a successful build, you'll find:

- `dist/MwambaPOS.exe` - The standalone portable executable
- `dist/win-unpacked/` - Unpacked application files (for debugging)

## Notes

- The portable Python package is approximately 20-30MB
- Total application size will be around 200-300MB depending on dependencies
- The first run may take a few seconds to start while the backend initializes
