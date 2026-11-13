/** OpenAPI `avatarKey` pattern: `public/{uuid-v4}`. */
const PUBLIC_AVATAR_KEY =
  /^public\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function isPublicAvatarKey(key: string | undefined): boolean {
  return typeof key === "string" && PUBLIC_AVATAR_KEY.test(key);
}

/**
 * Keep a prior or freshly uploaded key. Never invent a placeholder — OpenAPI
 * requires a real `public/{uuid}` key that profile update can confirm.
 */
export function avatarKeyForSave(existing: string | undefined): string | undefined {
  if (isPublicAvatarKey(existing)) return existing;
  return undefined;
}
