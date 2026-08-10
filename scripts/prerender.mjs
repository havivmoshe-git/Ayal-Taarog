/**
 * Injects the pre-rendered markup into the built index.html.
 *
 * Runs after both builds: the browser build produces dist/index.html with its
 * empty root div, and the SSR build produces a module that can render the page
 * to a string. This puts one inside the other.
 *
 * Failing here fails the build on purpose. A silently un-prerendered deploy
 * would look completely normal to a person and be invisible to a crawler,
 * which is the exact failure this exists to prevent.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';

const HTML = 'dist/index.html';
const MARKER = '<div id="root"></div>';

const html = await readFile(HTML, 'utf8');
if (!html.includes(MARKER)) {
  console.error(`prerender: could not find ${MARKER} in ${HTML}`);
  process.exit(1);
}

const { render } = await import('../dist-ssr/entry-server.js');
const body = render();

if (!body || body.length < 2000) {
  console.error(`prerender: rendered only ${body?.length ?? 0} characters — refusing to ship that`);
  process.exit(1);
}

await writeFile(HTML, html.replace(MARKER, `<div id="root">${body}</div>`));
await rm('dist-ssr', { recursive: true, force: true });

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
console.log(`prerender: ${kb(body.length)} of markup inlined into ${HTML}`);
