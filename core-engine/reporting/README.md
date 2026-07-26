# ReportBuilder

## Responsibility

Creates a structured report object from engine output.

## What It Does

- Adds product name.
- Adds language and direction.
- Adds status.
- Adds score and recommendation.
- Builds configured report sections.
- Adds generation metadata.

## What It Does Not Do

- It does not render HTML.
- It does not create PDFs.
- It does not call APIs.
- It does not contain product-specific report content unless supplied by configuration.

## Main Export

`ReportBuilder`

## Primary Method

`build(context)`

