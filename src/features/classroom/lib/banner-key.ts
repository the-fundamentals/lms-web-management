/** OpenAPI `bannerKey` pattern: `public/{uuid-v4}` (same shape as avatarKey). */
const PUBLIC_BANNER_KEY =
  /^public\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function isPublicBannerKey(key: string | undefined): boolean {
  return typeof key === "string" && PUBLIC_BANNER_KEY.test(key);
}
