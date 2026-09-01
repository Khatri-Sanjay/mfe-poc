import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_METADATA = 'permissions';

export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_METADATA, permissions);
