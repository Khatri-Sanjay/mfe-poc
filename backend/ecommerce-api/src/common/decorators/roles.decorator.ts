import { SetMetadata } from '@nestjs/common';

export const ROLES_METADATA = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_METADATA, roles);
