const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require('electron');
const path = require('path');
// const isDev = require('electron-is-dev'); // Removed dependency
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');

let backendProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    }
  });

  const startURL = !app.isPackaged
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', 'frontend', 'index.html')}`;

  win.loadURL(startURL);

  // Remove default menu
  Menu.setApplicationMenu(null);

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Optional: show devtools in dev
  if (!app.isPackaged) win.webContents.openDevTools({ mode: 'detach' });
}

function startBackend() {
  console.log('startBackend called, isPackaged:', app.isPackaged);
  const { dialog } = require('electron');
  dialog.showMessageBox(null, {
    type: 'info',
    title: 'Debug',
    message: `startBackend called, isPackaged: ${app.isPackaged}`
  });
  try {
    const logPath = path.join(app.getPath('userData'), 'backend-start.log');
    fs.appendFileSync(logPath, `Attempting to start backend at ${new Date().toISOString()} with RH_TEST_BACKEND_PATH=${process.env.RH_TEST_BACKEND_PATH}\n`);

    // If RH_TEST_BACKEND_PATH is set, spawn that JS file with node for local testing
    if (process.env.RH_TEST_BACKEND_PATH) {
      let rawPath = String(process.env.RH_TEST_BACKEND_PATH || '');
      // aggressive sanitize: remove trailing whitespace and control characters, BOM, NBSP, ZERO WIDTH etc.
      rawPath = rawPath.replace(/[\s\u00A0\uFEFF\u200B\u200E\u200F\u2028\u2029]+$/g, '');
      rawPath = rawPath.replace(/[\x00-\x1F\x7F]+$/g, '');
      let testScript = rawPath.trim();
      try { testScript = path.normalize(testScript); } catch (e) {}
      const hex = Buffer.from(testScript, 'utf8').toString('hex');
      fs.appendFileSync(logPath, `Using test backend script (sanitized): [${testScript}] hex=${hex}\n`);
      // Try to resolve node path and spawn directly to avoid shell quoting issues
      let nodePath = 'node';
      try {
        const execSync = require('child_process').execSync;
        const whereOut = execSync('where.exe node', { stdio: 'pipe' }).toString().trim();
        if (whereOut) nodePath = whereOut.split(/\r?\n/)[0];
      } catch (e) {
        // fallback to 'node'
      }
      fs.appendFileSync(logPath, `Spawning node executable: ${nodePath}\n`);
      // Use node -e to require the script after trimming to avoid trailing-space issues
      const requireExpr = `require(${JSON.stringify(testScript)}.trim())`;
      fs.appendFileSync(logPath, `Launching node via -e: ${requireExpr}\n`);
      backendProcess = spawn(nodePath, ['-e', requireExpr], { stdio: 'inherit' });
      backendProcess.on('exit', (code) => {
        fs.appendFileSync(logPath, `Test backend exited with code ${code}\n`);
        console.log('Test backend process exited with code', code);
        backendProcess = null;
      });
      fs.appendFileSync(logPath, `Test backend started at ${testScript}\n`);
      console.log('Test backend started at', testScript);
      return;
    }

    // Default: start the bundled backend server when packaged
    // Prefer embedded native binaries (populated via build extraResources), fall back to JS server
    const platform = process.platform;
    let bundledBinary = null;
    try {
      const resourceBase = process.resourcesPath;
      console.log('Resources path:', resourceBase);
      if (platform === 'win32') {
        bundledBinary = path.join(resourceBase, 'binaries', 'win', 'backend.exe');
      } else if (platform === 'darwin') {
        bundledBinary = path.join(resourceBase, 'binaries', 'mac', 'backend');
      } else {
        bundledBinary = path.join(resourceBase, 'binaries', 'linux', 'backend');
      }
      console.log('Bundled binary path:', bundledBinary);
      console.log('Binary exists:', fs.existsSync(bundledBinary));

      if (bundledBinary && fs.existsSync(bundledBinary)) {
        try { 
          fs.chmodSync(bundledBinary, 0o755); 
          console.log('Set executable permissions');
        } catch (e) {
          console.log('Failed to set permissions:', e);
        }
        console.log('Starting bundled backend...');
        backendProcess = spawn(bundledBinary, [], { stdio: 'inherit' });
        backendProcess.on('exit', (code) => {
          fs.appendFileSync(logPath, `Bundled backend exited with code ${code}\n`);
          console.log('Bundled backend exited with code', code);
          backendProcess = null;
        });
        backendProcess.on('error', (err) => {
          console.error('Bundled backend error:', err);
        });
        fs.appendFileSync(logPath, `Bundled backend started at ${bundledBinary}\n`);
        console.log('Bundled backend started at', bundledBinary);
        return;
      }
    } catch (e) {
      fs.appendFileSync(logPath, `Error checking bundled backend: ${e}\n`);
    }

    // Fallback: run the JS server from packaged app
    const backendEntry = path.join(app.getAppPath(), 'backend', 'server.js');
    backendProcess = spawn(process.execPath, [backendEntry], { stdio: 'inherit' });
    backendProcess.on('exit', (code) => {
      fs.appendFileSync(logPath, `Backend exited with code ${code}\n`);
      console.log('Backend process exited with code', code);
      backendProcess = null;
    });
    fs.appendFileSync(logPath, `Backend started at ${backendEntry}\n`);
    console.log('Backend started at', backendEntry);
  } catch (err) {
    fs.appendFileSync(logPath, `Backend start failed: ${err}\n`);
    console.error('Failed to start backend process:', err);
  }
}

app.whenReady().then(() => {
  dialog.showMessageBox(null, {
    type: 'info',
    title: 'Debug',
    message: `isPackaged: ${app.isPackaged}, RH_TEST_BACKEND_PATH: ${process.env.RH_TEST_BACKEND_PATH}`
  });

  createWindow();

  // If a test backend path is set, start it regardless of packaged state (local testing)
  // Start backend
  startBackend();

  // Check for updates only in packaged mode and handle errors gracefully
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.log('Update check failed (expected if no releases published):', err.message);
    });
  }

  autoUpdater.on('update-available', () => {
    console.log('Update available');
  });
  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded; will install on quit');
    try {
      autoUpdater.quitAndInstall();
    } catch (err) {
      console.error('Auto-install failed:', err);
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
      backendProcess = null;
    } catch (e) {
      console.error('Failed to kill backend process:', e);
    }
  }
});

// Placeholder for auto-update integration (electron-updater)
// We leave comments here so you can wire it later with GH_TOKEN and provider config.
// Example: const { autoUpdater } = require('electron-updater'); autoUpdater.checkForUpdatesAndNotify();

// Handle requests from preload to open external URLs in default browser
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (err) {
    console.error('Failed to open external URL:', err);
    return false;
  }
});

// Expose a simple ping channel if needed
ipcMain.handle('app:ping', async () => 'pong');
