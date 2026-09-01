import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';
import { initFederation } from "@angular-architects/native-federation";

initFederation('/assets/federation.manifest.json')
  .then((_) => bootstrapApplication(App, appConfig))
  .catch((err: unknown) => console.error(err));
