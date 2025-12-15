# Database Schema Notes

## Overview

This document describes the database schema for the Trading Journal application.

---

## Trades Table

| Column                  | Type          | Nullable | Description                                       |
| ----------------------- | ------------- | -------- | ------------------------------------------------- |
| `id`                    | UUID          | NO       | Primary key                                       |
| `user_id`               | UUID          | NO       | FK → auth.users                                   |
| `account_id`            | UUID          | NO       | FK → accounts                                     |
| `symbol`                | TEXT          | NO       | Trading pair (e.g., EURUSD)                       |
| `type`                  | TEXT          | NO       | 'Long' or 'Short'                                 |
| `entry_price`           | DECIMAL(15,5) | NO       | Entry price                                       |
| `stop_loss`             | DECIMAL(15,5) | YES      | Stop loss price                                   |
| `take_profit`           | DECIMAL(15,5) | YES      | Take profit price                                 |
| `exit_price`            | DECIMAL(15,5) | YES      | Exit price                                        |
| `lot`                   | DECIMAL(10,2) | NO       | Lot size (default: 1.0)                           |
| `commission`            | DECIMAL(12,2) | YES      | Commission cost                                   |
| `swap`                  | DECIMAL(12,2) | YES      | Swap cost                                         |
| `tf_analise`            | TEXT          | YES      | Analysis timeframe                                |
| `tf_entrada`            | TEXT          | YES      | Entry timeframe                                   |
| `tags`                  | TEXT          | YES      | Comma-separated tags                              |
| `strategy`              | TEXT          | YES      | Strategy name                                     |
| `strategy_icon`         | TEXT          | YES      | Strategy icon (added in types)                    |
| `setup`                 | TEXT          | YES      | Setup name                                        |
| `notes`                 | TEXT          | YES      | Trade notes                                       |
| `entry_date`            | DATE          | NO       | Entry date                                        |
| `entry_time`            | TEXT          | YES      | Entry time (HH:mm)                                |
| `exit_date`             | DATE          | YES      | Exit date                                         |
| `exit_time`             | TEXT          | YES      | Exit time                                         |
| `pnl`                   | DECIMAL(15,2) | YES      | Profit/Loss                                       |
| `outcome`               | TEXT          | YES      | 'win', 'loss', 'breakeven', 'pending'             |
| `session`               | VARCHAR(50)   | YES      | Trading session                                   |
| `htf_aligned`           | BOOLEAN       | YES      | HTF alignment (default: false)                    |
| `r_multiple`            | DECIMAL(5,2)  | YES      | Risk/Reward multiple                              |
| `market_condition`      | VARCHAR(50)   | YES      | Market condition (legacy)                         |
| `plan_adherence`        | VARCHAR(20)   | YES      | Plan adherence                                    |
| `plan_adherence_rating` | INTEGER       | YES      | 1-5 rating                                        |
| `entry_quality`         | TEXT          | YES      | 'picture-perfect', 'nice', 'normal', 'ugly'       |
| `market_condition_v2`   | TEXT          | YES      | 'bull-trend', 'bear-trend', 'ranging', 'breakout' |
| `pd_array`              | TEXT          | YES      | PD Array (in types, not in migration)             |
| `created_at`            | TIMESTAMPTZ   | YES      | Creation timestamp                                |
| `updated_at`            | TIMESTAMPTZ   | YES      | Last update timestamp                             |

### Trades Indexes

- `idx_trades_user_id` on (user_id)
- `idx_trades_account` on (account_id)
- `idx_trades_entry_date` on (entry_date)
- `idx_trades_outcome` on (outcome)
- `idx_trades_session` on (session)
- `idx_trades_account_date` on (account_id, entry_date DESC, entry_time DESC)

---

## Journal Entries Table

| Column            | Type        | Nullable | Description                                    |
| ----------------- | ----------- | -------- | ---------------------------------------------- |
| `id`              | UUID        | NO       | Primary key                                    |
| `user_id`         | UUID        | NO       | FK → auth.users                                |
| `account_id`      | UUID        | NO       | FK → accounts                                  |
| `date`            | DATE        | NO       | **Entry date**                                 |
| `title`           | TEXT        | NO       | Entry title                                    |
| `asset`           | TEXT        | YES      | Asset/symbol                                   |
| `trade_id`        | UUID        | YES      | DEPRECATED - FK → trades (legacy single trade) |
| `image_tfm`       | TEXT        | YES      | Legacy: Monthly TF image                       |
| `image_tfw`       | TEXT        | YES      | Legacy: Weekly TF image                        |
| `image_tfd`       | TEXT        | YES      | Legacy: Daily TF image                         |
| `image_tfh4`      | TEXT        | YES      | Legacy: H4 TF image                            |
| `image_tfh1`      | TEXT        | YES      | Legacy: H1 TF image                            |
| `image_tfm15`     | TEXT        | YES      | Legacy: M15 TF image                           |
| `image_tfm5`      | TEXT        | YES      | Legacy: M5 TF image                            |
| `image_tfm3`      | TEXT        | YES      | Legacy: M3 TF image                            |
| `emotion`         | TEXT        | YES      | Emotional state                                |
| `analysis`        | TEXT        | YES      | Analysis text                                  |
| `notes`           | TEXT        | YES      | Additional notes                               |
| `review_type`     | VARCHAR(10) | YES      | 'daily' (default) - added in migration         |
| `week_start_date` | DATE        | YES      | Weekly recap start                             |
| `week_end_date`   | DATE        | YES      | Weekly recap end                               |
| `created_at`      | TIMESTAMPTZ | YES      | Creation timestamp                             |
| `updated_at`      | TIMESTAMPTZ | YES      | Last update timestamp                          |

> **⚠️ IMPORTANT**: The date column in journal_entries is called `date`, NOT `entry_date`.

### Journal Entries Indexes

- `idx_journal_entries_user_id` on (user_id)
- `idx_journal_account` on (account_id)
- `idx_journal_date` on (date)
- `idx_journal_entries_account_date` on (account_id, date DESC)

---

## Relationship: Journal Entries ↔ Trades

### Current Model: N:N (Many-to-Many)

The relationship is managed via the **`journal_entry_trades`** junction table:

```
journal_entries ←──── journal_entry_trades ────→ trades
      (1)                    (N)                   (N)
```

### Junction Table: journal_entry_trades

| Column             | Type        | Nullable | Description          |
| ------------------ | ----------- | -------- | -------------------- |
| `id`               | UUID        | NO       | Primary key          |
| `journal_entry_id` | UUID        | NO       | FK → journal_entries |
| `trade_id`         | UUID        | NO       | FK → trades          |
| `created_at`       | TIMESTAMPTZ | YES      | Creation timestamp   |

- **UNIQUE constraint**: (journal_entry_id, trade_id)

### Legacy Model (DEPRECATED)

The `journal_entries.trade_id` column exists for backward compatibility but is **deprecated**.
New code should use the `journal_entry_trades` junction table.

---

## Key Findings

1. **Date column name**: `journal_entries.date` (NOT `entry_date`)
2. **Relationship type**: N:N via junction table
3. **FK direction**: Junction table → references both tables
4. **Legacy FK**: Direct `trade_id` on journal_entries is deprecated

---

## Related Tables

- **journal_images**: Images associated with journal entries
- **daily_routines**: Daily routine checklist per account
- **shared_journals**: Public sharing tokens for journal entries
- **trade_comments**: Comments on trades (mentor feature)
