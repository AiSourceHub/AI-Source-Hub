# AI Source Hub Design System v1.0

## Purpose

This design system turns AI Source Hub into a reusable multi-product platform.

It defines the shared visual language, component rules, layout standards, Arabic and English support, and accessibility expectations for every AI Source Hub product.

The design system does not create a new product. It provides the foundation for future focused AI decision engines.

## Design Principles

- Premium but quiet.
- Practical before decorative.
- Mobile first.
- Arabic and English by default.
- RTL and LTR layouts must feel native.
- Every component must be reusable.
- Every visual choice must support speed, clarity, or trust.
- Dark mode must be possible without redesign.

## Color Palette

### Light Mode

| Token | Value | Use |
| --- | --- | --- |
| background | `#f6f4ef` | Page background |
| surface | `#ffffff` | Cards and panels |
| surfaceMuted | `#f8fbf9` | Subtle result areas |
| text | `#1f2523` | Primary text |
| textMuted | `#68716d` | Secondary text |
| border | `#d9ded7` | Dividers and field borders |
| field | `#fbfcfa` | Input backgrounds |
| primary | `#0f766e` | Primary actions and score highlights |
| primaryStrong | `#0a5d56` | Hover and emphasis |
| primarySoft | `#e5f3ef` | Positive result surfaces |
| warning | `#b7791f` | Improve, caution, medium risk |
| warningSoft | `#fff4dc` | Warning surfaces |
| danger | `#b4233c` | Pause, errors, high risk |
| dangerSoft | `#fde8ed` | Error surfaces |
| success | `#18794e` | Pursue, strong states |
| successSoft | `#e6f4ec` | Success surfaces |

### Dark Mode Ready

| Token | Value |
| --- | --- |
| background | `#121715` |
| surface | `#1b211f` |
| surfaceMuted | `#202a27` |
| text | `#f2f5f1` |
| textMuted | `#a9b3ae` |
| border | `#39433f` |
| field | `#171d1b` |
| primary | `#28b8aa` |
| primaryStrong | `#5bd4c8` |
| primarySoft | `#123330` |
| warning | `#e2a93b` |
| warningSoft | `#392a10` |
| danger | `#ef6f85` |
| dangerSoft | `#3b171f` |
| success | `#5ec990` |
| successSoft | `#173524` |

### Color Rules

- Use primary teal for main actions and neutral score emphasis.
- Use success only for clearly positive outcomes.
- Use warning for improvement or caution.
- Use danger only for errors, pause states, or high-risk signals.
- Never rely on color alone to communicate meaning.
- Avoid one-color interfaces. Use neutral surfaces and restrained semantic accents.

## Typography

### Font Families

| Language | Font Stack |
| --- | --- |
| English | `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Arabic | `"IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif` |

### Type Scale

| Token | Size | Line Height | Weight | Use |
| --- | --- | --- | --- | --- |
| display | `clamp(2rem, 5vw, 4.25rem)` | `0.98` | `850` | Main product title |
| h1 | `2.25rem` | `1.08` | `850` | Page headings |
| h2 | `1.5rem` | `1.18` | `800` | Section headings |
| h3 | `1rem` | `1.3` | `780` | Card headings |
| body | `1rem` | `1.55` | `400` | Main text |
| small | `0.875rem` | `1.45` | `500` | Helper text |
| label | `0.78rem` | `1.2` | `800` | Compact labels |

### Typography Rules

- Use short, clear labels.
- Do not scale type with viewport width except true display headings.
- Letter spacing must be `0`.
- Arabic text should use a dedicated Arabic font stack.
- Keep result text scannable and direct.

## Spacing System

| Token | Value |
| --- | --- |
| 0 | `0` |
| 1 | `4px` |
| 2 | `8px` |
| 3 | `12px` |
| 4 | `16px` |
| 5 | `20px` |
| 6 | `24px` |
| 8 | `32px` |
| 10 | `40px` |
| 12 | `48px` |
| 16 | `64px` |

### Spacing Rules

- Use spacing tokens only.
- Default component gap: `16px`.
- Default panel padding: `20px` to `24px`.
- Mobile page gutter: `24px`.
- Desktop page gutter: `32px`.
- Keep vertical rhythm compact for product tools.

## Grid System

### Mobile First

- Default layout is one column.
- Content width should be fluid.
- Primary task must appear early.
- Avoid hiding key actions behind menus.

### Desktop

- Max content width: `1120px`.
- Use two columns only when it improves task speed.
- Keep input and result areas close enough to feel connected.

### Breakpoint

Primary responsive breakpoint: `860px`.

## Border Radius

| Token | Value | Use |
| --- | --- | --- |
| sm | `6px` | Small controls |
| md | `8px` | Cards, inputs, buttons |
| lg | `12px` | Larger panels only when needed |
| pill | `999px` | Progress fills, badges |

### Radius Rules

- Default radius is `8px`.
- Do not over-round product interfaces.
- Use pill radius only for small status elements and progress bars.

## Shadows

| Token | Value | Use |
| --- | --- | --- |
| sm | `0 8px 24px rgba(31, 37, 35, 0.06)` | Subtle elevation |
| md | `0 18px 55px rgba(31, 37, 35, 0.08)` | Main panels |
| focus | `0 0 0 3px rgba(15, 118, 110, 0.14)` | Focus rings |

