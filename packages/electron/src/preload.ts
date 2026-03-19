import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion:    () => ipcRenderer.invoke('app:version'),
  getBackendUrl: () => ipcRenderer.invoke('app:backend-url'),
  isDev:         () => ipcRenderer.invoke('app:is-dev'),
});
// ```

// ---

// La estructura de carpetas queda así:
// ```
// packages/electron/
// ├── package.json
// ├── tsconfig.json
// ├── src/
// │   ├── main.ts       ← proceso principal
// │   └── preload.ts    ← bridge seguro hacia Angular
// └── resources/
//     └── icons/        ← icon.icns / icon.ico / icon.png