import { initFederation, NativeFederationResult } from '@angular-architects/native-federation';

let federation: Promise<NativeFederationResult> | undefined;

export function startFederation(manifestUrl?: string) {
  federation = initFederation(manifestUrl);
  return federation;
}

export async function loadRemote<T = unknown>(
  remoteName: string,
  exposedModule: string,
): Promise<T> {
  if (!federation) throw new Error('Native Federation has not been initialized.');
  const { loadRemoteModule } = await federation;
  return loadRemoteModule<T>(remoteName, exposedModule);
}
