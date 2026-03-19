-- =============================================================================
-- DGI Dividend Analyzer — MariaDB Schema
-- =============================================================================
-- Design principles:
--   1. Canonical fields for universal financial data (income, balance, cashflow)
--   2. extended_metrics (JSON) for sector-specific fields (AFFO, NIM, etc.)
--   3. field_mapper per company: maps raw PDF labels → canonical field names
--   4. All monetary values stored in the company's reporting currency
--   5. fiscal_year + period_type allow annual AND quarterly data
-- =============================================================================


-- ---------------------------------------------------------------------------
-- SECTOR CATALOGUE
-- Used to know which extended_metrics are expected for a given company type
-- ---------------------------------------------------------------------------
CREATE TABLE sectors (
    id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    code            VARCHAR(30)         NOT NULL,   -- 'reit', 'bank', 'insurer', 'utility', 'industrial', etc.
    name            VARCHAR(80)         NOT NULL,
    notes           TEXT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sector_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO sectors (code, name, notes) VALUES
    ('industrial',  'Industrial / General',     'Standard P&L, balance, cashflow. No special metrics.'),
    ('reit',        'REIT',                     'Key extras: FFO, AFFO, NAV, occupancy rate, debt/EBITDA.'),
    ('bank',        'Bank / Financial',         'Key extras: NIM, NPL ratio, Tier 1 capital, loan loss provisions.'),
    ('insurer',     'Insurance',                'Key extras: combined ratio, loss ratio, expense ratio, float.'),
    ('utility',     'Utility',                  'Key extras: regulated vs unregulated revenue, RAB, capex intensity.'),
    ('telecom',     'Telecom',                  'Key extras: ARPU, churn rate, EBITDA margin, spectrum capex.'),
    ('pharma',      'Pharma / Biotech',         'Key extras: R&D / revenue ratio, patent cliff exposure.'),
    ('energy',      'Oil & Gas / Energy',       'Key extras: production (BOE/d), reserve life, finding cost.');


-- ---------------------------------------------------------------------------
-- COMPANIES
-- Master record for every company tracked
-- ---------------------------------------------------------------------------
CREATE TABLE companies (
    id                  INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    ticker              VARCHAR(12)         NOT NULL,   -- 'JNJ', 'REP', 'ITX'
    isin                VARCHAR(12)                 ,   -- 'US4592001014'
    name                VARCHAR(150)        NOT NULL,
    sector_id           TINYINT UNSIGNED    NOT NULL,
    industry            VARCHAR(100)                ,   -- more granular than sector
    country_iso         CHAR(2)             NOT NULL,   -- 'US', 'ES', 'DE'
    currency            CHAR(3)             NOT NULL,   -- reporting currency: 'USD', 'EUR'
    exchange            VARCHAR(20)                 ,   -- 'NYSE', 'BME', 'XETRA'
    fiscal_year_end     TINYINT UNSIGNED    NOT NULL DEFAULT 12, -- month number (12 = Dec)
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ticker (ticker),
    UNIQUE KEY uq_isin   (isin),
    CONSTRAINT fk_company_sector FOREIGN KEY (sector_id) REFERENCES sectors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- INCOME STATEMENT  (canonical fields, all monetary in thousands)
-- ---------------------------------------------------------------------------
CREATE TABLE income_statement (
    id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company_id                  INT UNSIGNED    NOT NULL,
    fiscal_year                 SMALLINT        NOT NULL,   -- 2023, 2024 …
    period_type                 ENUM('annual','q1','q2','q3','q4') NOT NULL DEFAULT 'annual',
    currency                    CHAR(3)         NOT NULL,

    -- Top line
    revenue                     BIGINT                  ,   -- Total revenue / net sales
    revenue_growth_pct          DECIMAL(8,4)            ,   -- YoY %

    -- Gross profit
    cost_of_revenue             BIGINT                  ,
    gross_profit                BIGINT                  ,
    gross_margin_pct            DECIMAL(8,4)            ,

    -- Operating
    research_and_development    BIGINT                  ,
    selling_general_admin       BIGINT                  ,
    depreciation_amortization   BIGINT                  ,
    other_operating_expenses    BIGINT                  ,
    operating_income            BIGINT                  ,   -- EBIT
    operating_margin_pct        DECIMAL(8,4)            ,

    -- Below the line
    interest_expense            BIGINT                  ,
    interest_income             BIGINT                  ,
    other_non_operating         BIGINT                  ,

    -- Pre-tax / tax
    pretax_income               BIGINT                  ,
    income_tax                  BIGINT                  ,
    effective_tax_rate_pct      DECIMAL(8,4)            ,

    -- Bottom line
    net_income                  BIGINT                  ,   -- attributable to parent
    minority_interest           BIGINT                  ,
    net_income_total            BIGINT                  ,   -- incl. minorities
    net_margin_pct              DECIMAL(8,4)            ,

    -- Per share
    shares_basic                BIGINT                  ,   -- weighted avg basic (thousands)
    shares_diluted              BIGINT                  ,
    eps_basic                   DECIMAL(12,4)           ,
    eps_diluted                 DECIMAL(12,4)           ,

    -- Adjusted / Non-GAAP (company-provided)
    ebitda                      BIGINT                  ,
    adjusted_net_income         BIGINT                  ,   -- company's own adj. figure
    adjusted_eps                DECIMAL(12,4)           ,

    -- Sector-specific extras (JSON): use for fields NOT covered above
    -- Examples: net_interest_income (bank), premiums_earned (insurer)
    extended_metrics            JSON                    ,

    source_file                 VARCHAR(255)            ,   -- original PDF filename
    import_id                   INT UNSIGNED            ,   -- links to import_log
    created_at                  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_is_period (company_id, fiscal_year, period_type),
    CONSTRAINT fk_is_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- BALANCE SHEET  (snapshot at fiscal year / quarter end)
-- ---------------------------------------------------------------------------
CREATE TABLE balance_sheet (
    id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company_id                  INT UNSIGNED    NOT NULL,
    fiscal_year                 SMALLINT        NOT NULL,
    period_type                 ENUM('annual','q1','q2','q3','q4') NOT NULL DEFAULT 'annual',
    currency                    CHAR(3)         NOT NULL,

    -- Current assets
    cash_and_equivalents        BIGINT                  ,
    short_term_investments      BIGINT                  ,
    accounts_receivable         BIGINT                  ,
    inventory                   BIGINT                  ,
    other_current_assets        BIGINT                  ,
    total_current_assets        BIGINT                  ,

    -- Non-current assets
    property_plant_equipment    BIGINT                  ,   -- net of depreciation
    intangible_assets           BIGINT                  ,
    goodwill                    BIGINT                  ,
    long_term_investments       BIGINT                  ,
    other_non_current_assets    BIGINT                  ,
    total_non_current_assets    BIGINT                  ,

    total_assets                BIGINT                  ,

    -- Current liabilities
    accounts_payable            BIGINT                  ,
    short_term_debt             BIGINT                  ,
    current_portion_lt_debt     BIGINT                  ,
    deferred_revenue_current    BIGINT                  ,
    other_current_liabilities   BIGINT                  ,
    total_current_liabilities   BIGINT                  ,

    -- Non-current liabilities
    long_term_debt              BIGINT                  ,
    deferred_tax_liabilities    BIGINT                  ,
    pension_obligations         BIGINT                  ,
    other_non_current_liab      BIGINT                  ,
    total_non_current_liab      BIGINT                  ,

    total_liabilities           BIGINT                  ,

    -- Equity
    common_stock                BIGINT                  ,
    retained_earnings           BIGINT                  ,
    additional_paid_in_capital  BIGINT                  ,
    treasury_stock              BIGINT                  ,
    other_equity                BIGINT                  ,
    total_equity                BIGINT                  ,   -- attributable to parent
    minority_interest_equity    BIGINT                  ,
    total_equity_incl_minority  BIGINT                  ,

    -- Derived (stored for fast queries)
    net_debt                    BIGINT                  ,   -- total_debt - cash
    total_debt                  BIGINT                  ,   -- short + long term debt
    book_value_per_share        DECIMAL(12,4)           ,

    -- Sector-specific extras
    -- REITs: real_estate_assets, mortgage_debt, nav_per_share
    -- Banks: loan_book, deposit_base, tier1_capital, rwa
    extended_metrics            JSON                    ,

    source_file                 VARCHAR(255)            ,
    import_id                   INT UNSIGNED            ,
    created_at                  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_bs_period (company_id, fiscal_year, period_type),
    CONSTRAINT fk_bs_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- CASH FLOW STATEMENT
-- ---------------------------------------------------------------------------
CREATE TABLE cash_flow (
    id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company_id                  INT UNSIGNED    NOT NULL,
    fiscal_year                 SMALLINT        NOT NULL,
    period_type                 ENUM('annual','q1','q2','q3','q4') NOT NULL DEFAULT 'annual',
    currency                    CHAR(3)         NOT NULL,

    -- Operating activities
    net_income_cf               BIGINT                  ,   -- starting point (=IS net_income)
    depreciation_amortization   BIGINT                  ,
    stock_based_compensation    BIGINT                  ,
    changes_in_working_capital  BIGINT                  ,
    change_accounts_receivable  BIGINT                  ,
    change_inventory            BIGINT                  ,
    change_accounts_payable     BIGINT                  ,
    other_operating_cf          BIGINT                  ,
    operating_cash_flow         BIGINT                  ,   -- CFO

    -- Investing activities
    capex                       BIGINT                  ,   -- usually negative
    acquisitions                BIGINT                  ,
    asset_disposals             BIGINT                  ,
    purchases_investments       BIGINT                  ,
    sales_investments           BIGINT                  ,
    other_investing_cf          BIGINT                  ,
    investing_cash_flow         BIGINT                  ,

    -- Financing activities
    debt_issuance               BIGINT                  ,
    debt_repayment              BIGINT                  ,
    dividends_paid              BIGINT                  ,
    share_buybacks              BIGINT                  ,
    share_issuance              BIGINT                  ,
    other_financing_cf          BIGINT                  ,
    financing_cash_flow         BIGINT                  ,

    -- Key derived metrics (stored for fast queries / charting)
    free_cash_flow              BIGINT                  ,   -- OCF - capex
    free_cash_flow_per_share    DECIMAL(12,4)           ,
    fcf_yield_pct               DECIMAL(8,4)            ,

    -- Sector-specific extras
    -- REITs   → ffo, affo, maintenance_capex, growth_capex
    -- Banks   → loan_originations, loan_repayments
    -- Utility → regulated_capex, maintenance_capex
    extended_metrics            JSON                    ,

    source_file                 VARCHAR(255)            ,
    import_id                   INT UNSIGNED            ,
    created_at                  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_cf_period (company_id, fiscal_year, period_type),
    CONSTRAINT fk_cf_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- DIVIDENDS  (one row per dividend event)
-- ---------------------------------------------------------------------------
CREATE TABLE dividends (
    id                  INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    company_id          INT UNSIGNED        NOT NULL,
    fiscal_year         SMALLINT            NOT NULL,
    ex_date             DATE                NOT NULL,
    record_date         DATE                        ,
    payment_date        DATE                        ,
    declared_date       DATE                        ,
    amount_per_share    DECIMAL(12,6)       NOT NULL,
    currency            CHAR(3)             NOT NULL,
    frequency           ENUM('monthly','quarterly','semi_annual','annual','special') NOT NULL,
    dividend_type       ENUM('ordinary','special','scrip','return_of_capital') NOT NULL DEFAULT 'ordinary',
    is_estimated        BOOLEAN             NOT NULL DEFAULT FALSE,  -- TRUE when forward-projected
    notes               VARCHAR(255)                ,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_div_exdate (company_id, ex_date, dividend_type),
    CONSTRAINT fk_div_company FOREIGN KEY (company_id) REFERENCES companies(id),
    INDEX idx_div_exdate     (ex_date),
    INDEX idx_div_payment    (payment_date),
    INDEX idx_div_company_yr (company_id, fiscal_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- RATIOS SNAPSHOT  (pre-calculated, refreshed after each import)
-- ---------------------------------------------------------------------------
CREATE TABLE ratios_snapshot (
    id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company_id                  INT UNSIGNED    NOT NULL,
    fiscal_year                 SMALLINT        NOT NULL,
    calculated_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Dividend ratios
    dividend_yield_pct          DECIMAL(8,4)            ,   -- at fiscal year end price
    dividend_per_share          DECIMAL(12,4)           ,
    dividend_cagr_3y            DECIMAL(8,4)            ,
    dividend_cagr_5y            DECIMAL(8,4)            ,
    dividend_cagr_10y           DECIMAL(8,4)            ,
    dividend_streak_years       SMALLINT                ,   -- consecutive years of growth
    payout_ratio_earnings       DECIMAL(8,4)            ,   -- DPS / EPS
    payout_ratio_fcf            DECIMAL(8,4)            ,   -- DPS / FCF per share
    -- REIT-specific payout
    payout_ratio_ffo            DECIMAL(8,4)            ,   -- DPS / FFO per share
    payout_ratio_affo           DECIMAL(8,4)            ,   -- DPS / AFFO per share

    -- Valuation
    price_earnings              DECIMAL(8,2)            ,
    price_book                  DECIMAL(8,2)            ,
    price_sales                 DECIMAL(8,2)            ,
    price_fcf                   DECIMAL(8,2)            ,
    ev_ebitda                   DECIMAL(8,2)            ,
    -- IQ Trends style: historical high/low yield bands
    hist_yield_high_5y          DECIMAL(8,4)            ,   -- undervalue zone
    hist_yield_low_5y           DECIMAL(8,4)            ,   -- overvalue zone
    yield_vs_hist_pct           DECIMAL(8,4)            ,   -- where current yield sits in band

    -- Profitability
    roe                         DECIMAL(8,4)            ,
    roa                         DECIMAL(8,4)            ,
    roic                        DECIMAL(8,4)            ,
    net_margin_pct              DECIMAL(8,4)            ,
    operating_margin_pct        DECIMAL(8,4)            ,
    ebitda_margin_pct           DECIMAL(8,4)            ,

    -- Leverage / solvency
    debt_to_equity              DECIMAL(8,4)            ,
    net_debt_to_ebitda          DECIMAL(8,4)            ,
    interest_coverage           DECIMAL(8,4)            ,   -- EBIT / interest expense
    current_ratio               DECIMAL(8,4)            ,

    -- Growth
    revenue_cagr_3y             DECIMAL(8,4)            ,
    revenue_cagr_5y             DECIMAL(8,4)            ,
    eps_cagr_3y                 DECIMAL(8,4)            ,
    eps_cagr_5y                 DECIMAL(8,4)            ,
    fcf_cagr_5y                 DECIMAL(8,4)            ,

    -- DGI quality score (composite 0-100)
    dgi_safety_score            TINYINT UNSIGNED        ,
    dgi_quality_grade           ENUM('A+','A','B+','B','C','D','F'),

    -- Sector-specific ratios (JSON)
    -- REITs: ffo_per_share, affo_per_share, nav_discount_pct, cap_rate, occupancy_pct
    -- Banks: nim_pct, npl_ratio_pct, tier1_ratio_pct, efficiency_ratio_pct
    -- Insurers: combined_ratio_pct, loss_ratio_pct
    extended_ratios             JSON                    ,

    PRIMARY KEY (id),
    UNIQUE KEY uq_ratio_period (company_id, fiscal_year),
    CONSTRAINT fk_ratio_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- FIELD MAPPERS  (one row = one raw label → one canonical field)
-- ---------------------------------------------------------------------------
CREATE TABLE field_mappers (
    id                  INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    company_id          INT UNSIGNED                ,   -- NULL = global/fallback rule
    statement_type      ENUM('income_statement','balance_sheet','cash_flow','dividends') NOT NULL,
    raw_label           VARCHAR(255)        NOT NULL,   -- exactly as found in PDF
    canonical_field     VARCHAR(100)        NOT NULL,   -- column name in target table / JSON key
    target_table        VARCHAR(50)         NOT NULL,   -- 'income_statement', etc.
    target_column       VARCHAR(100)        NOT NULL,   -- actual column or 'extended_metrics.affo'
    transform           ENUM('none','negate','abs','thousands','millions','pct_to_decimal') NOT NULL DEFAULT 'none',
    priority            TINYINT UNSIGNED    NOT NULL DEFAULT 10,  -- lower = checked first
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    notes               VARCHAR(255)                ,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_mapper (company_id, statement_type, raw_label),
    CONSTRAINT fk_mapper_company FOREIGN KEY (company_id) REFERENCES companies(id),
    INDEX idx_mapper_label (raw_label(80))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example global fallback mappers
INSERT INTO field_mappers (company_id, statement_type, raw_label, canonical_field, target_table, target_column, transform) VALUES
    (NULL, 'income_statement', 'Net income',               'net_income',       'income_statement', 'net_income',       'none'),
    (NULL, 'income_statement', 'Net earnings',             'net_income',       'income_statement', 'net_income',       'none'),
    (NULL, 'income_statement', 'Profit for the year',      'net_income',       'income_statement', 'net_income',       'none'),
    (NULL, 'income_statement', 'Resultado del ejercicio',  'net_income',       'income_statement', 'net_income',       'none'),
    (NULL, 'income_statement', 'Beneficio neto',           'net_income',       'income_statement', 'net_income',       'none'),
    (NULL, 'income_statement', 'Ergebnis nach Steuern',    'net_income',       'income_statement', 'net_income',       'none'),
    (NULL, 'income_statement', 'Revenue',                  'revenue',          'income_statement', 'revenue',          'none'),
    (NULL, 'income_statement', 'Net revenue',              'revenue',          'income_statement', 'revenue',          'none'),
    (NULL, 'income_statement', 'Ingresos',                 'revenue',          'income_statement', 'revenue',          'none'),
    (NULL, 'income_statement', 'Cifra de negocios',        'revenue',          'income_statement', 'revenue',          'none'),
    (NULL, 'income_statement', 'Umsatzerlöse',             'revenue',          'income_statement', 'revenue',          'none'),
    (NULL, 'cash_flow',        'Capital expenditures',     'capex',            'cash_flow',        'capex',            'negate'),
    (NULL, 'cash_flow',        'Capex',                    'capex',            'cash_flow',        'capex',            'negate'),
    (NULL, 'cash_flow',        'Inversiones en activos',   'capex',            'cash_flow',        'capex',            'negate'),
    -- REIT-specific global rules
    (NULL, 'cash_flow',        'Funds from operations',    'ffo',              'cash_flow',        'extended_metrics', 'none'),
    (NULL, 'cash_flow',        'FFO',                      'ffo',              'cash_flow',        'extended_metrics', 'none'),
    (NULL, 'cash_flow',        'Adjusted FFO',             'affo',             'cash_flow',        'extended_metrics', 'none'),
    (NULL, 'cash_flow',        'AFFO',                     'affo',             'cash_flow',        'extended_metrics', 'none');


-- ---------------------------------------------------------------------------
-- IMPORT LOG  (audit trail of every PDF import)
-- ---------------------------------------------------------------------------
CREATE TABLE import_log (
    id                  INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    company_id          INT UNSIGNED        NOT NULL,
    fiscal_year         SMALLINT            NOT NULL,
    period_type         ENUM('annual','q1','q2','q3','q4') NOT NULL DEFAULT 'annual',
    source_file         VARCHAR(255)        NOT NULL,
    source_type         ENUM('pdf_annual','pdf_10k','pdf_6k','manual','api_edgar') NOT NULL,
    parse_engine        ENUM('regex','llm','hybrid') NOT NULL,
    status              ENUM('pending','parsing','mapped','stored','error') NOT NULL DEFAULT 'pending',
    fields_extracted    SMALLINT UNSIGNED   NOT NULL DEFAULT 0,
    fields_mapped       SMALLINT UNSIGNED   NOT NULL DEFAULT 0,
    fields_failed       SMALLINT UNSIGNED   NOT NULL DEFAULT 0,
    unmapped_labels     JSON                        ,   -- labels found in PDF but not in mapper
    error_message       TEXT                        ,
    raw_extract_json    LONGTEXT                    ,   -- full raw extraction before mapping
    imported_by         VARCHAR(80)                 ,
    started_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at         DATETIME                    ,

    PRIMARY KEY (id),
    CONSTRAINT fk_import_company FOREIGN KEY (company_id) REFERENCES companies(id),
    INDEX idx_import_company  (company_id),
    INDEX idx_import_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- PORTFOLIO  (user's positions)
-- ---------------------------------------------------------------------------
CREATE TABLE portfolio (
    id                  INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    company_id          INT UNSIGNED        NOT NULL,
    shares              DECIMAL(14,4)       NOT NULL,
    avg_cost_basis      DECIMAL(14,4)       NOT NULL,   -- avg purchase price per share
    currency            CHAR(3)             NOT NULL,
    first_purchase_date DATE                        ,
    broker              VARCHAR(80)                 ,
    notes               VARCHAR(255)                ,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_portfolio_company (company_id),
    CONSTRAINT fk_portfolio_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- PRICE HISTORY  (closing prices, for yield/valuation calcs)
-- ---------------------------------------------------------------------------
CREATE TABLE price_history (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company_id  INT UNSIGNED    NOT NULL,
    price_date  DATE            NOT NULL,
    close_price DECIMAL(14,4)  NOT NULL,
    currency    CHAR(3)        NOT NULL,
    source      VARCHAR(40)            ,   -- 'manual', 'yahoo', 'alphavantage'
    PRIMARY KEY (id),
    UNIQUE KEY uq_price (company_id, price_date),
    CONSTRAINT fk_price_company FOREIGN KEY (company_id) REFERENCES companies(id),
    INDEX idx_price_date (price_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------------------
-- ALERTS  (user-configured thresholds and events)
-- ---------------------------------------------------------------------------
CREATE TABLE alerts (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company_id      INT UNSIGNED    NOT NULL,
    alert_type      ENUM(
                        'div_cut',          -- dividend reduced
                        'div_freeze',       -- dividend unchanged YoY
                        'div_raise',        -- dividend increased (notify on growth)
                        'payout_high',      -- payout ratio > threshold
                        'exdate_upcoming',  -- X days before ex-date
                        'yield_undervalue', -- yield reaches historical high (buy signal)
                        'yield_overvalue',  -- yield reaches historical low (sell signal)
                        'streak_broken',    -- dividend growth streak interrupted
                        'custom'
                    ) NOT NULL,
    threshold_value DECIMAL(10,4)           ,   -- e.g. 85.0 for payout > 85%
    days_before     TINYINT UNSIGNED        ,   -- for exdate_upcoming
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    last_triggered  DATETIME                ,
    notes           VARCHAR(255)            ,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_alert_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- USEFUL VIEWS
-- =============================================================================

-- Current portfolio summary with latest ratios
CREATE OR REPLACE VIEW v_portfolio_summary AS
SELECT
    p.id                                        AS portfolio_id,
    c.ticker,
    c.name                                      AS company_name,
    c.currency,
    s.code                                      AS sector,
    p.shares,
    p.avg_cost_basis,
    p.first_purchase_date,
    -- Latest ratios
    r.fiscal_year                               AS ratios_year,
    r.dividend_per_share,
    r.dividend_yield_pct,
    r.dividend_streak_years,
    r.payout_ratio_fcf,
    r.payout_ratio_affo,                        -- populated for REITs
    r.net_debt_to_ebitda,
    r.dgi_safety_score,
    r.dgi_quality_grade,
    -- Calculated
    ROUND(p.shares * r.dividend_per_share, 2)   AS annual_income,
    ROUND((r.dividend_per_share / NULLIF(p.avg_cost_basis,0)) * 100, 4) AS yield_on_cost,
    -- IQ Trends value signal
    CASE
        WHEN r.dividend_yield_pct >= r.hist_yield_high_5y THEN 'undervalued'
        WHEN r.dividend_yield_pct <= r.hist_yield_low_5y  THEN 'overvalued'
        ELSE 'fairly_valued'
    END AS iq_trends_signal
FROM portfolio p
JOIN companies       c ON c.id = p.company_id
JOIN sectors         s ON s.id = c.sector_id
LEFT JOIN ratios_snapshot r ON r.company_id = p.company_id
    AND r.fiscal_year = (
        SELECT MAX(fiscal_year) FROM ratios_snapshot WHERE company_id = p.company_id
    )
WHERE p.is_active = TRUE;


-- Dividend calendar: upcoming ex-dates and payment dates
CREATE OR REPLACE VIEW v_dividend_calendar AS
SELECT
    c.ticker,
    c.name          AS company_name,
    d.ex_date,
    d.payment_date,
    d.amount_per_share,
    d.currency,
    d.frequency,
    d.dividend_type,
    d.is_estimated,
    p.shares,
    ROUND(p.shares * d.amount_per_share, 2) AS total_payment
FROM dividends d
JOIN companies  c ON c.id = d.company_id
LEFT JOIN portfolio p ON p.company_id = d.company_id AND p.is_active = TRUE
WHERE d.ex_date >= CURDATE()
ORDER BY d.ex_date ASC;


-- Dividend growth history per company (for streak calculation)
CREATE OR REPLACE VIEW v_dividend_growth AS
SELECT
    company_id,
    fiscal_year,
    SUM(amount_per_share)                   AS annual_dps,
    LAG(SUM(amount_per_share)) OVER (
        PARTITION BY company_id ORDER BY fiscal_year
    )                                       AS prev_dps,
    ROUND(
        (SUM(amount_per_share) / NULLIF(LAG(SUM(amount_per_share)) OVER (
            PARTITION BY company_id ORDER BY fiscal_year), 0) - 1) * 100
    , 2)                                    AS dps_growth_pct
FROM dividends
WHERE dividend_type IN ('ordinary','special')
  AND is_estimated = FALSE
GROUP BY company_id, fiscal_year
ORDER BY company_id, fiscal_year;


-- Unmapped labels from latest import (for mapper maintenance)
CREATE OR REPLACE VIEW v_unmapped_labels AS
SELECT
    il.id           AS import_id,
    c.ticker,
    il.fiscal_year,
    il.source_file,
    il.finished_at,
    JSON_UNQUOTE(jt.label) AS unmapped_label
FROM import_log il
JOIN companies c ON c.id = il.company_id
JOIN JSON_TABLE(
    il.unmapped_labels, '$[*]'
    COLUMNS (label VARCHAR(255) PATH '$')
) jt
WHERE il.status IN ('mapped','stored')
  AND il.unmapped_labels IS NOT NULL
  AND JSON_LENGTH(il.unmapped_labels) > 0
ORDER BY il.finished_at DESC;


-- =============================================================================
-- EXTENDED METRICS JSON DOCUMENTATION (reference only — not a table)
-- =============================================================================
-- REIT (sector code: 'reit')
--   income_statement.extended_metrics: {
--       "rental_income": ...,
--       "property_management_fees": ...,
--       "net_operating_income": ...
--   }
--   cash_flow.extended_metrics: {
--       "ffo": ...,                -- Funds From Operations
--       "affo": ...,               -- Adjusted FFO (after maintenance capex)
--       "maintenance_capex": ...,
--       "growth_capex": ...
--   }
--   balance_sheet.extended_metrics: {
--       "real_estate_assets_gross": ...,
--       "accumulated_depreciation_re": ...,
--       "mortgage_debt": ...,
--       "nav_per_share": ...
--   }
--   ratios_snapshot.extended_ratios: {
--       "ffo_per_share": ...,
--       "affo_per_share": ...,
--       "price_to_ffo": ...,
--       "price_to_affo": ...,
--       "payout_ratio_affo_pct": ...,
--       "nav_discount_pct": ...,     -- negative = trading at discount
--       "cap_rate_pct": ...,
--       "occupancy_rate_pct": ...,
--       "debt_to_total_assets_pct": ...
--   }
--
-- BANK (sector code: 'bank')
--   income_statement.extended_metrics: {
--       "net_interest_income": ...,
--       "non_interest_income": ...,
--       "loan_loss_provisions": ...,
--       "trading_income": ...
--   }
--   balance_sheet.extended_metrics: {
--       "loan_book_gross": ...,
--       "loan_loss_reserves": ...,
--       "deposit_base": ...,
--       "tier1_capital": ...,
--       "risk_weighted_assets": ...
--   }
--   ratios_snapshot.extended_ratios: {
--       "nim_pct": ...,              -- Net Interest Margin
--       "npl_ratio_pct": ...,        -- Non-Performing Loans
--       "tier1_ratio_pct": ...,
--       "efficiency_ratio_pct": ..., -- costs / revenue
--       "rote_pct": ...              -- Return on Tangible Equity
--   }
--
-- INSURER (sector code: 'insurer')
--   income_statement.extended_metrics: {
--       "gross_premiums_written": ...,
--       "net_premiums_earned": ...,
--       "claims_incurred": ...,
--       "investment_income": ...
--   }
--   ratios_snapshot.extended_ratios: {
--       "combined_ratio_pct": ...,   -- loss + expense ratio (< 100 = underwriting profit)
--       "loss_ratio_pct": ...,
--       "expense_ratio_pct": ...,
--       "float_value": ...
--   }
-- =============================================================================