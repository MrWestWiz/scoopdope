export const API_VERSIONS = ['v1'] as const;
export type ApiVersion = (typeof API_VERSIONS)[number];
export const DEFAULT_API_VERSION: ApiVersion = 'v1';
export const LATEST_API_VERSION: ApiVersion = 'v1';

export const API_VERSION_HEADER = 'Accept-Version';
export const X_API_VERSION = 'X-API-Version';
export const X_API_DEPRECATED = 'X-API-Deprecated';
export const X_API_SUNSET = 'X-API-Sunset';

export interface VersionInfo {
  version: ApiVersion;
  releaseDate: Date;
  deprecationDate?: Date;
  sunsetDate?: Date;
  changelog?: string;
}

export const VERSION_MANIFEST: Record<ApiVersion, VersionInfo> = {
  v1: {
    version: 'v1',
    releaseDate: new Date('2025-01-01'),
    changelog: 'Initial stable release.',
  },
};

export function isApiVersion(value: string): value is ApiVersion {
  return (API_VERSIONS as readonly string[]).includes(value);
}

export function getVersionInfo(version: ApiVersion): VersionInfo {
  return VERSION_MANIFEST[version];
}
