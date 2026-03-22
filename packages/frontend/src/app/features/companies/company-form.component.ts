import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule }       from 'primeng/dialog';
import { ButtonModule }       from 'primeng/button';
import { InputTextModule }    from 'primeng/inputtext';
import { SelectModule }       from 'primeng/select';
import { CheckboxModule }     from 'primeng/checkbox';
import { FileUploadModule }   from 'primeng/fileupload';
import { DividerModule }      from 'primeng/divider';
import { SectorsService }     from '../../core/sectors.service';
import type { Company }       from './company.model';
import { COUNTRIES } from '../../shared/data/countries.data';

@Component({
  selector:   'app-company-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogModule, ButtonModule, InputTextModule,
    SelectModule, CheckboxModule, FileUploadModule, DividerModule,
  ],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onClose()"
      [header]="company() ? 'Edit company' : 'New company'"
      [modal]="true"
      [style]="{ width: '560px' }"
      [closable]="true"
      [draggable]="false">

      <form [formGroup]="form" class="form-grid">

        <!-- Ticker + ISIN -->
        <div class="field">
          <label>Ticker *</label>
          <input pInputText formControlName="ticker" placeholder="JNJ" class="w-full" />
        </div>
        <div class="field">
          <label>ISIN</label>
          <input pInputText formControlName="isin" placeholder="US4592001014" class="w-full" />
        </div>

        <!-- Name -->
        <div class="field full">
          <label>Company name *</label>
          <input pInputText formControlName="name" placeholder="Johnson & Johnson" class="w-full" />
        </div>

        <!-- Sector + Industry -->
        <div class="field">
          <label>Sector *</label>
          <p-select
            formControlName="sectorId"
            [options]="sectors.items()"
            optionLabel="name"
            optionValue="id"
            placeholder="Select sector"
            class="w-full" />
        </div>
        <div class="field">
          <label>Industry</label>
          <input pInputText formControlName="industry" placeholder="Pharmaceuticals" class="w-full" />
        </div>

        <!-- Country + Currency -->
        <div class="field">
  <label>Country *</label>
  <p-select
    formControlName="countryIso"
    [options]="countries"
    optionLabel="name"
    optionValue="iso"
    placeholder="Select country"
    [filter]="true"
    filterPlaceholder="Search..."
    class="w-full">
    <ng-template let-c pTemplate="item">
      <span>{{ c.flag }} {{ c.name }}</span>
    </ng-template>
    <ng-template let-c pTemplate="selectedItem">
      <span>{{ c.flag }} {{ c.name }}</span>
    </ng-template>
  </p-select>
</div>
        <div class="field">
          <label>Currency *</label>
          <input pInputText formControlName="currency" placeholder="USD" maxlength="3" class="w-full" />
        </div>

        <!-- Exchange + Fiscal year end -->
        <div class="field">
          <label>Exchange</label>
          <input pInputText formControlName="exchange" placeholder="NYSE" class="w-full" />
        </div>
        <div class="field">
          <label>Fiscal year end (month)</label>
          <input pInputText formControlName="fiscalYearEnd" type="number" min="1" max="12" class="w-full" />
        </div>

        <!-- Active -->
        <div class="field">
            <label>Active</label>
          <p-checkbox formControlName="isActive" [binary]="true" label="Active" />
        </div>

        <!-- Logo -->
        @if (company()) {
          <div class="field full">
            <p-divider />
            <label>Logo</label>
            <p-fileupload
              mode="basic"
              accept="image/*"
              [maxFileSize]="2097152"
              chooseLabel="Upload logo"
              (onSelect)="onLogoSelect($event)" />
          </div>
        }

      </form>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="onClose()" />
        <p-button
          [label]="company() ? 'Save changes' : 'Create'"
          [loading]="saving()"
          [disabled]="form.invalid"
          (onClick)="onSubmit()" />
      </ng-template>

    </p-dialog>
  `,
  styles: [`
    .form-grid {
      display:               grid;
      grid-template-columns: 1fr 1fr;
      gap:                   1rem;
      padding-top:           0.5rem;
    }
    .field       { display: flex; flex-direction: column; gap: 0.4rem; }
    .field.full  { grid-column: 1 / -1; }
    label        { font-size: 0.8rem; font-weight: 500; color: var(--p-text-muted-color); }
    .w-full      { width: 100%; }
  `],
})
export class CompanyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  sectors    = inject(SectorsService);

  visible = input.required<boolean>();
  company = input<Company | null>(null);
  saving  = input<boolean>(false);

  closed     = output<void>();
  submitted  = output<any>();
  logoSelected = output<File>();

  countries = COUNTRIES;

  form = this.fb.group({
    ticker:        ['', [Validators.required, Validators.maxLength(12)]],
    isin:          [''],
    name:          ['', Validators.required],
    sectorId:      [null as number | null, Validators.required],
    industry:      [''],
    countryIso:    ['', [Validators.required, Validators.maxLength(2)]],
    currency:      ['', [Validators.required, Validators.maxLength(3)]],
    exchange:      [''],
    fiscalYearEnd: [12],
    isActive:      [true],
  });

  ngOnInit() {
    this.sectors.load();
    const c = this.company();
    if (c) this.form.patchValue({ ...c });
  }

  onClose()   { this.closed.emit(); }

  onLogoSelect(event: any) {
    const file = event.files?.[0];
    if (file) this.logoSelected.emit(file);
  }

  onSubmit() {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.submitted.emit({
      ...val,
      ticker:     val.ticker?.toUpperCase(),
      countryIso: val.countryIso?.toUpperCase(),
      currency:   val.currency?.toUpperCase(),
    });
  }
}