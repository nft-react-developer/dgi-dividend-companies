# DGI Analyzer

Aplicación de escritorio para analizar empresas de dividendos crecientes (DGI — *Dividend Growth Investing*). Permite gestionar un universo de empresas, importar sus estados financieros desde hojas de cálculo y validar automáticamente criterios de seguridad del dividendo.

---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Base de datos](#base-de-datos)
- [API REST](#api-rest)
- [Módulo de importación](#módulo-de-importación)
- [Validaciones DGI](#validaciones-dgi)
- [Empaquetado](#empaquetado)

---

## Arquitectura

Monorepo con cuatro paquetes gestionados via Yarn Workspaces:

```
dgi-dividend-companies/
├── packages/
│   ├── backend/      # API REST — Express.js + Drizzle ORM + MySQL
│   ├── frontend/     # SPA — Angular 19 + PrimeNG
│   ├── electron/     # Envoltorio de escritorio — Electron 31
│   └── shared/       # Código compartido (reservado para uso futuro)
├── database/         # Documentación SQL
├── doc/              # Imágenes de documentación
└── drizzle.config.ts # Configuración de migraciones
```

**Flujo general:**

```
Electron (main process)
  ├── Lanza el proceso backend  (puerto 3399)
  └── Abre ventana Chromium con la SPA Angular  (puerto 4299)
```

---

## Tecnologías

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Express.js | 5.2 |
| Frontend | Angular | 19.2 |
| UI | PrimeNG | 19.0 |
| Base de datos | MySQL | 8.x |
| ORM | Drizzle | 0.45 |
| Validación | Zod | 4.3 |
| Escritorio | Electron | 31.0 |
| Gestor de paquetes | Yarn Workspaces | — |
| Lenguaje | TypeScript | 5.4–5.9 |

---

## Requisitos previos

- Node.js ≥ 18
- Yarn ≥ 1.22
- MySQL 8.x (instancia accesible en red o local)

---

## Instalación

```bash
git clone <repo-url>
cd dgi-dividend-companies
yarn install
```

---

## Configuración

Crea el fichero `.env` dentro de `packages/backend/`:

```env
DATABASE_HOST_NAME=localhost
DATABASE_USER_NAME=dev
DB_PORT=3306
DATABASE_USER_PASSWORD=changeme
DATABASE_DB_NAME=dgi_analyzer
API_PORT=3399
```

El frontend lee la URL del backend desde `packages/frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3399/api',
};
```

---

## Desarrollo

Lanza los tres paquetes en paralelo (backend + frontend + electron):

```bash
yarn dev
```

O bien cada uno por separado:

```bash
yarn workspace backend dev      # API en :3399
yarn workspace frontend dev     # SPA en :4299
yarn workspace electron dev     # Electron (abre ventana)
```

---

## Base de datos

### Migraciones

```bash
yarn db:migrate   # Aplica las migraciones pendientes
yarn db:seed      # Carga datos iniciales (sectores, etc.)
```

### Esquema

| Tabla | Descripción |
|-------|-------------|
| `companies` | Empresas: ticker, ISIN, nombre, sector, país, divisa, logo |
| `sectors` | Clasificación sectorial |
| `dividends` | Historial de pagos de dividendos por empresa y año fiscal |
| `income_statement` | Cuenta de resultados anual/trimestral (~45 campos + métricas extendidas en JSON) |
| `balance_sheet` | Balance: activo, pasivo y patrimonio neto + ratios DGI |
| `field_mappers` | Mapeo dinámico de columnas de hoja de cálculo a campos canónicos |
| `import_log` | Registro de auditoría de importaciones |

#### Frecuencias de dividendo soportadas

`monthly` · `quarterly` · `semi-annual` · `annual` · `special`

#### Tipos de dividendo soportados

`ordinary` · `special` · `scrip` · `return_of_capital`

---

## API REST

Base URL: `http://localhost:3399`

### Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Liveness check (sin BD) |
| GET | `/health/db` | Comprueba conectividad con MySQL |

### Empresas — `/api/companies`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/companies` | Lista empresas (filtros: `search`, `country`, `isActive`) |
| GET | `/api/companies/:id` | Detalle de una empresa |
| GET | `/api/companies/:id/logo` | Logo (imagen binaria) |
| POST | `/api/companies` | Crear empresa |
| PATCH | `/api/companies/:id` | Actualizar empresa |
| PUT | `/api/companies/:id/logo` | Subir logo |
| DELETE | `/api/companies/:id` | Eliminar empresa |

### Sectores — `/api/sectors`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/sectors` | Lista todos los sectores ordenados por nombre |

### Importador — `/api/importer`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/importer/:ticker` | Importar fichero Excel/CSV con datos financieros |

Respuesta de ejemplo:

```json
{
  "ticker": "JNJ",
  "rowsImported": 10,
  "warnings": ["2022: payout ratio 72% (límite 75% utilities)"],
  "errors": []
}
```

---

## Módulo de importación

El importador sigue un pipeline de cuatro etapas:

```
Fichero Excel/CSV
      │
      ▼
  1. Parser      — Lee las hojas del libro (balance, income, cashflow)
      │
      ▼
  2. Mapper      — Aplica la configuración field_mappers de la empresa
      │            · Mapeo directo de etiquetas con aliases
      │            · Campos calculados con expresiones matemáticas (expr-eval)
      │            · Mapeo de columnas por año (ej. 2023→B, 2022→C)
      ▼
  3. Validator   — Comprueba criterios DGI (ver sección siguiente)
      │
      ▼
  4. Repository  — Upsert en income_statement y balance_sheet
```

### Transformaciones soportadas en field_mappers

| Transformación | Efecto |
|----------------|--------|
| `none` | Sin transformación |
| `negate` | Invierte el signo |
| `abs` | Valor absoluto |
| `thousands` | Multiplica × 1 000 |
| `millions` | Multiplica × 1 000 000 |
| `pct_to_decimal` | Divide entre 100 |

---

## Validaciones DGI

El validador aplica las siguientes reglas sobre cada año importado:

| Criterio | Umbral general | Umbral utilities |
|----------|---------------|-----------------|
| Payout ratio | < 50 % | < 75 % |
| Ratio de deuda | < 50 % | < 75 % |
| EPS | Positivo | Positivo |
| Margen neto | Positivo | Positivo |

Los incumplimientos leves generan **warnings** (se importan los datos con aviso); los incumplimientos críticos generan **errors** (la fila no se importa).

---

## Empaquetado

Compila todos los paquetes y genera el instalador nativo:

```bash
yarn build
```

Salidas por plataforma:

| Plataforma | Formato |
|-----------|---------|
| macOS | `.dmg` |
| Windows | NSIS installer |
| Linux | `.AppImage` |

App ID: `com.dgi.analyzer` · Nombre: **DGI Analyzer**
