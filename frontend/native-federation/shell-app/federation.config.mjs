import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'shell_app',

  remotes: {
    // Auth app (remote) — exposes login, register, etc.
    auth_app: 'http://localhost:4201/remoteEntry.json',
    // Admin app (remote) — exposes admin dashboard
    admin_app: 'http://localhost:4202/remoteEntry.json',
    price_lens_product_app: 'http://localhost:4204/remoteEntry.json',
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
