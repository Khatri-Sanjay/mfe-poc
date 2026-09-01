import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'auth_app',
  exposes: {
    "./routes": "./src/app/app.routes.ts",
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
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // ignoreUnusedDeps is enabled by default now
    // ignoreUnusedDeps: true,

    // Opt-in: groups chunks in remoteEntry.json for smaller metadata file
    denseChunking: true,
  },
});
