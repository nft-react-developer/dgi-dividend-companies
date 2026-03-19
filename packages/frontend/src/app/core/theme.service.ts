import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'dgi-theme';

  mode = signal<ThemeMode>(this.loadSaved());

  init() {
    this.applyToDOM(this.mode());
  }

  toggle() {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode) {
    this.mode.set(mode);
    this.applyToDOM(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }

  private loadSaved(): ThemeMode {
    const saved      = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return saved ?? (prefersDark ? 'dark' : 'light');
  }

  private applyToDOM(mode: ThemeMode) {
    document.documentElement.classList.toggle('p-dark', mode === 'dark');
  }
}