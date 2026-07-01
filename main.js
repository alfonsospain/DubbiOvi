const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const http = require('http');
const net = require('net');
const fs = require('fs');

let nextProcess = null;
let mainWindow = null;

// Resolve diagnostics logging directory
const logDir = app.getPath('logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'diagnostics.log');

// Setup logging utility
function logDiag(message) {
  const time = new Date().toISOString();
  const line = `[${time}] ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (err) {
    console.error('Failed to write to diagnostics log file:', err);
  }
}

// Log application startup parameters
logDiag('--- DubbiOvi Diagnostics Startup ---');
logDiag(`Application Version: 1.3.7`);
logDiag(`Platform: ${process.platform} (${process.arch})`);
logDiag(`Node Version: ${process.version}`);
logDiag(`Electron Version: ${process.versions.electron}`);
logDiag(`Log file path: ${logFile}`);

// Instrument uncaught exception and promise rejection loggers
process.on('uncaughtException', (err) => {
  logDiag(`UNCAUGHT EXCEPTION: ${err.message}\nStack: ${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logDiag(`UNHANDLED REJECTION: ${reason}`);
});

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
    
    const poll = () => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 1000,
      }, (res) => {
        if (res.statusCode) {
          resolve(true);
        } else {
          setTimeout(poll, 200);
        }
      });

      req.on('error', () => {
        if (Date.now() - start > 15000) {
          logDiag('Still waiting for Next.js standalone server to start...');
        }
        setTimeout(poll, 200);
      });

      req.on('timeout', () => {
        req.destroy();
      });

      req.end();
    };

    poll();
  });
}

// Renders styled diagnostic errors within Electron BrowserWindow if backend crashes
function displayStartupError(message, stderr) {
  if (!mainWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DubbiOvi Startup Error</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #0b0f19;
          color: #f8fafc;
          padding: 40px;
          line-height: 1.6;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: #111827;
          border: 1px solid #1f2937;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        h1 {
          color: #ef4444;
          font-size: 24px;
          margin-top: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .error-box {
          background-color: #1e1b4b;
          border-left: 4px solid #6366f1;
          padding: 15px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13px;
          margin: 20px 0;
          white-space: pre-wrap;
          word-break: break-all;
          overflow-x: auto;
        }
        .stderr-box {
          background-color: #18181b;
          border: 1px solid #27272a;
          padding: 15px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          margin: 20px 0;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 250px;
          overflow-y: auto;
          color: #a1a1aa;
        }
        .info {
          font-size: 13px;
          color: #94a3b8;
        }
        .btn {
          background-color: #6366f1;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          margin-top: 15px;
        }
        .btn:hover {
          background-color: #4f46e5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ DubbiOvi Startup Failure</h1>
        <p>The application failed to start the local backend server. Below are the details of the failure:</p>
        
        <div class="error-box">${message}</div>
        
        ${stderr ? `
          <h3>Server output (stderr):</h3>
          <div class="stderr-box">${stderr}</div>
        ` : ''}
        
        <div class="info">
          Diagnostics log written to: <br>
          <code>${logFile}</code>
        </div>
        
        <button class="btn" onclick="window.location.reload()">Retry Launch</button>
      </div>
    </body>
    </html>
  `;

  const base64Html = Buffer.from(htmlContent).toString('base64');
  mainWindow.loadURL(`data:text/html;base64,${base64Html}`);
}

async function createWindow() {
  const isDev = !app.isPackaged;
  let port;

  if (isDev) {
    port = 9002; // Port configured in package.json dev command
  } else {
    // Attempt to use a fixed port (9981) so that origin-based localStorage persists across launches.
    const preferredPort = 9981;
    const isFree = await isPortFree(preferredPort);
    if (!isFree) {
      logDiag(`[Electron] Preferred port ${preferredPort} is busy. Terminating.`);
      dialog.showMessageBoxSync({
        type: 'warning',
        title: 'DubbiOvi Already Running',
        message: 'Another instance of DubbiOvi may already be running, or a previous instance did not shut down correctly.',
        detail: 'Please close the other instance and try again.',
        buttons: ['Exit']
      });
      app.quit();
      return;
    }
    port = preferredPort;
  }

  const iconPath = isDev
    ? path.join(__dirname, 'public', 'icon.png')
    : path.join(app.getAppPath(), '.next', 'standalone', 'public', 'icon.png');

  // Create the main window only if port check succeeds or we are in development
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    title: 'DubbiOvi',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    logDiag(`[Electron] Connecting to local Next.js dev server at http://127.0.0.1:${port}`);
    await checkServerReady(port);
  } else {
    logDiag(`[Electron] Starting Next.js standalone server on port ${port}...`);

    // In a packaged app, resources are in the app folder (since we compile with asar: false)
    const serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
    logDiag(`[Electron] Executing server path: ${serverPath}`);

    let serverErrorOutput = '';

    nextProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        PORT: port.toString(),
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    nextProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      logDiag(`[Next.js stdout] ${msg.trim()}`);
    });

    nextProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      serverErrorOutput += msg;
      logDiag(`[Next.js stderr] ${msg.trim()}`);
    });

    nextProcess.on('error', (err) => {
      logDiag(`[Electron] Next.js child process encountered an error: ${err.message}`);
    });

    nextProcess.on('exit', (code, signal) => {
      logDiag(`[Electron] Next.js child process exited with code ${code} and signal ${signal}`);
    });

    try {
      await Promise.race([
        checkServerReady(port),
        new Promise((_, reject) => {
          nextProcess.on('exit', (code, signal) => {
            reject(new Error(`Next.js standalone server exited early with code ${code} (signal: ${signal}).`));
          });
          nextProcess.on('error', (err) => {
            reject(new Error(`Failed to start Next.js process: ${err.message}`));
          });
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Next.js server startup timed out (15 seconds).')), 15000);
        })
      ]);
      logDiag(`[Electron] Next.js server resolved successfully on port ${port}`);
    } catch (err) {
      logDiag(`[Electron] Backend launch failure: ${err.message}`);
      displayStartupError(err.message, serverErrorOutput);
      return;
    }
  }

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (detachedWindow) {
      detachedWindow.close();
      detachedWindow = null;
    }
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
    logDiag('[Electron] Terminating Next.js standalone server process...');
    nextProcess.kill();
  }
});

// IPC Handlers for native save and file dialogs
ipcMain.handle('show-save-dialog', async (event, options) => {
  if (!mainWindow) return { canceled: true };
  return await dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('save-file', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

let detachedWindow = null;

ipcMain.on('open-detached-video', (event, url) => {
  if (detachedWindow) {
    detachedWindow.focus();
    return;
  }

  const { screen } = require('electron');
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  const windowOptions = {
    width: 800,
    height: 600,
    title: 'DubbiOvi - Video Player',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  };

  if (externalDisplay) {
    windowOptions.x = externalDisplay.bounds.x + 50;
    windowOptions.y = externalDisplay.bounds.y + 50;
  }

  detachedWindow = new BrowserWindow(windowOptions);
  detachedWindow.loadURL(url);

  detachedWindow.on('closed', () => {
    detachedWindow = null;
    if (mainWindow) {
      mainWindow.webContents.send('detached-window-status', { open: false });
    }
  });

  if (mainWindow) {
    mainWindow.webContents.send('detached-window-status', { open: true });
  }
});

ipcMain.on('close-detached-video', () => {
  if (detachedWindow) {
    detachedWindow.close();
    detachedWindow = null;
  }
});


