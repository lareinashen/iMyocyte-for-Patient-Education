/**
 * Minimal static host for the iMyocyte reentry education bundle.
 *
 * Responsibilities:
 *   - Serve the Vite production build from ../dist.
 *   - Apply a strict Content-Security-Policy, including
 *     `frame-ancestors` that restricts which pages are allowed to
 *     embed this app in an iframe.
 *   - Apply a handful of standard hardening headers.
 *
 * Configuration via environment variables (all optional):
 *   PORT                     default 8080
 *   FRAME_ANCESTORS          space-separated origin list used verbatim
 *                            in the frame-ancestors directive; default:
 *                            "'self' https://ottawaheart.ca https://*.ottawaheart.ca"
 *   ALLOW_DEV_FRAME_ANCESTORS=1  also allows http://localhost:* for local testing
 */

import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

const PORT = Number(process.env.PORT ?? 8080);

const defaultAncestors =
  "'self' https://ottawaheart.ca https://*.ottawaheart.ca";
const extraDevAncestors = process.env.ALLOW_DEV_FRAME_ANCESTORS === '1'
  ? ' http://localhost:* http://127.0.0.1:*'
  : '';
const frameAncestors =
  (process.env.FRAME_ANCESTORS ?? defaultAncestors) + extraDevAncestors;

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // Vite emits a <style> block in index.html, so 'unsafe-inline' is
  // required for style-src. If Cybersecurity asks, switch the build
  // to external stylesheet extraction to drop 'unsafe-inline'.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${frameAncestors}`,
].join('; ');

const app = express();

app.disable('x-powered-by');
app.use(compression());

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  // Note: X-Frame-Options is intentionally NOT set, because it cannot
  // express a domain allow-list. `frame-ancestors` in CSP supersedes it
  // in modern browsers.
  next();
});

// Static assets: long cache for hashed files, no-cache for index.html.
app.use(
  express.static(distDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

// SPA fallback: serve index.html for anything that did not match a file.
// Express 5 changed wildcard path syntax, so use a tail middleware.
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`iMyocyte serving ${distDir} on :${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`  frame-ancestors: ${frameAncestors}`);
});
