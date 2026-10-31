import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile, symlink, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { emitCss } from '../skills/ui-design/scripts/lib/emit.mjs';

const run = promisify(execFile);
export const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
const SKILL_ROOT = path.join(REPO_ROOT, 'skills/ui-design');

async function linkNodeModules(root) {
  const target = path.join(REPO_ROOT, 'node_modules');
  const link = path.join(root, 'node_modules');
  try {
    await symlink(target, link, 'dir');
  } catch (error) {
    if (error.code === 'EEXIST') return;
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
    await symlink(target, link, 'junction');
  }
}

export async function buildPreview({ out, brand = '#0f766e' } = {}) {
  const root = out ? path.resolve(out) : await mkdtemp(path.join(tmpdir(), 'ui-design-preview-'));
  await mkdir(root, { recursive: true });
  await run(process.execPath, [
    path.join(SKILL_ROOT, 'scripts/design-system.mjs'),
    'init',
    '--brand',
    brand,
    '--name',
    'Lumen',
    '--out',
    path.join(root, 'design'),
  ]);
  await linkNodeModules(root);
  await writeFile(
    path.join(root, 'probe.html'),
    '<div class="bg-primary bg-background text-foreground border-input rounded-lg min-h-11"></div>\n',
  );
  await writeFile(
    path.join(root, 'input.css'),
    '@import "./design/theme.css";\n@source "./probe.html";\n',
  );
  await run(process.execPath, [
    path.join(REPO_ROOT, 'node_modules/@tailwindcss/cli/dist/index.mjs'),
    '-i',
    path.join(root, 'input.css'),
    '-o',
    path.join(root, 'styles.css'),
    '--cwd',
    root,
  ]);
  const scopeTokens = JSON.parse(
    await readFile(path.join(root, 'design/design-tokens.json'), 'utf8'),
  );
  scopeTokens.semantic.color.ring = '{semantic.color.primary}';
  delete scopeTokens.modes.dark.color.ring;
  await writeFile(
    path.join(root, 'scope.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scoped theme alias check</title><style>${emitCss(scopeTokens)} body{margin:24px;font:16px system-ui}section{padding:24px;margin-bottom:24px;background:var(--ui-color-background);color:var(--ui-color-foreground);border:4px solid var(--ui-color-ring)}</style></head><body><h1>Scoped semantic alias</h1><section id="light">Light scope: ring aliases primary</section><section id="dark" class="dark">Dark scope: inherited alias must resolve to dark primary</section></body></html>`,
  );
  return root;
}

export async function servePreview(root, port = 4178) {
  const files = new Map([
    ['/', ['design/preview.html', 'text/html']],
    ['/styles.css', ['styles.css', 'text/css']],
    ['/tokens', ['design/preview.html', 'text/html']],
    ['/scope', ['scope.html', 'text/html']],
  ]);
  for (const id of [
    '01-settings',
    '02-login',
    '03-empty',
    '04-stats',
    '05-landing',
    '06-article',
    '07-hero',
    '08-blotter',
  ]) {
    files.set(`/audits/${id}`, [
      path.join(REPO_ROOT, 'tests/ui-design/fixtures/audits', id, 'index.html'),
      'text/html',
    ]);
  }
  const server = createServer(async (request, response) => {
    const file = files.get(new URL(request.url, 'http://localhost').pathname);
    if (!file) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      response.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` });
      response.end(await readFile(path.isAbsolute(file[0]) ? file[0] : path.join(root, file[0])));
    } catch {
      response.writeHead(500).end('Preview unavailable');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  console.log(`Preview: http://127.0.0.1:${server.address().port}\nArtifacts: ${root}`);
  return server;
}

async function main() {
  const { values } = parseArgs({
    options: {
      out: { type: 'string' },
      serve: { type: 'boolean' },
      port: { type: 'string', default: '4178' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log('pnpm preview:ui [--out DIRECTORY] [--serve] [--port 4178]');
    return;
  }
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error('--port must be an integer from 0 to 65535');
  const root = await buildPreview({ out: values.out });
  if (values.serve) await servePreview(root, port);
  else console.log(`Built preview: ${root}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
