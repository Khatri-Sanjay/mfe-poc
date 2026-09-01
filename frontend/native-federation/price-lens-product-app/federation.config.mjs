import { withNativeFederation } from '@softarc/native-federation/config';

export default withNativeFederation({
  name: 'price_lens_product_app',

  exposes: {
    './mount': './src/mount.tsx',
  },

  shared: {},

  skip: [],

  features: {
    denseChunking: true,
  },
});
