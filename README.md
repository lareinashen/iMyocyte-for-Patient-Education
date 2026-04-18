# iMyocyte — Cardiac Reentry Patient Education

A lightweight, single-page, client-side educational tool that visualises electrical propagation in a ring of cardiac cells. It illustrates three ideas for a lay audience:

1. **Normal conduction** — a single impulse spreads both ways around the ring and cancels out when the two waves meet.
2. **Reentry** — a timed pair of impulses interacting with a damaged region produces a self-sustaining circulating wave.
3. **Treatment** — during reentry, the user can click **Ablate damaged cell** to physically break the circuit, or **Add drug** to normalise the damaged tissue's refractory period.

The tool is built for embedding via `<iframe>` on [ottawaheart.ca](https://ottawaheart.ca). Simulation logic is pure TypeScript running in the browser — no backend services, no user data, no network calls.

## Tech stack

- React 18 + TypeScript, built with Vite
- No UI framework (plain CSS) — production bundle ≈ 51 KB gzipped
- Vitest for simulation unit tests
- Optional: Express + compression for a minimal self-hosted static server with CSP

## Repository layout

```
src/
  App.tsx, main.tsx, index.css        # entry + top-level composition
  components/                         # React components (SVG ring, controls, legend, language switcher)
  hooks/useRingSimulation.ts          # simulation loop driven by requestAnimationFrame
  simulation/                         # pure TS: types, ringModel, scenarios, tests
  iframe/autoResize.ts                # postMessage height notifier for iframe parent
  i18n/                               # EN + FR strings and provider
  legacy/                             # prior multi-user app (reference only, not built)
server/server.js                      # static host with CSP frame-ancestors
```

## Scripts

```bash
npm install           # install deps
npm run dev           # Vite dev server on http://localhost:5173
npm run build         # produce dist/
npm run preview       # preview the built bundle (Vite's default)
npm run serve         # serve dist/ via the Express host with CSP headers (port 8080)
npm test              # run the simulation unit tests
npm run lint
```

## Embedding

On the target page on `ottawaheart.ca`, use an iframe and a short listener script for auto-resize:

```html
<iframe
  id="imyocyte"
  src="https://<your-host>/"
  title="Cardiac reentry — patient education"
  style="width:100%;border:0"
  loading="lazy"
  referrerpolicy="strict-origin"
></iframe>
<script>
  window.addEventListener('message', function (event) {
    // In production, restrict to the expected iframe origin:
    // if (event.origin !== 'https://<your-host>') return;
    if (!event.data || event.data.type !== 'imyocyte:resize') return;
    var f = document.getElementById('imyocyte');
    if (f) f.style.height = event.data.height + 'px';
  });
</script>
```

### Language

Set the URL query `?lang=en` or `?lang=fr` to force a language. Otherwise the tool reads `<html lang>` on the iframe, then `navigator.language`, defaulting to English. A language selector is also shown in the UI.

## Hosting + Security headers

Cybersecurity review of the embed should focus on `Content-Security-Policy`. The bundled Express host (`server/server.js`) sets:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';    # Vite inlines a small style block in index.html
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self' https://ottawaheart.ca https://*.ottawaheart.ca;
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Notes:
- `X-Frame-Options` is intentionally not set because it cannot express a domain allow-list; modern browsers use CSP `frame-ancestors` instead.
- If you host behind nginx/Cloudflare instead of the Express server, apply the same headers there; `server/server.js` is a reference implementation.

Configuration env vars for `npm run serve`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | Listen port |
| `FRAME_ANCESTORS` | `'self' https://ottawaheart.ca https://*.ottawaheart.ca` | Overrides the CSP allow-list for iframe parents |
| `ALLOW_DEV_FRAME_ANCESTORS` | unset | If `1`, additionally permits `http://localhost:*` and `http://127.0.0.1:*` for local testing |

## Model notes

- 60-cell ring, fixed-timestep tick (40 ms/tick).
- Each cell cycles Resting → Excited → Refractory → Resting. A short damaged arc (8 cells) has a longer refractory period (32 vs 18 ticks), which is the substrate for reentry.
- Reentry is induced by an S1–S2 pacing protocol from a site offset toward the damaged zone, timed so that one arm is blocked by still-refractory damaged tissue while the other reaches it after recovery.
- **Ablate** sets one damaged cell to a permanent non-conducting state — the circuit can no longer close, the wave dies.
- **Add drug** reduces the damaged zone's refractory period to match healthy tissue. This homogenises the substrate and prevents new reentry from being induced. In this minimal model it does not, by itself, terminate a wave that is already circulating — a UI note tells the user that ablation is needed to break an established circuit. This is consistent with the real-world clinical picture.

## Legacy code

The previous multi-user simulator (Ably-based cell-to-cell messaging, MUI, multiple modes) is preserved under `src/legacy/` for reference. It is excluded from the TypeScript compile (see `tsconfig.app.json`) and from ESLint (see `eslint.config.js`), and it does not ship in the production build. You can safely delete that folder when no longer useful.

## Accessibility

- All interactive text is translated into EN + FR.
- The ring SVG has an accessible label; each cell has a `<title>`.
- `prefers-reduced-motion` disables transitions.
- High-contrast, outline-based damaged-cell distinction (not colour-only).

## License

Private; not yet licensed for public reuse.
