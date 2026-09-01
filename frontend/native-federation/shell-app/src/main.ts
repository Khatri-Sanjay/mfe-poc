import { startFederation } from './federation-loader';

startFederation('/assets/federation.manifest.json')
  .then(() => import('./bootstrap'))
  .catch((err: unknown) => console.error(err));
