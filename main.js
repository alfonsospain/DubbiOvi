const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const http = require('http');
const net = require('net');

let nextProcess = null;
let mainWindow = null;

// Find an available TCP port dynamically
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', (err) => reject(err));
  });
}

// Check if a specific port is free
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

// Poll the localhost server until it returns a valid HTTP response
function checkServerReady(port) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 1000,
      }, (res) => {
        if (res.statusCode) {
          clearInterval(interval);
          resolve(true);
        }
      });

      req.on('error', () => {
        // If it's taking too long, print a debug message
        if (Date.now() - start > 15000) {
          console.log('Still waiting for Next.js standalone server to start...');
        }
      });
      req.end();
    }, 200);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    title: 'DubbiOvi',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;
  let port;

  if (isDev) {
    port = 9002; // Port configured in package.json dev command
    console.log(`[Electron] Connecting to local Next.js dev server at http://127.0.0.1:${port}`);
    await checkServerReady(port);
  } else {
    // Attempt to use a fixed port (9981) so that origin-based localStorage persists across launches.
    const preferredPort = 9981;
    const isFree = await isPortFree(preferredPort);
    if (isFree) {
      port = preferredPort;
    } else {
      console.log(`[Electron] Preferred port ${preferredPort} is busy. Falling back to dynamic port.`);
      port = await getFreePort();
    }
    console.log(`[Electron] Starting Next.js standalone server on port ${port}...`);

    // In a packaged app, resources are in the app folder (since we compile with asar: false)
    const serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
    console.log(`[Electron] Executing server path: ${serverPath}`);

    nextProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        PORT: port.toString(),
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
      },
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });

    nextProcess.on('error', (err) => {
      console.error('[Electron] Next.js child process encountered an error:', err);
    });

    nextProcess.on('exit', (code, signal) => {
      console.log(`[Electron] Next.js child process exited with code ${code} and signal ${signal}`);
    });

    await checkServerReady(port);
  }

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up child process when app closes
app.on('will-quit', () => {
  if (nextProcess) {
    console.log('[Electron] Terminating Next.js standalone server process...');
    nextProcess.kill();
  }
});
