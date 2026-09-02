import { withNativeFederation } from '@softarc/native-federation/config';

export default withNativeFederation({
  name: 'product_spotlight_app',

  exposes: {
    './register': './src/remote/register.ts',
  },

  shared: {},

  skip: [],

  features: {
    denseChunking: true,
  },
});
