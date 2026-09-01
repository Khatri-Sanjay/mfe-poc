import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'admin_app',

  // Admin app exposes its routes for shell-app to consume
  exposes: {
    "./routes": "./src/app/app.routes.ts",
  },

  // Admin app also consumes auth-app for login
  remotes: {
    auth_app: 'http://localhost:4201/remoteEntry.json',
  },

  shared: {
    ...shareAll(
      { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' },
      {
        overrides: {
          '@angular/core': {
            singleton: true,
            strictVersion: true,
            requiredVersion: 'auto',
            build: 'package',
            includeSecondaries: false,
          },
        },
      },
    ),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    '@angular/core/event-dispatch-contract.min.js',
    '@angular/core/primitives/di',
    '@angular/core/primitives/event-dispatch',
    '@angular/core/primitives/signals',
    '@angular/core/rxjs-interop',
  ],

  features: {
    denseChunking: true,
  },
});
