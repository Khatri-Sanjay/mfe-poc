import { withNativeFederation } from '@softarc/native-federation/config';

export default withNativeFederation({
  name: 'product_spotlight_app',

  exposes: {
    './register': './src/register.tsx',
  },

  shared: {},

  skip: [],

  features: {
    denseChunking: true,
  },
});
