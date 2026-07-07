import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule }    from 'primeng/dialog';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule }    from 'primeng/select';
import { CheckboxModule }  from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { CompaniesService } from '../companies/companies.service';
import type { FieldMapper } from './mapper.model';
import { STATEMENT_TYPES, TRANSFORM_TYPES, DISPLAY_FORMAT_TYPES } from './mapper.model';

@Component({
  selector:   'app-mapper-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogModule, ButtonModule, InputTextModule,
    SelectModule, CheckboxModule, InputNumberModule,
  ],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onClose()"
      [header]="mapper() ? 'Edit mapper rule' : 'New mapper rule'"
      [modal]="true"
      [style]="{ width: '580px' }"
      [closable]="true"
      [draggable]="false">

      <form [formGroup]="form" class="form-grid">

        <!-- Company -->
        <div class="field full">
          <label>Company (optional — leave empty for global rule)</label>
          <p-select
            formControlName="companyId"
            [options]="companySvc.items()"
            optionLabel="ticker"
            optionValue="id"
            placeholder="All companies"
            [showClear]="true"
            [filter]="true"
            filterPlaceholder="Search ticker..."
            class="w-full">
            <ng-template let-c pTemplate="item">
              <span><strong>{{ c.ticker }}</strong> — {{ c.name }}</span>
            </ng-template>
          </p-select>
        </div>

        <!-- Statement type -->
        <div class="field">
          <label>Statement type *</label>
          <p-select
            formControlName="statementType"
            [options]="statementTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            class="w-full" />
        </div>

        <!-- Transform -->
        <div class="field">
          <label>Transform</label>
          <p-select
            formControlName="transform"
            [options]="transformTypes"
            optionLabel="label"
            optionValue="value"
            class="w-full" />
        </div>

        <!-- Display format -->
        <div class="field">
          <label>Display format</label>
          <p-select
            formControlName="displayFormat"
            [options]="displayFormats"
            optionLabel="label"
            optionValue="value"
            class="w-full" />
        </div>

        <!-- Raw label -->
        <div class="field full">
          <label>Raw label (as in Excel) *</label>
          <input pInputText formControlName="rawLabel" placeholder="Net Income" class="w-full" />
        </div>

        <!-- Canonical field -->
        <div class="field">
          <label>Canonical field *</label>
          <input pInputText formControlName="canonicalField" placeholder="netIncome" class="w-full" />
        </div>

        <!-- Target table -->
        <div class="field">
          <label>Target table *</label>
          <input pInputText formControlName="targetTable" placeholder="income_statement" class="w-full" />
        </div>

        <!-- Target column -->
        <div class="field">
          <label>Target column *</label>
          <input pInputText formControlName="targetColumn" placeholder="net_income" class="w-full" />
        </div>

        <!-- Priority -->
        <div class="field">
          <label>Priority</label>
          <p-inputnumber formControlName="priority" [min]="0" [max]="127" class="w-full" />
        </div>

        <!-- Notes -->
        <div class="field full">
          <label>Notes</label>
          <input pInputText formControlName="notes" placeholder="Optional notes" class="w-full" />
        </div>

        <!-- Active -->
        <div class="field">
          <label>Active</label>
          <p-checkbox formControlName="isActive" [binary]="true" label="Active" />
        </div>

      </form>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="onClose()" />
        <p-button
          [label]="mapper() ? 'Save changes' : 'Create'"
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
    .field      { display: flex; flex-direction: column; gap: 0.4rem; }
    .field.full { grid-column: 1 / -1; }
    label       { font-size: 0.8rem; font-weight: 500; color: var(--p-text-muted-color); }
    .w-full     { width: 100%; }
  `],
})
export class MapperFormComponent implements OnInit {
  private fb  = inject(FormBuilder);
  companySvc  = inject(CompaniesService);

  visible = input.required<boolean>();
  mapper  = input<FieldMapper | null>(null);
  saving  = input<boolean>(false);

  closed    = output<void>();
  submitted = output<any>();

  statementTypes = STATEMENT_TYPES;
  transformTypes = TRANSFORM_TYPES;
  displayFormats = DISPLAY_FORMAT_TYPES;

  form = this.fb.group({
    companyId:      [null as number | null],
    statementType:  ['' as any, Validators.required],
    rawLabel:       ['', Validators.required],
    canonicalField: ['', Validators.required],
    targetTable:    ['', Validators.required],
    targetColumn:   ['', Validators.required],
    transform:      ['none' as any],
    displayFormat:  ['currency' as any],
    priority:       [10],
    isActive:       [true],
    notes:          [''],
  });

  ngOnInit() {
    this.companySvc.load();
    const m = this.mapper();
    if (m) this.form.patchValue({ ...m, notes: m.notes ?? '' });
  }

  onClose()  { this.closed.emit(); }

  onSubmit() {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.submitted.emit({
      ...val,
      companyId: val.companyId ?? null,
      notes:     val.notes || undefined,
    });
  }
}
