# AI Source Hub v1.0 Deployment Guide

AI Source Hub v1.0 is a static, client-side project. It does not require a backend, database, authentication, payments, or external AI provider.

## Hosting Options

Suitable static hosting options:

- Static hosting on a CDN.
- Git-based static hosting.
- Object storage with static website hosting.
- Managed site hosting that serves HTML, CSS, JavaScript, SVG, XML, and TXT files.

## Build Commands

Current v1.0 does not require a build step.

Recommended validation before deployment:

```bash
node tools/validate-product.js
node tools/validate-launch.js
```

If Node.js is unavailable in the shell, run the same validation in an environment that has Node.js before deployment.

Analytics are intentionally disabled for the initial public launch. `tools/validate-launch.js` should pass once the deployed source matches this launch decision.

## Deployment Steps

1. Confirm SEO files and HTML metadata use the production domain `https://aisourcehq.com`.
2. Confirm the public contact page uses `support@aisourcehq.com`.
3. Confirm the legal pages are published with the approved general decision-support language.
4. Keep analytics disabled for the initial launch; no tracking scripts, cookies, or analytics provider IDs are required.
5. Upload the full static project or the selected public directory to the hosting provider.
6. Confirm the homepage, products, legal pages, `robots.txt`, `sitemap.xml`, `manifest.json`, and brand assets are publicly reachable.
7. Run manual desktop, tablet, mobile, English, and Arabic QA.
8. Submit the sitemap to search engines after DNS and SSL are active.

## Domain Checklist

- [ ] Production domain selected.
- [ ] Canonical URLs updated.
- [ ] Sitemap URLs updated.
- [ ] Open Graph URLs updated.
- [ ] Manifest `start_url` confirmed for hosting path.
- [x] Contact page updated with `support@aisourcehq.com`.

## DNS Checklist

- [ ] DNS records configured through the hosting provider.
- [ ] Apex and `www` behavior decided.
- [ ] Redirect behavior documented.
- [ ] DNS propagation verified.

## SSL Checklist

- [ ] HTTPS certificate issued.
- [ ] HTTP redirects to HTTPS.
- [ ] Mixed-content warnings checked.
- [ ] Canonical URLs use HTTPS.

## Environment Variables

No environment variables are required for the static v1.0 release.

Analytics configuration:

- Analytics are disabled for the initial public launch.
- No analytics provider IDs are required.
- Future analytics may be enabled only after the provider, consent approach, and privacy handling are approved.

Do not add tracking scripts, cookies, or external analytics dependencies for the initial launch.

## Rollback Procedure

1. Keep a copy of the last known working static deployment.
2. If launch verification fails, restore the previous deployment artifact.
3. Clear CDN cache if needed.
4. Recheck homepage, product pages, legal pages, and sitemap.
5. Document the issue before retrying deployment.

## Final Pre-Launch Gate

Do not send public traffic until:

- Legal pages use the approved general decision-support language.
- Domain placeholders are replaced.
- `node tools/validate-launch.js` passes.
- Browser QA passes on the deployed HTTPS URL.
- Analytics remain disabled for the initial public launch.
