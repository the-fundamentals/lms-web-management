declare global {
  interface ImportMetaEnv {
    readonly VITE_PUBLIC_ASSET_BASE_URL?: string;
  }
}

/**
 * Public S3/CDN origin for object keys such as `public/{uuid}`.
 * Empty when unset — callers must not invent placeholder URLs.
 */
export function readPublicAssetBaseUrl(): string {
  const value = import.meta.env.VITE_PUBLIC_ASSET_BASE_URL;
  return typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
}

/**
 * Build a browser URL for a stored public object key.
 * Returns undefined when the base URL or key is missing — never a fake avatar.
 */
export function publicAssetUrl(objectKey: string | undefined): string | undefined {
  const base = readPublicAssetBaseUrl();
  const key = typeof objectKey === "string" ? objectKey.trim() : "";
  if (!base || !key) return undefined;
  return `${base}/${key.replace(/^\//, "")}`;
}
