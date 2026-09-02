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
  const federationResult = federation ?? startFederation('/assets/federation.manifest.json');
  const { loadRemoteModule } = await federationResult;
  return loadRemoteModule<T>(remoteName, exposedModule);
}
