import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ImporterService } from './importer.service';

@Component({
  selector: 'app-importer',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
    MessageModule,
    TagModule,
    ProgressBarModule,
    DividerModule,
  ],
  providers: [ImporterService, MessageService],
  template: `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>Financial importer</h2>
        <span class="subtitle">Upload Excel or CSV with balance, income & cashflow sheets</span>
      </div>
    </div>

    <!-- Form -->
    <div class="import-card">

      <!-- Ticker -->
      <div class="field">
        <label for="ticker">Ticker</label>
        <input
          id="ticker"
          pInputText
          [(ngModel)]="ticker"
          placeholder="e.g. KO"
          class="ticker-input"
          (ngModelChange)="ticker = $event.toUpperCase()"
        />
      </div>

      <!-- Drop zone -->
      <div class="field">
        <label>File <span class="hint">.xlsx or .csv — 3 sheets: balance, income, cashflow</span></label>
        <p-fileUpload
          mode="advanced"
          [auto]="false"
          [multiple]="false"
          accept=".xlsx,.csv"
          chooseLabel="Choose file"
          [showUploadButton]="false"
          [showCancelButton]="false"
          (onSelect)="onFileSelect($event)"
          (onRemove)="onFileRemove()"
          styleClass="file-upload"
        />
      </div>

      <!-- Submit -->
      <div class="actions">
        <p-button
          label="Import"
          icon="pi pi-upload"
          [loading]="svc.loading()"
          [disabled]="!ticker || !selectedFile || svc.loading()"
          (onClick)="onSubmit()"
        />
        @if (svc.result()) {
          <p-button
            label="Clear"
            icon="pi pi-refresh"
            severity="secondary"
            [text]="true"
            (onClick)="onReset()"
          />
        }
      </div>

      <!-- Progress -->
      @if (svc.loading()) {
        <p-progressBar mode="indeterminate" styleClass="mt-3" />
      }
    </div>

    <!-- Result -->
    @if (svc.result(); as r) {
      <div class="result-card">
        <p-divider />

        <div class="result-summary">
          <span class="result-ticker">{{ r.ticker }}</span>
          <p-tag
            [value]="r.rowsImported + ' rows imported'"
            severity="success"
            icon="pi pi-check"
          />
          @if (r.warnings.length) {
            <p-tag
              [value]="r.warnings.length + ' warnings'"
              severity="warn"
              icon="pi pi-exclamation-triangle"
            />
          }
          @if (r.errors.length) {
            <p-tag
              [value]="r.errors.length + ' errors'"
              severity="danger"
              icon="pi pi-times"
            />
          }
        </div>

        <!-- Warnings list -->
        @if (r.warnings.length) {
          <div class="issues-list">
            <p class="issues-title">Warnings</p>
            @for (w of r.warnings; track w) {
              <p-message severity="warn" [text]="w" styleClass="issue-row" />
            }
          </div>
        }

        <!-- Errors list -->
        @if (r.errors.length) {
          <div class="issues-list">
            <p class="issues-title">Errors</p>
            @for (e of r.errors; track e) {
              <p-message severity="error" [text]="e" styleClass="issue-row" />
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      h2 { font-size: 1.3rem; font-weight: 600; margin: 0; }
      .subtitle { font-size: 0.8rem; color: var(--p-text-muted-color); }
    }

    .import-card {
      background: var(--p-surface-card);
      border: 1px solid var(--p-surface-border);
      border-radius: 8px;
      padding: 1.5rem;
      max-width: 600px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.25rem;
      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--p-text-color);
      }
      .hint {
        font-weight: 400;
        color: var(--p-text-muted-color);
        margin-left: 0.4rem;
      }
    }

    .ticker-input { width: 160px; text-transform: uppercase; }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .result-card { max-width: 600px; }

    .result-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .result-ticker {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .issues-list {
      margin-top: 0.75rem;
      .issues-title {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--p-text-muted-color);
        margin: 0 0 0.4rem;
      }
    }

    ::ng-deep .issue-row {
      margin-bottom: 0.3rem;
      width: 100%;
    }
  `],
})
export class ImporterComponent {
  svc = inject(ImporterService);

  ticker       = '';
  selectedFile = signal<File | null>(null);

  onFileSelect(event: any) {
    const file: File = event.files[0];
    if (file) this.selectedFile.set(file);
  }

  onFileRemove() {
    this.selectedFile.set(null);
  }

  async onSubmit() {
    const file = this.selectedFile();
    if (!this.ticker || !file) return;
    await this.svc.import(this.ticker, file);
  }

  onReset() {
    this.svc.reset();
    this.selectedFile.set(null);
    this.ticker = '';
  }
}