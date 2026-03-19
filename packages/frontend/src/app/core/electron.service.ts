import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI?: {
      getVersion:    () => Promise<string>;
      getBackendUrl: () => Promise<string>;
      isDev:         () => Promise<boolean>;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class ElectronService {
  readonly isElectron = !!window.electronAPI;

  getVersion()    { return window.electronAPI?.getVersion()    ?? Promise.resolve('web'); }
  getBackendUrl() { return window.electronAPI?.getBackendUrl() ?? Promise.resolve('http://localhost:3000'); }
  isDev()         { return window.electronAPI?.isDev()         ?? Promise.resolve(true); }
}