import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { federationBuilder } from '@softarc/native-federation';
import { createEsBuildAdapter } from '@softarc/native-federation-esbuild';
import { reactReplacements } from '@softarc/native-federation-esbuild/frameworks/react';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const prod = process.argv.includes('--prod');

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });

await federationBuilder.init({
  options: {
    workspaceRoot: root,
    outputPath: 'dist',
    tsConfig: 'tsconfig.remote.json',
    federationConfig: 'federation.config.mjs',
    verbose: false,
    dev: !prod,
  },
  adapter: createEsBuildAdapter({
    plugins: [],
    fileReplacements: prod ? reactReplacements.prod : reactReplacements.dev,
  }),
});

await esbuild.build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  tsconfig: path.join(root, 'tsconfig.remote.json'),
  jsx: 'automatic',
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Product Manager Remote</title>
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
