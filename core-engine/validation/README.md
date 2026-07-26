# ValidationEngine

## Responsibility

Checks whether analyzed input is usable for the configured product flow.

## What It Does

- Checks required fields.
- Runs optional product-provided validation rules.
- Returns structured errors and warnings.

## What It Does Not Do

- It does not block by default unless errors exist.
- It does not score.
- It does not format reports.
- It does not know any product-specific field names unless provided by configuration.

## Main Export

`ValidationEngine`

## Primary Method

`validate(analysis)`

