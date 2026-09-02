import { withNativeFederation } from '@softarc/native-federation/config';

export default withNativeFederation({
  name: 'productManager',
  exposes: {
    './register': './src/remote/register.ts',
  },
  // Angular does not use React, so the remote owns React/ReactDOM/React Router.
  // This keeps the Angular host and React remote independently deployable.
  shared: {},
});
