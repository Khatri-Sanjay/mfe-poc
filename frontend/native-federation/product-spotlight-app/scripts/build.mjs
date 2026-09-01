import { mkdir, rm, copyFile } from 'node:fs/promises';
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
await copyFile(path.join(root, 'index.html'), path.join(dist, 'index.html'));

await federationBuilder.init({
  options: {
    workspaceRoot: root,
    outputPath: 'dist',
    tsConfig: 'tsconfig.json',
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
  sourcemap: !prod,
  minify: prod,
  outdir: path.join(dist, 'assets'),
  external: federationBuilder.externals,
  loader: {
    '.svg': 'dataurl',
  },
});

await federationBuilder.build();
await federationBuilder.close();
