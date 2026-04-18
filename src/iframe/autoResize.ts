/**
 * Iframe auto-resize helper.
 *
 * When this module's `startAutoResize()` runs, it observes the document
 * body and posts the rendered height to the parent window whenever it
 * changes. The parent page listens for messages of type
 * "imyocyte:resize" and sets the iframe's height attribute accordingly.
 *
 * Parent-side listener (to include on ottawaheart.ca):
 *
 *   <iframe id="imyocyte" src="https://<host>/" style="width:100%;border:0"></iframe>
 *   <script>
 *     window.addEventListener('message', function (event) {
 *       // Restrict to the expected origin in production.
 *       if (!event.data || event.data.type !== 'imyocyte:resize') return;
 *       var f = document.getElementById('imyocyte');
 *       if (f) f.style.height = event.data.height + 'px';
 *     });
 *   </script>
 */

const MESSAGE_TYPE = 'imyocyte:resize';

export function startAutoResize(): () => void {
  if (typeof window === 'undefined' || window.parent === window) {
    // Not embedded — nothing to do.
    return () => {};
  }

  let lastHeight = -1;

  const post = () => {
    const h = Math.ceil(
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
      ),
    );
    if (h === lastHeight) return;
    lastHeight = h;
    window.parent.postMessage({ type: MESSAGE_TYPE, height: h }, '*');
  };

  // Observe body size changes (React re-renders, images loading, etc.).
  const ro = new ResizeObserver(() => post());
  ro.observe(document.documentElement);
  if (document.body) ro.observe(document.body);

  // Also post on load and on window resize, so the parent gets a size
  // immediately even if nothing has re-rendered yet.
  window.addEventListener('load', post);
  window.addEventListener('resize', post);
  post();

  return () => {
    ro.disconnect();
    window.removeEventListener('load', post);
    window.removeEventListener('resize', post);
  };
}
