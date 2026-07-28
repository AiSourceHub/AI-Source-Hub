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

`tools/validate-launch.js` is expected to fail until the production domain, official contact method, legal review state, and analytics decision are finalized.

## Deployment Steps

1. Replace `https://your-domain.example` in SEO files and HTML metadata with the real production domain.
2. Replace the contact page template with the official public contact method.
3. Review legal pages with qualified counsel.
4. Configure analytics placeholders only after consent and privacy requirements are approved.
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
- [ ] Contact page updated with real contact method.

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

Reserved future configuration:

- `GA_MEASUREMENT_ID`
- `GOOGLE_SEARCH_CONSOLE_TOKEN`
- `MICROSOFT_CLARITY_PROJECT_ID`

These values must not be committed as real secrets.

## Rollback Procedure

1. Keep a copy of the last known working static deployment.
2. If launch verification fails, restore the previous deployment artifact.
3. Clear CDN cache if needed.
4. Recheck homepage, product pages, legal pages, and sitemap.
5. Document the issue before retrying deployment.

## Final Pre-Launch Gate

Do not send public traffic until:

- Legal pages are reviewed.
- Domain placeholders are replaced.
- `node tools/validate-launch.js` passes.
- Browser QA passes on the deployed HTTPS URL.
- Analytics consent and privacy handling are approved.
