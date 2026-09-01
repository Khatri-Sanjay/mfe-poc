import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .then(() => import('./bootstrap'))
  .catch((err: unknown) => console.error(err));
