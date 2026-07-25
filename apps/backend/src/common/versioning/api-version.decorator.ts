import { SetMetadata } from '@nestjs/common';
import { LATEST_API_VERSION } from './api-version.constants';
import type { ApiVersion } from './api-version.constants';

export const API_VERSION_METADATA = 'api:version';

export const ApiVersion = (version: ApiVersion = LATEST_API_VERSION) =>
  SetMetadata(API_VERSION_METADATA, version);
