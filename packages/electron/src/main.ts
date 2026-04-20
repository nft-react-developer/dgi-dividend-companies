import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as log from 'electron-log';

const isDev        = !app.isPackaged;
const BACKEND_PORT = 3399;
const FRONTEND_PORT = 4299;
const FRONTEND_URL = isDev
  ? 'http://localhost:' + FRONTEND_PORT
  : `file://${path.join(__dirname, '../../frontend/index.html')}`;

let mainWindow:  BrowserWindow | null = null;
let backendProc: ChildProcess  | null = null;

// ── Backend ───────────────────────────────────────────────────────────────────
function startBackend(): Promise<void> {
  return new Promise((resolve) => {
    const backendPath = isDev
      ? path.join(__dirname, '../../backend/src/main.ts')
      : path.join(process.resourcesPath, 'backend/main.js');

    const command = isDev ? 'ts-node-dev' : 'node';
    const args    = isDev
      ? ['--respawn', '--transpile-only', backendPath]
      : [backendPath];

    backendProc = spawn(command, args, {
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      shell: true,
    });

    backendProc.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      log.info(`[backend] ${msg}`);
      if (msg.includes('Backend running')) resolve();
    });

    backendProc.stderr?.on('data', (data: Buffer) => {
      log.error(`[backend:err] ${data.toString().trim()}`);
    });

    backendProc.on('error', (err) => {
      log.error('Backend spawn error:', err);
      resolve(); // resolve anyway, window will show connection error
    });

    // Fallback: don't block window forever
    setTimeout(resolve, 4000);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function waitForUrl(url: string, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const http = require('http') as typeof import('http');
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        900,
    minHeight:       600,
    title:           'DGI Analyzer',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
    show: false,
  });

  mainWindow.loadURL(FRONTEND_URL);

  log.info('Main window created, loading URL:', FRONTEND_URL);
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) mainWindow?.webContents.openDevTools({ mode: 'detach' });
  });

  // External links → default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('app:version',     () => app.getVersion());
ipcMain.handle('app:backend-url', () => `http://localhost:${BACKEND_PORT}`);
ipcMain.handle('app:is-dev',      () => isDev);

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  await startBackend();
  if (isDev) {
    log.info('Waiting for frontend dev server...');
    await waitForUrl(`http://localhost:${FRONTEND_PORT}`).catch(() =>
      log.warn('Frontend dev server did not respond in time, loading anyway')
    );
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  backendProc?.kill();
});