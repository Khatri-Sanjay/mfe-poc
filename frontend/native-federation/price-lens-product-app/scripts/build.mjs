import { mkdir, rm, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { federationBuilder } from '@softarc/native-federation';
import { createEsBuildAdapter } from '@softarc/native-federation-esbuild';
import { reactReplacements } from '@softarc/native-federation-esbuild/frameworks/react';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const prod = process.argv.includes('--prod');
const apiBaseUrl = process.env.VITE_PRICE_LENS_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const define = {
  __PRICE_LENS_API_BASE_URL__: JSON.stringify(apiBaseUrl),
};

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await copyFile(path.join(root, 'public/favicon.svg'), path.join(dist, 'favicon.svg'));

await federationBuilder.init({
  options: {
    workspaceRoot: root,
    outputPath: 'dist',
    tsConfig: 'tsconfig.app.json',
    federationConfig: 'federation.config.mjs',
    verbose: false,
    dev: !prod,
  },
  adapter: createEsBuildAdapter({
    plugins: [],
    fileReplacements: prod ? reactReplacements.prod : reactReplacements.dev,
    define,
    loader: {
      '.svg': 'dataurl',
      '.png': 'dataurl',
    },
  }),
});

await esbuild.build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  tsconfig: path.join(root, 'tsconfig.app.json'),
  jsx: 'automatic',
  define,
  sourcemap: !prod,
  minify: prod,
  outdir: path.join(dist, 'assets'),
  external: federationBuilder.externals,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.svg': 'dataurl',
    '.png': 'dataurl',
  },
});

await writeFile(
  path.join(dist, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>price-lens-product-app</title>
    <link rel="stylesheet" href="/assets/main.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>
`,
);

await federationBuilder.build();
await federationBuilder.close();
