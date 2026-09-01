import { initFederation } from "@angular-architects/native-federation";

initFederation('/assets/federation.manifest.json')
  .then(() => import('./bootstrap'))
  .catch((err: unknown) => console.error(err));
