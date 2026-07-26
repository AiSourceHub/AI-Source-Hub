# LanguageSwitcher

## Purpose

Allow users to switch between Arabic and English when a product supports both.

## Rules

- Use Arabic and English labels in their own language.
- Persist the selected language when product storage exists.
- If language is detected automatically, allow manual correction.
- Never produce bilingual output unless explicitly required by the product.

## Accessibility

- Use a native select, segmented control, or accessible button group.
- Announce the current language.
- Apply correct `lang` and `dir` attributes to localized regions.