### Shadow Rules

- Use shadows sparingly.
- Prefer borders for structure.
- Do not rely on shadows as the only separation method.

## Icons

### Icon System

Preferred icon library: Lucide.

### Recommended Icons

| Purpose | Icon |
| --- | --- |
| Validate | `CheckCircle` |
| Copy | `Copy` |
| Language | `Languages` |
| Warning | `TriangleAlert` |
| Success | `CircleCheck` |
| Pause | `CirclePause` |
| Score | `Gauge` |
| Info | `Info` |

### Icon Rules

- Use icon plus text for primary actions when helpful.
- Use icon-only buttons only for familiar utility actions.
- Icon-only buttons require accessible labels and tooltips.
- Status icons must be paired with text.

## Animations

### Motion Principles

- Motion should clarify state changes.
- Motion should never slow the user down.
- Keep transitions short and subtle.

### Standards

| Motion | Duration | Use |
| --- | --- | --- |
| Focus or hover | `120ms` to `180ms` | Controls |
| Result reveal | `160ms` to `240ms` | New output |
| Progress animation | `800ms` max loop | Processing state |

### Accessibility

- Respect reduced-motion preferences.
- Do not use large decorative motion in business tools.

## Component Rules

### Header

- Use for brand, product name, language switcher, and optional secondary action.
- Keep compact.
- Support RTL and LTR.

### Footer

- Use for version, legal, and support links.
- Keep secondary.
- Do not place primary actions here.

### Button

- One primary action per screen.
- Minimum touch height: `44px`.
- Labels must use clear verbs.
- Preserve focus styles.

### Card

- Use for grouped content or repeated items.
- Do not nest cards inside cards.
- Default radius: `8px`.

### Input

- Use for short single-line values.
- Every input needs a visible label.
- Validation messages should appear near the field.

### TextArea

- Use for short descriptions.
- Make short answers feel acceptable.
- Support Arabic and English input.

### ProgressBar

- Use only for meaningful progress.
- Pair visual progress with text.
- Do not use as decoration.

### ScoreCircle

- Use for total score or confidence score.
- Always include a visible label.
- Provide an accessible text equivalent.

### ScoreBar

- Use for criterion-level score breakdowns.
- Always show numeric score.
- Do not rely only on bar width.

### AlertBox

- Use for validation, warnings, or important result context.
- Keep message short.
- Pair color with text and icon.

### ResultCard

- Use for structured decision outputs.
- Verdict comes first.
- Biggest risk and next action must be easy to find.
- Support `aria-live` for generated results.

### LanguageSwitcher

- Use when a product supports multiple languages.
- Support Arabic and English.
- Apply correct `lang` and `dir` attributes.
- Do not generate bilingual output unless explicitly required.

## Arabic And English Rules

### English

- Direction: LTR.
- Tone: direct, practical, calm.
- Use short labels and action-oriented language.

### Arabic

- Direction: RTL.
- Use professional Modern Standard Arabic.
- Avoid mixing English inside Arabic sentences.
- Use Arabic labels for all output sections.
- Arabic report sections must feel written in Arabic, not translated word by word.

### Required Terminology

| English | Arabic |
| --- | --- |
| Verdict | القرار |
| Total Score | الدرجة الكلية |
| Problem Clarity | وضوح المشكلة |
| Customer Clarity | وضوح العميل المستهدف |
| Pain Level | مستوى الحاجة |
| Monetization | نموذج الإيرادات |
| Differentiation | التميز |
| Biggest Risk | أكبر مخاطرة |
| Recommended Next Action | الخطوة التالية المقترحة |
| Improved Idea | الصياغة المقترحة للفكرة |
| Pursue | انطلق |
| Improve | طوّر |
| Pause | توقّف |

## Accessibility Rules

- Use semantic HTML.
- Every input must have a visible label.
- Every icon-only button needs an accessible label.
- Use visible focus styles.
- Minimum touch target: `44px`.
- Result regions that update after user action should use polite live regions.
- Text and background contrast must meet WCAG AA.
- Do not rely on color alone.
- Use correct `lang` and `dir` attributes for localized content.
- Keyboard users must be able to complete every workflow.
- Error messages must be specific and placed close to the relevant area.

## Dark Mode Rules

- Dark mode must use the token system.
- Do not hardcode one-off dark colors in components.
- Preserve contrast for text, borders, and controls.
- Semantic colors should remain recognizable in dark mode.

## File Structure

```text
/core
  theme.js
  colors.js
  typography.js
  spacing.js
  icons.js

/components
  Header
  Footer
  Button
  Card
  Input
  TextArea
  ProgressBar
  ScoreCircle
  ScoreBar
  AlertBox
  ResultCard
  LanguageSwitcher

/pages
  Home
  ProductLayout
```

## Product Adoption Rules

New AI Source Hub products must:

1. Use the shared color tokens.
2. Use the shared typography scale.
3. Use the spacing system.
4. Use reusable components before creating new UI.
5. Support Arabic RTL and English LTR.
6. Work on mobile before desktop enhancements.
7. Keep one primary action visible.
8. Return structured results that are easy to scan.

