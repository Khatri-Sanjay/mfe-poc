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

export async function loadRemoteFromEntry<T = unknown>(
  remoteEntryUrl: string,
  remoteName: string,
  exposedModule: string,
): Promise<T> {
  if (!federation) throw new Error('Native Federation has not been initialized.');
  const initializedFederation = await federation;
  const remoteFederation = await initializedFederation.initRemoteEntry(remoteEntryUrl, remoteName);
  return remoteFederation.loadRemoteModule<T>(remoteName, exposedModule);
}
